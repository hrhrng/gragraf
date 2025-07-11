import pytest
import respx
from httpx import Response
from gragraf.nodes.http_request import HttpRequestNode, HttpRequestConfig

@respx.mock
def test_http_request_node_get_success():
    """
    Tests that the HttpRequestNode successfully performs a GET request
    and returns the JSON response.
    """
    url = "https://api.example.com/data"
    response_json = {"message": "Success"}
    respx.get(url).respond(200, json=response_json)

    config = HttpRequestConfig(url=url, method="GET")
    node = HttpRequestNode("http_node_1", config)

    result = node.execute({})

    assert result == {"http_node_1_output": response_json}

@respx.mock
def test_http_request_node_post_success():
    """
    Tests that the HttpRequestNode can perform a POST request with a JSON body.
    """
    url = "https://api.example.com/submit"
    request_body = {"key": "value"}
    response_body = {"status": "created"}
    respx.post(url, json=request_body).respond(201, json=response_body)

    config = HttpRequestConfig(url=url, method="POST", body=request_body)
    node = HttpRequestNode("http_node_2", config)

    result = node.execute({})

    assert result == {"http_node_2_output": response_body}

@respx.mock
def test_http_request_node_failure():
    """
    Tests that the HttpRequestNode handles HTTP errors correctly.
    """
    url = "http://test.com/fail"
    respx.get(url).respond(500, text="Internal Server Error")
    
    config = HttpRequestConfig(url=url, method="GET")
    node = HttpRequestNode("http_node_3", config)
    
    result = node.execute({})

    assert "http_node_3_error" in result
    assert "500" in result["http_node_3_error"]

@respx.mock
def test_http_request_node_templating():
    """
    Tests that the URL is correctly templated using the state.
    """
    url_template = "http://test.com/users/{{user_id}}"
    response_json = {"user": "test_user"}
    
    respx.get("http://test.com/users/123").respond(200, json=response_json)

    config = HttpRequestConfig(url=url_template, method="GET")
    node = HttpRequestNode("http_node_4", config)
    
    state = {"user_id": 123}
    result = node.execute(state)

    assert result == {"http_node_4_output": response_json}

@respx.mock
def test_http_request_node_no_template_in_url():
    """
    Tests that a URL without a template is handled correctly.
    """
    url = "http://test.com/static"
    response_json = {"message": "static content"}
    respx.get(url).respond(200, json=response_json)

    config = HttpRequestConfig(url=url, method="GET")
    node = HttpRequestNode("http_node_5", config)
    
    result = node.execute({})

    assert result == {"http_node_5_output": response_json} 