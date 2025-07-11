import pytest
from gragraf.schemas.graph import Graph, Node, Edge, NodeType
from gragraf.parser import parse_graph

def test_parse_valid_graph():
    """
    Tests that a valid graph dictionary is correctly parsed into a Graph object.
    """
    graph_data = {
        "nodes": [
            {
                "id": "start_node",
                "type": "start",
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "http_node",
                "type": "http_request",
                "config": {"url": "https://api.example.com/data", "method": "GET"},
                "position": {"x": 300, "y": 100}
            },
            {
                "id": "end_node",
                "type": "end",
                "position": {"x": 500, "y": 100}
            }
        ],
        "edges": [
            {
                "id": "edge1",
                "source": "start_node",
                "target": "http_node"
            },
            {
                "id": "edge2",
                "source": "http_node",
                "target": "end_node",
                "source_handle": "success"
            }
        ]
    }

    parsed_graph = parse_graph(graph_data)

    assert isinstance(parsed_graph, Graph)
    assert len(parsed_graph.nodes) == 3
    assert len(parsed_graph.edges) == 2

    # Check node data
    assert parsed_graph.nodes[0].id == "start_node"
    assert parsed_graph.nodes[0].type == NodeType.START
    assert parsed_graph.nodes[1].id == "http_node"
    assert parsed_graph.nodes[1].type == NodeType.HTTP_REQUEST
    assert parsed_graph.nodes[1].config["url"] == "https://api.example.com/data"

    # Check edge data
    assert parsed_graph.edges[0].source == "start_node"
    assert parsed_graph.edges[0].target == "http_node"
    assert parsed_graph.edges[1].source_handle == "success"

def test_parse_graph_with_invalid_node_type():
    """
    Tests that parsing a graph with an invalid node type raises an error.
    """
    graph_data = {
        "nodes": [{"id": "node1", "type": "invalid_type"}],
        "edges": []
    }
    with pytest.raises(ValueError):
        parse_graph(graph_data)


class TestGraphParserAdvanced:
    """图解析器高级单元测试"""
    
    @pytest.fixture
    def simple_graph_dsl(self):
        """简单图DSL"""
        return {
            "nodes": [
                {"id": "start_1", "type": "start", "config": {}},
                {"id": "agent_1", "type": "agent", "config": {"model_name": "gpt-4o-mini"}},
                {"id": "end_1", "type": "end", "config": {}}
            ],
            "edges": [
                {"id": "e1", "source": "start_1", "target": "agent_1"},
                {"id": "e2", "source": "agent_1", "target": "end_1"}
            ]
        }
    
    def test_parse_nodes_detailed(self, simple_graph_dsl):
        """测试节点解析详细逻辑"""
        parsed = parse_graph(simple_graph_dsl)
        
        assert len(parsed.nodes) == 3
        node_ids = [node.id for node in parsed.nodes]
        assert "start_1" in node_ids
        assert "agent_1" in node_ids
        assert "end_1" in node_ids
        
        # 验证节点类型
        node_by_id = {node.id: node for node in parsed.nodes}
        assert node_by_id["start_1"].type == NodeType.START
        assert node_by_id["agent_1"].type == NodeType.AGENT
        assert node_by_id["end_1"].type == NodeType.END
    
    def test_parse_edges_detailed(self, simple_graph_dsl):
        """测试边解析详细逻辑"""
        parsed = parse_graph(simple_graph_dsl)
        
        assert len(parsed.edges) == 2
        edge_pairs = [(edge.source, edge.target) for edge in parsed.edges]
        assert ("start_1", "agent_1") in edge_pairs
        assert ("agent_1", "end_1") in edge_pairs
        
        # 验证边ID
        edge_ids = [edge.id for edge in parsed.edges]
        assert "e1" in edge_ids
        assert "e2" in edge_ids 