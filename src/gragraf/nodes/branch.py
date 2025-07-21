from typing import Dict, Any, List
from pydantic import BaseModel, Field
from ..utils.templating import render_config
from . import Conditional

class BranchCondition(BaseModel):
    condition: str = Field(..., description="A Python expression to evaluate for branching.")
    variable: str = Field(default="", description="The variable to evaluate (for UI)")
    operator: str = Field(default="==", description="The operator to use (for UI)")
    value: str = Field(default="", description="The value to compare against (for UI)")

class BranchConfig(BaseModel):
    conditions: List[BranchCondition] = Field(default_factory=list, description="List of conditions to evaluate")
    hasElse: bool = Field(default=False, description="Whether to include an else branch")

class BranchNode(Conditional):
    def __init__(self, id: str, config: BranchConfig):
        self.id = id
        self.config = config

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluates conditions and returns the branch decision."""
        try:
            rendered_config = render_config(self.config, state)
            
            # Evaluate each condition in order
            for index, condition in enumerate(rendered_config.conditions):
                try:
                    scope = {'state': state}
                    result = eval(condition.condition, {"__builtins__": {}}, scope)
                    if result:
                        decision = f"branch-{index}"
                        break
                except Exception:
                    continue
            else:
                # No condition matched, use else branch if available
                decision = "else" if rendered_config.hasElse else "default"
        except Exception:
            decision = "default"
        
        return {f"{self.id}_decision": decision}
    
    def get_decision(self, state: Dict[str, Any]) -> str:
        """Get the branch decision from state."""
        return state.get(f"{self.id}_decision")