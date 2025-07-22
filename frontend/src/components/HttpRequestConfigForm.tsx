import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm, useFieldArray } from 'react-hook-form';
import { NodeData } from '../types';
import { ConfigFormBase, ConfigSection } from './common/ConfigFormBase';
import { 
  ConfigTextField, 
  ConfigTextAreaField,
  ConfigSelectField,
  ConfigDynamicListField 
} from './common/ConfigFormFields';
import { 
  GlobeIcon, 
  GearIcon, 
  LockClosedIcon,
  TimerIcon 
} from '@radix-ui/react-icons';
import { Flex } from '@radix-ui/themes';

interface HttpRequestConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  onNodeChange: (nodeUpdates: Partial<Node<NodeData>>) => void;
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

export const HttpRequestConfigForm: React.FC<HttpRequestConfigFormProps> = ({ 
  node, 
  onConfigChange, 
  onNodeChange,
  availableVariables 
}) => {
  const { control, register, setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      method: node.data.config?.method || 'GET',
      url: node.data.config?.url || '',
      output_name: node.data.config?.output_name || '',
      headersList: node.data.config?.headers ? 
        Object.entries(node.data.config.headers).map(([key, value]) => ({ key, value: String(value) })) : [],
      paramsList: node.data.config?.params ? 
        Object.entries(node.data.config.params).map(([key, value]) => ({ key, value: String(value) })) : [],
      timeout: node.data.config?.timeout || 30,
      max_retries: node.data.config?.max_retries || 3,
      retry_delay: node.data.config?.retry_delay || 1,
      response_type: node.data.config?.response_type || 'auto',
      user_agent: node.data.config?.user_agent || '',
    },
  });

  const { fields: headerFields, append: appendHeader, remove: removeHeader } = useFieldArray({
    control,
    name: 'headersList',
  });

  const { fields: paramFields, append: appendParam, remove: removeParam } = useFieldArray({
    control,
    name: 'paramsList',
  });

  useEffect(() => {
    const subscription = watch((data) => {
      const config = {
        method: data.method,
        url: data.url,
        output_name: data.output_name,
        headers: data.headersList?.reduce((acc: any, header) => {
          if (header?.key && header?.value) {
            acc[header.key] = header.value;
          }
          return acc;
        }, {}) || {},
        params: data.paramsList?.reduce((acc: any, param) => {
          if (param?.key && param?.value) {
            acc[param.key] = param.value;
          }
          return acc;
        }, {}) || {},
        timeout: data.timeout,
        max_retries: data.max_retries,
        retry_delay: data.retry_delay,
        response_type: data.response_type,
        user_agent: data.user_agent,
      };
      onConfigChange(config);
    });

    return () => subscription.unsubscribe();
  }, [watch, onConfigChange]);

  const handleVariableSelect = (field: keyof FormData, variable: string) => {
    const currentValue = watch(field) as string;
    const newValue = currentValue + `{{${variable}}}`;
    setValue(field, newValue);
  };

  const methodOptions = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'PATCH', label: 'PATCH' },
    { value: 'HEAD', label: 'HEAD' },
    { value: 'OPTIONS', label: 'OPTIONS' },
  ];

  const responseTypeOptions = [
    { value: 'auto', label: '自动检测' },
    { value: 'json', label: 'JSON' },
    { value: 'text', label: '纯文本' },
    { value: 'binary', label: '二进制' },
  ];

  return (
    <ConfigFormBase
      nodeLabel={node.data.label || 'HTTP Request'}
      nodeType="httpRequest"
      onNodeLabelChange={(label) => onNodeChange({ data: { ...node.data, label } })}
      availableVariables={availableVariables}
    >
      {/* Basic Configuration */}
      <ConfigSection
        title="基本配置"
        description="配置HTTP请求的基本参数"
        icon={<GlobeIcon />}
      >
        <ConfigSelectField
          label="请求方法"
          value={watch('method')}
          onChange={(value) => setValue('method', value)}
          options={methodOptions}
          required
          helpText="选择HTTP请求方法"
        />

        <ConfigTextField
          label="请求URL"
          value={watch('url')}
          onChange={(value) => setValue('url', value)}
          placeholder="https://api.example.com/endpoint"
          type="url"
          required
          showVariablePicker
          availableVariables={availableVariables}
          onVariableSelect={(variable) => handleVariableSelect('url', variable)}
          helpText="完整的请求URL地址"
        />

        <ConfigTextField
          label="输出变量名"
          value={watch('output_name')}
          onChange={(value) => setValue('output_name', value)}
          placeholder="http_response"
          helpText="用于存储响应数据的变量名（可选）"
        />
      </ConfigSection>

      {/* Headers */}
      <ConfigSection
        title="请求头"
        description="配置HTTP请求头信息"
        icon={<LockClosedIcon />}
        collapsible
        defaultExpanded={headerFields.length > 0}
      >
        <ConfigDynamicListField
          label="Headers"
          items={headerFields}
          onAdd={() => appendHeader({ key: '', value: '' })}
          onRemove={removeHeader}
          addButtonText="添加请求头"
          helpText="添加自定义HTTP请求头"
          renderItem={(field, index) => (
            <Flex gap="2">
              <ConfigTextField
                label=""
                value={field.key}
                onChange={(value) => setValue(`headersList.${index}.key`, value)}
                placeholder="Header Name"
              />
              <ConfigTextField
                label=""
                value={field.value}
                onChange={(value) => setValue(`headersList.${index}.value`, value)}
                placeholder="Header Value"
                showVariablePicker
                availableVariables={availableVariables}
                onVariableSelect={(variable) => {
                  const currentValue = watch(`headersList.${index}.value`);
                  setValue(`headersList.${index}.value`, currentValue + `{{${variable}}}`);
                }}
              />
            </Flex>
          )}
        />
      </ConfigSection>

      {/* Parameters */}
      <ConfigSection
        title="请求参数"
        description="配置URL查询参数或请求体参数"
        icon={<GearIcon />}
        collapsible
        defaultExpanded={paramFields.length > 0}
      >
        <ConfigDynamicListField
          label="Parameters"
          items={paramFields}
          onAdd={() => appendParam({ key: '', value: '' })}
          onRemove={removeParam}
          addButtonText="添加参数"
          helpText="添加URL参数或请求体参数"
          renderItem={(field, index) => (
            <Flex gap="2">
              <ConfigTextField
                label=""
                value={field.key}
                onChange={(value) => setValue(`paramsList.${index}.key`, value)}
                placeholder="Parameter Name"
              />
              <ConfigTextField
                label=""
                value={field.value}
                onChange={(value) => setValue(`paramsList.${index}.value`, value)}
                placeholder="Parameter Value"
                showVariablePicker
                availableVariables={availableVariables}
                onVariableSelect={(variable) => {
                  const currentValue = watch(`paramsList.${index}.value`);
                  setValue(`paramsList.${index}.value`, currentValue + `{{${variable}}}`);
                }}
              />
            </Flex>
          )}
        />
      </ConfigSection>

      {/* Advanced Settings */}
      <ConfigSection
        title="高级设置"
        description="配置超时、重试等高级选项"
        icon={<TimerIcon />}
        collapsible
        defaultExpanded={false}
      >
        <ConfigTextField
          label="超时时间 (秒)"
          value={String(watch('timeout'))}
          onChange={(value) => setValue('timeout', parseInt(value) || 30)}
          type="number"
          placeholder="30"
          helpText="请求超时时间，默认30秒"
        />

        <ConfigTextField
          label="最大重试次数"
          value={String(watch('max_retries'))}
          onChange={(value) => setValue('max_retries', parseInt(value) || 3)}
          type="number"
          placeholder="3"
          helpText="失败时的最大重试次数"
        />

        <ConfigTextField
          label="重试间隔 (秒)"
          value={String(watch('retry_delay'))}
          onChange={(value) => setValue('retry_delay', parseFloat(value) || 1)}
          type="number"
          placeholder="1"
          helpText="重试之间的等待时间"
        />

        <ConfigSelectField
          label="响应类型"
          value={watch('response_type')}
          onChange={(value) => setValue('response_type', value)}
          options={responseTypeOptions}
          helpText="指定如何处理响应内容"
        />

        <ConfigTextField
          label="User Agent"
          value={watch('user_agent')}
          onChange={(value) => setValue('user_agent', value)}
          placeholder="自定义用户代理字符串"
          helpText="自定义User-Agent请求头"
        />
      </ConfigSection>
    </ConfigFormBase>
  );
}; 