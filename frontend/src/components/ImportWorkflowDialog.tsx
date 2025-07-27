import React, { useState, useCallback } from 'react';
import { Dialog, Flex, Text, Button, Card, Badge, Separator, Tabs, TextArea } from '@radix-ui/themes';
import { UploadIcon, FileTextIcon, CheckCircledIcon, CrossCircledIcon, ExclamationTriangleIcon, ClipboardIcon } from '@radix-ui/react-icons';
import { Node, Edge } from 'reactflow';
import { NodeData } from '../types';

interface ImportWorkflowData {
  name: string;
  description?: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
}

interface ImportWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImportWorkflowData) => void;
  existingWorkflows: { name: string }[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: ImportWorkflowData;
}

export const ImportWorkflowDialog: React.FC<ImportWorkflowDialogProps> = ({
  open,
  onOpenChange,
  onImport,
  existingWorkflows
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [clipboardText, setClipboardText] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('file');

  const validateJSON = (jsonText: string): ValidationResult => {
    const errors: string[] = [];
    
    try {
      const data = JSON.parse(jsonText);
      
      // 检查必要字段
      if (!data.name || typeof data.name !== 'string') {
        errors.push('缺少工作流名称或名称格式不正确');
      }
      
      if (!data.nodes || !Array.isArray(data.nodes)) {
        errors.push('缺少节点数据或节点数据格式不正确');
      }
      
      if (!data.edges || !Array.isArray(data.edges)) {
        errors.push('缺少边数据或边数据格式不正确');
      }
      
      // 检查节点数据
      if (data.nodes && Array.isArray(data.nodes)) {
        data.nodes.forEach((node: any, index: number) => {
          if (!node.id || !node.type || !node.position) {
            errors.push(`节点 ${index + 1} 缺少必要字段 (id, type, position)`);
          }
          if (!node.data) {
            errors.push(`节点 ${index + 1} 缺少 data 字段`);
          }
        });
      }
      
      // 检查边数据
      if (data.edges && Array.isArray(data.edges)) {
        data.edges.forEach((edge: any, index: number) => {
          if (!edge.id || !edge.source || !edge.target) {
            errors.push(`边 ${index + 1} 缺少必要字段 (id, source, target)`);
          }
        });
      }
      
      if (errors.length === 0) {
        return { isValid: true, errors: [], data };
      } else {
        return { isValid: false, errors, data };
      }
    } catch (error) {
      return { isValid: false, errors: ['JSON 格式错误：' + (error as Error).message] };
    }
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setValidationResult(null);
    
    if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
      setValidationResult({
        isValid: false,
        errors: ['请选择有效的 JSON 文件']
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = validateJSON(text);
      setValidationResult(result);
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleClipboardTextChange = useCallback((text: string) => {
    setClipboardText(text);
    if (text.trim()) {
      const result = validateJSON(text);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, []);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
      if (text.trim()) {
        const result = validateJSON(text);
        setValidationResult(result);
      }
    } catch (error) {
      console.error('读取剪贴板失败:', error);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleImport = useCallback(() => {
    if (validationResult?.isValid && validationResult.data) {
      setIsLoading(true);
      try {
        onImport(validationResult.data);
        onOpenChange(false);
        setFile(null);
        setClipboardText('');
        setValidationResult(null);
      } catch (error) {
        console.error('导入失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [validationResult, onImport, onOpenChange]);

  const isDuplicateName = validationResult?.data?.name && 
    existingWorkflows.some(w => w.name === validationResult.data!.name);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="w-[600px] max-h-[80vh] overflow-y-auto">
        <Dialog.Title className="flex items-center gap-2">
          <UploadIcon className="w-4 h-4" />
          导入工作流
        </Dialog.Title>
        
        <div className="space-y-4">
          {/* Tabs for import methods */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List className="w-full">
              <Tabs.Trigger value="file" className="flex-1 flex items-center gap-2 justify-center">
                <FileTextIcon className="w-4 h-4" />
                从文件导入
              </Tabs.Trigger>
              <Tabs.Trigger value="clipboard" className="flex-1 flex items-center gap-2 justify-center">
                <ClipboardIcon className="w-4 h-4" />
                从剪贴板导入
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="file" className="mt-4">
              {/* 文件上传区域 */}
              <Card className="p-4">
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
                    ${dragActive 
                      ? 'border-blue-400 bg-blue-50/10' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                    ${file ? 'border-green-400 bg-green-50/10' : ''}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <UploadIcon className="w-8 h-8 mx-auto text-gray-400" />
                      <Text className="block">
                        {file ? file.name : '拖拽 JSON 文件到此处或点击选择文件'}
                      </Text>
                      <Text size="1" className="text-gray-500">
                        支持 .json 格式的工作流文件
                      </Text>
                    </div>
                  </label>
                </div>
              </Card>
            </Tabs.Content>

            <Tabs.Content value="clipboard" className="mt-4">
              {/* 剪贴板输入区域 */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Text weight="medium">粘贴 JSON 内容</Text>
                    <Button
                      variant="soft"
                      size="1"
                      onClick={handlePasteFromClipboard}
                      className="flex items-center gap-1"
                    >
                      <ClipboardIcon className="w-3 h-3" />
                      从剪贴板粘贴
                    </Button>
                  </div>
                  <TextArea
                    value={clipboardText}
                    onChange={(e) => handleClipboardTextChange(e.target.value)}
                    placeholder="在此粘贴工作流的 JSON 内容..."
                    className="min-h-[200px] bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] text-white placeholder:text-[var(--color-text-secondary)]"
                  />
                  <Text size="1" className="text-gray-500">
                    请粘贴完整的工作流 JSON 内容
                  </Text>
                </div>
              </Card>
            </Tabs.Content>
          </Tabs.Root>

          {/* 验证结果 */}
          {validationResult && (
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircledIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <CrossCircledIcon className="w-4 h-4 text-red-500" />
                  )}
                  <Text weight="medium">
                    {validationResult.isValid ? '内容验证通过' : '内容验证失败'}
                  </Text>
                </div>
                
                {validationResult.errors.length > 0 && (
                  <div className="space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <Text key={index} size="2" className="text-red-500 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3 h-3" />
                        {error}
                      </Text>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 导入预览 */}
          {validationResult?.isValid && validationResult.data && (
            <Card className="p-4">
              <Text weight="medium" className="mb-3 block">导入预览</Text>
              
              <div className="space-y-3">
                <div>
                  <Text size="2" className="text-gray-500">工作流名称</Text>
                  <Text className="flex items-center gap-2">
                    {validationResult.data.name}
                    {isDuplicateName && (
                      <Badge color="orange" variant="soft">已存在同名工作流</Badge>
                    )}
                  </Text>
                </div>
                
                {validationResult.data.description && (
                  <div>
                    <Text size="2" className="text-gray-500">描述</Text>
                    <Text>{validationResult.data.description}</Text>
                  </div>
                )}
                
                <div className="flex gap-4">
                  <div>
                    <Text size="2" className="text-gray-500">节点数量</Text>
                    <Text>{validationResult.data.nodes.length}</Text>
                  </div>
                  <div>
                    <Text size="2" className="text-gray-500">连接数量</Text>
                    <Text>{validationResult.data.edges.length}</Text>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Text size="2" className="text-gray-500 mb-2 block">节点列表</Text>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {validationResult.data.nodes.map((node) => (
                      <div key={node.id} className="flex items-center gap-2 text-sm">
                        <Badge variant="soft" color="blue">{node.type}</Badge>
                        <Text className="truncate">{node.data?.label || node.id}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              取消
            </Button>
          </Dialog.Close>
          
          <Button
            onClick={handleImport}
            disabled={!validationResult?.isValid || isLoading}
            className="min-w-[80px]"
          >
            {isLoading ? '导入中...' : '导入'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}; 