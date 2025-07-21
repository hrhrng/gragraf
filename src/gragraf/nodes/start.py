from typing import Dict, Any, List
from pydantic import BaseModel, Field
from ..utils.templating import render_config
import logging

logger = logging.getLogger(__name__)

class InputVariable(BaseModel):
    name: str = Field(..., description="Name of the input variable")

class StartConfig(BaseModel):
    inputs: List[InputVariable] = Field(default_factory=list, description="List of input variables")

class StartNode:
    def __init__(self, node_id: str, config: Dict[str, Any]):
        self.node_id = node_id
        self.raw_config = config
        # Parse the inputs part as StartConfig if it exists
        if 'inputs' in config:
            self.config = StartConfig.model_validate({'inputs': config['inputs']})
        else:
            self.config = StartConfig()

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initialize workflow state with input variables.
        The actual input values should be passed from the frontend/API via state.
        """
        try:
            updates = {}
            # For each defined input variable, try to extract its value from the state
            for input_var in self.config.inputs:
                var_name = input_var.name
                if var_name in state:
                    updates[var_name] = state[var_name]
                    logger.info(f"StartNode {self.node_id}: Set {var_name} = {state[var_name]}")
                else:
                    logger.warning(f"StartNode {self.node_id}: Input variable {var_name} not found in state")
            return updates
        except Exception as e:
            logger.error(f"StartNode {self.node_id} execution failed: {e}")
            return {f"{self.node_id}_error": f"Start node execution failed: {str(e)}"}

    def get_requirements(self) -> Dict[str, Any]:
        """Get information about what variables this start node provides."""
        return {
            "provides_variables": [input_var.name for input_var in self.config.inputs],
            "node_id": self.node_id
        } 