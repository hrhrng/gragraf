import React, { useEffect, useMemo } from 'react';
import { Node } from 'reactflow';
import { useForm } from 'react-hook-form';
import { NodeData } from '../types';
import { ConfigFormBase, ConfigSection } from './common/ConfigFormBase';
import { 
  ConfigTextField, 
  ConfigTextAreaField,
  ConfigSelectField
} from './common/ConfigFormFields';
import { 
  PersonIcon, 
  GearIcon, 
  ChatBubbleIcon,
  MagicWandIcon
} from '@radix-ui/react-icons';
import { Badge, Text } from '@radix-ui/themes';

interface AgentConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  availableVariables: string[];
}

interface FormData {
  model_name: string;
  temperature: number;
  system_prompt: string;
  user_prompt: string;
  output_name: string;
}

export const AgentConfigForm: React.FC<AgentConfigFormProps> = ({ 
  node, 
  onConfigChange, 
  availableVariables 
}) => {
  const { setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      model_name: node.data.config?.model_name || 'gpt-4o-mini',
      temperature: node.data.config?.temperature || 0.7,
      system_prompt: node.data.config?.system_prompt || 'You are a helpful assistant.',
      user_prompt: node.data.config?.user_prompt || '',
      output_name: node.data.config?.output_name || '',
    },
  });

  useEffect(() => {
    reset({
      model_name: node.data.config?.model_name || 'gpt-4o-mini',
      temperature: node.data.config?.temperature || 0.7,
      system_prompt: node.data.config?.system_prompt || 'You are a helpful assistant.',
      user_prompt: node.data.config?.user_prompt || '',
      output_name: node.data.config?.output_name || '',
    });
  }, [node, reset]);

  useEffect(() => {
    const subscription = watch((data) => {
      onConfigChange({
        model_name: data.model_name,
        temperature: data.temperature,
        system_prompt: data.system_prompt,
        user_prompt: data.user_prompt,
        output_name: data.output_name,
      });
    });

    return () => subscription.unsubscribe();
  }, [watch, onConfigChange]);

  const handleVariableSelect = (field: keyof FormData, variable: string) => {
    const currentValue = watch(field) as string;
    const newValue = currentValue + `{{${variable}}}`;
    setValue(field, newValue);
  };

  // 分析变量使用情况
  const variableUsage = useMemo(() => {
    const systemVars = extractVariables(watch('system_prompt'));
    const userVars = extractVariables(watch('user_prompt'));
    const totalVars = Array.from(new Set([...systemVars, ...userVars]));
    
    return {
      systemVars,
      userVars,
      totalVars
    };
  }, [watch('system_prompt'), watch('user_prompt')]);

  const modelOptions = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (推荐)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ];

  return (
    <ConfigFormBase
      title="Agent Configuration"
      nodeType="agent"
      availableVariables={availableVariables}
    >
      {/* Model Configuration */}
      <ConfigSection
        title="模型配置"
        description="配置AI模型和基本参数"
        icon={<MagicWandIcon />}
      >
        <ConfigSelectField
          label="AI模型"
          value={watch('model_name')}
          onChange={(value) => setValue('model_name', value)}
          options={modelOptions}
          required
          helpText="选择要使用的AI模型"
        />

        <ConfigTextField
          label="Temperature"
          value={String(watch('temperature'))}
          onChange={(value) => setValue('temperature', parseFloat(value) || 0.7)}
          type="number"
          placeholder="0.7"
          helpText="控制回答的随机性，0-1之间，越高越随机"
        />

        <ConfigTextField
          label="输出变量名"
          value={watch('output_name')}
          onChange={(value) => setValue('output_name', value)}
          placeholder="agent_response"
          helpText="用于存储AI响应的变量名（可选）"
        />
      </ConfigSection>

      {/* System Prompt */}
      <ConfigSection
        title="系统提示词"
        description="定义AI助手的角色和行为规范"
        icon={<GearIcon />}
        badge={{ text: '系统级', color: 'blue' }}
      >
        <ConfigTextAreaField
          label="System Prompt"
          value={watch('system_prompt')}
          onChange={(value) => setValue('system_prompt', value)}
          placeholder="You are a helpful assistant that..."
          rows={4}
          required
          showVariablePicker
          availableVariables={availableVariables}
          onVariableSelect={(variable) => handleVariableSelect('system_prompt', variable)}
          helpText="系统提示词定义了AI的角色和基本行为准则"
        />

        {variableUsage.systemVars.length > 0 && (
          <div className="space-y-2">
            <Text size="2" weight="medium" className="text-[var(--color-text-primary)]">
              使用的变量
            </Text>
            <div className="flex flex-wrap gap-1">
              {variableUsage.systemVars.map((variable) => (
                <Badge key={variable} size="1" variant="soft" color="blue">
                  <Text size="1" className="font-mono">{variable}</Text>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </ConfigSection>

      {/* User Prompt */}
      <ConfigSection
        title="用户提示词"
        description="具体的任务指令和用户输入"
        icon={<ChatBubbleIcon />}
        badge={{ text: '用户级', color: 'green' }}
      >
        <ConfigTextAreaField
          label="User Prompt"
          value={watch('user_prompt')}
          onChange={(value) => setValue('user_prompt', value)}
          placeholder="请分析以下内容..."
          rows={6}
          required
          showVariablePicker
          availableVariables={availableVariables}
          onVariableSelect={(variable) => handleVariableSelect('user_prompt', variable)}
          helpText="用户提示词包含具体的任务指令和需要处理的内容"
        />

        {variableUsage.userVars.length > 0 && (
          <div className="space-y-2">
            <Text size="2" weight="medium" className="text-[var(--color-text-primary)]">
              使用的变量
            </Text>
            <div className="flex flex-wrap gap-1">
              {variableUsage.userVars.map((variable) => (
                <Badge key={variable} size="1" variant="soft" color="green">
                  <Text size="1" className="font-mono">{variable}</Text>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </ConfigSection>

      {/* Variable Usage Summary */}
      {variableUsage.totalVars.length > 0 && (
        <ConfigSection
          title="变量使用总览"
          description="所有使用的变量汇总"
          icon={<PersonIcon />}
          collapsible
          defaultExpanded={false}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {variableUsage.totalVars.map((variable) => (
                <Badge key={variable} size="1" variant="soft" color="violet">
                  <Text size="1" className="font-mono">{variable}</Text>
                </Badge>
              ))}
            </div>
            <Text size="1" className="text-[var(--color-text-secondary)]">
              共使用了 {variableUsage.totalVars.length} 个变量
            </Text>
          </div>
        </ConfigSection>
      )}
    </ConfigFormBase>
  );
};

// 辅助函数：从文本中提取变量
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  
  return matches.map(match => match.slice(2, -2).trim());
} 