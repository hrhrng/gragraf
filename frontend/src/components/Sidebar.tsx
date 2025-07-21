import React from 'react';
import { Text, Heading, Card, Badge, ScrollArea } from '@radix-ui/themes';
import { Node } from 'reactflow';
import { 
  PlusIcon, 
  ComponentInstanceIcon, 
  ExitIcon,
  GlobeIcon,
  BookmarkIcon,
  BorderSplitIcon,
  PersonIcon,
  PlayIcon,
  CheckCircledIcon
} from '@radix-ui/react-icons';
import { NodeData } from '../types';

interface SidebarProps {
  onAddNode: (type: string, label: string) => void;
  nodes: Node<NodeData>[];
}

const nodeTypes = [
  { 
    type: 'httpRequest', 
    label: 'HTTP Request', 
    icon: GlobeIcon, 
    color: 'blue',
    description: 'Make HTTP API calls'
  },
  { 
    type: 'agent', 
    label: 'Agent', 
    icon: PersonIcon, 
    color: 'custom',
    description: 'AI agent processing'
  },
  { 
    type: 'knowledgeBase', 
    label: 'Knowledge Base', 
    icon: BookmarkIcon, 
    color: 'cyan',
    description: 'Query knowledge base'
  },
  { 
    type: 'branch', 
    label: 'Branch', 
    icon: BorderSplitIcon, 
    color: 'yellow',
    description: 'Conditional branching'
  },
  { 
    type: 'humanInLoop', 
    label: 'Human Approval', 
    icon: CheckCircledIcon, 
    color: 'orange',
    description: 'Human-in-the-loop approval'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ onAddNode, nodes }) => {
  return (
    <div className="w-80 bg-[var(--color-bg-secondary)] rounded-lg flex flex-col h-full animate-slide-in">
      {/* Header */}
      <div className="p-6 border-b border-[var(--color-border-primary)] h-16 flex items-center">
        <div className="flex items-center gap-3 w-full">
          <Heading size="4" className="text-white font-semibold" style={{ fontFamily: 'Bellota Text, Arial, sans-serif', fontWeight: 300, fontSize: '2rem' }}>
            GraGraf
          </Heading>
        </div>
      </div>

      {/* Node Library */}
      <div className="flex-1 p-6 overflow-visible">
        <div className="flex items-center gap-2 mb-6">
          <PlusIcon className="w-4 h-4 text-[var(--color-accent)]" />
          <Heading size="3" className="text-white">
            Add Nodes
          </Heading>
        </div>
        
        {/* 用原生 div 替代 ScrollArea，支持 overflow 可见 */}
        <div className="h-full overflow-y-auto overflow-x-visible">
          <div className="space-y-3">
            {nodeTypes.map((nodeType) => {
              const IconComponent = nodeType.icon;
              return (
                <Card 
                  key={nodeType.type}
                  className="group cursor-pointer relative transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:z-20 bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)] border-[var(--color-border-primary)] animate-fade-in"
                  onClick={() => onAddNode(nodeType.type, nodeType.label)}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${nodeType.color}-500/10 border border-${nodeType.color}-500/20 group-hover:bg-${nodeType.color}-500/20 transition-colors`}>
                        <IconComponent className={`w-5 h-5 text-${nodeType.color}-400`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Text size="3" weight="medium" className="text-white">
                            {nodeType.label}
                          </Text>
                        </div>
                        <Text size="1" className="text-[var(--color-text-secondary)] leading-tight">
                          {nodeType.description}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>


    </div>
  );
}; 