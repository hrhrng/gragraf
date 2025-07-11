import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button, Text, TextField, Flex, Card } from '@radix-ui/themes';
import { PlusIcon, Cross2Icon } from '@radix-ui/react-icons';
import { NodeData } from '../types';

interface StartConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
}

export const StartConfigForm: React.FC<StartConfigFormProps> = ({ node, onConfigChange }) => {
  const { control, register, watch, reset } = useForm({
    defaultValues: {
      inputs: node.data.config.inputs || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'inputs',
  });

  useEffect(() => {
    reset({ inputs: node.data.config.inputs || [] });
  }, [node, reset]);

  const handleBlur = () => {
    onConfigChange(watch());
  };

  const handleAddInput = () => {
    append({ name: '' });
    setTimeout(() => onConfigChange(watch()), 0);
  };

  const handleRemoveInput = (index: number) => {
    remove(index);
    setTimeout(() => onConfigChange(watch()), 0);
  };

  return (
    <div onBlur={handleBlur} className="space-y-4">
      <div>
        <Text size="3" weight="medium" className="text-white mb-3 block">
          Define Inputs
        </Text>
        <Text size="1" className="text-[var(--color-text-secondary)] mb-4 block">
          Configure the input fields for this workflow
        </Text>
      </div>
      
      <div className="space-y-3">
        {fields.map((field, index) => (
          <Card key={field.id} className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
            <div className="p-3">
              <Flex gap="2" align="center">
                <TextField.Root
                  {...register(`inputs.${index}.name`)}
                  placeholder="Input name (e.g., user_query)"
                  className="flex-1 bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-white"
                />
                <Button
                  variant="ghost"
                  size="2"
                  color="red"
                  onClick={() => handleRemoveInput(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Cross2Icon className="w-4 h-4" />
                </Button>
              </Flex>
            </div>
          </Card>
        ))}
      </div>
      
      <Button
        onClick={handleAddInput}
        variant="soft"
        size="2"
        className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Add Input Field
      </Button>
    </div>
  );
}; 