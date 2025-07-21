import React, { useState } from 'react';
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
  CheckCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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
    color: 'teal',
    iconColor: 'text-teal-300',
    bgColor: 'bg-teal-900/20',
    borderColor: 'border-teal-700/30',
    hoverBgColor: 'group-hover:bg-teal-800/30',
    hoverIconColor: 'group-hover:text-teal-200',
    description: 'Make HTTP API calls'
  },
  { 
    type: 'agent', 
    label: 'Agent', 
    icon: PersonIcon, 
    color: 'indigo',
    iconColor: 'text-indigo-300',
    bgColor: 'bg-indigo-900/20',
    borderColor: 'border-indigo-700/30',
    hoverBgColor: 'group-hover:bg-indigo-800/30',
    hoverIconColor: 'group-hover:text-indigo-200',
    description: 'AI agent processing'
  },
  { 
    type: 'knowledgeBase', 
    label: 'Knowledge Base', 
    icon: FileTextIcon, 
    color: 'purple',
    iconColor: 'text-purple-300',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-700/30',
    hoverBgColor: 'group-hover:bg-purple-800/30',
    hoverIconColor: 'group-hover:text-purple-200',
    description: 'Query knowledge base'
  },
  { 
    type: 'branch', 
    label: 'Branch', 
    icon: BorderSplitIcon, 
    color: 'orange',
    iconColor: 'text-orange-300',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-700/30',
    hoverBgColor: 'group-hover:bg-orange-800/30',
    hoverIconColor: 'group-hover:text-orange-200',
    description: 'Conditional branching'
  },
  { 
    type: 'humanInLoop', 
    label: 'Human Approval', 
    icon: CheckCircledIcon, 
    color: 'red',
    iconColor: 'text-red-300',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-700/30',
    hoverBgColor: 'group-hover:bg-red-800/30',
    hoverIconColor: 'group-hover:text-red-200',
    description: 'Human-in-the-loop approval'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ onAddNode, nodes }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="relative">
      <div className={`${isCollapsed ? 'w-16' : 'w-48'} bg-[var(--color-bg-secondary)] rounded-lg flex flex-col h-full animate-slide-in transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <div className={`${isCollapsed ? 'p-2' : 'p-3'} border-b border-[var(--color-border-primary)] ${isCollapsed ? 'h-12' : 'h-12'} flex items-center`}>
          {isCollapsed ? (
            <div className="w-full flex items-center justify-center">
              <Text className="text-white" style={{ fontFamily: 'Bellota Text, Arial, sans-serif', fontWeight: 300, fontSize: '1.5rem' }}>
                G
              </Text>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <Heading size="3" className="text-white font-semibold" style={{ fontFamily: 'Bellota Text, Arial, sans-serif', fontWeight: 300, fontSize: '1.5rem' }}>
                GraGraf
              </Heading>
              <button
                onClick={toggleCollapse}
                className="ml-auto p-1 hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
                title="收起侧边栏"
              >
                <ChevronLeftIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Node Library */}
        <div className={`flex-1 ${isCollapsed ? 'p-2' : 'p-3'} overflow-visible`}>
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <PlusIcon className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <Heading size="1" className="text-white">
                Add Nodes
              </Heading>
            </div>
          )}
          
          {/* 用原生 div 替代 ScrollArea，支持 overflow 可见 */}
          <div className="h-full overflow-y-auto overflow-x-visible">
            <div className={`${isCollapsed ? 'space-y-2 pt-2' : 'space-y-1 px-1 pt-1'}`}>
              {nodeTypes.map((nodeType) => {
                const IconComponent = nodeType.icon;
                return (
                  <Card 
                    key={nodeType.type}
                    className="group cursor-pointer relative transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:z-20 bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)] border-[var(--color-border-primary)] animate-fade-in"
                    onClick={() => onAddNode(nodeType.type, nodeType.label)}
                    title={isCollapsed ? nodeType.label : undefined}
                  >
                    {isCollapsed ? (
                      <div className="w-6 h-6 flex items-center justify-center mx-auto">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${nodeType.bgColor} ${nodeType.borderColor} ${nodeType.hoverBgColor} transition-colors border`}>
                          <IconComponent className={`w-3 h-3 ${nodeType.iconColor} ${nodeType.hoverIconColor} transition-all`} />
                        </div>
                      </div>
                    ) : (
                      <div className="px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${nodeType.bgColor} ${nodeType.borderColor} ${nodeType.hoverBgColor} transition-colors border`}>
                            <IconComponent className={`w-3 h-3 ${nodeType.iconColor} ${nodeType.hoverIconColor} transition-all`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Text size="1" weight="medium" className="text-white block truncate">
                              {nodeType.label}
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 可爱的小箭头按钮 - 与G字母同一水平线 */}
      {isCollapsed && (
        <button
          onClick={toggleCollapse}
          className="absolute top-[24px] left-[72px] hover:scale-125 transition-all duration-200 cursor-pointer z-10"
          title="展开侧边栏"
        >
          <ChevronRightIcon className="w-3 h-3 text-white/50 hover:text-white/80" />
        </button>
      )}
    </div>
  );
}; 