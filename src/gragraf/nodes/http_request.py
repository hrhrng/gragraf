from typing import Dict, Any, Literal, Optional, Union
from pydantic import BaseModel, Field
import httpx
import time
import logging
from ..utils.templating import render_config

logger = logging.getLogger(__name__)

class HttpRequestConfig(BaseModel):
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"] = "GET"
    url: str = Field(..., description="The URL to send the request to.")
    headers: Dict[str, str] = Field(default_factory=dict, description="HTTP headers to include in the request.")
    body: Union[Dict[str, Any], str, None] = Field(default=None, description="Request body (JSON object or string).")
    params: Dict[str, str] = Field(default_factory=dict, description="URL query parameters.")
    timeout: float = Field(default=30.0, description="Request timeout in seconds.")
    max_retries: int = Field(default=3, description="Maximum number of retry attempts.")
    retry_delay: float = Field(default=1.0, description="Delay between retries in seconds.")
    follow_redirects: bool = Field(default=True, description="Whether to follow HTTP redirects.")
    verify_ssl: bool = Field(default=True, description="Whether to verify SSL certificates.")
    response_format: Literal["json", "text", "bytes", "auto"] = Field(default="auto", description="Expected response format.")
    output_name: Optional[str] = None
    user_agent: Optional[str] = Field(default=None, description="Custom User-Agent header.")
    extract_text: bool = Field(default=False, description="Extract text content from HTML responses.")

class HttpRequestNode:
    def __init__(self, node_id: str, config: HttpRequestConfig):
        self.node_id = node_id
        self.config = config

    def _prepare_headers(self, headers: Dict[str, str], user_agent: Optional[str] = None) -> Dict[str, str]:
        prepared_headers = headers.copy()
        
        if user_agent:
            prepared_headers["User-Agent"] = user_agent
        elif "User-Agent" not in prepared_headers and "user-agent" not in prepared_headers:
            prepared_headers["User-Agent"] = "Mozilla/5.0 (compatible; GraGraf/1.0; +https://github.com/gragraf)"
        
        return prepared_headers

    def _prepare_body(self, body: Union[Dict[str, Any], str, None], method: str) -> Union[Dict[str, Any], str, None]:
        if body is None or method.upper() in ["GET", "HEAD"]:
            return None
        return body

    def _determine_response_format(self, response: httpx.Response, expected_format: str) -> str:
        if expected_format != "auto":
            return expected_format
        
        content_type = response.headers.get("content-type", "").lower()
        
        if "application/json" in content_type:
            return "json"
        elif any(t in content_type for t in ["text/", "application/xml", "application/xhtml"]):
            return "text"
        else:
            return "bytes"

    def _extract_text_from_html(self, html_content: str) -> str:
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            for script in soup(["script", "style"]):
                script.decompose()
            
            text = soup.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            return text
        except Exception:
            return html_content

    def _process_response(self, response: httpx.Response, response_format: str, extract_text: bool) -> Dict[str, Any]:
        result = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "url": str(response.url),
            "elapsed_ms": response.elapsed.total_seconds() * 1000 if hasattr(response, 'elapsed') else None
        }
        
        try:
            actual_format = self._determine_response_format(response, response_format)
            
            if actual_format == "json":
                result["body"] = response.json()
                result["content_type"] = "json"
            elif actual_format == "text":
                text_content = response.text
                result["body"] = text_content
                result["content_type"] = "text"
                
                if extract_text and "text/html" in response.headers.get("content-type", "").lower():
                    result["text_content"] = self._extract_text_from_html(text_content)
            else:
                result["body"] = response.content
                result["content_type"] = "bytes"
                result["content_length"] = len(response.content)
            
        except Exception as e:
            result["body"] = response.text
            result["content_type"] = "text"
            result["parse_error"] = str(e)
        
        return result

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        try:
            rendered_config = render_config(self.config, state)
            headers = self._prepare_headers(rendered_config.headers, rendered_config.user_agent)
            body = self._prepare_body(rendered_config.body, rendered_config.method)
            
            client_config = {
                "timeout": rendered_config.timeout,
                "follow_redirects": rendered_config.follow_redirects,
                "verify": rendered_config.verify_ssl,
            }
            
            last_exception = None
            
            for attempt in range(rendered_config.max_retries + 1):
                try:
                    with httpx.Client(**client_config) as client:
                        if body is not None and isinstance(body, dict):
                            response = client.request(
                                method=rendered_config.method,
                                url=rendered_config.url,
                                headers=headers,
                                params=rendered_config.params,
                                json=body,
                            )
                        else:
                            response = client.request(
                                method=rendered_config.method,
                                url=rendered_config.url,
                                headers=headers,
                                params=rendered_config.params,
                                content=body,
                            )
                        
                        response.raise_for_status()
                        
                        # Simplified response handling - just return the body content
                        output_key = self.config.output_name or f"{self.node_id}_output"
                        
                        actual_format = self._determine_response_format(response, rendered_config.response_format)
                        
                        if actual_format == "json":
                            return {output_key: response.json()}
                        elif actual_format == "text":
                            text_content = response.text
                            if rendered_config.extract_text and "text/html" in response.headers.get("content-type", "").lower():
                                text_content = self._extract_text_from_html(text_content)
                            return {output_key: text_content}
                        else:
                            return {output_key: response.content}
                        
                except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as e:
                    last_exception = e
                    if attempt < rendered_config.max_retries:
                        wait_time = rendered_config.retry_delay * (2 ** attempt)
                        time.sleep(wait_time)
                        continue
                    else:
                        raise e
                        
                except httpx.HTTPStatusError as e:
                    # For HTTP errors, return error information
                    error_key = f"{self.node_id}_error"
                    return {error_key: f"HTTP {e.response.status_code}: {e.response.reason_phrase}"}
            
            if last_exception:
                raise last_exception
                
        except Exception as e:
            logger.error(f"HTTP Request {self.node_id} execution failed: {e}")
            error_key = f"{self.node_id}_error"
            return {error_key: f"HTTP request failed: {str(e)}"}

    def get_requirements(self) -> Dict[str, Any]:
        from ..utils.templating import find_template_variables
        
        url_vars = find_template_variables(self.config.url)
        
        header_vars = set()
        for key, value in self.config.headers.items():
            header_vars.update(find_template_variables(key))
            header_vars.update(find_template_variables(value))
        
        body_vars = set()
        if isinstance(self.config.body, str):
            body_vars.update(find_template_variables(self.config.body))
        
        param_vars = set()
        for key, value in self.config.params.items():
            param_vars.update(find_template_variables(key))
            param_vars.update(find_template_variables(value))
        
        return {
            "url_variables": list(url_vars),
            "header_variables": list(header_vars),
            "body_variables": list(body_vars),
            "param_variables": list(param_vars),
            "all_variables": list(url_vars | header_vars | body_vars | param_vars),
            "output_name": self.config.output_name or f"{self.node_id}_output"
        } 