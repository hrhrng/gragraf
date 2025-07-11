import React from 'react';
import { Node, Edge } from 'reactflow';
import { Text, Heading, ScrollArea, Badge } from '@radix-ui/themes';
import { GearIcon } from '@radix-ui/react-icons';
import { NodeData } from '../types';
import { HttpRequestConfigForm } from './HttpRequestConfigForm';
import { AgentConfigForm } from './AgentConfigForm';

import { KnowledgeBaseConfigForm } from './KnowledgeBaseConfigForm';
import { BranchConfigForm } from './BranchConfigForm';
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

const getNodeTypeInfo = (nodeType: string | undefined) => {
  const nodeTypeMap: Record<string, { color: string; description: string }> = {
    start: { color: 'green', description: 'Workflow entry point' },
    end: { color: 'red', description: 'Workflow exit point' },
    httpRequest: { color: 'blue', description: 'HTTP API calls' },
    agent: { color: 'violet', description: 'AI agent processing' },

    knowledgeBase: { color: 'cyan', description: 'Knowledge base queries' },
    branch: { color: 'yellow', description: 'Conditional branching' },
  };
  return nodeTypeMap[nodeType || ''] || { color: 'gray', description: 'Node configuration' };
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
  const nodeInfo = getNodeTypeInfo(selectedNode.type);

  return (
    <div className="w-96 bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${nodeInfo.color}-500/10 border border-${nodeInfo.color}-500/20`}>
            <GearIcon className={`w-5 h-5 text-${nodeInfo.color}-400`} />
          </div>
          <div className="flex-1 min-w-0">
            <Heading size="3" className="text-white">
              {selectedNode.data.label}
            </Heading>
            <Text size="1" className="text-[var(--color-text-secondary)]">
              {nodeInfo.description}
            </Text>
          </div>
          <Badge size="1" color={nodeInfo.color as any} variant="soft">
            <Text size="1">{selectedNode.type}</Text>
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <Text size="1">ID:</Text>
          <Text size="1" className="font-mono bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">
            {selectedNode.id}
          </Text>
        </div>
      </div>

      {/* Available Variables */}
      {availableVariables.length > 0 && (
        <div className="p-6 border-b border-[var(--color-border-primary)]">
          <Text size="2" weight="medium" className="text-white mb-3 block">
            Available Variables
          </Text>
          <div className="flex flex-wrap gap-1">
            {availableVariables.map((variable) => (
              <Badge key={variable} size="1" variant="soft" color="gray">
                <Text size="1" className="font-mono">{variable}</Text>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Form */}
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
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel; 