from typing import Dict, Any
from .schemas.graph import Graph
from pydantic import ValidationError

def parse_graph(graph_data: Dict[str, Any]) -> Graph:
    """
    Parses a dictionary into a Graph object.
    
    Raises:
        ValueError: If the graph data is invalid.
    """
    try:
        return Graph.model_validate(graph_data)
    except ValidationError as e:
        # For simplicity, we'll raise a generic ValueError.
        # In a real app, you might want to return a more detailed error.
        raise ValueError(f"Invalid graph structure: {e}") 