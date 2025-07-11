#!/usr/bin/env python3
"""
端到端测试：使用完整的工作流JSON测试整个系统的端到端执行
"""

import pytest
import json
import logging
import sys
import os
from pathlib import Path
from typing import Dict, Any

# 添加项目源码路径
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from gragraf.compiler import GraphCompiler
from gragraf.parser import parse_graph

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@pytest.fixture
def test_payload() -> Dict[str, Any]:
    """加载测试payload"""
    payload_path = Path(__file__).parent.parent / "test_payload.json"
    with open(payload_path, 'r') as f:
        return json.load(f)

@pytest.fixture
def compiled_graph(test_payload):
    """编译测试图"""
    compiler = GraphCompiler(test_payload)
    return compiler.compile()

class TestEndToEnd:
    """端到端测试类"""
    
    def test_payload_structure(self, test_payload):
        """测试payload结构正确性"""
        assert "nodes" in test_payload
        assert "edges" in test_payload
        assert len(test_payload["nodes"]) == 4  # start, end, agent_3, agent_4
        assert len(test_payload["edges"]) == 4  # 4条边
        
        # 检查节点类型
        node_types = {node["id"]: node["type"] for node in test_payload["nodes"]}
        assert node_types["start_1"] == "start"
        assert node_types["end_1"] == "end" 
        assert node_types["agent_3"] == "agent"
        assert node_types["agent_4"] == "agent"
    
    def test_graph_compilation(self, test_payload):
        """测试图编译成功"""
        compiler = GraphCompiler(test_payload)
        compiled_graph = compiler.compile()
        assert compiled_graph is not None
        logger.info("✅ 图编译成功")
    
    def test_graph_execution_invoke(self, compiled_graph):
        """测试图执行 - invoke模式"""
        initial_state = {"user": "hi"}
        result = compiled_graph.invoke(initial_state)
        
        # 验证结果结构
        assert isinstance(result, dict)
        assert "user" in result
        assert result["user"] == "hi"
        
        # 应该有agent输出
        agent_outputs = [k for k in result.keys() if k.endswith("_output")]
        assert len(agent_outputs) >= 2  # 至少两个agent的输出
        
        logger.info(f"✅ Invoke执行成功，结果键: {list(result.keys())}")
    
    def test_graph_execution_stream(self, compiled_graph):
        """测试图执行 - stream模式"""
        initial_state = {"user": "hello streaming"}
        
        steps = []
        for step in compiled_graph.stream(initial_state):
            steps.append(step)
            logger.info(f"Stream step: {list(step.keys())}")
        
        # 验证流式执行
        assert len(steps) > 0
        
        # 最后一步应该包含所有结果
        final_state = {}
        for step in steps:
            for key, value in step.items():
                if isinstance(value, dict):
                    final_state.update(value)
                else:
                    final_state[key] = value
        
        logger.info(f"✅ Stream执行成功，共{len(steps)}步")
    
    def test_concurrent_execution(self, compiled_graph):
        """测试并发执行（两个agent并行）"""
        initial_state = {"user": "test concurrent"}
        result = compiled_graph.invoke(initial_state)
        
        # 应该有两个agent的输出
        agent_3_output = result.get("agent_3_output")
        agent_4_output = result.get("agent_4_output")
        
        assert agent_3_output is not None, "agent_3应该有输出"
        assert agent_4_output is not None, "agent_4应该有输出"
        assert isinstance(agent_3_output, str), "agent输出应该是字符串"
        assert isinstance(agent_4_output, str), "agent输出应该是字符串"
        
        logger.info("✅ 并发执行测试通过")
    
    def test_state_management(self, compiled_graph):
        """测试状态管理正确性"""
        initial_state = {"user": "state test"}
        result = compiled_graph.invoke(initial_state)
        
        # 原始状态应该保留
        assert result["user"] == "state test"
        
        # 不应该有状态冲突相关的键
        assert "__updates__" not in result
        assert "__root__" not in result
        
        logger.info("✅ 状态管理测试通过")

 