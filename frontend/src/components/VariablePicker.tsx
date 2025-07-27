import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { 
  Button, 
  Card, 
  Text, 
  ScrollArea, 
  Badge,
  Flex,
  TextField,
  Separator
} from '@radix-ui/themes';
import { 
  CaretDownIcon, 
  MagnifyingGlassIcon,
  CodeIcon,
  InfoCircledIcon
} from '@radix-ui/react-icons';

interface VariablePickerProps {
  // A list of available variable names, e.g., ["node_1.output", "http_2.data"]
  availableVariables: string[];
  // Callback function to call when a variable is selected
  onVariableSelect: (variable: string) => void;
  showMappingHelper?: boolean;
  placeholder?: string;
}

export const VariablePicker: React.FC<VariablePickerProps> = ({ 
  availableVariables, 
  onVariableSelect,
  showMappingHelper = false,
  placeholder = "Insert Variable"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter variables based on search term
  const filteredVariables = availableVariables.filter(variable =>
    variable.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simple variable list without categorization

  const handleVariableClick = (variable: string) => {
    onVariableSelect(`{{${variable}}}`);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleMappingHelperClick = (variable: string) => {
    // For mapping, don't include the {{}} brackets
    onVariableSelect(variable);
    setIsOpen(false);
    setSearchTerm('');
  };

  const renderVariableList = (variables: string[], title?: string) => (
    <div className="space-y-2">
      {title && (
        <div className="px-2">
          <Text size="1" weight="medium" className="text-[var(--color-text-secondary)] uppercase tracking-wide">
            {title}
          </Text>
        </div>
      )}
      <div className="space-y-1">
        {variables.map((variable) => (
          <div key={variable} className="group">
            <button
              className="w-full text-left p-2 hover:bg-[var(--color-bg-tertiary)] rounded-md cursor-pointer transition-colors border-0 bg-transparent"
              onClick={() => showMappingHelper ? handleMappingHelperClick(variable) : handleVariableClick(variable)}
            >
              <Flex justify="between" align="center">
                <Flex align="center" gap="2" className="min-w-0 flex-1">
                  <CodeIcon className="w-3 h-3 text-[var(--color-text-secondary)] flex-shrink-0" />
                  <Text size="2" className="text-white font-mono truncate overflow-hidden">
                    {variable}
                  </Text>
                </Flex>
                {showMappingHelper && (
                  <Badge size="1" variant="soft" color="blue" className="flex-shrink-0">
                    Map
                  </Badge>
                )}
              </Flex>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button 
          variant="ghost" 
          size="2" 
          className="text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-bg-tertiary)]"
        >
          <CaretDownIcon className="w-3 h-3 mr-1" />
          {placeholder}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="w-80 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg shadow-lg z-50"
          align="end"
          sideOffset={5}
        >
          <Card className="bg-transparent border-0">
            <div className="p-4 space-y-4">
              {/* Header */}
              <Flex justify="between" align="center">
                <Text size="2" weight="medium" className="text-white">
                  {showMappingHelper ? 'Select Variable to Map' : 'Insert Variable'}
                </Text>
                {showMappingHelper && (
                  <Badge size="1" variant="soft" color="violet">
                    Mapping Mode
                  </Badge>
                )}
              </Flex>

              {/* Search */}
              {availableVariables.length > 5 && (
                <div>
                  <TextField.Root
                    placeholder="Search variables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-white"
                  >
                    <TextField.Slot>
                      <MagnifyingGlassIcon className="w-3 h-3 text-[var(--color-text-secondary)]" />
                    </TextField.Slot>
                  </TextField.Root>
                </div>
              )}

              {/* Variable List */}
              <ScrollArea className="max-h-64">
                {filteredVariables.length > 0 ? (
                  <div className="space-y-4">
                    {renderVariableList(filteredVariables)}
                  </div>
                ) : searchTerm ? (
                  <div className="p-4 text-center">
                    <Text size="2" className="text-[var(--color-text-secondary)]">
                      No variables match "{searchTerm}"
                    </Text>
                  </div>
                ) : (
                  <div className="p-4 text-center space-y-2">
                    <InfoCircledIcon className="w-6 h-6 mx-auto text-[var(--color-text-secondary)] opacity-50" />
                    <Text size="2" className="text-[var(--color-text-secondary)]">
                      No variables available
                    </Text>
                    <Text size="1" className="text-[var(--color-text-secondary)]">
                      Connect nodes to make variables available
                    </Text>
                  </div>
                )}
              </ScrollArea>

              {/* Helper Text */}
              {!showMappingHelper && filteredVariables.length > 0 && (
                <div className="pt-2 border-t border-[var(--color-border-primary)]">
                  <Text size="1" className="text-[var(--color-text-secondary)]">
                    💡 Variables will be inserted as Jinja2 templates (e.g., {`{{variable_name}}`})
                  </Text>
                </div>
              )}

              {showMappingHelper && filteredVariables.length > 0 && (
                <div className="pt-2 border-t border-[var(--color-border-primary)]">
                  <Text size="1" className="text-[var(--color-text-secondary)]">
                    🔗 Select a variable to map it to a prompt placeholder
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}; 