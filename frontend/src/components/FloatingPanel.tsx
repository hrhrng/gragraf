import React, { useState } from 'react';
import { Node, Edge } from 'reactflow';
import { Text, Heading, ScrollArea, Badge, Button, Card, Tabs } from '@radix-ui/themes';
import { 
  GearIcon, 
  Cross2Icon,
  PlayIcon as TestIcon
} from '@radix-ui/react-icons';
import { NodeData } from '../types';
import { HttpRequestConfigForm } from './HttpRequestConfigForm';
import { AgentConfigForm } from './AgentConfigForm';
import { KnowledgeBaseConfigForm } from './KnowledgeBaseConfigForm';
import { BranchConfigForm } from './BranchConfigForm';
import { StartConfigForm } from './StartConfigForm';
import { EndConfigForm } from './EndConfigForm';
import { WorkflowResult } from './WorkflowResult';

interface FloatingPanelProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: Node<NodeData> | null;
  onNodeUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onClose: () => void;
  isVisible: boolean;
  executionResults?: any;
  onRunWorkflow?: () => void;
  isRunning?: boolean;
}

const getNodeTypeInfo = (nodeType: string) => {
  const nodeTypes: Record<string, { label: string; icon: string; color: string }> = {
    'start': { label: '开始节点', icon: '🚀', color: 'green' },
    'httpRequest': { label: 'HTTP请求', icon: '🌐', color: 'blue' },
    'agent': { label: 'AI助手', icon: '🤖', color: 'purple' },
    'knowledgeBase': { label: '知识库', icon: '📚', color: 'orange' },
    'branch': { label: '分支判断', icon: '🔀', color: 'yellow' },
    'end': { label: '结束节点', icon: '🏁', color: 'red' },
    'unknown': { label: '未知节点', icon: '❓', color: 'gray' }
  };
  return nodeTypes[nodeType] || nodeTypes['unknown'];
};

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  nodes,
  edges,
  selectedNode,
  onNodeUpdate,
  onClose,
  isVisible,
  executionResults,
  onRunWorkflow,
  isRunning = false
}) => {
  const [activeTab, setActiveTab] = useState(selectedNode ? 'config' : 'run');

  if (!isVisible) {
    return null;
  }

  const nodeInfo = selectedNode ? getNodeTypeInfo(selectedNode.type || 'unknown') : null;

  const renderConfigForm = () => {
    if (!selectedNode) {
      return (
        <div className="p-6 text-center">
          <Text className="text-gray-500">请选择一个节点来配置</Text>
        </div>
      );
    }

    const nodeType = selectedNode.type;
    
    // Generate available variables from all nodes
    const availableVariables = nodes
      .filter(node => node.data.config?.output_name)
      .map(node => `{{${node.data.config.output_name}}}`)
      .concat(['{{input}}', '{{user_input}}']); // Add common variables
    
    const commonProps = {
      node: selectedNode,
      onConfigChange: (config: any) => {
        onNodeUpdate(selectedNode.id, { config });
      },
      availableVariables
    };

    switch (nodeType) {
      case 'httpRequest':
        return <HttpRequestConfigForm {...commonProps} />;
      case 'agent':
        return <AgentConfigForm {...commonProps} />;
      case 'knowledgeBase':
        return <KnowledgeBaseConfigForm {...commonProps} />;
      case 'branch':
        return <BranchConfigForm {...commonProps} />;
      case 'start':
        return <StartConfigForm {...commonProps} />;
      case 'end':
        return <EndConfigForm {...commonProps} />;
      default:
        return (
          <div className="p-6 text-center">
            <Text className="text-gray-500">此节点类型暂不支持配置</Text>
          </div>
        );
    }
  };

  // Auto-switch to config tab when a node is selected
  React.useEffect(() => {
    if (selectedNode) {
      setActiveTab('config');
    }
  }, [selectedNode]);

  return (
    <div className="fixed right-4 top-4 bottom-4 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col">
      {/* 移除Header部分，直接渲染内容 */}
      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {/* Tab List */}
          <div className="border-b border-gray-200">
            <Tabs.List className="flex w-full">
              <Tabs.Trigger value="config" className="flex-1 flex items-center justify-center gap-2 px-4 py-3">
                <GearIcon className="w-4 h-4" />
                节点配置
              </Tabs.Trigger>
              <Tabs.Trigger value="run" className="flex-1 flex items-center justify-center gap-2 px-4 py-3">
                <TestIcon className="w-4 h-4" />
                测试运行
              </Tabs.Trigger>
            </Tabs.List>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs.Content value="config" className="h-full">
              <ScrollArea className="h-full">
                {renderConfigForm()}
              </ScrollArea>
            </Tabs.Content>
            <Tabs.Content value="run" className="h-full">
              {executionResults && <WorkflowResult result={executionResults} isLoading={isRunning} />}
              {onRunWorkflow && (
                <Button onClick={onRunWorkflow} disabled={isRunning} className="mt-4">
                  {isRunning ? '运行中...' : '运行工作流'}
                </Button>
              )}
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </div>
  );
}; 