from typing import Dict, Any, List, Annotated, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .parser import parse_graph
from .schemas.graph import NodeType
from .nodes.http_request import HttpRequestNode, HttpRequestConfig

from .nodes.branch import BranchNode, BranchConfig
from .nodes.knowledge_base import KnowledgeBaseNode, KnowledgeBaseConfig
from .nodes.agent import AgentNode, AgentConfig
from .nodes.human_in_loop import HumanInLoopNode, HumanInLoopConfig
from .nodes.start import StartNode
from .nodes.end import EndNode

import operator
import logging

# Use operator.add to accumulate updates in a list
def flatten_updates(updates_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Flatten a list of state updates into a single dictionary.
    This resolves the concurrent update issue by collecting all updates first.
    """
    result = {}
    for update in updates_list:
        result.update(update)
    return result

# Custom reducer function for state management
def state_reducer(x: Dict[str, Any], y: Dict[str, Any]) -> Dict[str, Any]:
    """
    Advanced state reducer to handle concurrent updates and prevent conflicts.
    Supports both concurrent update format and direct updates.
    """
    logger = logging.getLogger(__name__)
    
    # Always start with the base state
    result = dict(x) if x else {}
    
    # Defensive check for y
    if y is None:
        return result
    
    # Handle the concurrent update format with __updates__ key
    if isinstance(y, dict) and "__updates__" in y:
        logger.info(f"Processing {len(y['__updates__'])} concurrent updates")
        for update in y["__updates__"]:
            if isinstance(update, dict):
                logger.info(f"Applying update: {update}")
                result.update(update)
            else:
                logger.warning(f"Skipping non-dict update: {update}")
    elif isinstance(y, dict):
        # Handle direct state updates - ensure y is a proper dictionary
        logger.info(f"Applying direct state update: {y}")
        result.update(y)
    else:
        # If y is not a dict, log the issue and skip the update
        logger.error(f"Invalid state update format. Expected dict, got {type(y)}: {y}")
        
    logger.info(f"State after reducer: {list(result.keys())}")
    return result

# Dynamic state that can hold any fields, with a custom reducer
GraphState = Annotated[Dict[str, Any], state_reducer]

class GraphCompiler:
    def __init__(self, graph_dsl: Dict[str, Any], checkpointer: Optional[MemorySaver] = None):
        self.graph_dsl = graph_dsl
        self.parsed_graph = parse_graph(graph_dsl)
        self.nodes = {node.id: node for node in self.parsed_graph.nodes}
        self.node_instances = {}
        self.checkpointer = checkpointer or MemorySaver()

    def _create_node_instance(self, node_id: str):
        """Creates an instance of a node from its configuration."""
        node_config = self.nodes[node_id]
        node_type = node_config.type
        
        if node_type == NodeType.HTTP_REQUEST:
            config = HttpRequestConfig.model_validate(node_config.config)
            return HttpRequestNode(node_id, config)
        elif node_type == NodeType.BRANCH:
            config = BranchConfig.model_validate(node_config.config)
            return BranchNode(node_id, config)
        elif node_type == NodeType.HUMAN_IN_LOOP:
            config = HumanInLoopConfig.model_validate(node_config.config)
            return HumanInLoopNode(node_id, config)
        elif node_type == NodeType.KNOWLEDGE_BASE:
            config = KnowledgeBaseConfig.model_validate(node_config.config)
            return KnowledgeBaseNode(node_id, config)
        elif node_type == NodeType.AGENT:
            config = AgentConfig.model_validate(node_config.config)
            return AgentNode(node_id, config)
        elif node_type == NodeType.START:
            return StartNode(node_id, node_config.config)
        elif node_type == NodeType.END:
            return EndNode(node_id, node_config.config)
        else:
            raise ValueError(f"Unsupported node type: {node_type}")

    def _get_start_node(self) -> str:
        """Get the single start node ID."""
        start_nodes = [node_id for node_id, node_config in self.nodes.items() 
                      if node_config.type == NodeType.START]
        if len(start_nodes) != 1:
            raise ValueError(f"Expected exactly 1 start node, found {len(start_nodes)}")
        return start_nodes[0]
    
    def _get_end_node(self) -> str:
        """Get the single end node ID."""
        end_nodes = [node_id for node_id, node_config in self.nodes.items() 
                    if node_config.type == NodeType.END]
        if len(end_nodes) != 1:
            raise ValueError(f"Expected exactly 1 end node, found {len(end_nodes)}")
        return end_nodes[0]

    def _topological_sort(self) -> List[str]:
        """
        Perform topological sorting using Kahn's algorithm.
        Returns the nodes in topological order.
        Raises ValueError if a cycle is detected.
        """
        # Calculate in-degree for each node
        in_degree = {node_id: 0 for node_id in self.nodes}
        
        for edge in self.parsed_graph.edges:
            in_degree[edge.target] += 1
        
        # Start with nodes that have no incoming edges
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            # Sort to ensure deterministic ordering
            queue.sort()
            node = queue.pop(0)
            result.append(node)
            
            # Remove this node from the graph and update in-degrees
            for edge in self.parsed_graph.edges:
                if edge.source == node:
                    in_degree[edge.target] -= 1
                    if in_degree[edge.target] == 0:
                        queue.append(edge.target)
        
        # Check for cycles
        if len(result) != len(self.nodes):
            remaining_nodes = [node_id for node_id in self.nodes if node_id not in result]
            raise ValueError(f"Cycle detected in graph. Remaining nodes: {remaining_nodes}")
        
        return result

    def _validate_graph_structure(self):
        """Validate the graph structure and constraints."""
        # These methods will raise if not exactly 1 start and 1 end node
        start_node = self._get_start_node()
        end_node = self._get_end_node()
        
        # Check for orphaned nodes (nodes with no incoming or outgoing edges)
        edge_sources = {edge.source for edge in self.parsed_graph.edges}
        edge_targets = {edge.target for edge in self.parsed_graph.edges}
        
        for node_id, node_config in self.nodes.items():
            if node_config.type not in [NodeType.START, NodeType.END]:
                has_incoming = node_id in edge_targets
                has_outgoing = node_id in edge_sources
                if not has_incoming and not has_outgoing:
                    raise ValueError(f"Orphaned node detected: {node_id}")
                elif not has_incoming:
                    raise ValueError(f"Node {node_id} has no incoming connections")
                elif not has_outgoing and node_config.type != NodeType.END:
                    raise ValueError(f"Node {node_id} has no outgoing connections")

    def compile(self):
        """
        Compiles the DSL into an executable LangGraph with proper support for:
        - Multiple start nodes (parallel execution)
        - Topological ordering
        - Cycle detection
        - Proper LangGraph semantics
        - Dynamic state management to avoid concurrent update conflicts
        """
        # Validate graph structure
        self._validate_graph_structure()
        
        # Check topological ordering (this will raise if there are cycles)
        topological_order = self._topological_sort()
        # Use dynamic state to avoid concurrent update conflicts
        workflow = StateGraph(GraphState)
        start_node_id = self._get_start_node()
        end_node_id = self._get_end_node()

        # Add all nodes to the graph
        for node_id, node_config in self.nodes.items():
            # Create node instances for all node types
            instance = self._create_node_instance(node_id)
            self.node_instances[node_id] = instance
            workflow.add_node(node_id, instance.execute)
        
        # Set the single start node as entry point
        workflow.set_entry_point(start_node_id)

        # Analyze edges to handle multiple input edges properly
        # Group edges by target to detect nodes with multiple inputs
        edges_by_target = {}
        for edge in self.parsed_graph.edges:
            source_node = self.nodes[edge.source]
            if source_node.type not in (NodeType.BRANCH, NodeType.HUMAN_IN_LOOP):  # Skip branch nodes for now
                target = edge.target
                if target not in edges_by_target:
                    edges_by_target[target] = []
                edges_by_target[target].append(edge.source)
        
        # Add edges based on input degree
        regular_edges = []
        for target, sources in edges_by_target.items():
            if len(sources) == 1:
                # Single input - use traditional syntax
                workflow.add_edge(sources[0], target)
                regular_edges.append(f"{sources[0]} -> {target}")
            else:
                # Multiple inputs - use list syntax for LangGraph
                workflow.add_edge(sources, target)
                regular_edges.append(f"{sources} -> {target}")
        # Add conditional edges for branch and human-in-loop nodes
        branch_edges = []
        for node_id, node_config in self.nodes.items():
            if node_config.type in [NodeType.BRANCH, NodeType.HUMAN_IN_LOOP]:
                instance = self.node_instances[node_id]
                # Find the edges from this conditional node
                conditional_edges_for_node = [e for e in self.parsed_graph.edges if e.source == node_id]
                path_map = {
                    edge.source_handle or "default": edge.target 
                    for edge in conditional_edges_for_node
                }
                # LangGraph requires a mapping function that returns the path key
                def create_condition_func(inst):
                    def condition_func(state):
                        return inst.get_decision(state)
                    return condition_func
                
                workflow.add_conditional_edges(
                    node_id,
                    create_condition_func(instance),
                    path_map
                )
                
                branch_edges.extend([f"{node_id} -[{handle}]-> {target}" 
                                   for handle, target in path_map.items()])
        # Connect the single end node to LangGraph's END
        workflow.add_edge(end_node_id, END)
        # Handle nodes that don't connect to explicit end nodes
        nodes_with_outgoing = {edge.source for edge in self.parsed_graph.edges}
        nodes_with_outgoing.update(node_id for node_id, config in self.nodes.items() 
                                 if config.type in [NodeType.BRANCH, NodeType.HUMAN_IN_LOOP])
        
        for node_id, node_config in self.nodes.items():
            if (node_config.type not in [NodeType.START, NodeType.END, NodeType.BRANCH, NodeType.HUMAN_IN_LOOP] and 
                node_id not in nodes_with_outgoing):
                # This is a leaf node that should connect to END
                workflow.add_edge(node_id, END)
    
        return workflow.compile(checkpointer=self.checkpointer)