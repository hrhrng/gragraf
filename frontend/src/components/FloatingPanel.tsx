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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {nodeInfo && (
            <>
              <span className="text-xl">{nodeInfo.icon}</span>
              <div>
                <Heading size="3">{nodeInfo.label}</Heading>
                <Text size="2" className="text-gray-500">
                  {selectedNode?.id || '配置面板'}
                </Text>
              </div>
            </>
          )}
          {!selectedNode && (
            <>
              <TestIcon className="w-5 h-5 text-blue-500" />
              <Heading size="3">工作流管理</Heading>
            </>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="2" 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <Cross2Icon className="w-4 h-4" />
        </Button>
      </div>

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

            <Tabs.Content value="run" className="h-full p-4">
              <div className="space-y-4">
                {/* Run Button */}
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Heading size="3">执行工作流</Heading>
                      <Badge variant="outline" color={nodes.length > 0 ? 'green' : 'gray'}>
                        {nodes.length} 个节点
                      </Badge>
                    </div>
                    <Button 
                      onClick={onRunWorkflow}
                      disabled={isRunning || nodes.length === 0}
                      className="w-full"
                      size="3"
                    >
                      {isRunning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          执行中...
                        </>
                      ) : (
                        <>
                          <TestIcon className="w-4 h-4 mr-2" />
                          开始执行
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Results */}
                <div className="flex-1">
                  <WorkflowResult 
                    result={executionResults}
                    isLoading={isRunning}
                  />
                </div>
              </div>
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </div>
  );
}; 