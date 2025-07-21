import React, { useState } from 'react';
import { Dialog, Button, TextArea, Text, Heading, Badge } from '@radix-ui/themes';
import { CheckIcon, Cross1Icon } from '@radix-ui/react-icons';
import { HumanInputRequired } from '../types';

interface ApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interruptInfo: HumanInputRequired | null;
  onDecision: (decision: 'approved' | 'rejected', comment: string) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  open,
  onOpenChange,
  interruptInfo,
  onDecision
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('ApprovalModal render:', { open, interruptInfo });
  if (!interruptInfo) return null;

  const handleApproval = async () => {
    if (interruptInfo.require_comment && !comment.trim()) {
      alert('Comment is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onDecision('approved', comment);
      setComment('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejection = async () => {
    if (interruptInfo.require_comment && !comment.trim()) {
      alert('Comment is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onDecision('rejected', comment);
      setComment('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="500px" className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <Heading size="4" className="text-white mb-1">
                Human Approval Required
              </Heading>
              <Badge size="1" variant="soft" color="orange">
                Workflow Paused
              </Badge>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <Text size="3" className="text-white block mb-3 leading-relaxed">
              {interruptInfo.message}
            </Text>
            
            {/* Node info */}
            <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg p-3">
              <Text size="1" className="text-[var(--color-text-secondary)]">
                Node ID: <span className="font-mono">{interruptInfo.node_id}</span>
              </Text>
            </div>
          </div>

          {/* Comment input */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Text size="2" weight="medium" className="text-white">
                {interruptInfo.input_label}
              </Text>
              {interruptInfo.require_comment && (
                <Badge size="1" color="red" variant="soft">
                  Required
                </Badge>
              )}
            </div>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Enter your ${interruptInfo.input_label.toLowerCase()}...`}
              rows={4}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="soft"
              color="red"
              onClick={handleRejection}
              disabled={isSubmitting || (interruptInfo.require_comment && !comment.trim())}
              className="min-w-24"
            >
              <Cross1Icon className="w-4 h-4 mr-2" />
              {interruptInfo.rejection_label}
            </Button>
            
            <Button
              variant="solid"
              color="green"
              onClick={handleApproval}
              disabled={isSubmitting || (interruptInfo.require_comment && !comment.trim())}
              className="min-w-24"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              {interruptInfo.approval_label}
            </Button>
          </div>

          {/* Help text */}
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <Text size="1" className="text-orange-400">
              💡 The workflow has been paused and is waiting for your decision. 
              Choose to approve or reject to continue execution.
            </Text>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};
