import pytest
from src.gragraf.compiler import GraphCompiler
from src.gragraf.schemas.graph import Graph, Node, Edge, NodeType
from langgraph.constants import INTERRUPT


class TestHumanInLoopIntegration:
    """Integration tests for Human-in-Loop functionality."""

    def test_hilp_workflow_compilation(self):
        """Test that a workflow with HiL node compiles correctly."""
        # Create a simple workflow: Start -> HiL -> End
        graph_data = {
            "nodes": [
                {
                    "id": "start_1",
                    "type": "start",
                    "config": {},
                    "position": {"x": 0, "y": 0}
                },
                {
                    "id": "hilp_1", 
                    "type": "human_in_loop",
                    "config": {
                        "message": "Please review this workflow",
                        "approval_label": "Continue",
                        "rejection_label": "Stop"
                    },
                    "position": {"x": 200, "y": 0}
                },
                {
                    "id": "end_1",
                    "type": "end",
                    "config": {},
                    "position": {"x": 400, "y": 0}
                }
            ],
            "edges": [
                {
                    "id": "edge_1",
                    "source": "start_1",
                    "target": "hilp_1"
                },
                {
                "id": "edge_2",
                "source": "hilp_1",
                "target": "end_1",
                "source_handle": "approval"
                },
                {
                    "id": "edge_3",
                    "source": "hilp_1",
                    "target": "end_1",
                    "source_handle": "rejection"
                }
            ]
        }
        
        # Should compile without errors
        compiler = GraphCompiler(graph_data)
        app = compiler.compile()
        assert app is not None

    def test_hilp_workflow_execution_triggers_interrupt(self):
        """Test that HiL node properly triggers interrupt during execution."""
        graph_data = {
            "nodes": [
                {
                    "id": "start_1",
                    "type": "start", 
                    "config": {},
                    "position": {"x": 0, "y": 0}
                },
                {
                    "id": "hilp_1",
                    "type": "human_in_loop",
                    "config": {
                        "message": "Approve this action?",
                        "require_comment": True
                    },
                    "position": {"x": 200, "y": 0}
                },
                {
                    "id": "end_1",
                    "type": "end",
                    "config": {},
                    "position": {"x": 400, "y": 0}
                }
            ],
            "edges": [
                {
                    "id": "edge_1",
                    "source": "start_1",
                    "target": "hilp_1"
                },
                {
                "id": "edge_2",
                "source": "hilp_1",
                "target": "end_1",
                "source_handle": "approval"
                },
                {
                    "id": "edge_3",
                    "source": "hilp_1",
                    "target": "end_1",
                    "source_handle": "rejection"
                }
            ]
        }
        
        compiler = GraphCompiler(graph_data)
        app = app_instance = compiler.compile()
        
        # Execute workflow - should be interrupted at HiL node
        config = {"configurable": {"thread_id": "test_thread"}}
        final_state = {}
        
        execution_stopped_early = False
        hilp_info_found = False
        for chunk in app.stream({}, config):
            final_state.update(chunk)
            
            # Check if we hit the HiL interrupt with info (nested in node data)
            for node_key, node_data in chunk.items():
                if isinstance(node_data, dict):
                    has_interrupt = "__interrupt__" in node_data
                    has_hilp_info = any(k.endswith('_hilp_info') for k in node_data.keys())
                    if has_interrupt and has_hilp_info:
                        execution_stopped_early = True
                        hilp_info_found = True
                        break
            if execution_stopped_early:
                break
        
        # Should have stopped due to interrupt with HiL info
        assert execution_stopped_early
        assert hilp_info_found

    def test_hilp_workflow_resumption_with_approval(self):
        """Test resuming workflow after human approval."""
        graph_data = {
            "nodes": [
                {
                    "id": "start_1",
                    "type": "start",
                    "config": {},
                    "position": {"x": 0, "y": 0}
                },
                {
                    "id": "hilp_1",
                    "type": "human_in_loop", 
                    "config": {
                        "message": "Approve this action?"
                    },
                    "position": {"x": 200, "y": 0}
                },
                {
                    "id": "end_1",
                    "type": "end",
                    "config": {},
                    "position": {"x": 400, "y": 0}
                }
            ],
            "edges": [
                {
                    "id": "edge_1",
                    "source": "start_1",
                    "target": "hilp_1"
                },
                {
                    "id": "edge_2",
                    "source": "hilp_1",
                    "target": "end_1",
                    "source_handle": "approval"
                },
                {
                    "id": "edge_3",
                    "source": "hilp_1",
                    "target": "end_1",
                    "source_handle": "rejection"
                }
            ]
        }
        
        compiler = GraphCompiler(graph_data)
        app = compiler.compile()
        
        config = {"configurable": {"thread_id": "test_thread_2"}}
        
        # First execution - should stop at HiL
        first_state = {}
        for chunk in app.stream({}, config):
            first_state.update(chunk)
            # Check for nested interrupt and hilp_info
            for node_key, node_data in chunk.items():
                if isinstance(node_data, dict):
                    has_interrupt = "__interrupt__" in node_data
                    has_hilp_info = any(k.endswith('_hilp_info') for k in node_data.keys())
                    if has_interrupt and has_hilp_info:
                        break
            else:
                continue
            break
        
        # Simulate human approval
        human_input = {
            "hilp_1_human_input": {
                "decision": "approved",
                "comment": "Looks good to proceed"
            }
        }
        
        # Resume execution with human input
        final_state = {}
        for chunk in app.stream(human_input, config):
            final_state.update(chunk)
        
        # Should have completed the workflow
        # Check nested structure from LangGraph
        hilp_data = final_state.get("hilp_1", {})
        assert "hilp_1_decision" in hilp_data
        assert hilp_data["hilp_1_decision"] == "approved"
        assert "hilp_1_comment" in hilp_data
        assert hilp_data["hilp_1_comment"] == "Looks good to proceed"

    def test_hilp_workflow_with_branching(self):
        """Test HiL node with conditional branching."""
        graph_data = {
            "nodes": [
                {
                    "id": "start_1",
                    "type": "start",
                    "config": {},
                    "position": {"x": 0, "y": 0}
                },
                {
                    "id": "hilp_1",
                    "type": "human_in_loop",
                    "config": {
                        "message": "Choose path: approve or reject?"
                    },
                    "position": {"x": 200, "y": 0}
                },
                {
                    "id": "end_1",
                    "type": "end", 
                    "config": {},
                    "position": {"x": 400, "y": 0}
                }
            ],
            "edges": [
                {
                    "id": "edge_1",
                    "source": "start_1",
                    "target": "hilp_1"
                },
                {
                    "id": "edge_2",
                    "source": "hilp_1",
                    "target": "end_1",
                    "source_handle": "approval"
                },
                {
                    "id": "edge_3",
                    "source": "hilp_1", 
                    "target": "end_1",
                    "source_handle": "rejection"
                }
            ]
        }
        
        compiler = GraphCompiler(graph_data)
        app = compiler.compile()
        
        config = {"configurable": {"thread_id": "test_branch"}}
        
        # First execution - get interrupt 
        for chunk in app.stream({}, config):
            # Check for nested interrupt and hilp_info
            for node_key, node_data in chunk.items():
                if isinstance(node_data, dict):
                    has_interrupt = "__interrupt__" in node_data
                    has_hilp_info = any(k.endswith('_hilp_info') for k in node_data.keys())
                    if has_interrupt and has_hilp_info:
                        break
            else:
                continue
            break
        
        # Test rejection path
        reject_input = {
            "hilp_1_human_input": {
                "decision": "rejected",
                "comment": "Not ready"
            }
        }
        
        final_state = {}
        for chunk in app.stream(reject_input, config):
            final_state.update(chunk)
        
        hilp_data = final_state.get("hilp_1", {})
        assert hilp_data.get("hilp_1_decision") == "rejected"
