import pytest
from src.gragraf.nodes.human_in_loop import HumanInLoopNode, HumanInLoopConfig


class TestHumanInLoopNode:
    """Test cases for Human-in-Loop node functionality."""

    def test_init(self):
        """Test node initialization."""
        config = HumanInLoopConfig(
            message="Please approve this action",
            approval_label="Approve",
            rejection_label="Reject"
        )
        node = HumanInLoopNode("hilp_1", config)
        
        assert node.id == "hilp_1"
        assert node.config.message == "Please approve this action"
        assert node.config.approval_label == "Approve"
        assert node.config.rejection_label == "Reject"

    def test_execute_triggers_interrupt_without_human_input(self):
        """Test that node triggers interrupt when no human input is available."""
        config = HumanInLoopConfig(
            message="Please review this request",
            input_label="Comments",
            approval_label="Approve",
            rejection_label="Reject",
            require_comment=True
        )
        node = HumanInLoopNode("hilp_1", config)
        
        state = {"previous_data": "some data"}
        result = node.execute(state)
        
        # Should contain interrupt info and trigger interrupt
        assert "hilp_1_hilp_info" in result
        assert "__interrupt__" in result
        assert result["__interrupt__"] == "human_input_required_hilp_1"
        
        hilp_info = result["hilp_1_hilp_info"]
        assert hilp_info["node_id"] == "hilp_1"
        assert hilp_info["message"] == "Please review this request"
        assert hilp_info["type"] == "human_in_loop_interrupt"
        assert hilp_info["require_comment"] is True

    def test_execute_with_human_approval(self):
        """Test execution when human provides approval."""
        config = HumanInLoopConfig(message="Please approve")
        node = HumanInLoopNode("hilp_1", config)
        
        # State with human input
        state = {
            "previous_data": "some data",
            "hilp_1_human_input": {
                "decision": "approve",
                "comment": "Looks good to me"
            }
        }
        
        result = node.execute(state)
        
        # Should contain decision and comment
        assert result["hilp_1_decision"] == "approve"
        assert result["hilp_1_comment"] == "Looks good to me"
        assert result["hilp_1_user_input"]["decision"] == "approve"
        assert "__interrupt__" not in result

    def test_execute_with_human_rejection(self):
        """Test execution when human provides rejection."""
        config = HumanInLoopConfig(message="Please review")
        node = HumanInLoopNode("hilp_1", config)
        
        # State with human rejection
        state = {
            "previous_data": "some data",
            "hilp_1_human_input": {
                "decision": "reject",
                "comment": "Not ready yet"
            }
        }
        
        result = node.execute(state)
        
        # Should contain rejection decision
        assert result["hilp_1_decision"] == "reject"
        assert result["hilp_1_comment"] == "Not ready yet"
        assert "__interrupt__" not in result

    def test_execute_with_existing_decision(self):
        """Test that node returns existing decision if already made."""
        config = HumanInLoopConfig(message="Please approve")
        node = HumanInLoopNode("hilp_1", config)
        
        # State with existing decision
        state = {
            "previous_data": "some data",
            "hilp_1_decision": "approve"
        }
        
        result = node.execute(state)
        
        # Should return existing decision without triggering interrupt
        assert result["hilp_1_decision"] == "approve"
        assert "__interrupt__" not in result

    def test_execute_handles_template_errors_gracefully(self):
        """Test that template errors are handled gracefully."""
        config = HumanInLoopConfig(message="{{undefined_var}}")  # Undefined variable
        node = HumanInLoopNode("hilp_1", config)
        
        state = {"some_data": "value"}
        result = node.execute(state)
        
        # Should still generate interrupt info with error message
        assert "hilp_1_hilp_info" in result
        assert "__interrupt__" in result
        
        # The message should contain template error information
        hilp_info = result["hilp_1_hilp_info"]
        assert "ERROR" in hilp_info["message"]

    def test_get_decision_approval_mapping(self):
        """Test decision mapping for approval path."""
        config = HumanInLoopConfig()
        node = HumanInLoopNode("hilp_1", config)
        
        state = {"hilp_1_decision": "approve"}
        decision = node.get_decision(state)
        
        assert decision == "approval"

    def test_get_decision_rejection_mapping(self):
        """Test decision mapping for rejection path."""
        config = HumanInLoopConfig()
        node = HumanInLoopNode("hilp_1", config)
        
        state = {"hilp_1_decision": "rejected"}
        decision = node.get_decision(state)
        
        assert decision == "rejection"

    def test_get_decision_default_to_rejection(self):
        """Test that unknown decisions default to rejection."""
        config = HumanInLoopConfig()
        node = HumanInLoopNode("hilp_1", config)
        
        # No decision in state
        state = {"some_data": "value"}
        decision = node.get_decision(state)
        
        assert decision == "rejection"

    def test_get_decision_invalid_decision(self):
        """Test that invalid decisions map to error path."""
        config = HumanInLoopConfig()
        node = HumanInLoopNode("hilp_1", config)
        
        state = {"hilp_1_decision": "invalid_decision"}
        decision = node.get_decision(state)
        
        assert decision == "error_path"

    def test_template_rendering_in_config(self):
        """Test that template variables are rendered in configuration."""
        config = HumanInLoopConfig(
            message="Please review request for {{user_name}}"
        )
        node = HumanInLoopNode("hilp_1", config)
        
        state = {"user_name": "John Doe"}
        result = node.execute(state)
        
        # Check that template was rendered in the interrupt info
        hilp_info = result["hilp_1_hilp_info"]
        assert hilp_info["message"] == "Please review request for John Doe"
