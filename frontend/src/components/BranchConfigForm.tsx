import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button, Text, TextField, Card, Flex, Switch, Select } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { NodeData } from '../types';

interface BranchConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  availableVariables: string[];
}

export const BranchConfigForm: React.FC<BranchConfigFormProps> = ({ node, onConfigChange, availableVariables }) => {
  const { control, register, watch, reset, setValue } = useForm({
    defaultValues: {
      conditions: node.data.config.conditions || [{ condition: '', variable: '', operator: '==', value: '' }],
      hasElse: node.data.config.hasElse || false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'conditions',
  });

  useEffect(() => {
    reset({
      conditions: node.data.config.conditions || [{ condition: '', variable: '', operator: '==', value: '' }],
      hasElse: node.data.config.hasElse || false,
    });
  }, [node, reset]);

  const handleBlur = () => {
    onConfigChange(watch());
  };

  const handleAddCondition = () => {
    append({ condition: '', variable: '', operator: '==', value: '' });
    setTimeout(() => onConfigChange(watch()), 0);
  };

  const handleRemoveCondition = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      setTimeout(() => onConfigChange(watch()), 0);
    }
  };

  const handleVariableSelect = (index: number, variable: string) => {
    setValue(`conditions.${index}.variable`, variable, { shouldDirty: true });
    // 自动构建condition字符串
    const currentCondition = watch(`conditions.${index}`);
    const newCondition = `{{${variable}}} ${currentCondition.operator || '=='} ${currentCondition.value || ''}`;
    setValue(`conditions.${index}.condition`, newCondition, { shouldDirty: true });
    setTimeout(() => onConfigChange(watch()), 0);
  };

  const handleOperatorChange = (index: number, operator: string) => {
    setValue(`conditions.${index}.operator`, operator, { shouldDirty: true });
    const currentCondition = watch(`conditions.${index}`);
    const newCondition = `{{${currentCondition.variable || ''}}} ${operator} ${currentCondition.value || ''}`;
    setValue(`conditions.${index}.condition`, newCondition, { shouldDirty: true });
    setTimeout(() => onConfigChange(watch()), 0);
  };

  const handleValueChange = (index: number, value: string) => {
    setValue(`conditions.${index}.value`, value, { shouldDirty: true });
    const currentCondition = watch(`conditions.${index}`);
    const newCondition = `{{${currentCondition.variable || ''}}} ${currentCondition.operator || '=='} ${value}`;
    setValue(`conditions.${index}.condition`, newCondition, { shouldDirty: true });
    setTimeout(() => onConfigChange(watch()), 0);
  };

  const handleElseToggle = (checked: boolean) => {
    setValue('hasElse', checked, { shouldDirty: true });
    setTimeout(() => onConfigChange(watch()), 0);
  };

  return (
    <div onBlur={handleBlur} className="space-y-4">
      <div>
        <Text size="3" weight="medium" className="text-white mb-3 block">
          Condition Branches
        </Text>
        <Text size="1" className="text-[var(--color-text-secondary)] mb-4 block">
          Connect multiple downstream branches. Only the corresponding branch will be executed if the set conditions are met.
        </Text>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <Card key={field.id} className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Text size="2" weight="medium" className="text-white">
                  {index === 0 ? 'If' : 'Else if'}
                </Text>
                <Text size="1" className="text-[var(--color-text-secondary)]">
                  Priority {index + 1}
                </Text>
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => handleRemoveCondition(index)}
                >
                  <TrashIcon className="w-3 h-3" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Text size="1" className="text-[var(--color-text-secondary)] mb-1 block">
                    Variable
                  </Text>
                  <Flex gap="1">
                    <Select.Root
                      value={watch(`conditions.${index}.variable`) || ''}
                      onValueChange={(value) => handleVariableSelect(index, value)}
                    >
                      <Select.Trigger placeholder="Please select" className="flex-1" />
                      <Select.Content position="popper" sideOffset={4} className="z-50">
                        {availableVariables.map((variable) => (
                          <Select.Item key={variable} value={variable.replace(/[{}]/g, '')}>
                            {variable}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                </div>

                <div>
                  <Text size="1" className="text-[var(--color-text-secondary)] mb-1 block">
                    Operator
                  </Text>
                  <Select.Root
                    value={watch(`conditions.${index}.operator`) || '=='}
                    onValueChange={(value) => handleOperatorChange(index, value)}
                  >
                    <Select.Trigger />
                    <Select.Content position="popper" sideOffset={4} className="z-50">
                      <Select.Item value="==">Equals</Select.Item>
                      <Select.Item value="!=">Not equals</Select.Item>
                      <Select.Item value=">">Greater than</Select.Item>
                      <Select.Item value="<">Less than</Select.Item>
                      <Select.Item value=">=">Greater or equal</Select.Item>
                      <Select.Item value="<=">Less or equal</Select.Item>
                      <Select.Item value="in">Contains</Select.Item>
                      <Select.Item value="not in">Not contains</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>

                <div>
                  <Text size="1" className="text-[var(--color-text-secondary)] mb-1 block">
                    Value
                  </Text>
                  <TextField.Root
                    placeholder="Enter or reference parameter values"
                    {...register(`conditions.${index}.value`)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(index, e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Text size="1" className="text-[var(--color-text-secondary)] mb-1 block">
                  Condition Expression
                </Text>
                <TextField.Root
                  placeholder="Auto-generated or custom expression"
                  {...register(`conditions.${index}.condition`)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </Card>
        ))}

        <Button
          type="button"
          size="2"
          variant="outline"
          onClick={handleAddCondition}
          className="w-full"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Condition
        </Button>
      </div>

      <div className="pt-4 border-t border-[var(--color-border-primary)]">
        <Flex justify="between" align="center">
          <div>
            <Text size="2" weight="medium" className="text-white block">
              Else Branch
            </Text>
            <Text size="1" className="text-[var(--color-text-secondary)]">
              Execute if no conditions are met
            </Text>
          </div>
          <Switch
            checked={watch('hasElse')}
            onCheckedChange={handleElseToggle}
          />
        </Flex>
      </div>
    </div>
  );
}; 