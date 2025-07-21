import React from 'react';
import { useForm } from 'react-hook-form';
import { Node, Edge } from 'reactflow';
import { Button, Text, Heading, TextField, Flex } from '@radix-ui/themes';
import { PlayIcon } from '@radix-ui/react-icons';
import { NodeData } from '../types';
import ConfigPanel from './ConfigPanel';
import { WorkflowResult } from './WorkflowResult';

interface RightPanelProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: Node<NodeData> | null;
  onConfigChange: (nodeId: string, config: any) => void;
  result: any;
  isLoading: boolean;
  onRetry?: () => void;
  // 运行表单相关
  showRunForm: boolean;
  runFormInputs: { name: string }[];
  onRunSubmit: (data: any) => void;
  onRunCancel: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  nodes, 
  edges, 
  selectedNode, 
  onConfigChange, 
  result, 
  isLoading, 
  onRetry,
  showRunForm,
  runFormInputs,
  onRunSubmit,
  onRunCancel
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  // 优先显示运行表单（当需要运行工作流时）
  if (showRunForm) {
    return (
      <div className="w-96 bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col h-full">
        <div className="p-6 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-3 mb-3">
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
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          <form onSubmit={handleSubmit(onRunSubmit)} className="space-y-4 h-full flex flex-col">
            <div className="flex-1 space-y-4">
              {runFormInputs.length === 0 ? (
                <div className="text-center py-8">
                  <Text size="2" className="text-[var(--color-text-secondary)]">
                    No input fields configured for this workflow
                  </Text>
                </div>
              ) : (
                runFormInputs.map((input) => (
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
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[var(--color-border-primary)]">
              <Flex gap="3">
                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  onClick={onRunCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="soft"
                  color="blue"
                  className="flex-1"
                  disabled={runFormInputs.length === 0}
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Run
                </Button>
              </Flex>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 显示配置面板（当有选中节点时）
  if (selectedNode) {
    // ConfigPanel现在是浮窗，不在RightPanel中显示
    return null;
  }

  // 当没有选中节点且有结果或正在加载时，显示结果面板
  if (result || isLoading) {
    return (
      <div className="w-96 bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col h-full">
        <div className="p-6 border-b border-[var(--color-border-primary)]">
          <h3 className="text-lg font-semibold text-white mb-2">
            工作流执行结果
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            查看工作流的执行状态和结果
          </p>
        </div>
        <div className="flex-1 p-6 overflow-hidden">
          <WorkflowResult 
            result={result} 
            isLoading={isLoading}
            onRetry={onRetry}
          />
        </div>
      </div>
    );
  }

  // 默认情况下不显示任何面板
  return null;
};

export default RightPanel; 