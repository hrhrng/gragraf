import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm, useFieldArray } from 'react-hook-form';
import { NodeData } from '../types';
import { ConfigFormBase, ConfigSection } from './common/ConfigFormBase';
import { 
  ConfigTextField,
  ConfigDynamicListField
} from './common/ConfigFormFields';
import { 
  PlayIcon, 
  ReaderIcon,
  InfoCircledIcon
} from '@radix-ui/react-icons';
import { Text } from '@radix-ui/themes';

interface StartConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  onNodeChange: (nodeUpdates: Partial<Node<NodeData>>) => void;
}

interface InputField {
  name: string;
}

interface FormData {
  inputs: InputField[];
}

export const StartConfigForm: React.FC<StartConfigFormProps> = ({ 
  node, 
  onConfigChange,
  onNodeChange
}) => {
  const { control, setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      inputs: node.data.config?.inputs || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'inputs',
  });

  useEffect(() => {
    reset({ inputs: node.data.config?.inputs || [] });
  }, [node, reset]);

  useEffect(() => {
    const subscription = watch((data) => {
      onConfigChange(data);
    });

    return () => subscription.unsubscribe();
  }, [watch, onConfigChange]);

  const handleAddInput = () => {
    append({ name: '' });
  };

  const handleRemoveInput = (index: number) => {
    remove(index);
  };

  return (
    <ConfigFormBase
      nodeLabel={node.data.label || 'Start Node'}
      nodeType="start"
      onNodeLabelChange={(label) => onNodeChange({ data: { ...node.data, label } })}
      showVariables={false}
    >
      {/* Input Configuration */}
      <ConfigSection
        title="工作流输入参数"
        description="定义工作流启动时需要的输入参数"
        icon={<ReaderIcon />}
        badge={{ text: `${fields.length} 个输入`, color: 'green' }}
      >
        <ConfigDynamicListField
          label="输入参数"
          items={fields}
          onAdd={handleAddInput}
          onRemove={handleRemoveInput}
          addButtonText="添加输入参数"
          helpText="这些参数在工作流启动时由用户提供，可在后续节点中使用"
          renderItem={(field, index) => (
            <ConfigTextField
              label={`参数 ${index + 1}`}
              value={field.name}
              onChange={(value) => setValue(`inputs.${index}.name`, value)}
              placeholder="输入参数名称（如：user_query, document_url）"
              required
              helpText={`参数名称应该简洁明确，使用下划线分隔单词`}
            />
          )}
        />
      </ConfigSection>

      {/* Usage Guide */}
      <ConfigSection
        title="使用说明"
        description="关于输入参数的使用指南"
        icon={<InfoCircledIcon />}
        collapsible
        defaultExpanded={fields.length === 0}
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Text size="2" weight="medium" className="text-green-400 mb-2 block">
              参数命名建议
            </Text>
            <div className="space-y-2 text-sm text-green-300">
              <div>• 使用描述性的名称，如 <code className="bg-green-500/20 px-1 rounded">user_query</code>、<code className="bg-green-500/20 px-1 rounded">document_url</code></div>
              <div>• 使用下划线分隔单词，避免空格和特殊字符</div>
              <div>• 保持名称简洁但含义明确</div>
              <div>• 避免使用系统保留字</div>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Text size="2" weight="medium" className="text-blue-400 mb-2 block">
              在其他节点中使用
            </Text>
            <div className="space-y-2 text-sm text-blue-300">
              <div>• 在其他节点中使用 <code className="bg-blue-500/20 px-1 rounded">{"{{参数名}}"}</code> 引用这些输入</div>
              <div>• 例如：<code className="bg-blue-500/20 px-1 rounded">{"{{user_query}}"}</code> 会被实际的用户输入替换</div>
              <div>• 参数在整个工作流中都可用</div>
            </div>
          </div>

          {fields.length > 0 && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Text size="2" weight="medium" className="text-purple-400 mb-2 block">
                当前配置的参数
              </Text>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500/20 border border-purple-400 rounded text-center text-xs text-purple-300 flex items-center justify-center">
                      {index + 1}
                    </div>
                    <code className="bg-purple-500/20 px-2 py-1 rounded text-purple-300 font-mono text-sm">
                      {field.name || `input_${index + 1}`}
                    </code>
                    <Text size="1" className="text-purple-300">
                      → 使用方式：<code className="bg-purple-500/20 px-1 rounded">{`{{${field.name || `input_${index + 1}`}}}`}</code>
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ConfigSection>

      {/* Workflow Information */}
      <ConfigSection
        title="工作流信息"
        description="关于起始节点的基本信息"
        icon={<PlayIcon />}
        collapsible
        defaultExpanded={false}
      >
        <div className="space-y-3">
          <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
            <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
              起始节点说明
            </Text>
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <div>• 起始节点是工作流的入口点</div>
              <div>• 每个工作流必须且只能有一个起始节点</div>
              <div>• 在这里定义的输入参数将在工作流启动时收集</div>
              <div>• 所有输入参数在整个工作流中都可用</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-center">
              <Text size="3" weight="bold" className="text-green-400 block">{fields.length}</Text>
              <Text size="1" className="text-[var(--color-text-secondary)]">输入参数</Text>
            </div>
            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-center">
              <Text size="3" weight="bold" className="text-green-400 block">1</Text>
              <Text size="1" className="text-[var(--color-text-secondary)]">起始节点</Text>
            </div>
          </div>
        </div>
      </ConfigSection>
    </ConfigFormBase>
  );
}; 