import React from 'react';
import { Node, Edge } from 'reactflow';
import { ScrollArea, Button, Text, Heading, TextField, Flex } from '@radix-ui/themes';
import { PlayIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { NodeData } from '../types';
import { HttpRequestConfigForm } from './HttpRequestConfigForm';
import { AgentConfigForm } from './AgentConfigForm';
import { KnowledgeBaseConfigForm } from './KnowledgeBaseConfigForm';
import { BranchConfigForm } from './BranchConfigForm';
import { HumanInLoopConfigForm } from './HumanInLoopConfigForm';
import { StartConfigForm } from './StartConfigForm';
import { EndConfigForm } from './EndConfigForm';
import { WorkflowResult } from './WorkflowResult';

interface ConfigPanelProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: Node<NodeData> | null;
  onConfigChange: (nodeId: string, config: any) => void;
  onNodeChange: (nodeUpdates: Partial<Node<NodeData>>) => void;
  // Run workflow related props
  showRunForm?: boolean;
  runFormInputs?: { name: string }[];
  onRunSubmit?: (data: any) => void;
  onRunCancel?: () => void;
  // Execution result related props
  result?: any;
  isLoading?: boolean;
  onRetry?: () => void;
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

// RunWorkflowForm Component
interface RunWorkflowFormProps {
  inputs: { name: string }[];
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

const RunWorkflowForm: React.FC<RunWorkflowFormProps> = ({ inputs, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleFormSubmit = (data: any) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <PlayIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <Heading size="3" className="text-white">
            Run Workflow
          </Heading>
          <Text size="1" className="text-[var(--color-text-secondary)]">
            Provide input values to start execution
          </Text>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {inputs.length === 0 ? (
          <div className="text-center py-8">
            <Text size="2" className="text-[var(--color-text-secondary)]">
              No input fields configured for this workflow
            </Text>
          </div>
        ) : (
          inputs.map((input) => (
            <div key={input.name} className="space-y-2">
              <Text size="2" weight="medium" className="text-white capitalize">
                {input.name.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
              <TextField.Root
                {...register(input.name, { required: true })}
                placeholder={`Enter ${input.name}`}
                className="w-full bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] text-white placeholder:text-[var(--color-text-secondary)]"
              />
              {errors[input.name] && (
                <Text size="1" className="text-red-400">
                  This field is required
                </Text>
              )}
            </div>
          ))
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-[var(--color-border-primary)]">
          <Flex gap="3">
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="soft"
              color="blue"
              className="flex-1"
              disabled={inputs.length === 0}
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Run
            </Button>
          </Flex>
        </div>
      </form>
    </div>
  );
};

const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  nodes, 
  edges, 
  selectedNode, 
  onConfigChange, 
  onNodeChange,
  showRunForm = false,
  runFormInputs = [],
  onRunSubmit,
  onRunCancel,
  result,
  isLoading = false,
  onRetry
}) => {
  // 如果没有选中节点、没有显示运行表单、且没有执行结果，则不显示浮窗
  if (!selectedNode && !showRunForm && !result && !isLoading) {
    return null;
  }

  const handleConfigChange = (newConfig: any) => {
    if (selectedNode) {
      onConfigChange(selectedNode.id, newConfig);
    }
  };

  const availableVariables = selectedNode ? getAvailableVariables(selectedNode.id, nodes, edges) : [];

  return (
    <div className="fixed right-6 top-20 bottom-6 w-96 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl shadow-2xl shadow-black/20 flex flex-col z-50 animate-fade-in backdrop-blur-sm">
      {/* Configuration Form */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Run Workflow Form */}
            {showRunForm && (
              <RunWorkflowForm 
                inputs={runFormInputs}
                onSubmit={onRunSubmit}
                onCancel={onRunCancel}
              />
            )}
            
            {/* Execution Result */}
            {(result || isLoading) && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <Heading size="3" className="text-white">
                      工作流执行结果
                    </Heading>
                    <Text size="1" className="text-[var(--color-text-secondary)]">
                      查看工作流的执行状态和结果
                    </Text>
                  </div>
                </div>
                <WorkflowResult 
                  result={result} 
                  isLoading={isLoading}
                  onRetry={onRetry}
                />
              </div>
            )}
            
            {/* Node Configuration Forms */}
            {selectedNode && (
              <>
                {selectedNode.type === 'start' && (
                  <StartConfigForm node={selectedNode} onConfigChange={handleConfigChange} onNodeChange={onNodeChange} />
                )}
                {selectedNode.type === 'end' && (
                  <EndConfigForm 
                      node={selectedNode} 
                      onConfigChange={handleConfigChange}
                      onNodeChange={onNodeChange}
                      availableVariables={availableVariables}
                  />
                )}
                {selectedNode.type === 'httpRequest' && (
                  <HttpRequestConfigForm 
                    node={selectedNode} 
                    onConfigChange={handleConfigChange}
                    onNodeChange={onNodeChange}
                    availableVariables={availableVariables}
                  />
                )}
                {selectedNode.type === 'agent' && (
                  <AgentConfigForm 
                    node={selectedNode} 
                    onConfigChange={handleConfigChange}
                    onNodeChange={onNodeChange}
                    availableVariables={availableVariables}
                  />
                )}
                {selectedNode.type === 'knowledgeBase' && (
                  <KnowledgeBaseConfigForm
                    node={selectedNode}
                    onConfigChange={handleConfigChange}
                    onNodeChange={onNodeChange}
                    availableVariables={availableVariables}
                  />
                )}
                {selectedNode.type === 'branch' && (
                  <BranchConfigForm 
                      node={selectedNode} 
                      onConfigChange={handleConfigChange}
                      onNodeChange={onNodeChange}
                      availableVariables={availableVariables}
                  />
                )}
                {selectedNode.type === 'humanInLoop' && (
                  <HumanInLoopConfigForm 
                      node={selectedNode}
                      onConfigChange={handleConfigChange}
                      onNodeChange={onNodeChange}
                  />
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ConfigPanel; 