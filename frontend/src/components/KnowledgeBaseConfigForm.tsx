import React, { useEffect } from 'react';
import { Node } from 'reactflow';
import { useForm } from 'react-hook-form';
import { NodeData } from '../types';
import { ConfigFormBase, ConfigSection } from './common/ConfigFormBase';
import { 
  ConfigTextField, 
  ConfigTextAreaField
} from './common/ConfigFormFields';
import { 
  FileTextIcon, 
  GlobeIcon, 
  MagnifyingGlassIcon,
  GearIcon
} from '@radix-ui/react-icons';
import { Text } from '@radix-ui/themes';

interface KnowledgeBaseConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  availableVariables: string[];
}

interface FormData {
  urls: string;
  documents: string;
  query: string;
  top_k: number;
  output_name: string;
  chunk_size: number;
  chunk_overlap: number;
}

export const KnowledgeBaseConfigForm: React.FC<KnowledgeBaseConfigFormProps> = ({ 
  node, 
  onConfigChange, 
  availableVariables 
}) => {
  const { setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      urls: node.data.config?.urls?.join('\n') || '',
      documents: node.data.config?.documents?.join('\n') || '',
      query: node.data.config?.query || '',
      top_k: node.data.config?.top_k || 4,
      output_name: node.data.config?.output_name || '',
      chunk_size: node.data.config?.chunk_size || 1000,
      chunk_overlap: node.data.config?.chunk_overlap || 200,
    },
  });

  useEffect(() => {
    reset({
      urls: node.data.config?.urls?.join('\n') || '',
      documents: node.data.config?.documents?.join('\n') || '',
      query: node.data.config?.query || '',
      top_k: node.data.config?.top_k || 4,
      output_name: node.data.config?.output_name || '',
      chunk_size: node.data.config?.chunk_size || 1000,
      chunk_overlap: node.data.config?.chunk_overlap || 200,
    });
  }, [node, reset]);

  useEffect(() => {
    const subscription = watch((data) => {
      const config = {
        urls: data.urls ? data.urls.split('\n').filter((url: string) => url.trim()) : [],
        documents: data.documents ? data.documents.split('\n').filter((doc: string) => doc.trim()) : [],
        query: data.query,
        top_k: data.top_k,
        output_name: data.output_name,
        chunk_size: data.chunk_size,
        chunk_overlap: data.chunk_overlap,
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

  const urlCount = watch('urls') ? watch('urls').split('\n').filter(url => url.trim()).length : 0;
  const documentCount = watch('documents') ? watch('documents').split('\n').filter(doc => doc.trim()).length : 0;

  return (
    <ConfigFormBase
      title="Knowledge Base Configuration"
      nodeType="knowledgeBase"
      availableVariables={availableVariables}
    >
      {/* Data Sources */}
      <ConfigSection
        title="数据源"
        description="配置知识库的数据来源"
        icon={<GlobeIcon />}
        badge={{ text: `${urlCount + documentCount} 个源`, color: 'cyan' }}
      >
        <ConfigTextAreaField
          label="文档URLs"
          value={watch('urls')}
          onChange={(value) => setValue('urls', value)}
          placeholder="https://example.com/doc1.pdf&#10;https://example.com/doc2.txt&#10;一行一个URL"
          rows={4}
          helpText={`支持在线文档链接，每行一个URL。当前：${urlCount} 个URL`}
        />

        <ConfigTextAreaField
          label="文档内容"
          value={watch('documents')}
          onChange={(value) => setValue('documents', value)}
          placeholder="文档1内容...&#10;---&#10;文档2内容...&#10;使用 --- 分隔不同文档"
          rows={6}
          helpText={`直接输入文档内容，使用 --- 分隔不同文档。当前：${documentCount} 个文档`}
        />
      </ConfigSection>

      {/* Query Configuration */}
      <ConfigSection
        title="查询配置"
        description="配置知识库查询参数"
        icon={<MagnifyingGlassIcon />}
      >
        <ConfigTextField
          label="查询内容"
          value={watch('query')}
          onChange={(value) => setValue('query', value)}
          placeholder="请输入查询问题或关键词"
          required
          showVariablePicker
          availableVariables={availableVariables}
          onVariableSelect={(variable) => handleVariableSelect('query', variable)}
          helpText="要在知识库中搜索的问题或关键词"
        />

        <ConfigTextField
          label="返回结果数量"
          value={String(watch('top_k'))}
          onChange={(value) => setValue('top_k', parseInt(value) || 4)}
          type="number"
          placeholder="4"
          helpText="返回最相关的文档片段数量（1-20）"
        />

        <ConfigTextField
          label="输出变量名"
          value={watch('output_name')}
          onChange={(value) => setValue('output_name', value)}
          placeholder="kb_results"
          helpText="用于存储知识库查询结果的变量名（可选）"
        />
      </ConfigSection>

      {/* Advanced Settings */}
      <ConfigSection
        title="高级设置"
        description="文档处理和索引相关配置"
        icon={<GearIcon />}
        collapsible
        defaultExpanded={false}
      >
        <ConfigTextField
          label="文档块大小"
          value={String(watch('chunk_size'))}
          onChange={(value) => setValue('chunk_size', parseInt(value) || 1000)}
          type="number"
          placeholder="1000"
          helpText="将文档分割成块的大小（字符数）"
        />

        <ConfigTextField
          label="块重叠大小"
          value={String(watch('chunk_overlap'))}
          onChange={(value) => setValue('chunk_overlap', parseInt(value) || 200)}
          type="number"
          placeholder="200"
          helpText="相邻文档块之间的重叠字符数"
        />

        <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
          <Text size="2" weight="medium" className="text-[var(--color-text-primary)] mb-2 block">
            配置说明
          </Text>
          <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <div>• <strong>文档块大小</strong>：控制每个文档片段的长度，影响搜索精度和响应速度</div>
            <div>• <strong>块重叠大小</strong>：确保重要信息不会在分割边界丢失</div>
            <div>• <strong>建议比例</strong>：重叠大小约为块大小的 10-20%</div>
          </div>
        </div>
      </ConfigSection>

      {/* Usage Statistics */}
      <ConfigSection
        title="使用统计"
        description="当前配置的数据源统计信息"
        icon={<FileTextIcon />}
        collapsible
        defaultExpanded={false}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-center">
            <Text size="3" weight="bold" className="text-cyan-400 block">{urlCount}</Text>
            <Text size="1" className="text-[var(--color-text-secondary)]">在线文档</Text>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-center">
            <Text size="3" weight="bold" className="text-cyan-400 block">{documentCount}</Text>
            <Text size="1" className="text-[var(--color-text-secondary)]">本地文档</Text>
          </div>
        </div>

        <div className="space-y-2">
          <Text size="2" weight="medium" className="text-[var(--color-text-primary)]">
            预估处理信息
          </Text>
          <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <div>• 预估文档块数量：约 {Math.ceil((urlCount + documentCount) * 2000 / watch('chunk_size'))} 个</div>
            <div>• 索引构建时间：约 {Math.ceil((urlCount + documentCount) * 0.5)} 秒</div>
            <div>• 返回结果数量：{watch('top_k')} 个最相关片段</div>
          </div>
        </div>
      </ConfigSection>
    </ConfigFormBase>
  );
}; 