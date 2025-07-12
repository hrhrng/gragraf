from typing import Dict, Any, List
from pydantic import BaseModel, Field
from ..utils.templating import render_config
import logging

logger = logging.getLogger(__name__)

class OutputVariable(BaseModel):
    name: str = Field(..., description="Name of the output variable")
    value: str = Field(..., description="Template string for the output value (e.g., '{{variable_name}}')")

class EndConfig(BaseModel):
    outputs: List[OutputVariable] = Field(default_factory=list, description="List of output variables to collect")

class EndNode:
    def __init__(self, node_id: str, config: Dict[str, Any]):
        self.node_id = node_id
        self.raw_config = config
        # Parse the outputs part as EndConfig if it exists
        if 'outputs' in config:
            self.config = EndConfig.model_validate({'outputs': config['outputs']})
        else:
            self.config = EndConfig()

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Collect and render output variables from the workflow state.
        This represents the final result of the workflow.
        """
        try:
            rendered_config = render_config(self.config, state)
            
            # Collect outputs by rendering template variables
            outputs = {}
            for output_var in rendered_config.outputs:
                try:
                    # The render_config should have already resolved the template
                    outputs[output_var.name] = output_var.value
                    logger.info(f"EndNode {self.node_id}: Collected {output_var.name} = {output_var.value}")
                except Exception as e:
                    logger.warning(f"EndNode {self.node_id}: Failed to render output {output_var.name}: {e}")
                    outputs[output_var.name] = f"Error: {str(e)}"
            
            # Return the outputs under a special key for the end node
            output_key = f"{self.node_id}_outputs"
            return {
                output_key: outputs,
                "outputs": outputs  # Also add under generic 'outputs' key for easy access
            }
            
        except Exception as e:
            logger.error(f"EndNode {self.node_id} execution failed: {e}")
            return {f"{self.node_id}_error": f"End node execution failed: {str(e)}"}

    def get_requirements(self) -> Dict[str, Any]:
        """Get information about what variables this end node requires."""
        from ..utils.templating import find_template_variables
        
        required_vars = set()
        for output_var in self.config.outputs:
            required_vars.update(find_template_variables(output_var.value))
        
        return {
            "required_variables": list(required_vars),
            "output_variables": [output_var.name for output_var in self.config.outputs],
            "node_id": self.node_id
        } 