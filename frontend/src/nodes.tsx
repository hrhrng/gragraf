import React from 'react';
import { Handle, Position, Node, NodeProps } from 'reactflow';
import { Card, Text, Badge } from '@radix-ui/themes';
import { 
  GlobeIcon, 
  PersonIcon, 
  BookmarkIcon, 
  BorderSplitIcon,
  FileTextIcon,
  QuestionMarkIcon,
  CheckCircledIcon,
  MagnifyingGlassIcon
} from '@radix-ui/react-icons';
import { NodeData } from './types';
import { StartNode } from './components/StartNode';
import { EndNode } from './components/EndNode';

// 定义Badge颜色类型 - 使用Radix UI实际支持的颜色
type BadgeColor = 'gray' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'pink' | 'ruby' | 'gold' | 'bronze' | 'brown' | 'tomato' | 'crimson' | 'plum' | 'iris';

// 定义节点样式配置类型
interface NodeStyleConfig {
  icon: React.ComponentType<any>;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  badgeColor: BadgeColor;
}

// 定义条件类型
interface Condition {
  field?: string;
  operator?: string;
  value?: any;
}

// 统一的克苏鲁风格配色
const nodeStyleConfig: Record<string, NodeStyleConfig> = {
  'http request': {
    icon: GlobeIcon,
    iconColor: 'text-teal-300',
    bgColor: 'bg-teal-900/20',
    borderColor: 'border-teal-700/30',
    badgeColor: 'teal'
  },
  'agent': {
    icon: PersonIcon,
    iconColor: 'text-indigo-300',
    bgColor: 'bg-indigo-900/20',
    borderColor: 'border-indigo-700/30',
    badgeColor: 'indigo'
  },
  'knowledge base': {
    icon: FileTextIcon,
    iconColor: 'text-purple-300',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-700/30',
    badgeColor: 'purple'
  },
  'branch': {
    icon: BorderSplitIcon,
    iconColor: 'text-orange-300',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-700/30',
    badgeColor: 'orange'
  },
  'human approval': {
    icon: CheckCircledIcon,
    iconColor: 'text-red-300',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-700/30',
    badgeColor: 'red'
  }
};

