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

const BaseNode = ({ data, selected }: NodeProps<NodeData>) => {
  const getNodeIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'agent': return <PersonIcon />;
      case 'http request': return <GlobeIcon />;
      case 'knowledge base': return <FileTextIcon />;
      case 'human approval': return <CheckCircledIcon />;
      default: return <QuestionMarkIcon />;
    }
  };

  const getNodeColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'agent': return 'blue';
      case 'http request': return 'green';
      case 'knowledge base': return 'purple';
      case 'human approval': return 'orange';
      default: return 'gray';
    }
  };

  const color = getNodeColor(data.label);
  const icon = getNodeIcon(data.label);

  return (
    <div className="relative transition-all duration-200">
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2 border-white bg-[var(--color-bg-tertiary)]"
      />
      
      <Card className={`w-56 bg-[var(--color-bg-secondary)] border-2 ${
        selected 
          ? 'border-[var(--color-accent)] shadow-lg shadow-violet-500/20' 
          : 'border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50'
      } transition-all duration-200`}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-500/10 border border-${color}-500/20`}>
              {icon && React.cloneElement(icon, { className: `w-4 h-4 text-${color}-400` })}
            </div>
            <Text size="3" weight="medium" className="text-white flex-1">
              {data.label}
            </Text>
          </div>
          
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="space-y-2">
              {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Text size="1" className="text-[var(--color-text-secondary)] capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Badge size="1" variant="soft" color={color}>
                    <Text size="1">
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
        className="w-3 h-3 border-2 border-white bg-[var(--color-bg-tertiary)]"
      />
    </div>
  );
};

const BranchNode = ({ data, selected }: NodeProps<NodeData>) => {
  const conditions = data.config?.conditions || [];
  const hasElse = data.config?.hasElse || false;
  const branchCount = conditions.length + (hasElse ? 1 : 0);
  
  return (
    <div className="relative transition-all duration-200">
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2 border-white bg-[var(--color-bg-tertiary)]"
      />
      
      <Card className={`w-56 bg-[var(--color-bg-secondary)] border-2 ${
        selected 
          ? 'border-[var(--color-accent)] shadow-lg shadow-violet-500/20' 
          : 'border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50'
      } transition-all duration-200`}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20">
              <BorderSplitIcon className="w-4 h-4 text-yellow-400" />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1">
              {data.label}
            </Text>
          </div>
          
          {conditions.length > 0 && (
            <div className="space-y-2">
              <Text size="1" className="text-[var(--color-text-secondary)]">
                Conditions: {conditions.length}
              </Text>
              {conditions.slice(0, 3).map((condition: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <Text size="1" className="text-[var(--color-text-secondary)]">
                    {index === 0 ? 'If' : `Else if`}
                  </Text>
                  <Badge size="1" variant="soft" color="yellow">
                    <Text size="1">
                      {condition.condition?.slice(0, 10) + (condition.condition?.length > 10 ? '...' : '') || 'Empty'}
                    </Text>
                  </Badge>
                </div>
              ))}
              {conditions.length > 3 && (
                <div className="flex items-center justify-between">
                  <Text size="1" className="text-[var(--color-text-secondary)]">
                    ...
                  </Text>
                  <Badge size="1" variant="soft" color="gray">
                    <Text size="1">+{conditions.length - 3}</Text>
                  </Badge>
                </div>
              )}
              {hasElse && (
                <div className="flex items-center justify-between">
                  <Text size="1" className="text-[var(--color-text-secondary)]">
                    Else
                  </Text>
                  <Badge size="1" variant="soft" color="gray">
                    <Text size="1">Default</Text>
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      
      {/* 主输出Handle */}
      <Handle 
        type="source" 
        position={Position.Right}
        className="w-3 h-3 border-2 border-yellow-400 bg-yellow-500/20"
      />
    </div>
  );
};

const HumanInLoopNode = ({ data, selected }: NodeProps<NodeData>) => {
  const config = data.config || {};
  
  return (
    <div className="relative transition-all duration-200">
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2 border-white bg-[var(--color-bg-tertiary)]"
      />
      
      <Card className={`w-56 bg-[var(--color-bg-secondary)] border-2 ${
        selected 
          ? 'border-[var(--color-accent)] shadow-lg shadow-violet-500/20' 
          : 'border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50'
      } transition-all duration-200`}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/10 border border-orange-500/20">
              <CheckCircledIcon className="w-4 h-4 text-orange-400" />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1">
              {data.label}
            </Text>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Text size="1" className="text-[var(--color-text-secondary)]">
                Message
              </Text>
              <Badge size="1" variant="soft" color="orange">
                <Text size="1">
                  {config.message ? config.message.slice(0, 15) + (config.message.length > 15 ? '...' : '') : 'Not set'}
                </Text>
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <Text size="1" className="text-[var(--color-text-secondary)]">
                Required
              </Text>
              <Badge size="1" variant="soft" color={config.require_comment ? "orange" : "gray"}>
                <Text size="1">
                  {config.require_comment ? 'Yes' : 'No'}
                </Text>
              </Badge>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Approval handle */}
      <Handle 
        type="source" 
        position={Position.Right}
        id="approval"
        style={{ top: '40%' }}
        className="w-3 h-3 border-2 border-green-400 bg-green-500/20"
      />
      
      {/* Rejection handle */}
      <Handle 
        type="source" 
        position={Position.Right}
        id="rejection"
        style={{ top: '60%' }}
        className="w-3 h-3 border-2 border-red-400 bg-red-500/20"
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