import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm } from 'react-hook-form';
import { Box, Text, Checkbox } from '@radix-ui/themes';
import { NodeData } from '../types';

interface HumanInLoopConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
}

export const HumanInLoopConfigForm: React.FC<HumanInLoopConfigFormProps> = ({
  node,
  onConfigChange
}) => {
  const { register, watch, reset, setValue } = useForm({
    defaultValues: {
      message: node.data.config.message || 'Please review and approve this action',
      input_label: node.data.config.input_label || 'Comments',
      approval_label: node.data.config.approval_label || 'Approve',
      rejection_label: node.data.config.rejection_label || 'Reject',
      require_comment: node.data.config.require_comment || false
    }
  });

  useEffect(() => {
    reset({
      message: node.data.config.message || 'Please review and approve this action',
      input_label: node.data.config.input_label || 'Comments',
      approval_label: node.data.config.approval_label || 'Approve',
      rejection_label: node.data.config.rejection_label || 'Reject',
      require_comment: node.data.config.require_comment || false
    });
  }, [node, reset]);

  const handleBlur = () => {
    onConfigChange(watch());
  };

  return (
    <div className="space-y-4" onBlur={handleBlur}>
      <div>
        <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
          Message
        </Text>
        <textarea
          {...register('message')}
          placeholder="Enter the message to display to the user"
          className="w-full min-h-[80px] p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
          rows={3}
        />
        <Text size="1" className="text-[var(--color-text-secondary)] mt-1">
          Message shown to the user when approval is required
        </Text>
      </div>

      <div>
        <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
          Input Label
        </Text>
        <input
          {...register('input_label')}
          placeholder="Comments"
          className="w-full p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
        />
        <Text size="1" className="text-[var(--color-text-secondary)] mt-1">
          Label for the comment input field
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
            Approval Label
          </Text>
          <input
            {...register('approval_label')}
            placeholder="Approve"
            className="w-full p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
          />
        </div>

        <div>
          <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
            Rejection Label
          </Text>
          <input
            {...register('rejection_label')}
            placeholder="Reject"
            className="w-full p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={watch('require_comment')}
          onCheckedChange={(checked) => {
            setValue('require_comment', !!checked);
            setTimeout(() => handleBlur(), 0);
          }}
          id="require_comment"
        />
        <Text size="2" className="text-[var(--color-text-primary)]">
          Require comment from user
        </Text>
      </div>
      
      <Box className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
        <Text size="1" className="text-orange-400">
          <strong>Note:</strong> When this node executes, the workflow will pause and wait for human input. 
          Users will see the message above and can approve or reject with optional comments.
        </Text>
      </Box>
    </div>
  );
};
