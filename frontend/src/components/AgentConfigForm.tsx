import { Node } from 'reactflow';
import { NodeData } from '../types';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { VariablePicker } from './VariablePicker';
import { 
  Card, 
  Text, 
  Badge,
  Flex
} from '@radix-ui/themes';

interface AgentConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  availableVariables: string[];
}



export const AgentConfigForm: React.FC<AgentConfigFormProps> = ({ 
  node, 
  onConfigChange, 
  availableVariables 
}) => {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      model_name: node.data.config.model_name || 'gpt-4o-mini',
      temperature: node.data.config.temperature || 0.7,
      system_prompt: node.data.config.system_prompt || 'You are a helpful assistant.',
      user_prompt: node.data.config.user_prompt || '',
      output_name: node.data.config.output_name || '',
    },
  });

  useEffect(() => {
    reset({
      model_name: node.data.config.model_name || 'gpt-4o-mini',
      temperature: node.data.config.temperature || 0.7,
      system_prompt: node.data.config.system_prompt || 'You are a helpful assistant.',
      user_prompt: node.data.config.user_prompt || '',
      output_name: node.data.config.output_name || '',
    });
  }, [node, reset]);

  const handleBlur = () => {
    const formData = watch();

    const config = {
      model_name: formData.model_name,
      temperature: formData.temperature,
      system_prompt: formData.system_prompt,
      user_prompt: formData.user_prompt,
      output_name: formData.output_name,
    };

    onConfigChange(config);
  };

  const handleVariableSelect = (field: 'system_prompt' | 'user_prompt', variable: string) => {
    const currentValue = watch(field) || '';
    setValue(field, `${currentValue} ${variable}`.trim(), { shouldDirty: true });
    setTimeout(() => handleBlur(), 0);
  };



  const getVariableUsageInfo = () => {
    const systemPrompt = watch('system_prompt') || '';
    const userPrompt = watch('user_prompt') || '';
    
    const extractVariables = (text: string) => {
      const matches = text.match(/\{\{([^}]+)\}\}/g);
      return matches ? matches.map(match => match.slice(2, -2).trim()) : [];
    };

    return {
      systemPromptVars: extractVariables(systemPrompt),
      userPromptVars: extractVariables(userPrompt),
      totalVars: Array.from(new Set([...extractVariables(systemPrompt), ...extractVariables(userPrompt)]))
    };
  };

  const variableUsage = getVariableUsageInfo();

  return (
    <div className="space-y-6" onBlur={handleBlur}>
      {/* Basic Configuration */}
      <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
        <div className="p-4 space-y-4">
          <Text size="3" weight="medium" className="text-white">
            Model Settings
          </Text>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model Name</label>
              <select 
                {...register('model_name')} 
                className="w-full p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
              >
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Temperature: {watch('temperature')}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                {...register('temperature', { valueAsNumber: true })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Focused (0)</span>
                <span>Balanced (1)</span>
                <span>Creative (2)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Prompts */}
      <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
        <div className="p-4 space-y-4">
          <Text size="3" weight="medium" className="text-white">
            Prompts
          </Text>
          
          <div className="space-y-4">
            <div>
              <Flex justify="between" align="center" className="mb-2">
                <label className="text-sm font-medium text-gray-300">System Prompt</label>
                <VariablePicker 
                  availableVariables={availableVariables} 
                  onVariableSelect={(variable) => handleVariableSelect('system_prompt', variable)} 
                />
              </Flex>
              <textarea
                {...register('system_prompt')}
                placeholder="You are a helpful assistant..."
                className="w-full min-h-[80px] p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
              />
            </div>

            <div>
              <Flex justify="between" align="center" className="mb-2">
                <label className="text-sm font-medium text-gray-300">User Prompt</label>
                <VariablePicker 
                  availableVariables={availableVariables} 
                  onVariableSelect={(variable) => handleVariableSelect('user_prompt', variable)} 
                />
              </Flex>
              <textarea
                {...register('user_prompt')}
                placeholder="Ask the agent something..."
                className="w-full min-h-[120px] p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Variable Usage Info */}
      {variableUsage.totalVars.length > 0 && (
        <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
          <div className="p-4">
            <Text size="3" weight="medium" className="text-white mb-3">
              Variables Used
            </Text>
            <div className="flex flex-wrap gap-1">
              {variableUsage.totalVars.map((variable) => (
                <Badge key={variable} size="1" variant="soft" color="violet">
                  <Text size="1" className="font-mono">{variable}</Text>
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}



      {/* Output Configuration */}
      <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
        <div className="p-4">
          <Text size="3" weight="medium" className="text-white mb-3">
            Output
          </Text>
          <input
            {...register('output_name')}
            placeholder="e.g., agent_response"
            className="w-full p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
          />
          <Text size="1" className="text-gray-400 mt-1">
            Optional: Custom name for this node's output
          </Text>
        </div>
      </Card>
    </div>
  );
}; 