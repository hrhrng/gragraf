from enum import Enum
from typing import Dict, Any, List, Optional

from pydantic import BaseModel, Field


class NodeType(str, Enum):
    """
    Enum for the different types of nodes that can be used in the graph.
    """
    AGENT = "agent"
    HTTP_REQUEST = "http_request"

    KNOWLEDGE_BASE = "knowledge_base"
    BRANCH = "branch"
    START = "start"
    END = "end"


class Node(BaseModel):
    """
    Represents a node in the computation graph.
    """
    id: str = Field(..., description="Unique identifier for the node.")
    type: NodeType = Field(..., description="The type of the node.")
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuration for the node's execution.")
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0}, description="Position on the frontend canvas.")


class Edge(BaseModel):
    """
    Represents a directed edge between two nodes in the graph.
    """
    id: str = Field(..., description="Unique identifier for the edge.")
    source: str = Field(..., description="The ID of the source node.")
    target: str = Field(..., description="The ID of the target node.")
    source_handle: Optional[str] = Field(None, description="The specific output handle of the source node.")
    target_handle: Optional[str] = Field(None, description="The specific input handle of the target node.")


class Graph(BaseModel):
    """
    Represents the entire computation graph.
    """
    nodes: List[Node] = Field(..., description="A list of all nodes in the graph.")
    edges: List[Edge] = Field(..., description="A list of all edges connecting the nodes.") 