import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button, Text, Heading, TextField, Card, Flex, Box } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { NodeData } from '../types';
import { VariablePicker } from './VariablePicker';

interface EndConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  availableVariables: string[];
}

export const EndConfigForm: React.FC<EndConfigFormProps> = ({ node, onConfigChange, availableVariables }) => {
  const { control, register, watch, reset, setValue } = useForm({
    defaultValues: {
      outputs: node.data.config.outputs || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'outputs',
  });

  useEffect(() => {
    reset({ outputs: node.data.config.outputs || [] });
  }, [node, reset]);

  // 简单的 ResizeObserver 错误抑制
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (!message.includes('ResizeObserver loop completed')) {
        originalError.apply(console, args);
      }
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const handleAddOutput = () => {
    append({ name: '', value: '' });
    // 延迟执行避免立即重新渲染
    setTimeout(() => onConfigChange(watch()), 50);
  };

  const handleRemoveOutput = (index: number) => {
    remove(index);
    setTimeout(() => onConfigChange(watch()), 50);
  };

  const handleVariableSelect = (index: number, variable: string) => {
    setValue(`outputs.${index}.value`, variable, { shouldDirty: true });
    setTimeout(() => onConfigChange(watch()), 50);
  };

  const handleInputChange = () => {
    // 防抖处理输入变化
    setTimeout(() => onConfigChange(watch()), 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <Heading size="3" className="text-white mb-2">
          Define Graph Outputs
        </Heading>
        <Text size="2" className="text-[var(--color-text-secondary)]">
          Select variables to be returned as the final output.
        </Text>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <Card key={field.id} className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] p-4">
            <div className="space-y-3">
              {/* Output Name */}
              <div className="space-y-2">
                <Text size="2" weight="medium" className="text-white">
                  Output Name
                </Text>
                <TextField.Root
                  {...register(`outputs.${index}.name`)}
                  placeholder="e.g., final_result"
                  className="w-full bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-white placeholder:text-[var(--color-text-secondary)]"
                  onChange={handleInputChange}
                />
              </div>

              {/* Output Value */}
              <div className="space-y-2">
                <Text size="2" weight="medium" className="text-white">
                  Output Value
                </Text>
                <Flex gap="2" align="end">
                  <Box className="flex-1">
                    <TextField.Root
                      {...register(`outputs.${index}.value`)}
                      placeholder="{{agent_3_output}}"
                      className="w-full bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-white placeholder:text-[var(--color-text-secondary)]"
                      onChange={handleInputChange}
                    />
                  </Box>
                  <VariablePicker 
                    availableVariables={availableVariables}
                    onVariableSelect={(variable) => handleVariableSelect(index, variable)}
                  />
                </Flex>
              </div>

              {/* Remove Button */}
              <Flex justify="end">
                <Button
                  type="button"
                  variant="soft"
                  color="red"
                  size="2"
                  onClick={() => handleRemoveOutput(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </Flex>
            </div>
          </Card>
        ))}

        {fields.length === 0 && (
          <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] border-dashed">
            <div className="p-8 text-center">
              <Text size="2" className="text-[var(--color-text-secondary)]">
                No outputs defined yet. Add an output to specify what this workflow should return.
              </Text>
            </div>
          </Card>
        )}
      </div>

      <Button
        type="button"
        onClick={handleAddOutput}
        size="3"
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 font-medium"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Add Output
      </Button>
    </div>
  );
}; 