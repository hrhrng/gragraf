import pytest
import json
from pathlib import Path
from unittest.mock import MagicMock, patch
from gragraf.compiler import GraphCompiler, state_reducer
from gragraf.schemas.graph import Graph, Node, Edge, NodeType

@pytest.fixture
def sample_graph_dsl():
    """Provides a simple graph DSL for testing."""
    return {
        "nodes": [
            {"id": "start", "type": "start", "config": {}},
            {"id": "http", "type": "http_request", "config": {"url": "http://test.com"}},
            {"id": "end", "type": "end", "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "start", "target": "http"},
            {"id": "e2", "source": "http", "target": "end"},
        ],
    }

@patch('gragraf.nodes.http_request.HttpRequestNode.execute')
def test_compiled_graph_execution(mock_http_execute, sample_graph_dsl):
    """
    Tests that a compiled graph can be executed and that the mock node is called.
    """
    # Mock the http node to return a predictable state change
    mock_http_execute.return_value = {"http_output": "mocked_response"}

    compiler = GraphCompiler(sample_graph_dsl)
    app = compiler.compile()

    # Execute the graph
    final_state = app.invoke({})

    # Verify that the http node's execute method was called
    mock_http_execute.assert_called_once()
    
    # Verify the final state
    assert final_state == {"http_output": "mocked_response"}

@patch('gragraf.nodes.branch.BranchNode.execute')
@patch('gragraf.nodes.http_request.HttpRequestNode.execute')
def test_conditional_graph_execution(mock_http_execute, mock_branch_execute):
    """
    Tests that a graph with a branch node executes the correct path.
    """
    from gragraf.nodes.branch import BranchCondition
    
    branching_dsl = {
        "nodes": [
            {"id": "start", "type": "start", "config": {}},
            {
                "id": "branch", 
                "type": "branch", 
                "config": {
                    "conditions": [
                        {
                            "condition": "state['x'] > 5",
                            "variable": "x",
                            "operator": ">",
                            "value": "5"
                        }
                    ],
                    "hasElse": True
                }
            },
            {"id": "http_true", "type": "http_request", "config": {"url": "http://true.com"}},
            {"id": "http_false", "type": "http_request", "config": {"url": "http://false.com"}},
            {"id": "end", "type": "end", "config": {}},
        ],
        "edges": [
            {"id": "e1", "source": "start", "target": "branch"},
            {"id": "e2", "source": "branch", "target": "http_true", "source_handle": "branch-0"},
            {"id": "e3", "source": "branch", "target": "http_false", "source_handle": "else"},
            {"id": "e4", "source": "branch", "target": "end", "source_handle": "error_path"},
            {"id": "e5", "source": "http_true", "target": "end"},
            {"id": "e6", "source": "http_false", "target": "end"},
        ],
    }

    # Mock branch to return decision in new format
    mock_branch_execute.return_value = {"branch_decision": "branch-0"}
    mock_http_execute.return_value = {"http_output": "true_path_response"}

    compiler = GraphCompiler(branching_dsl)
    app = compiler.compile()

    final_state = app.invoke({"x": 10})

    # Verify that the branch node was called
    mock_branch_execute.assert_any_call({"x": 10})
    # Verify that the correct http node was called
    mock_http_execute.assert_called_once()
    # Check the final state
    assert final_state["http_output"] == "true_path_response"


class TestStateReducer:
    """状态reducer单元测试"""
    
    def test_direct_state_update(self):
        """测试直接状态更新"""
        initial_state = {"user": "test"}
        update = {"output": "result"}
        
        result = state_reducer(initial_state, update)
        
        assert result["user"] == "test"
        assert result["output"] == "result"
    
    def test_concurrent_updates(self):
        """测试并发更新处理"""
        initial_state = {"user": "test"}
        update1 = {"output1": "result1"}
        update2 = {"output2": "result2"}
        
        # 模拟并发更新
        state_after_1 = state_reducer(initial_state, update1)
        final_state = state_reducer(state_after_1, update2)
        
        assert final_state["user"] == "test"
        assert final_state["output1"] == "result1" 
        assert final_state["output2"] == "result2"


class TestGraphCompilerAdvanced:
    """图编译器高级单元测试"""
    
    @pytest.fixture
    def test_payload(self):
        """加载测试payload"""
        payload_path = Path(__file__).parent.parent / "test_payload.json"
        with open(payload_path, 'r') as f:
            return json.load(f)
    
    def test_compiler_initialization(self, test_payload):
        """测试编译器初始化"""
        compiler = GraphCompiler(test_payload)
        
        assert compiler.graph_dsl == test_payload
        assert compiler.parsed_graph is not None
        assert len(compiler.nodes) == 4
    
    def test_get_start_node(self, test_payload):
        """测试获取start节点"""
        compiler = GraphCompiler(test_payload)
        start_node = compiler._get_start_node()
        
        assert start_node == "start_1"
    
    def test_get_end_node(self, test_payload):
        """测试获取end节点"""
        compiler = GraphCompiler(test_payload)
        end_node = compiler._get_end_node()
        
        assert end_node == "end_1"
    
    def test_topological_sort(self, test_payload):
        """测试拓扑排序"""
        compiler = GraphCompiler(test_payload)
        topo_order = compiler._topological_sort()
        
        assert len(topo_order) == 4
        assert topo_order.index("start_1") < topo_order.index("agent_3")
        assert topo_order.index("start_1") < topo_order.index("agent_4")
        assert topo_order.index("agent_3") < topo_order.index("end_1")
        assert topo_order.index("agent_4") < topo_order.index("end_1")
    
    def test_validate_graph_structure(self, test_payload):
        """测试图结构验证"""
        compiler = GraphCompiler(test_payload)
        
        # 应该不抛出异常
        compiler._validate_graph_structure() 