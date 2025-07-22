import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm } from 'react-hook-form';
import { NodeData } from '../types';
import { ConfigFormBase, ConfigSection } from './common/ConfigFormBase';
import { 
  ConfigTextField, 
  ConfigTextAreaField,
  ConfigSwitchField
} from './common/ConfigFormFields';
import { 
  CheckCircledIcon, 
  ChatBubbleIcon, 
  ExclamationTriangleIcon,
  PersonIcon
} from '@radix-ui/react-icons';
import { Text, Flex } from '@radix-ui/themes';

interface HumanInLoopConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  onNodeChange: (nodeUpdates: Partial<Node<NodeData>>) => void;
}

interface FormData {
  message: string;
  input_label: string;
  approval_label: string;
  rejection_label: string;
  require_comment: boolean;
}

export const HumanInLoopConfigForm: React.FC<HumanInLoopConfigFormProps> = ({ 
  node, 
  onConfigChange,
  onNodeChange
}) => {
  const { setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      message: node.data.config?.message || 'Please review and approve this action',
      input_label: node.data.config?.input_label || 'Comments',
      approval_label: node.data.config?.approval_label || 'Approve',
      rejection_label: node.data.config?.rejection_label || 'Reject',
      require_comment: node.data.config?.require_comment || false
    }
  });

  useEffect(() => {
    reset({
      message: node.data.config?.message || 'Please review and approve this action',
      input_label: node.data.config?.input_label || 'Comments',
      approval_label: node.data.config?.approval_label || 'Approve',
      rejection_label: node.data.config?.rejection_label || 'Reject',
      require_comment: node.data.config?.require_comment || false
    });
  }, [node, reset]);

  useEffect(() => {
    const subscription = watch((data) => {
      onConfigChange(data);
    });

    return () => subscription.unsubscribe();
  }, [watch, onConfigChange]);

  return (
    <ConfigFormBase
      nodeLabel={node.data.label || 'Human Approval'}
      nodeType="humanInLoop"
      onNodeLabelChange={(label) => onNodeChange({ data: { ...node.data, label } })}
      showVariables={false}
    >
      {/* Message Configuration */}
      <ConfigSection
        title="用户提示信息"
        description="配置显示给用户的提示消息"
        icon={<ChatBubbleIcon />}
      >
        <ConfigTextAreaField
          label="提示消息"
          value={watch('message')}
          onChange={(value) => setValue('message', value)}
          placeholder="请审阅以下内容并选择是否批准..."
          rows={3}
          required
          helpText="向用户显示的审批提示信息"
        />

        <ConfigTextField
          label="评论字段标签"
          value={watch('input_label')}
          onChange={(value) => setValue('input_label', value)}
          placeholder="评论"
          helpText="用户输入评论时显示的字段标签"
        />
      </ConfigSection>

      {/* Button Configuration */}
      <ConfigSection
        title="按钮配置"
        description="自定义批准和拒绝按钮的显示文本"
        icon={<CheckCircledIcon />}
      >
        <div className="grid grid-cols-2 gap-4">
          <ConfigTextField
            label="批准按钮文本"
            value={watch('approval_label')}
            onChange={(value) => setValue('approval_label', value)}
            placeholder="批准"
            helpText="批准按钮显示的文本"
          />

          <ConfigTextField
            label="拒绝按钮文本"
            value={watch('rejection_label')}
            onChange={(value) => setValue('rejection_label', value)}
            placeholder="拒绝"
            helpText="拒绝按钮显示的文本"
          />
        </div>

        <ConfigSwitchField
          label="强制要求评论"
          checked={watch('require_comment')}
          onChange={(checked) => setValue('require_comment', checked)}
          helpText="启用后，用户必须输入评论才能提交决定"
        />
      </ConfigSection>

      {/* Behavior Preview */}
      <ConfigSection
        title="预览效果"
        description="查看用户界面的预期效果"
        icon={<PersonIcon />}
        collapsible
        defaultExpanded={false}
      >
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
            <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-3 block">
              用户看到的界面预览
            </Text>
            
            {/* Preview Message */}
            <div className="mb-4 p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded">
              <Text size="2" className="text-[var(--color-text-primary)]">
                {watch('message') || '请审阅以下内容并选择是否批准...'}
              </Text>
            </div>

            {/* Preview Comment Field */}
            <div className="mb-4">
              <Text size="1" className="text-[var(--color-text-secondary)] mb-1 block">
                {watch('input_label') || '评论'}
                {watch('require_comment') && <span className="text-red-400 ml-1">*</span>}
              </Text>
              <div className="p-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-sm text-[var(--color-text-secondary)]">
                [用户输入框]
              </div>
            </div>

            {/* Preview Buttons */}
            <Flex gap="2">
              <div className="px-3 py-1 bg-green-500/20 border border-green-400 rounded text-green-400 text-sm">
                {watch('approval_label') || '批准'}
              </div>
              <div className="px-3 py-1 bg-red-500/20 border border-red-400 rounded text-red-400 text-sm">
                {watch('rejection_label') || '拒绝'}
              </div>
            </Flex>
          </div>
        </div>
      </ConfigSection>

      {/* Important Notes */}
      <ConfigSection
        title="重要提示"
        description="关于人工审批节点的使用说明"
        icon={<ExclamationTriangleIcon />}
        collapsible
        defaultExpanded={false}
      >
        <div className="space-y-3">
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <Text size="2" weight="medium" className="text-orange-400 mb-2 block">
              工作流执行说明
            </Text>
            <div className="space-y-2 text-sm text-orange-300">
              <div>• 当工作流执行到此节点时，会暂停等待人工输入</div>
              <div>• 用户将看到上面配置的提示消息</div>
              <div>• 用户可以选择批准或拒绝，并可选择性地添加评论</div>
              <div>• 根据用户的选择，工作流将走不同的分支路径</div>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Text size="2" weight="medium" className="text-blue-400 mb-2 block">
              连接说明
            </Text>
            <div className="space-y-2 text-sm text-blue-300">
              <div>• 批准路径：连接到批准后执行的节点</div>
              <div>• 拒绝路径：连接到拒绝后执行的节点</div>
              <div>• 两个路径都应该连接到后续节点</div>
            </div>
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <Text size="2" weight="medium" className="text-purple-400 mb-2 block">
              最佳实践
            </Text>
            <div className="space-y-2 text-sm text-purple-300">
              <div>• 提示消息应该清晰说明需要审批的内容</div>
              <div>• 考虑是否需要强制要求用户输入评论</div>
              <div>• 按钮文本应该明确表达操作意图</div>
              <div>• 确保批准和拒绝路径都有适当的后续处理</div>
            </div>
          </div>
        </div>
      </ConfigSection>
    </ConfigFormBase>
  );
};
