import pytest
from unittest.mock import patch, AsyncMock
from gragraf.nodes.agent import AgentNode, AgentConfig

@pytest.mark.asyncio
async def test_agent_node_execute_success():
    """
    Tests that the AgentNode successfully executes and returns the output.
    """
    config = AgentConfig(user_prompt="What is the capital of France?")
    
    # Patch os.getenv to provide a dummy API key and patch the async chain method
    with patch('os.getenv', return_value='fake_api_key'), \
         patch('langchain_core.runnables.base.RunnableSequence.ainvoke', new_callable=AsyncMock) as mock_ainvoke:
        
        # Configure the mock to return a specific value
        mock_ainvoke.return_value = "Paris"
        
        node = AgentNode("agent_1", config)
        result = await node.execute_async({})
        
        # Verify that the chain was called with the correct input
        mock_ainvoke.assert_called_once_with({"input": "What is the capital of France?"})
        assert result == {"agent_1_output": "Paris"}

@pytest.mark.asyncio
async def test_agent_node_templating():
    """
    Tests that the user_prompt is correctly templated with the given state.
    """
    config = AgentConfig(user_prompt="What is the capital of {{country}}?")
    state = {"country": "France"}

    with patch('os.getenv', return_value='fake_api_key'), \
         patch('langchain_core.runnables.base.RunnableSequence.ainvoke', new_callable=AsyncMock) as mock_ainvoke:
        
        mock_ainvoke.return_value = "The capital of France is Paris."
        
        node = AgentNode("agent_1", config)
        result = await node.execute_async(state)
        
        # Verify that the prompt was rendered before being passed to the chain
        mock_ainvoke.assert_called_once_with({"input": "What is the capital of France?"})
        assert result == {"agent_1_output": "The capital of France is Paris."}

@pytest.mark.asyncio
async def test_agent_node_execution_error():
    """
    Tests that the node handles exceptions from the LLM chain gracefully.
    """
    config = AgentConfig(user_prompt="This will fail.")
    
    with patch('os.getenv', return_value='fake_api_key'), \
         patch('langchain_core.runnables.base.RunnableSequence.ainvoke', new_callable=AsyncMock) as mock_ainvoke:
        
        # Configure the mock to raise an exception
        mock_ainvoke.side_effect = Exception("LLM call failed")
        
        node = AgentNode("agent_1", config)
        result = await node.execute_async({})
        
        # Verify that the error is caught and reported in the output
        assert "agent_1_error" in result
        assert "LLM call failed" in result["agent_1_error"]

def test_agent_node_initialization_no_api_key():
    """
    Tests that the node raises a ValueError if no API key is provided.
    """
    with patch('os.getenv', return_value=None):
        with pytest.raises(ValueError, match="OPENAI_API_KEY environment variable not set"):
            AgentNode("agent_1", AgentConfig())


def test_create_agent_node():
    """测试创建Agent节点配置"""
    config = AgentConfig(
        model_name="gpt-4o-mini",
        temperature=0.7,
        user_prompt="test prompt"
    )
    
    with patch('os.getenv', return_value='fake_api_key'):
        node = AgentNode("test_agent", config)
        assert node.node_id == "test_agent"
        assert node.config.model_name == "gpt-4o-mini"
        assert node.config.temperature == 0.7
        assert node.config.user_prompt == "test prompt" 