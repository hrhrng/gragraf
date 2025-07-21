import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button, Text, Heading, TextField, Card, Flex, Box, Badge } from '@radix-ui/themes';
import { PlusIcon, TrashIcon, ExitIcon } from '@radix-ui/react-icons';
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
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#d9422433', border: '1px solid #d94224' }}>
          <ExitIcon className="w-4 h-4" style={{ color: '#d94224' }} />
        </div>
        <Text size="3" weight="medium" className="text-white flex-1">
          Define Graph Outputs
        </Text>
        <Badge size="1" style={{ background: '#d94224' + '22', color: '#d94224' }} variant="soft">
          <Text size="1">Exit</Text>
        </Badge>
      </div>
      <Text size="2" className="text-[var(--color-text-secondary)]">
        Select variables to be returned as the final output.
      </Text>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <Card key={field.id} className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] p-4" style={{ background: '#d9422433', borderColor: '#d94224' }}>
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
                  style={{ borderColor: '#d94224' }}
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
                      style={{ borderColor: '#d94224' }}
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
                  size="2"
                  onClick={() => handleRemoveOutput(index)}
                  style={{ color: '#d94224', borderColor: '#d94224', background: 'rgba(217,66,36,0.08)' }}
                  className="hover:opacity-80"
                >
                  <ExitIcon className="w-4 h-4 mr-1" style={{ color: '#d94224' }} />
                  Remove
                </Button>
              </Flex>
            </div>
          </Card>
        ))}
        {fields.length === 0 && (
          <Card className="border-dashed" style={{ background: '#d9422433', borderColor: '#d94224' }}>
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
        style={{ background: 'linear-gradient(90deg, #d94224 0%, #d94224cc 100%)', color: 'white', border: 0, fontWeight: 500 }}
        className="w-full"
      >
        <ExitIcon className="w-4 h-4 mr-2" style={{ color: 'white' }} />
        Add Output
      </Button>
    </div>
  );
}; 