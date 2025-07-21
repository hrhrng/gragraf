from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from langgraph.types import interrupt, Command
from ..utils.templating import render_config
from . import Conditional

class HumanInLoopConfig(BaseModel):
    """Configuration for Human-in-the-Loop node."""
    message: str = Field(default="Please review and approve or reject.", description="Message to display to the user")
    input_label: str = Field(default="Comments", description="Label for the input field")
    approval_label: str = Field(default="Approve", description="Label for approval button")
    rejection_label: str = Field(default="Reject", description="Label for rejection button")
    require_comment: bool = Field(default=False, description="Whether a comment is required")
    output_name: Optional[str] = Field(default=None, description="Name of the output variable")

class HumanInLoopNode(Conditional):
    """
    Human-in-the-Loop node that pauses execution for human input.
    Uses interrupt/resume mechanism, returns Command with goto and update.
    """
    def __init__(self, id: str, config: HumanInLoopConfig):
        self.id = id
        self.config = config

    def execute(self, state: Any) -> Command:
        # 标准 langgraph resume 机制
        rendered_config = render_config(self.config, state)
        question = rendered_config.message or "Do you approve this step?"
        interrupt_payload = {
            "question": question,
            "node_id": self.id,
            "input_label": rendered_config.input_label,
            "approval_label": rendered_config.approval_label,
            "rejection_label": rendered_config.rejection_label,
            "require_comment": rendered_config.require_comment,
        }
        data = interrupt(interrupt_payload)
        next_node = data.get("decision")
        comment = data.get("comment")
        output_key = self.config.output_name or f"{self.id}_output"
        return {
            f"{self.id}_decision": next_node,
            output_key: comment
        }

    def get_decision(self, state: Any) -> str:
        return state.get(f"{self.id}_decision")
    
