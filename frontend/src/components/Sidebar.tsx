import React from 'react';
import { Text, Heading, Card, Badge, ScrollArea } from '@radix-ui/themes';
import { Node } from 'reactflow';
import { 
  PlusIcon, 
  ComponentInstanceIcon, 
  ExitIcon,
  GlobeIcon,
  FileTextIcon,
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
    color: 'purple',
    description: 'AI agent processing'
  },
  { 
    type: 'knowledgeBase', 
    label: 'Knowledge Base', 
    icon: FileTextIcon, 
    color: 'green',
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
    <div className="w-64 bg-[var(--color-bg-secondary)] rounded-lg flex flex-col h-full animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-primary)] h-14 flex items-center">
        <div className="flex items-center gap-3 w-full">
          <Heading size="4" className="text-white font-semibold" style={{ fontFamily: 'Bellota Text, Arial, sans-serif', fontWeight: 300, fontSize: '1.75rem' }}>
            GraGraf
          </Heading>
        </div>
      </div>

      {/* Node Library */}
      <div className="flex-1 p-3 overflow-visible">
        <div className="flex items-center gap-2 mb-3">
          <PlusIcon className="w-4 h-4 text-[var(--color-accent)]" />
          <Heading size="2" className="text-white">
            Add Nodes
          </Heading>
        </div>
        
        {/* 用原生 div 替代 ScrollArea，支持 overflow 可见 */}
        <div className="h-full overflow-y-auto overflow-x-visible">
          <div className="space-y-1">
            {nodeTypes.map((nodeType) => {
              const IconComponent = nodeType.icon;
              return (
                <Card 
                  key={nodeType.type}
                  className="group cursor-pointer relative transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:z-20 bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)] border-[var(--color-border-primary)] animate-fade-in"
                  onClick={() => onAddNode(nodeType.type, nodeType.label)}
                >
                  <div className="px-2.5 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center bg-${nodeType.color}-500/10 border border-${nodeType.color}-500/20 group-hover:bg-${nodeType.color}-500/20 transition-colors`}>
                        <IconComponent className={`w-3 h-3 text-${nodeType.color}-400 transition-all`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text size="1" weight="medium" className="text-white block">
                          {nodeType.label}
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