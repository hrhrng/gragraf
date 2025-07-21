from typing import Dict, Any
from pydantic import BaseModel, Field
from langgraph.constants import INTERRUPT
from ..utils.templating import render_config

class HumanInLoopConfig(BaseModel):
    """Configuration for Human-in-the-Loop node."""
    message: str = Field(default="Please review and approve or reject.", description="Message to display to the user")
    input_label: str = Field(default="Comments", description="Label for the input field")
    approval_label: str = Field(default="Approve", description="Label for approval button")
    rejection_label: str = Field(default="Reject", description="Label for rejection button")
    require_comment: bool = Field(default=False, description="Whether a comment is required")

class HumanInLoopNode:
    """
    Human-in-the-Loop node that pauses execution for human input.
    Similar to BranchNode but waits for human decision (approve/reject).
    """
    
    def __init__(self, id: str, config: HumanInLoopConfig):
        self.id = id
        self.config = config

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the human-in-loop node.
        This will interrupt execution and wait for human input.
        """
        try:
            # Render the configuration with current state
            rendered_config = render_config(self.config, state)
            
            # Check if we already have a decision from previous execution
            decision_key = f"{self.id}_decision"
            if decision_key in state:
                # Decision already made, return it
                return {decision_key: state[decision_key]}
            
            # Check if human input is available in the state
            human_input_key = f"{self.id}_human_input"
            if human_input_key in state:
                human_input = state[human_input_key]
                decision = human_input.get("decision", "rejected")  # default to rejected for safety
                comment = human_input.get("comment", "")
                
                # Store the decision and comment in state
                return {
                    decision_key: decision,
                    f"{self.id}_comment": comment,
                    f"{self.id}_user_input": human_input
                }
            
            # No human input yet - LangGraph will handle the interrupt
            # Store the HiL configuration for the frontend to use
            hilp_info = {
                "node_id": self.id,
                "message": rendered_config.message,
                "input_label": rendered_config.input_label,
                "approval_label": rendered_config.approval_label,
                "rejection_label": rendered_config.rejection_label,
                "require_comment": rendered_config.require_comment,
                "type": "human_in_loop_interrupt"
            }
            
            # Set the interrupt information and trigger interrupt
            return {
                f"{self.id}_hilp_info": hilp_info,
                INTERRUPT: f"human_input_required_{self.id}"
            }
            
        except Exception as e:
            # On error, default to rejection and log the error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in HumanInLoopNode {self.id}: {e}")
            return {
                f"{self.id}_decision": "rejected",
                f"{self.id}_error": str(e)
            }
    
    def get_decision(self, state: Dict[str, Any]) -> str:
        """Get the human decision from state."""
        decision_key = f"{self.id}_decision"
        decision = state.get(decision_key, "rejected")
        
        # Map decision to branch paths
        if decision == "approved":
            return "approval"
        elif decision == "rejected":
            return "rejection"
        else:
            return "error_path"