const BaseNode = ({ data, selected }: NodeProps<NodeData>) => {
  const getNodeStyle = (nodeType: string): NodeStyleConfig => {
    // 基于节点类型而不是标签名称来确定样式
    const typeToStyleMap: Record<string, NodeStyleConfig> = {
      'httpRequest': nodeStyleConfig['http request'],
      'agent': nodeStyleConfig['agent'],
      'knowledgeBase': nodeStyleConfig['knowledge base'],
      'branch': nodeStyleConfig['branch'],
      'humanInLoop': nodeStyleConfig['human approval'],
    };
    
    return typeToStyleMap[nodeType] || {
      icon: QuestionMarkIcon,
      iconColor: 'text-gray-300',
      bgColor: 'bg-gray-900/20',
      borderColor: 'border-gray-700/30',
      badgeColor: 'gray'
    };
  };

  // 从节点类型获取样式，而不是从标签名称
  const style = getNodeStyle(data.nodeType || 'unknown');
  const IconComponent = style.icon;

  return (
    <div className="relative transition-all duration-200">
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
      />
      
      <div className={`w-44 bg-[var(--color-bg-secondary)] border-2 rounded-lg ${
        selected 
          ? 'border-white/30 shadow-lg shadow-black/20' 
          : 'border-[var(--color-border-primary)] hover:border-white/20'
      } transition-all duration-200`}
        style={{ borderRadius: '8px' }}>
        <div className="py-5 px-4">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bgColor} border ${style.borderColor}`} style={{ minWidth: '32px', minHeight: '32px' }}>
              <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1 truncate" style={{ fontFamily: 'inherit' }}>
              {data.label}
            </Text>
          </div>
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right}
        className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
      />
    </div>
  );
};

const BranchNode = ({ data, selected }: NodeProps<NodeData>) => {
  const conditions: Condition[] = data.config?.conditions || [];
  const hasElse = data.config?.hasElse || false;
  const branchCount = conditions.length + (hasElse ? 1 : 0);

  // 每个分支预览的高度
  const branchPreviewHeight = 32;
  // 基础内容高度（图标+文字区域）
  const baseContentHeight = 48; // 标题区域高度
  // 计算所需的总高度 - 如果没有条件，使用标准高度
  const totalHeight = branchCount > 0 
    ? baseContentHeight + (branchCount * branchPreviewHeight) + 16 
    : 72; // 标准高度，与BaseNode一致

  const style = nodeStyleConfig['branch'];

  // 生成条件预览文本
  const getConditionPreview = (condition: any, index: number) => {
    // 检查是否有预生成的条件字符串（来自BranchConfigForm）
    if (condition.condition && condition.condition !== '请配置完整条件') {
      return condition.condition;
    }
    
    // 兼容两种数据格式：Condition接口和ConditionData接口
    const field = condition.field || condition.variable;
    const operator = condition.operator || '==';
    const value = condition.value || '';
    
    // 即使没有完整配置，也显示条件表达式格式
    if (!field) {
      return `{{变量}} ${operator} ${value || '值'}`;
    }
    
    if (!value) {
      return `{{${field}}} ${operator} 值`;
    }
    
    // 显示生成的条件表达式格式
    return `{{${field}}} ${operator} ${value}`;
  };

  return (
    <div className="relative transition-all duration-200">
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
      />
      <div className={`w-44 bg-[var(--color-bg-secondary)] border-2 rounded-lg ${
        selected 
          ? 'border-white/30 shadow-lg shadow-black/20' 
          : 'border-[var(--color-border-primary)] hover:border-white/20'
      } transition-all duration-200`}
        style={{ 
          borderRadius: '8px',
          minHeight: `${totalHeight}px`
        }}>
        <div className="py-5 px-4" style={{ 
          minHeight: `${totalHeight}px`
        }}>
          {/* 标题区域 */}
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bgColor} border ${style.borderColor}`} style={{ minWidth: '32px', minHeight: '32px' }}>
              <BorderSplitIcon className={`w-5 h-5 ${style.iconColor}`} />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1 truncate" style={{ fontFamily: 'inherit' }}>
              {data.label}
            </Text>
          </div>

          {/* 分支预览区域 - 只在有条件时显示 */}
          {branchCount > 0 && (
            <div className="mt-3 space-y-1">
              {/* 条件分支预览 */}
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center justify-between bg-[var(--color-bg-tertiary)] rounded px-2 py-1 border border-[var(--color-border-primary)]">
                  <Text size="1" className="text-[var(--color-text-primary)] font-mono truncate" style={{ maxWidth: '100%' }}>
                    {getConditionPreview(condition, index)}
                  </Text>
                </div>
              ))}
              
              {/* Else分支预览 */}
              {hasElse && (
                <div className="flex items-center justify-between bg-[var(--color-bg-tertiary)] rounded px-2 py-1 border border-[var(--color-border-primary)]">
                  <Text size="1" className="text-[var(--color-text-primary)]">
                    否则
                  </Text>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 动态生成右侧 Handle */}
      {Array.from({ length: branchCount }, (_, index) => {
        // 如果没有条件，不生成Handle
        if (branchCount === 0) return null;
        
        // 计算Handle位置：标题区域高度 + 条件预览区域的位置
        const titleHeight = 72; // 标题区域高度
        const conditionStartY = titleHeight + 12; // 标题区域 + 间距
        const startY = conditionStartY + (index * 29.9); // 每个条件框高度32px，间距4px
        const centerY = startY - 3; // startY + 32/2 - 4 (往上偏移4px)
        
        const isElseBranch = hasElse && index === conditions.length;
        const handleId = isElseBranch ? 'else' : `branch-${index}`;
        
        return (
          <Handle 
            key={index}
            type="source" 
            position={Position.Right}
            id={handleId}
            className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
            style={{ top: centerY + 'px' }}
          />
        );
      })}
    </div>
  );
};

