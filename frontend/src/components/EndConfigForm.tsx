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
  ExitIcon, 
  ArchiveIcon,
  InfoCircledIcon
} from '@radix-ui/react-icons';
import { Text, Flex } from '@radix-ui/themes';

interface EndConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  onNodeChange: (nodeUpdates: Partial<Node<NodeData>>) => void;
  availableVariables: string[];
}

interface OutputField {
  name: string;
  value: string;
}

interface FormData {
  outputs: OutputField[];
}

export const EndConfigForm: React.FC<EndConfigFormProps> = ({ 
  node, 
  onConfigChange, 
  onNodeChange,
  availableVariables 
}) => {
  const { control, setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      outputs: node.data.config?.outputs || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'outputs',
  });

  useEffect(() => {
    reset({ outputs: node.data.config?.outputs || [] });
  }, [node, reset]);

  useEffect(() => {
    const subscription = watch((data) => {
      onConfigChange(data);
    });

    return () => subscription.unsubscribe();
  }, [watch, onConfigChange]);

  const handleAddOutput = () => {
    append({ name: '', value: '' });
  };

  const handleRemoveOutput = (index: number) => {
    remove(index);
  };

  const handleVariableSelect = (index: number, variable: string) => {
    const currentValue = watch(`outputs.${index}.value`);
    const newValue = currentValue + `{{${variable}}}`;
    setValue(`outputs.${index}.value`, newValue);
  };

  return (
    <ConfigFormBase
      nodeLabel={node.data.label || 'End Node'}
      nodeType="end"
      onNodeLabelChange={(label) => onNodeChange({ data: { ...node.data, label } })}
      availableVariables={availableVariables}
    >
      {/* Output Configuration */}
      <ConfigSection
        title="工作流输出配置"
        description="定义工作流完成时的输出结果"
        icon={<ArchiveIcon />}
        badge={{ text: `${fields.length} 个输出`, color: 'red' }}
      >
        <ConfigDynamicListField
          label="输出字段"
          items={fields}
          onAdd={handleAddOutput}
          onRemove={handleRemoveOutput}
          addButtonText="添加输出字段"
          helpText="配置工作流执行完成后返回的数据"
          renderItem={(field, index) => (
            <div className="space-y-3 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Text size="2" weight="medium" className="text-[var(--color-text-primary)]">
                  输出 {index + 1}
                </Text>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <ConfigTextField
                  label="输出名称"
                  value={field.name}
                  onChange={(value) => setValue(`outputs.${index}.name`, value)}
                  placeholder="输出字段名称（如：final_result, summary）"
                  required
                  helpText="定义输出字段的名称，将在结果中使用"
                />

                <ConfigTextField
                  label="输出值"
                  value={field.value}
                  onChange={(value) => setValue(`outputs.${index}.value`, value)}
                  placeholder="输出的值或变量引用"
                  required
                  showVariablePicker
                  availableVariables={availableVariables}
                  onVariableSelect={(variable) => handleVariableSelect(index, variable)}
                  helpText="可以是静态值或引用前面节点的输出变量"
                />

                {/* Preview */}
                <div className="mt-2 p-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded">
                  <Text size="1" className="text-[var(--color-text-secondary)] mb-1 block">
                    输出预览：
                  </Text>
                  <div className="font-mono text-sm text-[var(--color-text-primary)]">
                    {field.name && field.value ? (
                      `"${field.name}": "${field.value}"`
                    ) : (
                      '配置完整后显示预览'
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      </ConfigSection>

      {/* Usage Guide */}
      <ConfigSection
        title="使用说明"
        description="关于工作流输出的详细指南"
        icon={<InfoCircledIcon />}
        collapsible
        defaultExpanded={fields.length === 0}
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Text size="2" weight="medium" className="text-red-400 mb-2 block">
              输出字段说明
            </Text>
            <div className="space-y-2 text-sm text-red-300">
              <div>• 输出字段定义了工作流完成时返回的数据结构</div>
              <div>• 每个输出包含名称和值两部分</div>
              <div>• 值可以是静态文本或动态变量引用</div>
              <div>• 使用 <code className="bg-red-500/20 px-1 rounded">{'{{变量名}}'}</code> 引用其他节点的输出</div>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Text size="2" weight="medium" className="text-blue-400 mb-2 block">
              变量引用示例
            </Text>
            <div className="space-y-2 text-sm text-blue-300">
              <div>• <code className="bg-blue-500/20 px-1 rounded">{'{{agent_response}}'}</code> - 引用AI代理的输出</div>
              <div>• <code className="bg-blue-500/20 px-1 rounded">{'{{http_response}}'}</code> - 引用HTTP请求的结果</div>
              <div>• <code className="bg-blue-500/20 px-1 rounded">{'Final result: {{summary}}'}</code> - 混合静态文本和变量</div>
              <div>• 可以在一个值中引用多个变量</div>
            </div>
          </div>

          {fields.length > 0 && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Text size="2" weight="medium" className="text-purple-400 mb-2 block">
                输出结果预览
              </Text>
              <div className="p-3 bg-purple-500/20 border border-purple-400 rounded font-mono text-sm">
                <div className="text-purple-300">&#123;</div>
                {fields.map((field, index) => (
                  <div key={field.id} className="ml-4 text-purple-200">
                    <span className="text-purple-300">"</span>
                    <span>{field.name || `output_${index + 1}`}</span>
                    <span className="text-purple-300">": "</span>
                    <span>{field.value || "value"}</span>
                    <span className="text-purple-300">"</span>
                    {index < fields.length - 1 && <span className="text-purple-300">,</span>}
                  </div>
                ))}
                <div className="text-purple-300">&#125;</div>
              </div>
            </div>
          )}
        </div>
      </ConfigSection>

      {/* End Node Information */}
      <ConfigSection
        title="结束节点信息"
        description="关于结束节点的基本信息"
        icon={<ExitIcon />}
        collapsible
        defaultExpanded={false}
      >
        <div className="space-y-3">
          <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
            <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
              结束节点说明
            </Text>
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <div>• 结束节点标志着工作流执行的完成</div>
              <div>• 每个工作流至少需要一个结束节点</div>
              <div>• 在这里定义的输出将作为工作流的最终结果</div>
              <div>• 可以有多个结束节点对应不同的执行路径</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-center">
              <Text size="3" weight="bold" className="text-red-400 block">{fields.length}</Text>
              <Text size="1" className="text-[var(--color-text-secondary)]">输出字段</Text>
            </div>
            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-center">
              <Text size="3" weight="bold" className="text-red-400 block">{availableVariables.length}</Text>
              <Text size="1" className="text-[var(--color-text-secondary)]">可用变量</Text>
            </div>
          </div>
        </div>
      </ConfigSection>
    </ConfigFormBase>
  );
}; 