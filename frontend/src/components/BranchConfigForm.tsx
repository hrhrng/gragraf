import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm, useFieldArray } from 'react-hook-form';
import { NodeData } from '../types';
import { ConfigFormBase, ConfigSection } from './common/ConfigFormBase';
import { 
  ConfigTextField, 
  ConfigSelectField,
  ConfigSwitchField,
  ConfigDynamicListField
} from './common/ConfigFormFields';
import { 
  BorderSplitIcon, 
  QuestionMarkIcon,
  PlusIcon
} from '@radix-ui/react-icons';
import { Flex, Text } from '@radix-ui/themes';

interface BranchConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  onNodeChange: (nodeUpdates: Partial<Node<NodeData>>) => void;
  availableVariables: string[];
}

interface ConditionData {
  condition: string;
  variable: string;
  operator: string;
  value: string;
}

interface FormData {
  conditions: ConditionData[];
  hasElse: boolean;
}

export const BranchConfigForm: React.FC<BranchConfigFormProps> = ({ 
  node, 
  onConfigChange, 
  onNodeChange,
  availableVariables 
}) => {
  const { control, setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      conditions: node.data.config?.conditions || [{ condition: '', variable: '', operator: '==', value: '' }],
      hasElse: node.data.config?.hasElse || false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'conditions',
  });

  useEffect(() => {
    reset({
      conditions: node.data.config?.conditions || [{ condition: '', variable: '', operator: '==', value: '' }],
      hasElse: node.data.config?.hasElse || false,
    });
  }, [node, reset]);

  useEffect(() => {
    const subscription = watch((data) => {
      onConfigChange(data);
    });

    return () => subscription.unsubscribe();
  }, [watch, onConfigChange]);

  const handleAddCondition = () => {
    append({ condition: '', variable: '', operator: '==', value: '' });
  };

  const handleRemoveCondition = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleVariableSelect = (index: number, variable: string) => {
    setValue(`conditions.${index}.variable`, variable);
    updateConditionString(index, variable, null, null);
  };

  const handleOperatorChange = (index: number, operator: string) => {
    setValue(`conditions.${index}.operator`, operator);
    updateConditionString(index, null, operator, null);
  };

  const handleValueChange = (index: number, value: string) => {
    setValue(`conditions.${index}.value`, value);
    updateConditionString(index, null, null, value);
  };

  const updateConditionString = (index: number, variable?: string | null, operator?: string | null, value?: string | null) => {
    const currentCondition = watch(`conditions.${index}`);
    const newVariable = variable !== null ? variable : currentCondition.variable;
    const newOperator = operator !== null ? operator : currentCondition.operator;
    const newValue = value !== null ? value : currentCondition.value;
    
    const conditionString = `'{{${newVariable}}}' ${newOperator} '${newValue}'`;
    setValue(`conditions.${index}.condition`, conditionString);
  };

  const operatorOptions = [
    { value: '==', label: '等于 (==)' },
    { value: '!=', label: '不等于 (!=)' },
    { value: '>', label: '大于 (>)' },
    { value: '<', label: '小于 (<)' },
    { value: '>=', label: '大于等于 (>=)' },
    { value: '<=', label: '小于等于 (<=)' },
    { value: 'contains', label: '包含 (contains)' },
    { value: 'not_contains', label: '不包含 (not contains)' },
    { value: 'starts_with', label: '开始于 (starts with)' },
    { value: 'ends_with', label: '结束于 (ends with)' },
  ];

  return (
    <ConfigFormBase
      nodeLabel={node.data.label || node.id}
      nodeType="branch"
      onNodeLabelChange={(label) => onNodeChange({ data: { ...node.data, label } })}
      availableVariables={availableVariables}
    >
      {/* Conditions */}
      <ConfigSection
        title="条件配置"
        description="配置分支条件，支持多条件判断"
        icon={<BorderSplitIcon />}
      >
        <ConfigDynamicListField
          label="分支条件"
          items={fields}
          onAdd={handleAddCondition}
          onRemove={handleRemoveCondition}
          addButtonText="添加条件"
          minItems={1}
          helpText="添加条件来控制分支逻辑"
          renderItem={(field, index) => (
            <div className="space-y-3 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Text size="2" weight="medium" className="text-[var(--color-text-primary)]">
                  {index === 0 ? 'If' : `Else If ${index}`}
                </Text>
                <Text size="1" className="text-[var(--color-text-secondary)]">
                  条件 {index + 1}
                </Text>
              </div>

              <div className="space-y-3">
                {/* Variable and Operator Selection - on same line */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <ConfigSelectField
                      label="变量"
                      value={watch(`conditions.${index}.variable`) || ''}
                      onChange={(value) => handleVariableSelect(index, value)}
                      options={availableVariables.map(variable => ({ 
                        value: variable, 
                        label: variable 
                      }))}
                      placeholder="选择变量"
                    />
                  </div>
                  <div className="flex-1">
                    <ConfigSelectField
                      label="操作符"
                      value={watch(`conditions.${index}.operator`) || ''}
                      onChange={(value) => handleOperatorChange(index, value)}
                      options={operatorOptions}
                    />
                  </div>
                </div>

                {/* Value Input */}
                <ConfigTextField
                  label="比较值"
                  value={watch(`conditions.${index}.value`) || ''}
                  onChange={(value) => handleValueChange(index, value)}
                  placeholder="输入比较值"
                />

                {/* Generated Condition */}
                <div className="mt-2">
                  <Text size="1" className="text-[var(--color-text-secondary)] mb-1 block">
                    生成的条件表达式：
                  </Text>
                  <div className="p-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] font-mono text-sm">
                    {watch(`conditions.${index}.condition`) || '请配置完整条件'}
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      </ConfigSection>

      {/* Else Branch */}
      <ConfigSection
        title="默认分支"
        description="配置当所有条件都不满足时的默认分支"
        icon={<QuestionMarkIcon />}
        collapsible
        defaultExpanded={watch('hasElse')}
      >
        <ConfigSwitchField
          label="启用 Else 分支"
          checked={watch('hasElse')}
          onChange={(checked) => setValue('hasElse', checked)}
          helpText="当所有条件都不满足时，执行默认分支"
        />

        {watch('hasElse') && (
          <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
            <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
              默认分支
            </Text>
            <Text size="1" className="text-[var(--color-text-secondary)]">
              当上述所有条件都不满足时，工作流将执行此分支。这是一个可选的分支，用于处理异常情况或提供默认行为。
            </Text>
          </div>
        )}
      </ConfigSection>

      {/* Branch Summary */}
      <ConfigSection
        title="分支总览"
        description="查看所有配置的分支路径"
        icon={<BorderSplitIcon />}
        collapsible
        defaultExpanded={false}
      >
        <div className="space-y-3">
          <Text size="2" weight="medium" className="text-[var(--color-text-primary)]">
            分支路径概览
          </Text>
          
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 p-2 bg-[var(--color-bg-secondary)] rounded">
                <div className="w-16 text-center">
                  <Text size="1" className="text-[var(--color-text-secondary)]">
                    {index === 0 ? 'If' : `Else If`}
                  </Text>
                </div>
                <div className="flex-1">
                  <Text size="1" className="font-mono text-[var(--color-text-primary)]">
                    {field.condition || '未配置条件'}
                  </Text>
                </div>
                <div className="w-8 h-3 bg-yellow-500/20 border border-yellow-400 rounded-sm"></div>
              </div>
            ))}
            
            {watch('hasElse') && (
              <div className="flex items-center gap-3 p-2 bg-[var(--color-bg-secondary)] rounded">
                <div className="w-16 text-center">
                  <Text size="1" className="text-[var(--color-text-secondary)]">
                    Else
                  </Text>
                </div>
                <div className="flex-1">
                  <Text size="1" className="text-[var(--color-text-primary)]">
                    默认分支（所有条件都不满足时）
                  </Text>
                </div>
                <div className="w-8 h-3 bg-gray-500/20 border border-gray-400 rounded-sm"></div>
              </div>
            )}
          </div>

          <Text size="1" className="text-[var(--color-text-secondary)]">
            总共 {fields.length + (watch('hasElse') ? 1 : 0)} 个分支路径
          </Text>
        </div>
      </ConfigSection>
    </ConfigFormBase>
  );
}; 