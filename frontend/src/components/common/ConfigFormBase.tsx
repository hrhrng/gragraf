import React, { ReactNode } from 'react';
import { Card, Heading, Text, Badge, Separator } from '@radix-ui/themes';
import { 
  PlayIcon, 
  ExitIcon, 
  GlobeIcon, 
  PersonIcon, 
  FileTextIcon, 
  BorderSplitIcon, 
  CheckCircledIcon, 
  QuestionMarkIcon,
  InfoCircledIcon
} from '@radix-ui/react-icons';

export interface ConfigSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface ConfigFormBaseProps {
  nodeLabel: string;
  nodeType: string;
  onNodeLabelChange: (label: string) => void;
  children: ReactNode;
  availableVariables?: string[];
  showVariables?: boolean;
}

// 统一的配置段落组件
export const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  description,
  icon,
  children,
  collapsible = false,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] transition-all duration-200 hover:border-[var(--color-accent)]/30">
      <div className="p-4">
        {/* Section Header */}
        <div 
          className={`flex items-center justify-between mb-3 ${collapsible ? 'cursor-pointer' : ''}`}
          onClick={toggleExpanded}
        >
          <div className="flex items-center gap-2">
            {icon && (
              <div className="w-5 h-5 text-[var(--color-text-primary)]">
                {icon}
              </div>
            )}
            <Heading size="3" className="text-[var(--color-text-primary)]">
              {title}
            </Heading>
          </div>
          {collapsible && (
            <InfoCircledIcon 
              className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          )}
        </div>

        {/* Section Description */}
        {description && (
          <Text size="1" className="text-[var(--color-text-secondary)] mb-3 block leading-relaxed">
            {description}
          </Text>
        )}

        {/* Section Content */}
        {(!collapsible || isExpanded) && (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    </Card>
  );
};

// 统一的配置表单容器
export const ConfigFormBase: React.FC<ConfigFormBaseProps> = ({
  nodeLabel,
  nodeType,
  onNodeLabelChange,
  children,
  availableVariables = [],
  showVariables = true
}) => {
  const [isEditingLabel, setIsEditingLabel] = React.useState(false);
  const [tempLabel, setTempLabel] = React.useState(nodeLabel);

  const getNodeTypeColor = (type: string): 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' => {
    const colorMap: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'> = {
      start: 'green',
      end: 'red',
      httpRequest: 'blue',
      agent: 'purple',
      knowledgeBase: 'blue',
      branch: 'yellow',
      humanInLoop: 'yellow',
    };
    return colorMap[type] || 'gray';
  };

  const getNodeTypeIcon = (type: string) => {
    // 返回节点类型对应的图标容器和图标组件
    const iconMap: Record<string, { 
      bgColor: string; 
      borderColor: string; 
      textColor: string; 
      icon: React.ComponentType<any>;
    }> = {
      start: { 
        bgColor: 'bg-green-900/20', 
        borderColor: 'border-green-700/30', 
        textColor: 'text-green-300',
        icon: PlayIcon
      },
      end: { 
        bgColor: 'bg-red-900/20', 
        borderColor: 'border-red-700/30', 
        textColor: 'text-red-300',
        icon: ExitIcon
      },
      httpRequest: { 
        bgColor: 'bg-teal-900/20', 
        borderColor: 'border-teal-700/30', 
        textColor: 'text-teal-300',
        icon: GlobeIcon
      },
      agent: { 
        bgColor: 'bg-indigo-900/20', 
        borderColor: 'border-indigo-700/30', 
        textColor: 'text-indigo-300',
        icon: PersonIcon
      },
      knowledgeBase: { 
        bgColor: 'bg-purple-900/20', 
        borderColor: 'border-purple-700/30', 
        textColor: 'text-purple-300',
        icon: FileTextIcon
      },
      branch: { 
        bgColor: 'bg-orange-900/20', 
        borderColor: 'border-orange-700/30', 
        textColor: 'text-orange-300',
        icon: BorderSplitIcon
      },
      humanInLoop: { 
        bgColor: 'bg-red-900/20', 
        borderColor: 'border-red-700/30', 
        textColor: 'text-red-300',
        icon: CheckCircledIcon
      },
    };
    return iconMap[type] || { 
      bgColor: 'bg-gray-700/20', 
      borderColor: 'border-gray-600/30', 
      textColor: 'text-gray-300',
      icon: QuestionMarkIcon
    };
  };

  const handleLabelSubmit = () => {
    if (tempLabel.trim()) {
      onNodeLabelChange(tempLabel.trim());
    } else {
      setTempLabel(nodeLabel);
    }
    setIsEditingLabel(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setTempLabel(nodeLabel);
      setIsEditingLabel(false);
    }
  };

  const nodeStyle = getNodeTypeIcon(nodeType);
  const IconComponent = nodeStyle.icon;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Simplified Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Node type icon */}
          <div className={`w-8 h-8 rounded flex items-center justify-center ${nodeStyle.bgColor} ${nodeStyle.borderColor} border`}>
            <IconComponent className={`w-4 h-4 ${nodeStyle.textColor}`} />
          </div>
          
          {/* Editable node label */}
          {isEditingLabel ? (
            <input
              type="text"
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              onBlur={handleLabelSubmit}
              onKeyDown={handleKeyPress}
              className="text-lg font-semibold bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] rounded px-2 py-1 focus:outline-none focus:border-[var(--color-accent)]"
              autoFocus
            />
          ) : (
            <Heading 
              size="4" 
              className="text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent)] transition-colors"
              onClick={() => setIsEditingLabel(true)}
            >
              {nodeLabel}
            </Heading>
          )}
          

        </div>
        
        {/* Available Variables */}
        {showVariables && availableVariables.length > 0 && (
          <div>
            <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
              Available Variables
            </Text>
            <div className="flex flex-wrap gap-1">
              {availableVariables.map((variable) => (
                <Badge key={variable} size="1" variant="soft" color="gray" className="max-w-xs">
                  <Text size="1" className="font-mono truncate overflow-hidden">{variable}</Text>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-[var(--color-border-primary)]" />

      {/* Form Content */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};