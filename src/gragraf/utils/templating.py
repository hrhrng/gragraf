from typing import Any, Dict, List, Set
from jinja2 import Environment, meta, TemplateError, UndefinedError
from pydantic import BaseModel
import logging

# Initialize Jinja2 environment with strict undefined handling
from jinja2 import StrictUndefined
env = Environment(undefined=StrictUndefined)

logger = logging.getLogger(__name__)

def find_template_variables(template_string: str) -> Set[str]:
    """
    Extract all variables referenced in a Jinja2 template string.
    """
    try:
        parsed = env.parse(template_string)
        return meta.find_undeclared_variables(parsed)
    except Exception as e:
        logger.warning(f"Failed to parse template '{template_string}': {e}")
        return set()

def validate_template_variables(template_string: str, available_vars: Set[str]) -> Dict[str, Any]:
    """
    Validate that all variables in a template are available in the state.
    Returns validation results with missing variables and other info.
    """
    required_vars = find_template_variables(template_string)
    missing_vars = required_vars - available_vars
    
    return {
        "required_variables": list(required_vars),
        "missing_variables": list(missing_vars),
        "is_valid": len(missing_vars) == 0,
        "available_variables": list(available_vars)
    }

def render_template_string(template_string: str, state: Dict[str, Any], debug: bool = False) -> str:
    """
    Render a single template string with comprehensive error handling and debugging.
    """
    if not isinstance(template_string, str):
        return template_string
    
    # Check if the string contains template syntax
    if '{{' not in template_string or '}}' not in template_string:
        return template_string
    
    try:
        # State is now directly accessible - no need for flattening
        actual_state = state
        
        # Find required variables
        required_vars = find_template_variables(template_string)
        available_vars = set(actual_state.keys())
        
        if debug:
            validation = validate_template_variables(template_string, available_vars)
            logger.info(f"Template validation: {validation}")
        
        # Create template and render
        template = env.from_string(template_string)
        rendered = template.render(actual_state)
        
        if debug:
            logger.info(f"Successfully rendered template: '{template_string}' -> '{rendered}'")
        
        return rendered
        
    except UndefinedError as e:
        logger.error(f"Undefined variable in template '{template_string}': {e}")
        # Return original string with error marker for debugging
        return f""
    except TemplateError as e:
        logger.error(f"Template syntax error in '{template_string}': {e}")
        return f"[TEMPLATE_ERROR: {str(e)}] {template_string}"
    except Exception as e:
        logger.error(f"Unexpected error rendering template '{template_string}': {e}")
        return f"[RENDER_ERROR: {str(e)}] {template_string}"

def render_config(config: BaseModel, state: Dict[str, Any], debug: bool = False) -> BaseModel:
    """
    Renders all string fields in a Pydantic model with the given state.
    Enhanced with better error handling and debugging capabilities.
    """
    config_data = config.model_dump()
    rendered_data = {}
    
    if debug:
        logger.info(f"Rendering config for {type(config).__name__} with state keys: {list(state.keys())}")

    def render_recursive(obj: Any, path: str = "") -> Any:
        """Recursively render templates in nested structures"""
        if isinstance(obj, str):
            return render_template_string(obj, state, debug)
        elif isinstance(obj, dict):
            return {k: render_recursive(v, f"{path}.{k}") for k, v in obj.items()}
        elif isinstance(obj, list):
            return [render_recursive(item, f"{path}[{i}]") for i, item in enumerate(obj)]
        else:
            return obj

    for key, value in config_data.items():
        try:
            rendered_data[key] = render_recursive(value, key)
            if debug and isinstance(value, str) and value != rendered_data[key]:
                logger.info(f"Rendered field '{key}': '{value}' -> '{rendered_data[key]}'")
        except Exception as e:
            logger.error(f"Error rendering field '{key}': {e}")
            rendered_data[key] = value  # Keep original value on error

    # Create a new config instance with the rendered data
    try:
        return type(config).model_validate(rendered_data)
    except Exception as e:
        logger.error(f"Failed to validate rendered config: {e}")
        # Return original config if validation fails
        return config

def get_debug_info(config: BaseModel, state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get debugging information about template rendering for a config.
    """
    config_data = config.model_dump()
    debug_info = {
        "config_type": type(config).__name__,
        "state_variables": list(state.keys()),
        "field_analysis": {}
    }
    
    def analyze_field(obj: Any, path: str = "") -> Dict[str, Any]:
        """Analyze a field for template variables"""
        if isinstance(obj, str):
            if '{{' in obj and '}}' in obj:
                validation = validate_template_variables(obj, set(state.keys()))
                return {
                    "is_template": True,
                    "template_string": obj,
                    "validation": validation
                }
            else:
                return {"is_template": False, "value": obj}
        elif isinstance(obj, (dict, list)):
            return {"is_complex": True, "type": type(obj).__name__}
        else:
            return {"is_simple": True, "value": obj, "type": type(obj).__name__}
    
    for key, value in config_data.items():
        debug_info["field_analysis"][key] = analyze_field(value, key)
    
    return debug_info 