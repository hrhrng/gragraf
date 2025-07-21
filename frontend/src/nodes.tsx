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
  CheckCircledIcon
} from '@radix-ui/react-icons';
import { NodeData } from './types';
import { StartNode } from './components/StartNode';
import { EndNode } from './components/EndNode';

// 统一的克苏鲁风格配色
const nodeStyleConfig = {
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
  const getNodeStyle = (label: string) => {
    const normalizedLabel = label.toLowerCase();
    return nodeStyleConfig[normalizedLabel] || {
      icon: QuestionMarkIcon,
      iconColor: 'text-gray-300',
      bgColor: 'bg-gray-900/20',
      borderColor: 'border-gray-700/30',
      badgeColor: 'gray'
    };
  };

  const style = getNodeStyle(data.label);
  const IconComponent = style.icon;

  return (
    <div className="relative transition-all duration-200">
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
      />
      
      <Card className={`w-56 bg-[var(--color-bg-secondary)] border-2 ${
        selected 
          ? 'border-white/30 shadow-lg shadow-black/20' 
          : 'border-[var(--color-border-primary)] hover:border-white/20'
      } transition-all duration-200`}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bgColor} border ${style.borderColor}`}>
              <IconComponent className={`w-4 h-4 ${style.iconColor}`} />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1" style={{ fontFamily: 'inherit' }}>
              {data.label}
            </Text>
          </div>
          
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="space-y-2">
              {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Text size="1" className="text-white/60 capitalize" style={{ fontFamily: 'inherit' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Badge size="1" variant="soft" color={style.badgeColor}>
                    <Text size="1" style={{ fontFamily: 'inherit' }}>
                      {typeof value === 'string' ? value.slice(0, 10) + (value.length > 10 ? '...' : '') : 
                       typeof value === 'object' ? 'Object' : 
                       String(value)}
                    </Text>
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      <Handle 
        type="source" 
        position={Position.Right}
        className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
      />
    </div>
  );
};

const BranchNode = ({ data, selected }: NodeProps<NodeData>) => {
  const conditions = data.config?.conditions || [];
  const hasElse = data.config?.hasElse || false;
  const branchCount = conditions.length + (hasElse ? 1 : 0);

  // 行高（px），需与下方内容区每行高度一致
  const rowHeight = 32;
  // 内容区顶部padding
  const contentPaddingTop = 16;

  const style = nodeStyleConfig['branch'];

  return (
    <div className="relative transition-all duration-200">
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
      />
      <Card className={`w-56 bg-[var(--color-bg-secondary)] border-2 ${
        selected 
          ? 'border-white/30 shadow-lg shadow-black/20' 
          : 'border-[var(--color-border-primary)] hover:border-white/20'
      } transition-all duration-200`}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bgColor} border ${style.borderColor}`}>
              <BorderSplitIcon className={`w-4 h-4 ${style.iconColor}`} />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1" style={{ fontFamily: 'inherit' }}>
              {data.label}
            </Text>
          </div>
          
          <div className="space-y-1">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center justify-between">
                <Text size="1" className="text-white/60" style={{ fontFamily: 'inherit' }}>
                  Condition {index + 1}
                </Text>
                <Badge size="1" variant="soft" color={style.badgeColor}>
                  <Text size="1" style={{ fontFamily: 'inherit' }}>
                    {condition.field || 'Field'} {condition.operator || '='} {String(condition.value).slice(0, 8)}
                  </Text>
                </Badge>
              </div>
            ))}
            {hasElse && (
              <div className="flex items-center justify-between">
                <Text size="1" className="text-white/60" style={{ fontFamily: 'inherit' }}>
                  Else Branch
                </Text>
                <Badge size="1" variant="soft" color="gray">
                  <Text size="1" style={{ fontFamily: 'inherit' }}>Default</Text>
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* 动态生成右侧 Handle */}
      {Array.from({ length: branchCount }, (_, index) => {
        const yOffset = contentPaddingTop + (index * rowHeight);
        return (
          <Handle 
            key={index}
            type="source" 
            position={Position.Right}
            id={index === branchCount - 1 && hasElse ? 'else' : `condition-${index}`}
            className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
            style={{ top: yOffset + 'px' }}
          />
        );
      })}
    </div>
  );
};

const HumanInLoopNode = ({ data, selected }: NodeProps<NodeData>) => {
  const config = data.config || {};
  const style = nodeStyleConfig['human approval'];
  
  return (
    <div className="relative transition-all duration-200">
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
      />
      
      <Card className={`w-56 bg-[var(--color-bg-secondary)] border-2 ${
        selected 
          ? 'border-white/30 shadow-lg shadow-black/20' 
          : 'border-[var(--color-border-primary)] hover:border-white/20'
      } transition-all duration-200`}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bgColor} border ${style.borderColor}`}>
              <CheckCircledIcon className={`w-4 h-4 ${style.iconColor}`} />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1" style={{ fontFamily: 'inherit' }}>
              {data.label}
            </Text>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Text size="1" className="text-white/60" style={{ fontFamily: 'inherit' }}>
                Message
              </Text>
              <Badge size="1" variant="soft" color={style.badgeColor}>
                <Text size="1" style={{ fontFamily: 'inherit' }}>
                  {config.message?.slice(0, 10) + (config.message?.length > 10 ? '...' : '') || 'Pending'}
                </Text>
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <Text size="1" className="text-white/60" style={{ fontFamily: 'inherit' }}>
                Timeout
              </Text>
              <Badge size="1" variant="soft" color="gray">
                <Text size="1" style={{ fontFamily: 'inherit' }}>
                  {config.timeout || 'None'}
                </Text>
              </Badge>
            </div>
          </div>
        </div>
      </Card>
      
      <Handle 
        type="source" 
        position={Position.Right}
        className="w-3 h-3 border-2 border-white/50 bg-[var(--color-bg-secondary)]"
      />
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
    data: { label: 'Start', config: { inputs: [{ name: 'input' }] } },
    position: { x: 100, y: 200 },
  },
  {
    id: 'end_1',
    type: 'end',
    data: { label: 'End', config: {} },
    position: { x: 800, y: 200 },
  },
]; 