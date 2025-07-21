import React, { ReactNode } from 'react';
import { Card, Text, Heading, Badge, Separator } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';

export interface ConfigSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: {
    text: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  };
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface ConfigFormBaseProps {
  title: string;
  nodeType: string;
  children: ReactNode;
  availableVariables?: string[];
  showVariables?: boolean;
}

// 统一的配置段落组件
export const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  description,
  icon,
  badge,
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
            {badge && (
              <Badge size="1" variant="soft" color={badge.color || 'blue'}>
                <Text size="1">{badge.text}</Text>
              </Badge>
            )}
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
  title,
  nodeType,
  children,
  availableVariables = [],
  showVariables = true
}) => {
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Form Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Heading size="4" className="text-[var(--color-text-primary)]">
            {title}
          </Heading>
          <Badge size="2" variant="soft" color={getNodeTypeColor(nodeType)}>
            <Text size="1" weight="medium">{nodeType}</Text>
          </Badge>
        </div>
        
        {/* Available Variables */}
        {showVariables && availableVariables.length > 0 && (
          <div>
            <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
              Available Variables
            </Text>
            <div className="flex flex-wrap gap-1">
              {availableVariables.map((variable) => (
                <Badge key={variable} size="1" variant="soft" color="gray">
                  <Text size="1" className="font-mono">{variable}</Text>
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