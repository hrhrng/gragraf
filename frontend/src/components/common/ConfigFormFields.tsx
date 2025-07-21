import React, { ReactNode } from 'react';
import { Text, TextField, TextArea, Select, Switch, Button, Badge, Flex } from '@radix-ui/themes';
import { PlusIcon, Cross2Icon, ChevronDownIcon } from '@radix-ui/react-icons';
import { VariablePicker } from '../VariablePicker';

export interface FormFieldBaseProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: ReactNode;
}

export interface TextFieldProps extends Omit<FormFieldBaseProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'url' | 'password';
  showVariablePicker?: boolean;
  availableVariables?: string[];
  onVariableSelect?: (variable: string) => void;
}

export interface TextAreaFieldProps extends Omit<FormFieldBaseProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  showVariablePicker?: boolean;
  availableVariables?: string[];
  onVariableSelect?: (variable: string) => void;
}

export interface SelectFieldProps extends Omit<FormFieldBaseProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export interface SwitchFieldProps extends Omit<FormFieldBaseProps, 'children'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface DynamicListFieldProps extends Omit<FormFieldBaseProps, 'children'> {
  items: any[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  addButtonText?: string;
  minItems?: number;
  maxItems?: number;
  renderItem: (item: any, index: number) => ReactNode;
}

// 基础字段包装器
export const FormFieldBase: React.FC<FormFieldBaseProps> = ({
  label,
  description,
  required = false,
  error,
  helpText,
  children
}) => {
  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Text size="2" weight="medium" className="text-[var(--color-text-primary)]">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Text>
        {description && (
          <Text size="1" className="text-[var(--color-text-secondary)]">
            {description}
          </Text>
        )}
      </div>

      {/* Field */}
      <div className="space-y-1">
        {children}
        
        {/* Help Text */}
        {helpText && !error && (
          <Text size="1" className="text-[var(--color-text-secondary)]">
            {helpText}
          </Text>
        )}
        
        {/* Error */}
        {error && (
          <Text size="1" className="text-red-400">
            {error}
          </Text>
        )}
      </div>
    </div>
  );
};

// 文本输入字段
export const ConfigTextField: React.FC<TextFieldProps> = ({
  label,
  description,
  required,
  error,
  helpText,
  value,
  onChange,
  placeholder,
  type = 'text',
  showVariablePicker,
  availableVariables = [],
  onVariableSelect
}) => {
  return (
    <FormFieldBase
      label={label}
      description={description}
      required={required}
      error={error}
      helpText={helpText}
    >
      <div className="space-y-2">
        {showVariablePicker && availableVariables.length > 0 && onVariableSelect && (
          <div className="flex justify-end">
            <VariablePicker
              availableVariables={availableVariables}
              onVariableSelect={onVariableSelect}
            />
          </div>
        )}
        <TextField.Root
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full"
        >
          <TextField.Slot>
            <input
              type={type}
              className="w-full p-2 bg-transparent text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </TextField.Slot>
        </TextField.Root>
      </div>
    </FormFieldBase>
  );
};

// 文本域字段
export const ConfigTextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  description,
  required,
  error,
  helpText,
  value,
  onChange,
  placeholder,
  rows = 3,
  showVariablePicker,
  availableVariables = [],
  onVariableSelect
}) => {
  return (
    <FormFieldBase
      label={label}
      description={description}
      required={required}
      error={error}
      helpText={helpText}
    >
      <div className="space-y-2">
        {showVariablePicker && availableVariables.length > 0 && onVariableSelect && (
          <div className="flex justify-end">
            <VariablePicker
              availableVariables={availableVariables}
              onVariableSelect={onVariableSelect}
            />
          </div>
        )}
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] resize-vertical"
        />
      </div>
    </FormFieldBase>
  );
};

// 选择字段
export const ConfigSelectField: React.FC<SelectFieldProps> = ({
  label,
  description,
  required,
  error,
  helpText,
  value,
  onChange,
  options,
  placeholder
}) => {
  return (
    <FormFieldBase
      label={label}
      description={description}
      required={required}
      error={error}
      helpText={helpText}
    >
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger 
          className="w-full"
          placeholder={placeholder}
        >
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {options.map((option) => (
            <Select.Item 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </FormFieldBase>
  );
};

// 开关字段
export const ConfigSwitchField: React.FC<SwitchFieldProps> = ({
  label,
  description,
  required,
  error,
  helpText,
  checked,
  onChange
}) => {
  return (
    <FormFieldBase
      label={label}
      description={description}
      required={required}
      error={error}
      helpText={helpText}
    >
      <Flex align="center" gap="2">
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          size="2"
        />
        <Text size="1" className={checked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}>
          {checked ? 'Enabled' : 'Disabled'}
        </Text>
      </Flex>
    </FormFieldBase>
  );
};

// 动态列表字段
export const ConfigDynamicListField: React.FC<DynamicListFieldProps> = ({
  label,
  description,
  required,
  error,
  helpText,
  items,
  onAdd,
  onRemove,
  addButtonText = 'Add Item',
  minItems = 0,
  maxItems,
  renderItem
}) => {
  const canRemove = items.length > minItems;
  const canAdd = !maxItems || items.length < maxItems;

  return (
    <FormFieldBase
      label={label}
      description={description}
      required={required}
      error={error}
      helpText={helpText}
    >
      <div className="space-y-3">
        {/* Items */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                {renderItem(item, index)}
              </div>
              {canRemove && (
                <Button
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => onRemove(index)}
                  className="mt-1"
                >
                  <Cross2Icon width="12" height="12" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add Button */}
        {canAdd && (
          <Button
            size="2"
            variant="soft"
            onClick={onAdd}
            className="w-full"
          >
            <PlusIcon width="14" height="14" />
            {addButtonText}
          </Button>
        )}

        {/* Count Info */}
        <div className="flex justify-between items-center">
          <Text size="1" className="text-[var(--color-text-secondary)]">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Text>
          {maxItems && (
            <Text size="1" className="text-[var(--color-text-secondary)]">
              Max: {maxItems}
            </Text>
          )}
        </div>
      </div>
    </FormFieldBase>
  );
};