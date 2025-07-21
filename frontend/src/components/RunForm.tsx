import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Text, Heading, TextField, Flex, Card } from '@radix-ui/themes';
import { PlayIcon, Cross2Icon } from '@radix-ui/react-icons';

interface RunFormProps {
  inputs: { name: string }[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const RunForm: React.FC<RunFormProps> = ({ inputs, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <Card className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] shadow-2xl w-full max-w-md mx-4 animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <PlayIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <Heading size="4" className="text-white">
                  Run Workflow
                </Heading>
                <Text size="2" className="text-[var(--color-text-secondary)]">
                  Provide input values to start execution
                </Text>
              </div>
            </div>
            <Button
              variant="ghost"
              size="2"
              onClick={onCancel}
              className="text-[var(--color-text-secondary)] hover:text-white"
            >
              <Cross2Icon className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {inputs.length === 0 ? (
              <div className="text-center py-8">
                <Text size="2" className="text-[var(--color-text-secondary)]">
                  No input fields configured for this workflow
                </Text>
              </div>
            ) : (
              inputs.map((input) => (
                <div key={input.name} className="space-y-2">
                  <Text size="2" weight="medium" className="text-white capitalize">
                    {input.name.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <TextField.Root
                    {...register(input.name, { required: true })}
                    placeholder={`Enter ${input.name}`}
                    className="w-full bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] text-white placeholder:text-[var(--color-text-secondary)]"
                  />
                  {errors[input.name] && (
                    <Text size="1" className="text-red-400">
                      This field is required
                    </Text>
                  )}
                </div>
              ))
            )}

            {/* Actions */}
            <Flex gap="3" className="pt-6">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="soft"
                color="blue"
                className="flex-1"
                disabled={inputs.length === 0}
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Run Workflow
              </Button>
            </Flex>
          </form>
        </div>
      </Card>
    </div>
  );
}; 