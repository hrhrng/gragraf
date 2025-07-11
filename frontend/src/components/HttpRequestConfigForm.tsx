import React, { useState, useCallback, useMemo } from 'react';
import { Node } from 'reactflow';
import { NodeData } from '../types';
import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect } from 'react';
import { VariablePicker } from './VariablePicker';
import { 
  Text, 
  TextField, 
  Select, 
  Switch, 
  Button, 
  Card, 
  Flex, 
  Box,
  Badge,
  TextArea,
  Separator
} from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';

interface HttpRequestConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  availableVariables: string[];
}

interface HeaderOrParam {
  key: string;
  value: string;
}

interface FormData {
  method: string;
  url: string;
  output_name: string;
  headersList: HeaderOrParam[];
  paramsList: HeaderOrParam[];
  timeout: number;
  max_retries: number;
  retry_delay: number;
  response_type: string;
  user_agent: string;
}

type FormField = keyof FormData;

export const HttpRequestConfigForm: React.FC<HttpRequestConfigFormProps> = ({
  node,
  onConfigChange,
  availableVariables,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  const { register, control, watch, reset, setValue } = useForm<FormData>({
    defaultValues: {
      method: node.data.config.method || 'GET',
      url: node.data.config.url || '',
      output_name: node.data.config.output_name || '',
      headersList: node.data.config.headersList || [],
      paramsList: node.data.config.paramsList || [],
      timeout: node.data.config.timeout || 30,
      max_retries: node.data.config.max_retries || 3,
      retry_delay: node.data.config.retry_delay || 1,
      response_type: node.data.config.response_type || 'auto',
      user_agent: node.data.config.user_agent || '',
    },
  });

  const { fields: headersFields, append: appendHeader, remove: removeHeader } = useFieldArray({
    control,
    name: 'headersList',
  });

  const { fields: paramsFields, append: appendParam, remove: removeParam } = useFieldArray({
    control,
    name: 'paramsList',
  });

  useEffect(() => {
    reset({
      method: node.data.config.method || 'GET',
      url: node.data.config.url || '',
      output_name: node.data.config.output_name || '',
      headersList: node.data.config.headersList || [],
      paramsList: node.data.config.paramsList || [],
      timeout: node.data.config.timeout || 30,
      max_retries: node.data.config.max_retries || 3,
      retry_delay: node.data.config.retry_delay || 1,
      response_type: node.data.config.response_type || 'auto',
      user_agent: node.data.config.user_agent || '',
    });
  }, [node, reset]);

  // Debounced config update to reduce re-renders
  const debouncedConfigUpdate = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onConfigChange(watch());
      }, 300); // 300ms debounce
    };
  }, [onConfigChange, watch]);

  const handleConfigUpdate = useCallback(() => {
    debouncedConfigUpdate();
  }, [debouncedConfigUpdate]);

  const handleVariableSelect = useCallback((variable: string, field: FormField) => {
    const currentValue = watch(field) || '';
    setValue(field, `${currentValue} ${variable}`.trim(), { shouldDirty: true });
    handleConfigUpdate();
  }, [watch, setValue, handleConfigUpdate]);

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
        <div className="p-4 space-y-4">
          {/* Method Selection */}
          <div>
            <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              请求方法
            </Text>
            <Select.Root defaultValue={watch('method')} onValueChange={(value) => {
              setValue('method', value);
              handleConfigUpdate();
            }}>
              <Select.Trigger className="w-full" />
              <Select.Content>
                <Select.Item value="GET">GET</Select.Item>
                <Select.Item value="POST">POST</Select.Item>
                <Select.Item value="PUT">PUT</Select.Item>
                <Select.Item value="DELETE">DELETE</Select.Item>
                <Select.Item value="PATCH">PATCH</Select.Item>
                <Select.Item value="HEAD">HEAD</Select.Item>
                <Select.Item value="OPTIONS">OPTIONS</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          {/* URL Input */}
          <div>
            <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              请求URL
            </Text>
            <Flex gap="2">
              <TextField.Root className="flex-1">
                <TextField.Slot>
                                      <input
                      {...register('url')}
                      placeholder="https://api.example.com/data"
                      onBlur={handleConfigUpdate}
                      className="w-full p-2 bg-transparent text-white outline-none"
                    />
                </TextField.Slot>
              </TextField.Root>
              <VariablePicker
                availableVariables={availableVariables}
                onVariableSelect={(variable) => handleVariableSelect(variable, 'url')}
              />
            </Flex>
          </div>

          {/* Output Name */}
          <div>
            <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              输出变量名 (可选)
            </Text>
            <TextField.Root>
              <TextField.Slot>
                                  <input
                    {...register('output_name')}
                    placeholder="例如: api_response"
                    onBlur={handleConfigUpdate}
                    className="w-full p-2 bg-transparent text-white outline-none"
                  />
              </TextField.Slot>
            </TextField.Root>
          </div>
        </div>
      </Card>

      {/* Headers Configuration */}
      <Collapsible.Root open={showHeaders} onOpenChange={setShowHeaders}>
        <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
          <Collapsible.Trigger asChild>
            <div className="p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Text className="text-sm font-medium text-[var(--color-text-primary)]">
                  请求头
                </Text>
                {headersFields.length > 0 && (
                  <Badge size="1" variant="soft">
                    {headersFields.length}
                  </Badge>
                )}
              </div>
              {showHeaders ? (
                <ChevronDownIcon className="text-[var(--color-text-secondary)]" />
              ) : (
                <ChevronRightIcon className="text-[var(--color-text-secondary)]" />
              )}
            </div>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-4 pt-0 space-y-4">
              {headersFields.map((field, index) => (
                <div key={field.id}>
                  <Flex gap="2" align="center">
                    <TextField.Root className="flex-1">
                      <TextField.Slot>
                        <input
                          {...register(`headersList.${index}.key`)}
                          placeholder="Header名称"
                          onBlur={handleConfigUpdate}
                          className="w-full p-2 bg-transparent text-white outline-none"
                        />
                      </TextField.Slot>
                    </TextField.Root>
                    <TextField.Root className="flex-1">
                      <TextField.Slot>
                        <input
                          {...register(`headersList.${index}.value`)}
                          placeholder="Header值"
                          onBlur={handleConfigUpdate}
                          className="w-full p-2 bg-transparent text-white outline-none"
                        />
                      </TextField.Slot>
                    </TextField.Root>
                    <Button
                      variant="ghost"
                      color="red"
                      onClick={() => {
                        removeHeader(index);
                        handleConfigUpdate();
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </Flex>
                </div>
              ))}
              <Button
                variant="soft"
                onClick={() => {
                  appendHeader({ key: '', value: '' });
                  handleConfigUpdate();
                }}
              >
                <PlusIcon className="mr-2" />
                添加请求头
              </Button>
            </div>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>

      {/* URL Parameters Configuration */}
      <Collapsible.Root open={showParams} onOpenChange={setShowParams}>
        <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
          <Collapsible.Trigger asChild>
            <div className="p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Text className="text-sm font-medium text-[var(--color-text-primary)]">
                  URL参数
                </Text>
                {paramsFields.length > 0 && (
                  <Badge size="1" variant="soft">
                    {paramsFields.length}
                  </Badge>
                )}
              </div>
              {showParams ? (
                <ChevronDownIcon className="text-[var(--color-text-secondary)]" />
              ) : (
                <ChevronRightIcon className="text-[var(--color-text-secondary)]" />
              )}
            </div>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-4 pt-0 space-y-4">
              {paramsFields.map((field, index) => (
                <div key={field.id}>
                  <Flex gap="2" align="center">
                    <TextField.Root className="flex-1">
                      <TextField.Slot>
                        <input
                          {...register(`paramsList.${index}.key`)}
                          placeholder="参数名"
                          onBlur={handleConfigUpdate}
                          className="w-full p-2 bg-transparent text-white outline-none"
                        />
                      </TextField.Slot>
                    </TextField.Root>
                    <TextField.Root className="flex-1">
                      <TextField.Slot>
                        <input
                          {...register(`paramsList.${index}.value`)}
                          placeholder="参数值"
                          onBlur={handleConfigUpdate}
                          className="w-full p-2 bg-transparent text-white outline-none"
                        />
                      </TextField.Slot>
                    </TextField.Root>
                    <Button
                      variant="ghost"
                      color="red"
                      onClick={() => {
                        removeParam(index);
                        handleConfigUpdate();
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </Flex>
                </div>
              ))}
              <Button
                variant="soft"
                onClick={() => {
                  appendParam({ key: '', value: '' });
                  handleConfigUpdate();
                }}
              >
                <PlusIcon className="mr-2" />
                添加URL参数
              </Button>
            </div>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>

      {/* Advanced Configuration */}
      <Collapsible.Root open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
          <Collapsible.Trigger asChild>
            <div className="p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Text className="text-sm font-medium text-[var(--color-text-primary)]">
                  高级设置
                </Text>
                <Badge size="1" variant="soft" color="orange">
                  新功能
                </Badge>
              </div>
              {showAdvanced ? (
                <ChevronDownIcon className="text-[var(--color-text-secondary)]" />
              ) : (
                <ChevronRightIcon className="text-[var(--color-text-secondary)]" />
              )}
            </div>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-4 pt-0 space-y-6">
              {/* Timeout Setting */}
              <div>
                <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  超时时间 (秒)
                </Text>
                <TextField.Root>
                  <TextField.Slot>
                    <input
                      {...register('timeout', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      placeholder="30"
                      onBlur={handleConfigUpdate}
                      className="w-full p-2 bg-transparent text-white outline-none"
                    />
                  </TextField.Slot>
                </TextField.Root>
              </div>

              {/* Retry Configuration */}
              <Collapsible.Root open={showRetry} onOpenChange={setShowRetry}>
                <div>
                  <Collapsible.Trigger asChild>
                    <div className="flex items-center justify-between cursor-pointer mb-4">
                      <Text className="text-sm font-medium text-[var(--color-text-primary)]">
                        重试设置
                      </Text>
                      {showRetry ? (
                        <ChevronDownIcon className="text-[var(--color-text-secondary)]" />
                      ) : (
                        <ChevronRightIcon className="text-[var(--color-text-secondary)]" />
                      )}
                    </div>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <div className="space-y-4">
                      <div>
                        <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                          最大重试次数
                        </Text>
                        <TextField.Root>
                          <TextField.Slot>
                            <input
                              {...register('max_retries', { valueAsNumber: true })}
                              type="number"
                              min="0"
                              placeholder="3"
                              onBlur={handleConfigUpdate}
                              className="w-full p-2 bg-transparent text-white outline-none"
                            />
                          </TextField.Slot>
                        </TextField.Root>
                      </div>
                      <div>
                        <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                          重试间隔 (秒)
                        </Text>
                        <TextField.Root>
                          <TextField.Slot>
                            <input
                              {...register('retry_delay', { valueAsNumber: true })}
                              type="number"
                              min="0.1"
                              step="0.1"
                              placeholder="1"
                              onBlur={handleConfigUpdate}
                              className="w-full p-2 bg-transparent text-white outline-none"
                            />
                          </TextField.Slot>
                        </TextField.Root>
                      </div>
                    </div>
                  </Collapsible.Content>
                </div>
              </Collapsible.Root>

              <Separator />

              {/* Response Type */}
              <div>
                <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  响应类型
                </Text>
                <Select.Root defaultValue={watch('response_type')} onValueChange={(value) => {
                  setValue('response_type', value);
                  handleConfigUpdate();
                }}>
                  <Select.Trigger className="w-full" />
                  <Select.Content>
                    <Select.Item value="auto">自动检测</Select.Item>
                    <Select.Item value="json">JSON</Select.Item>
                    <Select.Item value="text">纯文本</Select.Item>
                    <Select.Item value="binary">二进制</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>

              {/* User Agent */}
              <div>
                <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  User Agent
                </Text>
                <TextField.Root>
                  <TextField.Slot>
                    <input
                      {...register('user_agent')}
                      placeholder="自定义用户代理字符串"
                      onBlur={handleConfigUpdate}
                      className="w-full p-2 bg-transparent text-white outline-none"
                    />
                  </TextField.Slot>
                </TextField.Root>
              </div>
            </div>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>
    </div>
  );
}; 