import React from 'react';
import { Node, Edge } from 'reactflow';
import { Text, Heading, ScrollArea, Badge } from '@radix-ui/themes';
import { GearIcon } from '@radix-ui/react-icons';
import { NodeData } from '../types';
import { HttpRequestConfigForm } from './HttpRequestConfigForm';
import { AgentConfigForm } from './AgentConfigForm';
import { KnowledgeBaseConfigForm } from './KnowledgeBaseConfigForm';
import { BranchConfigForm } from './BranchConfigForm';
import { HumanInLoopConfigForm } from './HumanInLoopConfigForm';
import { StartConfigForm } from './StartConfigForm';
import { EndConfigForm } from './EndConfigForm';

interface ConfigPanelProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: Node<NodeData> | null;
  onConfigChange: (nodeId: string, config: any) => void;
}

// Helper function to find all ancestor nodes for a given node
const getAvailableVariables = (nodeId: string, nodes: Node[], edges: Edge[]): string[] => {
  const allVariables: Set<string> = new Set();
  const queue: string[] = [nodeId];
  const visited: Set<string> = new Set();

  // First, add all inputs from the start node, as they are globally available
  const startNode = nodes.find(n => n.type === 'start');
  if (startNode && startNode.data.config.inputs) {
    for (const input of startNode.data.config.inputs) {
      if (input.name) {
        allVariables.add(input.name);
      }
    }
  }

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    if (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);
      
      const incomingEdges = edges.filter((edge) => edge.target === currentNodeId);
      for (const edge of incomingEdges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.type !== 'start') {
          const outputName = sourceNode.data.config?.output_name || `${sourceNode.id}_output`;
          allVariables.add(outputName);
        }
        queue.push(edge.source);
      }
    }
  }

  return Array.from(allVariables);
};

const ConfigPanel: React.FC<ConfigPanelProps> = ({ nodes, edges, selectedNode, onConfigChange }) => {
  if (!selectedNode) {
    return (
      <div className="w-96 bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] flex items-center justify-center mb-4">
            <GearIcon className="w-8 h-8 text-[var(--color-text-secondary)]" />
          </div>
          <Heading size="4" className="text-white mb-2">
            Node Configuration
          </Heading>
          <Text size="2" className="text-[var(--color-text-secondary)] max-w-xs leading-relaxed">
            Select a node from the canvas to configure its properties and settings.
          </Text>
        </div>
      </div>
    );
  }

  const handleConfigChange = (newConfig: any) => {
    onConfigChange(selectedNode.id, newConfig);
  };

  const availableVariables = getAvailableVariables(selectedNode.id, nodes, edges);

  return (
    <div className="w-96 bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col h-full animate-fade-in">
      {/* Configuration Form - 统一的配置表单会处理所有样式和变量显示 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {selectedNode.type === 'start' && (
            <StartConfigForm node={selectedNode} onConfigChange={handleConfigChange} />
          )}
          {selectedNode.type === 'end' && (
            <EndConfigForm 
                node={selectedNode} 
                onConfigChange={handleConfigChange} 
                availableVariables={availableVariables}
            />
          )}
          {selectedNode.type === 'httpRequest' && (
            <HttpRequestConfigForm 
              node={selectedNode} 
              onConfigChange={handleConfigChange}
              availableVariables={availableVariables}
            />
          )}
          {selectedNode.type === 'agent' && (
            <AgentConfigForm 
              node={selectedNode} 
              onConfigChange={handleConfigChange}
              availableVariables={availableVariables}
            />
          )}
          {selectedNode.type === 'knowledgeBase' && (
            <KnowledgeBaseConfigForm
              node={selectedNode}
              onConfigChange={handleConfigChange}
              availableVariables={availableVariables}
            />
          )}
          {selectedNode.type === 'branch' && (
            <BranchConfigForm 
                node={selectedNode} 
                onConfigChange={handleConfigChange} 
                availableVariables={availableVariables}
            />
          )}
          {selectedNode.type === 'humanInLoop' && (
            <HumanInLoopConfigForm 
                node={selectedNode}
                onConfigChange={handleConfigChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel; 