const HumanInLoopNode = ({ data, selected }: NodeProps<NodeData>) => {
  const style = nodeStyleConfig['human approval'];
  
  // 计算所需的总高度 - 固定为2个分支
  const branchCount = 2;
  const branchPreviewHeight = 32;
  const baseContentHeight = 48; // 标题区域高度
  const totalHeight = baseContentHeight + (branchCount * branchPreviewHeight) + 16;

  return (
    <div className="relative transition-all duration-200">
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
      />
      
      <div className={`w-44 bg-[var(--color-bg-secondary)] border-2 rounded-lg ${
        selected 
          ? 'border-white/30 shadow-lg shadow-black/20' 
          : 'border-[var(--color-border-primary)] hover:border-white/20'
      } transition-all duration-200`}
        style={{ 
          borderRadius: '8px',
          minHeight: `${totalHeight}px`
        }}>
        <div className="py-5 px-4" style={{ 
          minHeight: `${totalHeight}px`
        }}>
          {/* 标题区域 */}
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bgColor} border ${style.borderColor}`} style={{ minWidth: '32px', minHeight: '32px' }}>
              <CheckCircledIcon className={`w-5 h-5 ${style.iconColor}`} />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1 truncate" style={{ fontFamily: 'inherit' }}>
              {data.label}
            </Text>
          </div>

          {/* 分支预览区域 */}
          <div className="mt-3 space-y-1">
            {/* Approve分支预览 */}
            <div className="flex items-center justify-between bg-[var(--color-bg-tertiary)] rounded px-2 py-1 border border-[var(--color-border-primary)]">
              <Text size="1" className="text-green-300 font-mono truncate" style={{ maxWidth: '100%' }}>
                Approve
              </Text>
            </div>
            
            {/* Reject分支预览 */}
            <div className="flex items-center justify-between bg-[var(--color-bg-tertiary)] rounded px-2 py-1 border border-[var(--color-border-primary)]">
              <Text size="1" className="text-red-300 font-mono truncate" style={{ maxWidth: '100%' }}>
                Reject
              </Text>
            </div>
          </div>
        </div>
      </div>
      
      {/* 动态生成右侧 Handle - 与Branch节点相同的逻辑 */}
      {Array.from({ length: branchCount }, (_, index) => {
        // 计算Handle位置：标题区域高度 + 分支预览区域的位置
        const titleHeight = 72; // 标题区域高度
        const conditionStartY = titleHeight + 12; // 标题区域 + 间距
        const startY = conditionStartY + (index * 29.9); // 每个分支框高度32px，间距4px
        const centerY = startY - 3; // startY + 32/2 - 4 (往上偏移4px)
        
        const handleId = index === 0 ? 'approve' : 'reject';
        
        return (
          <Handle 
            key={index}
            type="source" 
            position={Position.Right}
            id={handleId}
            className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
            style={{ top: centerY + 'px' }}
          />
        );
      })}
    </div>
  );
};

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  httpRequest: BaseNode,
  agent: BaseNode,
  knowledgeBase: BaseNode,
  branch: BranchNode,
  humanInLoop: HumanInLoopNode,
};

export const initialNodes: Node<NodeData>[] = [
  {
    id: 'start_1',
    type: 'start',
    data: { label: 'Start', nodeType: 'start', config: { inputs: [{ name: 'input' }] } },
    position: { x: 100, y: 200 },
  },
  {
    id: 'end_1',
    type: 'end',
    data: { label: 'End', nodeType: 'end', config: {} },
    position: { x: 800, y: 200 },
  },
]; 