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
  InfoCircledIcon,
  Cross2Icon,
  PlusIcon,
  TrashIcon
} from '@radix-ui/react-icons';
import { Text, Flex, Button, Card, Badge } from '@radix-ui/themes';

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
    const newValue = currentValue + variable;
    setValue(`outputs.${index}.value`, newValue);
  };

  return (
    <ConfigFormBase
      nodeLabel={node.data.label || node.id}
      nodeType="end"
      onNodeLabelChange={(label) => onNodeChange({ data: { ...node.data, label } })}
      availableVariables={availableVariables}
    >
      {/* Output Configuration */}
      <ConfigSection
        title="输出配置"
        description="配置工作流输出"
        icon={<ArchiveIcon />}
      >
        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center">
                <ArchiveIcon className="w-8 h-8 text-red-400" />
              </div>
              <Text size="2" className="text-[var(--color-text-secondary)] mb-4 block">
                暂无输出配置
              </Text>
              <Text size="1" className="text-[var(--color-text-tertiary)]">
                点击下方按钮添加工作流输出
              </Text>
            </div>
          ) : (
            fields.map((field, index) => (
              <Card 
                key={field.id} 
                className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/30 transition-all duration-200"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge size="1" variant="soft" color="red">
                        #{index + 1}
                      </Badge>
                      <Text size="2" weight="medium" className="text-[var(--color-text-primary)]">
                        输出配置
                      </Text>
                    </div>
                    <Button
                      size="1"
                      variant="ghost"
                      color="red"
                      onClick={() => handleRemoveOutput(index)}
                      className="hover:bg-red-500/10"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <ConfigTextField
                      label="名称"
                      value={watch(`outputs.${index}.name`) || ''}
                      onChange={(value) => setValue(`outputs.${index}.name`, value)}
                      placeholder="输出名称"
                    />

                    <ConfigTextField
                      label="值"
                      value={watch(`outputs.${index}.value`) || ''}
                      onChange={(value) => setValue(`outputs.${index}.value`, value)}
                      placeholder="输出值或变量"
                      showVariablePicker
                      availableVariables={availableVariables}
                      onVariableSelect={(variable) => handleVariableSelect(index, variable)}
                    />
                  </div>
                </div>
              </Card>
            ))
          )}
          
          <Button
            size="2"
            variant="soft"
            onClick={handleAddOutput}
            className="w-full bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-red-200 transition-all duration-200"
          >
            <PlusIcon className="w-4 h-4" />
            添加输出
          </Button>
        </div>
      </ConfigSection>
    </ConfigFormBase>
  );
}; 