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
    return null; // 没有选中节点时不显示浮窗
  }

  const handleConfigChange = (newConfig: any) => {
    onConfigChange(selectedNode.id, newConfig);
  };

  const availableVariables = getAvailableVariables(selectedNode.id, nodes, edges);

  return (
    <div className="fixed right-6 top-20 bottom-6 w-96 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl shadow-2xl shadow-black/20 flex flex-col z-50 animate-fade-in backdrop-blur-sm">
      {/* Header */}
      <div className="p-6 border-b border-[var(--color-border-primary)] rounded-t-xl bg-[var(--color-bg-secondary)]/95">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <GearIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <Heading size="3" className="text-white">
              Node Configuration
            </Heading>
            <Text size="1" className="text-[var(--color-text-secondary)]">
              {selectedNode.data.label} • {selectedNode.id.slice(0, 8)}
            </Text>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
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
        </ScrollArea>
      </div>
    </div>
  );
};

export default ConfigPanel; 