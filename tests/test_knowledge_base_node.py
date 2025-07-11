import pytest
from unittest.mock import patch, MagicMock
from gragraf.nodes.knowledge_base import KnowledgeBaseNode, KnowledgeBaseConfig
from langchain_core.documents import Document

@pytest.fixture
def mock_retriever():
    """Mocks the vector store retriever."""
    retriever = MagicMock()
    retriever.invoke.return_value = [
        MagicMock(
            page_content="Paris is the capital of France.",
            metadata={"source": "test_doc", "type": "text"}
        )
    ]
    return retriever

@patch('gragraf.nodes.knowledge_base.OpenAIEmbeddings')
@patch('gragraf.nodes.knowledge_base.FAISS')
def test_knowledge_base_node_with_documents(mock_faiss, mock_embeddings):
    """
    Tests successful document retrieval from text documents.
    """
    # Mock the retriever and its response
    mock_retriever = MagicMock()
    mock_retriever.invoke.return_value = [
        MagicMock(
            page_content="Paris is the capital of France.",
            metadata={"source": "document_0", "type": "text"}
        )
    ]
    
    # Mock the FAISS vector store to return our mock retriever
    mock_vector_store = MagicMock()
    mock_vector_store.as_retriever.return_value = mock_retriever
    mock_faiss.from_documents.return_value = mock_vector_store
    
    # Configure the node with documents
    config = KnowledgeBaseConfig(
        documents=["France is a country in Europe. Paris is its capital."], 
        query="What is the capital of France?",
        top_k=2
    )
    
    # We patch os.getenv to avoid needing a real API key
    with patch('os.getenv', return_value='fake_api_key'):
        node = KnowledgeBaseNode("kb_1", config)

    # Execute the node
    result = node.execute({})
    
    # Assertions
    mock_retriever.invoke.assert_called_once_with("What is the capital of France?")
    assert "kb_1_output" in result
    assert len(result["kb_1_output"]) == 1
    assert result["kb_1_output"][0]["content"] == "Paris is the capital of France."

@patch('gragraf.nodes.knowledge_base.OpenAIEmbeddings')
@patch('gragraf.nodes.knowledge_base.FAISS')
@patch('gragraf.nodes.knowledge_base.WebBaseLoader')
def test_knowledge_base_node_with_urls(mock_web_loader, mock_faiss, mock_embeddings):
    """
    Tests successful document retrieval from URLs.
    """
    # Mock the web loader
    mock_loader_instance = MagicMock()
    mock_loader_instance.load.return_value = [
        Document(
            page_content="This is content from a website about Python programming.",
            metadata={"source": "https://example.com/python"}
        )
    ]
    mock_web_loader.return_value = mock_loader_instance
    
    # Mock the text splitter
    mock_text_splitter = MagicMock()
    mock_text_splitter.split_documents.return_value = [
        Document(
            page_content="Python is a programming language.",
            metadata={"source": "https://example.com/python"}
        )
    ]
    
    # Mock the retriever
    mock_retriever = MagicMock()
    mock_retriever.invoke.return_value = [
        MagicMock(
            page_content="Python is a programming language.",
            metadata={"source": "https://example.com/python"}
        )
    ]
    
    # Mock the FAISS vector store
    mock_vector_store = MagicMock()
    mock_vector_store.as_retriever.return_value = mock_retriever
    mock_faiss.from_documents.return_value = mock_vector_store
    
    # Configure the node with URLs
    config = KnowledgeBaseConfig(
        urls=["https://example.com/python"],
        query="What is Python?",
        top_k=1
    )
    
    with patch('os.getenv', return_value='fake_api_key'):
        node = KnowledgeBaseNode("kb_1", config)
        # Mock the text splitter
        node.text_splitter = mock_text_splitter

    # Execute the node
    result = node.execute({})
    
    # Assertions
    mock_web_loader.assert_called_once_with(["https://example.com/python"])
    mock_loader_instance.load.assert_called_once()
    mock_retriever.invoke.assert_called_once_with("What is Python?")
    assert "kb_1_output" in result

