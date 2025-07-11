from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import os
import logging
from ..utils.templating import render_config

logger = logging.getLogger(__name__)

class KnowledgeBaseConfig(BaseModel):
    urls: List[str] = Field(default_factory=list, description="List of URLs to load documents from.")
    documents: List[str] = Field(default_factory=list, description="List of document contents.")
    query: str = Field(..., description="Query to search for in the documents.")
    top_k: int = Field(default=4, description="Number of documents to retrieve.")
    output_name: Optional[str] = None
    chunk_size: int = Field(default=1000, description="Size of text chunks for splitting documents.")
    chunk_overlap: int = Field(default=200, description="Overlap between text chunks.")

class KnowledgeBaseNode:
    def __init__(self, node_id: str, config: KnowledgeBaseConfig, api_key: str | None = None):
        self.node_id = node_id
        self.config = config
        
        effective_api_key = api_key or os.getenv("OPENAI_API_KEY")
        maybe_proxy = os.getenv("OPENAI_BASE_URL")
        if not effective_api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set and no key provided.")
        
        self.embeddings = OpenAIEmbeddings(api_key=effective_api_key, base_url=maybe_proxy)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.chunk_size,
            chunk_overlap=self.config.chunk_overlap,
            length_function=len,
        )

    def _load_documents_from_urls(self, urls: List[str]) -> List[Document]:
        documents = []
        
        for url in urls:
            try:
                # 主要方法：WebBaseLoader
                try:
                    loader = WebBaseLoader([url])
                    docs = loader.load()
                    split_docs = self.text_splitter.split_documents(docs)
                    documents.extend(split_docs)
                    continue
                    
                except Exception:
                    # 备用方法：直接HTTP请求
                    import httpx
                    from bs4 import BeautifulSoup
                    
                    headers = {"User-Agent": "Mozilla/5.0 (compatible; GraGraf/1.0)"}
                    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                        response = client.get(url, headers=headers)
                        response.raise_for_status()
                        
                        content_type = response.headers.get("content-type", "").lower()
                        
                        if "text/html" in content_type:
                            try:
                                soup = BeautifulSoup(response.text, 'html.parser')
                                for script in soup(["script", "style"]):
                                    script.decompose()
                                
                                title = soup.find('title')
                                title_text = title.get_text() if title else ""
                                text = soup.get_text()
                                
                                lines = (line.strip() for line in text.splitlines())
                                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                                clean_text = ' '.join(chunk for chunk in chunks if chunk)
                                
                                doc = Document(
                                    page_content=clean_text,
                                    metadata={"source": url, "title": title_text, "method": "backup"}
                                )
                                
                            except ImportError:
                                doc = Document(
                                    page_content=response.text,
                                    metadata={"source": url, "method": "raw"}
                                )
                        else:
                            doc = Document(
                                page_content=response.text,
                                metadata={"source": url, "method": "text"}
                            )
                        
                        split_docs = self.text_splitter.split_documents([doc])
                        documents.extend(split_docs)
                
            except Exception as e:
                logger.error(f"Failed to load document from {url}: {e}")
                error_doc = Document(
                    page_content=f"Error loading document from {url}: {str(e)}",
                    metadata={"source": url, "error": True}
                )
                documents.append(error_doc)
        
        return documents

    def _prepare_documents(self, urls: List[str], document_texts: List[str]) -> List[Document]:
        all_documents = []
        
        if urls:
            url_documents = self._load_documents_from_urls(urls)
            all_documents.extend(url_documents)
        
        if document_texts:
            for i, text in enumerate(document_texts):
                if text.strip():
                    doc = Document(
                        page_content=text,
                        metadata={"source": f"document_{i}", "type": "text"}
                    )
                    split_docs = self.text_splitter.split_documents([doc])
                    all_documents.extend(split_docs)
        
        return all_documents

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        try:
            rendered_config = render_config(self.config, state)
            
            all_documents = self._prepare_documents(
                rendered_config.urls, 
                rendered_config.documents
            )
            
            if not all_documents:
                output_key = self.config.output_name or f"{self.node_id}_output"
                return {output_key: []}
            
            vector_store = FAISS.from_documents(all_documents, self.embeddings)
            retriever = vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": rendered_config.top_k}
            )
            
            retrieved_docs = retriever.invoke(rendered_config.query)
            
            results = []
            for doc in retrieved_docs:
                result = {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "source": doc.metadata.get("source", "unknown")
                }
                results.append(result)
            
            output_key = self.config.output_name or f"{self.node_id}_output"
            return {output_key: results}
            
        except Exception as e:
            logger.error(f"Error in knowledge base execution: {e}")
            error_key = f"{self.node_id}_error"
            return {error_key: f"Knowledge base error: {str(e)}"}

    def get_requirements(self) -> Dict[str, Any]:
        from ..utils.templating import find_template_variables
        
        query_vars = find_template_variables(self.config.query)
        url_vars = set()
        for url in self.config.urls:
            url_vars.update(find_template_variables(url))
        
        doc_vars = set()
        for doc in self.config.documents:
            doc_vars.update(find_template_variables(doc))
        
        return {
            "query_variables": list(query_vars),
            "url_variables": list(url_vars),
            "document_variables": list(doc_vars),
            "all_variables": list(query_vars | url_vars | doc_vars)
        } 