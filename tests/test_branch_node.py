import pytest
from gragraf.nodes.branch import BranchNode, BranchConfig, BranchCondition

def test_branch_node_true_condition():
    """
    Tests that the branch node returns the correct decision when the condition is met.
    """
    conditions = [
        BranchCondition(condition="state['x'] > 5", variable="x", operator=">", value="5")
    ]
    config = BranchConfig(conditions=conditions)
    node = BranchNode("branch_node_1", config)
    
    input_state = {"x": 10}
    result = node.execute(input_state)
    
    assert result == {"branch_node_1_decision": "branch-0"}

def test_branch_node_false_condition():
    """
    Tests that the branch node returns 'error_path' when no condition is met and no else branch.
    """
    conditions = [
        BranchCondition(condition="state['x'] > 5", variable="x", operator=">", value="5")
    ]
    config = BranchConfig(conditions=conditions, hasElse=False)
    node = BranchNode("branch_node_2", config)
    
    input_state = {"x": 3}
    result = node.execute(input_state)
    
    assert result == {"branch_node_2_decision": "error_path"}

def test_branch_node_evaluation_error():
    """
    Tests that the branch node handles errors during condition evaluation.
    For example, if a key is missing from the state.
    """
    conditions = [
        BranchCondition(condition="state['non_existent_key'] == 'value'", variable="non_existent_key", operator="==", value="value")
    ]
    config = BranchConfig(conditions=conditions)
    node = BranchNode("branch_node_3", config)

    input_state = {}
    
    # In this case, it should return error_path since no else branch
    result = node.execute(input_state)
    assert result == {"branch_node_3_decision": "error_path"}

def test_branch_node_syntax_error():
    """
    Tests that the branch node handles syntax errors in the condition.
    """
    conditions = [
        BranchCondition(condition="state['x' > 5", variable="x", operator=">", value="5")  # Invalid syntax
    ]
    config = BranchConfig(conditions=conditions)
    node = BranchNode("branch_node_4", config)

    input_state = {"x": 10}
    
    result = node.execute(input_state)
    assert result == {"branch_node_4_decision": "error_path"} 