@patch('gragraf.nodes.knowledge_base.OpenAIEmbeddings')
@patch('gragraf.nodes.knowledge_base.FAISS')
def test_knowledge_base_node_no_documents(mock_faiss, mock_embeddings):
    """
    Tests behavior when no documents are provided.
    """
    # Configure the node with no documents or URLs
    config = KnowledgeBaseConfig(
        query="What is the capital of France?",
        top_k=2
    )
    
    with patch('os.getenv', return_value='fake_api_key'):
        node = KnowledgeBaseNode("kb_1", config)

    # Execute the node
    result = node.execute({})
    
    # Should return empty results
    assert result == {"kb_1_output": []}

@patch('gragraf.nodes.knowledge_base.OpenAIEmbeddings')
@patch('gragraf.nodes.knowledge_base.FAISS')
@patch('gragraf.nodes.knowledge_base.WebBaseLoader')
def test_knowledge_base_node_url_loading_error(mock_web_loader, mock_faiss, mock_embeddings):
    """
    Tests handling of URL loading errors.
    """
    # Mock the web loader to raise an exception
    mock_web_loader.side_effect = Exception("Network error")
    
    # Mock the text splitter
    mock_text_splitter = MagicMock()
    mock_text_splitter.split_documents.return_value = [
        Document(
            page_content="Error loading document from https://invalid-url.com: Network error",
            metadata={"source": "https://invalid-url.com", "error": True}
        )
    ]
    
    # Mock the retriever
    mock_retriever = MagicMock()
    mock_retriever.invoke.return_value = [
        MagicMock(
            page_content="Error occurred",
            metadata={"source": "https://invalid-url.com", "error": True}
        )
    ]
    
    # Mock the FAISS vector store
    mock_vector_store = MagicMock()
    mock_vector_store.as_retriever.return_value = mock_retriever
    mock_faiss.from_documents.return_value = mock_vector_store
    
    # Configure the node with invalid URL
    config = KnowledgeBaseConfig(
        urls=["https://invalid-url.com"],
        query="What is this?",
        top_k=1
    )
    
    with patch('os.getenv', return_value='fake_api_key'):
        node = KnowledgeBaseNode("kb_1", config)
        # Mock the text splitter
        node.text_splitter = mock_text_splitter

    # Execute the node - should not raise exception
    result = node.execute({})
    
    # Should still return results (error documents)
    assert "kb_1_output" in result

def test_knowledge_base_config_validation():
    """
    Tests configuration validation for the knowledge base.
    """
    # Test valid configuration
    config = KnowledgeBaseConfig(
        urls=["https://example.com"],
        documents=["Some text"],
        query="test query",
        top_k=5,
        chunk_size=500,
        chunk_overlap=100
    )
    
    assert config.urls == ["https://example.com"]
    assert config.documents == ["Some text"]
    assert config.query == "test query"
    assert config.top_k == 5
    assert config.chunk_size == 500
    assert config.chunk_overlap == 100

def test_knowledge_base_get_requirements():
    """
    Tests the get_requirements method for variable detection.
    """
    config = KnowledgeBaseConfig(
        urls=["https://example.com/{{url_param}}"],
        documents=["Document with {{doc_var}}"],
        query="Search for {{search_term}}",
        top_k=2
    )
    
    with patch('os.getenv', return_value='fake_api_key'):
        node = KnowledgeBaseNode("kb_1", config)
    
    requirements = node.get_requirements()
    
    assert "query_variables" in requirements
    assert "url_variables" in requirements
    assert "document_variables" in requirements
    assert "all_variables" in requirements
    
    # Check that variables are detected
    all_vars = set(requirements["all_variables"])
    assert "search_term" in all_vars
    assert "url_param" in all_vars
    assert "doc_var" in all_vars 