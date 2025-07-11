import { Node } from 'reactflow';
import { NodeData } from '../types';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { VariablePicker } from './VariablePicker';
import { Text, Heading, Badge, Button } from '@radix-ui/themes';
import { ChevronDownIcon, ChevronUpIcon, InfoCircledIcon } from '@radix-ui/react-icons';

interface KnowledgeBaseConfigFormProps {
  node: Node<NodeData>;
  onConfigChange: (config: any) => void;
  availableVariables: string[];
}

export const KnowledgeBaseConfigForm: React.FC<KnowledgeBaseConfigFormProps> = ({ node, onConfigChange, availableVariables }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      urls: node.data.config.urls?.join('\n') || '',
      documents: node.data.config.documents?.join('\n') || '',
      query: node.data.config.query || '',
      top_k: node.data.config.top_k || 4,
      output_name: node.data.config.output_name || '',
      chunk_size: node.data.config.chunk_size || 1000,
      chunk_overlap: node.data.config.chunk_overlap || 200,
    },
  });

  useEffect(() => {
    reset({
      urls: node.data.config.urls?.join('\n') || '',
      documents: node.data.config.documents?.join('\n') || '',
      query: node.data.config.query || '',
      top_k: node.data.config.top_k || 4,
      output_name: node.data.config.output_name || '',
      chunk_size: node.data.config.chunk_size || 1000,
      chunk_overlap: node.data.config.chunk_overlap || 200,
    });
  }, [node, reset]);

  const handleConfigChange = (data: any) => {
    onConfigChange({
      ...data,
      urls: data.urls.split('\n').filter((url: string) => url.trim()),
      documents: data.documents.split('\n').filter((doc: string) => doc.trim()),
      top_k: parseInt(data.top_k) || 4,
      chunk_size: parseInt(data.chunk_size) || 1000,
      chunk_overlap: parseInt(data.chunk_overlap) || 200,
    });
  };

  const handleBlur = () => {
    handleConfigChange(watch());
  };

  const handleVariableSelect = (variable: string, field: string) => {
    setValue(field as any, variable, { shouldDirty: true });
    setTimeout(() => handleConfigChange(watch()), 0);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Heading size="3" className="text-[var(--color-text-primary)]">
          知识库配置
        </Heading>
        
        <div className="space-y-4">
          {/* URLs 输入 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Text className="text-sm font-medium text-[var(--color-text-primary)]">
                文档URLs
              </Text>
              <Badge variant="soft" color="blue">
                新功能
              </Badge>
            </div>
            <Text className="text-xs text-[var(--color-text-secondary)] mb-2">
              每行一个URL，支持网页、PDF等格式
            </Text>
            <textarea
              {...register('urls')}
              onBlur={handleBlur}
              className="w-full p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white resize-vertical"
              placeholder="https://example.com/doc1.pdf&#10;https://example.com/page2.html"
              rows={4}
            />
          </div>

          {/* 文档内容输入 */}
          <div>
            <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              文档内容
            </Text>
            <Text className="text-xs text-[var(--color-text-secondary)] mb-2">
              每行一个文档内容，支持直接输入文本
            </Text>
            <textarea
              {...register('documents')}
              onBlur={handleBlur}
              className="w-full p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white resize-vertical"
              placeholder="文档内容1&#10;文档内容2"
              rows={4}
            />
          </div>

          {/* 查询输入 */}
          <div>
            <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              查询内容
            </Text>
            <div className="flex items-start gap-2">
              <input
                {...register('query')}
                onBlur={handleBlur}
                className="flex-1 p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
                placeholder="要检索的问题或关键词"
              />
              <VariablePicker 
                availableVariables={availableVariables} 
                onVariableSelect={(variable) => handleVariableSelect(variable, 'query')} 
              />
            </div>
          </div>

          {/* 召回数量 */}
          <div>
            <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              召回数量
            </Text>
            <input
              {...register('top_k')}
              onBlur={handleBlur}
              type="number"
              min="1"
              max="20"
              className="w-full p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
              placeholder="4"
            />
            <Text className="text-xs text-[var(--color-text-secondary)] mt-1">
              检索返回的文档数量 (1-20)
            </Text>
          </div>

          {/* 输出名称 */}
          <div>
            <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              输出名称 (可选)
            </Text>
            <input
              {...register('output_name')}
              onBlur={handleBlur}
              className="w-full p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
              placeholder="例如：retrieved_docs"
            />
          </div>
        </div>
      </div>

      {/* 高级配置 */}
      <div className="border-t border-[var(--color-border-primary)] pt-4">
        <Button
          type="button"
          variant="ghost"
          size="2"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          {showAdvanced ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          高级配置
        </Button>
        
        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 bg-[var(--color-bg-tertiary)] rounded-md border border-[var(--color-border-secondary)]">
            <div className="flex items-center gap-2 mb-3">
              <InfoCircledIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <Text className="text-sm text-[var(--color-text-secondary)]">
                文档分块配置，影响检索精度和速度
              </Text>
            </div>
            
            {/* 分块大小 */}
            <div>
              <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                分块大小
              </Text>
              <input
                {...register('chunk_size')}
                onBlur={handleBlur}
                type="number"
                min="100"
                max="4000"
                className="w-full p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
                placeholder="1000"
              />
              <Text className="text-xs text-[var(--color-text-secondary)] mt-1">
                每个文档块的字符数 (100-4000)
              </Text>
            </div>

            {/* 分块重叠 */}
            <div>
              <Text className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                分块重叠
              </Text>
              <input
                {...register('chunk_overlap')}
                onBlur={handleBlur}
                type="number"
                min="0"
                max="1000"
                className="w-full p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md text-white"
                placeholder="200"
              />
              <Text className="text-xs text-[var(--color-text-secondary)] mt-1">
                相邻文档块之间的重叠字符数 (0-1000)
              </Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 