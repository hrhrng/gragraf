import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Text, Heading, TextField, Card, Badge } from '@radix-ui/themes';
import { PlayIcon, Cross2Icon } from '@radix-ui/react-icons';
import { ConfigSection } from './common/ConfigFormBase';

interface RunFormProps {
  inputs: { name: string }[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const RunForm: React.FC<RunFormProps> = ({ inputs, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <Card className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] shadow-2xl w-full max-w-lg mx-4 animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Icon container matching node style */}
              <div className="w-8 h-8 rounded flex items-center justify-center bg-blue-900/20 border-blue-700/30 border">
                <PlayIcon className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Heading size="4" className="text-[var(--color-text-primary)]">
                    Run Workflow
                  </Heading>
                </div>
                <Text size="2" className="text-[var(--color-text-secondary)]">
                  Configure input parameters and start execution
                </Text>
              </div>
            </div>
            <Button
              variant="ghost"
              size="2"
              onClick={onCancel}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/30"
            >
              <Cross2Icon className="w-4 h-4" />
            </Button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {inputs.length === 0 ? (
              <ConfigSection
                title="No Inputs Required"
                description="This workflow doesn't require any input parameters"
                icon={<PlayIcon />}
              >
                <div className="text-center py-4">
                  <Text size="2" className="text-[var(--color-text-secondary)]">
                    Click "Run Workflow" to start execution immediately
                  </Text>
                </div>
              </ConfigSection>
            ) : (
              <ConfigSection
                title="Input Parameters"
                description="Provide values for the workflow input parameters"
                icon={<PlayIcon />}
              >
                                <div className="space-y-4">
                  {inputs.map((input) => (
                    <div key={input.name} className="space-y-2">
                      <Text size="2" weight="medium" className="text-[var(--color-text-primary)] capitalize">
                        {input.name.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      <TextField.Root
                        {...register(input.name, { required: true })}
                        placeholder={`Enter ${input.name.toLowerCase()}`}
                        className="w-full bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]"
                      />
                      {errors[input.name] && (
                        <Text size="1" className="text-red-400">
                          This field is required
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              </ConfigSection>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[var(--color-border-primary)]">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={onCancel}
                className="flex-1 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="soft"
                className="flex-1 bg-blue-900/20 hover:bg-blue-800/30 text-blue-300 hover:text-blue-200 border border-blue-700/30 hover:border-blue-600/40"
                disabled={inputs.length === 0 ? false : Object.keys(errors).length > 0}
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Run Workflow
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}; 