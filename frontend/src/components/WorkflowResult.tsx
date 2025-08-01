import React, { useState } from 'react';
import { Card, Text, Badge, ScrollArea, Button, Box, Flex, Heading } from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';
import { 
  CheckCircledIcon, 
  CrossCircledIcon, 
  ClockIcon, 
  InfoCircledIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ReloadIcon,
  CopyIcon,
  FileTextIcon,
  GearIcon
} from '@radix-ui/react-icons';

interface NodeExecutionResult {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  duration?: number;
  result?: any;
  error?: string;
  logs?: string[];
}

interface WorkflowExecutionResult {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'waiting_for_approval';
  startTime?: string;
  endTime?: string;
  duration?: number;
  nodes: NodeExecutionResult[];
  finalResult?: any;
  error?: string;
  totalNodes: number;
  completedNodes: number;
}

interface WorkflowResultProps {
  result: WorkflowExecutionResult | null;
  isLoading: boolean;
  onRetry?: () => void;
}

const formatDuration = (duration: number): string => {
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const NodeStatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed':
      return <CheckCircledIcon className="w-4 h-4 text-green-400" />;
    case 'failed':
      return <CrossCircledIcon className="w-4 h-4 text-red-400" />;
    case 'running':
      return <ReloadIcon className="w-4 h-4 text-blue-400 animate-spin" />;
    default:
      return <ClockIcon className="w-4 h-4 text-gray-400" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    idle: { color: 'gray', label: '待运行' },
    running: { color: 'blue', label: '运行中' },
    completed: { color: 'green', label: '完成' },
    failed: { color: 'red', label: '失败' },
    pending: { color: 'gray', label: '等待中' },
    waiting_for_approval: { color: 'orange', label: '等待审批' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle;
  
  return (
    <Badge size="1" color={config.color as any} variant="soft">
      <Text size="1">{config.label}</Text>
    </Badge>
  );
};

const JsonViewer = ({ data, title }: { data: any; title: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <Collapsible.Trigger asChild>
        <Button variant="ghost" size="1" className="w-full justify-between">
          <Flex align="center" gap="2">
            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
            <Text size="2">{title}</Text>
          </Flex>
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Box className="mt-2 relative">
          <Button
            size="1"
            variant="ghost"
            className="absolute top-2 right-2 z-10"
            onClick={handleCopy}
          >
            <CopyIcon />
            {copied ? '已复制' : '复制'}
          </Button>
          <ScrollArea className="max-h-48">
            <pre className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap font-mono p-3 bg-[var(--color-bg-tertiary)] rounded-md pr-16">
              {JSON.stringify(data, null, 2)}
            </pre>
          </ScrollArea>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

// 新增：美化 map 展示的组件，支持嵌套
const MapViewer: React.FC<{ data: Record<string, any>; level?: number }> = ({ data, level = 0 }) => {
  return (
    <div className={`space-y-2 pl-${level * 2}`}> {/* 缩进层级 */}
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="p-3 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border-primary)]">
          <Text size="2" weight="medium" className="text-[var(--color-text-secondary)] mb-1 block">
            {key}:
          </Text>
          {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
            <MapViewer data={value} level={level + 1} />
          ) : Array.isArray(value) ? (
            <div className="space-y-1">
              {value.map((item, idx) => (
                <div key={idx} className="bg-[var(--color-bg-tertiary)] rounded px-2 py-1 text-white text-xs">
                  {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                </div>
              ))}
            </div>
          ) : (
            <Text size="3" className="text-white">{String(value)}</Text>
          )}
        </div>
      ))}
    </div>
  );
};

// 解析和美化最终结果显示
const FinalResultDisplay = ({ data }: { data: any }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 优化：始终优先 end 节点的 outputs 字段
  const extractFinalOutput = (result: any) => {
    if (!result) return null;
    // 优先 end 节点的 outputs
    if (typeof result === 'object' && result !== null) {
      if (result.end_1 && result.end_1.outputs) {
        return result.end_1.outputs;
      }
      if (result.end && result.end.outputs) {
        return result.end.outputs;
      }
      if (result.outputs) {
        return result.outputs;
      }
    }
    // 兼容旧逻辑
    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
      return result;
    }
    if (typeof result === 'object' && result !== null) {
      // 只保留用户关心的输出
      const processedResult: any = {};
      for (const [key, value] of Object.entries(result)) {
        if (!['status', 'startTime', 'endTime', 'duration', 'nodes', 'error', 'totalNodes', 'completedNodes', 'globalLogs'].includes(key)) {
          processedResult[key] = value;
        }
      }
      if (Object.keys(processedResult).length === 1) {
        return processedResult[Object.keys(processedResult)[0]];
      }
      if (Object.keys(processedResult).length > 0) {
        return processedResult;
      }
    }
    return null;
  };

  const finalOutput = extractFinalOutput(data);
  
  // 调试信息（仅在开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('FinalResultDisplay - 原始数据:', data);
    console.log('FinalResultDisplay - 提取结果:', finalOutput);
    console.log('FinalResultDisplay - 结果类型:', typeof finalOutput);
  }
  
  if (!finalOutput) {
    return (
      <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] border-dashed">
        <div className="p-6 text-center">
          <FileTextIcon className="w-8 h-8 text-[var(--color-text-secondary)] mx-auto mb-2" />
          <Text size="2" className="text-[var(--color-text-secondary)]">
            暂无输出结果
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
      <div className="p-4">
        <Flex justify="between" align="center" className="mb-3">
          <Flex align="center" gap="2">
            <FileTextIcon className="w-4 h-4 text-green-400" />
            <Heading size="3" className="text-white">
              工作流输出
            </Heading>
          </Flex>
          <Button
            size="1"
            variant="soft"
            color="gray"
            onClick={handleCopy}
          >
            <CopyIcon className="w-3 h-3 mr-1" />
            {copied ? '已复制' : '复制'}
          </Button>
        </Flex>
        
        <ScrollArea className="max-h-64">
          {typeof finalOutput === 'string' ? (
            // 字符串结果 - 大字体显示
            <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)]">
              <Text size="4" className="text-white leading-relaxed">
                {finalOutput}
              </Text>
            </div>
          ) : typeof finalOutput === 'number' || typeof finalOutput === 'boolean' ? (
            // 数字或布尔值 - 高亮显示
            <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-center">
              <Text size="5" weight="bold" className="text-green-400">
                {String(finalOutput)}
              </Text>
            </div>
          ) : Array.isArray(finalOutput) ? (
            // 数组结果 - 列表形式显示
            <div className="space-y-2">
              {finalOutput.map((item, index) => (
                <div key={index} className="p-3 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border-primary)]">
                  <Text size="3" className="text-white">
                    {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                  </Text>
                </div>
              ))}
            </div>
          ) : typeof finalOutput === 'object' && finalOutput !== null ? (
            // 对象结果 - 键值对形式或JSON显示
            <MapViewer data={finalOutput} />
          ) : (
            // 其他情况
            <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)]">
              <Text size="3" className="text-white">
                {String(finalOutput)}
              </Text>
            </div>
          )}
        </ScrollArea>
      </div>
    </Card>
  );
};

export const WorkflowResult: React.FC<WorkflowResultProps> = ({ 
  result, 
  isLoading, 
  onRetry 
}) => {
  if (!result && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] animate-fade-in">
        <div className="p-4">
          <Flex align="center" gap="3" className="mb-3">
            <ReloadIcon className="w-4 h-4 text-blue-400 animate-spin" />
            <Text size="2" weight="medium" className="text-white">
              正在执行工作流...
            </Text>
          </Flex>
          <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse w-1/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!result) return null;

  const progressPercentage = result.totalNodes > 0 
    ? Math.round((result.completedNodes / result.totalNodes) * 100) 
    : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 最终输出结果 - 放在最顶部 */}
      {result.finalResult && result.status === 'completed' && (
        <FinalResultDisplay data={result.finalResult} />
      )}

      {/* 执行状态和进度 */}
      <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Flex align="center" gap="2">
              <StatusBadge status={result.status} />
              <Text size="2" weight="medium" className="text-white">
                执行状态
              </Text>
            </Flex>
            {onRetry && result.status === 'failed' && (
              <Button size="1" variant="soft" onClick={onRetry}>
                <ReloadIcon />
                重试
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {(result.status === 'running' || result.status === 'completed' || result.status === 'failed') && (
            <div className="space-y-2">
              <Flex justify="between" align="center">
                <Text size="1" className="text-[var(--color-text-secondary)]">
                  进度: {result.completedNodes}/{result.totalNodes}
                </Text>
                <Text size="1" className="text-[var(--color-text-secondary)]">
                  {progressPercentage}%
                </Text>
              </Flex>
              <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (() => {
                      switch (result.status) {
                        case 'completed': return 'bg-green-500';
                        case 'failed': return 'bg-red-500';
                        case 'running': return 'bg-blue-500';
                        default: return 'bg-gray-500';
                      }
                    })()
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Timing Info */}
          {result.startTime && (
            <Flex gap="4" className="text-xs text-[var(--color-text-secondary)]">
              <Text size="1">开始时间: {formatTimestamp(result.startTime)}</Text>
              {result.endTime && (
                <Text size="1">结束时间: {formatTimestamp(result.endTime)}</Text>
              )}
              {result.duration && (
                <Text size="1">耗时: {formatDuration(result.duration)}</Text>
              )}
            </Flex>
          )}

          {/* Global Error */}
          {result.error && (
            <Card className="bg-red-500/10 border-red-500/20">
              <div className="p-3">
                <Flex align="center" gap="2" className="mb-2">
                  <CrossCircledIcon className="w-4 h-4 text-red-400" />
                  <Text size="2" weight="medium" className="text-red-400">
                    执行错误
                  </Text>
                </Flex>
                <Text size="1" className="text-red-300">
                  {result.error}
                </Text>
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* 执行详情 - 可折叠的高级信息 */}
      {result.nodes && result.nodes.length > 0 && (
        <Collapsible.Root>
          <Card className="bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]">
            <Collapsible.Trigger asChild>
              <Button variant="ghost" className="w-full p-4 justify-between hover:bg-[var(--color-bg-secondary)]">
                <Flex align="center" gap="2">
                  <GearIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <Text size="2" weight="medium" className="text-white">
                    执行详情
                  </Text>
                  <Badge size="1" variant="soft" color="gray">
                    <Text size="1">{result.nodes.length} 个节点</Text>
                  </Badge>
                </Flex>
                <ChevronDownIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </Button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <div className="p-4 pt-0">
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {result.nodes.map((node, index) => (
                      <Card key={node.id} className="bg-[var(--color-bg-secondary)] border-[var(--color-border-secondary)]">
                        <div className="p-3">
                          <Flex justify="between" align="center" className="mb-2">
                            <Flex align="center" gap="2">
                              <NodeStatusIcon status={node.status} />
                              <Text size="2" className="text-white">
                                {node.id}
                              </Text>
                              <Badge size="1" variant="soft" color="gray">
                                <Text size="1">{node.type}</Text>
                              </Badge>
                            </Flex>
                            <StatusBadge status={node.status} />
                          </Flex>

                          {/* Node timing */}
                          {(node.startTime || node.duration) && (
                            <Flex gap="3" className="mb-2 text-xs text-[var(--color-text-secondary)]">
                              {node.startTime && (
                                <Text size="1">开始: {formatTimestamp(node.startTime)}</Text>
                              )}
                              {node.duration && (
                                <Text size="1">耗时: {formatDuration(node.duration)}</Text>
                              )}
                            </Flex>
                          )}

                          {/* Node error */}
                          {node.error && (
                            <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                              <Text size="1" className="text-red-300">
                                {node.error}
                              </Text>
                            </div>
                          )}

                          {/* Node result */}
                          {node.result && (
                            <JsonViewer 
                              data={node.result} 
                              title={`节点 ${node.id} 结果`}
                            />
                          )}

                          {/* Node logs */}
                          {node.logs && node.logs.length > 0 && (
                            <Collapsible.Root>
                              <Collapsible.Trigger asChild>
                                <Button variant="ghost" size="1" className="w-full justify-start mt-2">
                                  <InfoCircledIcon />
                                  查看日志 ({node.logs.length})
                                </Button>
                              </Collapsible.Trigger>
                              <Collapsible.Content>
                                <ScrollArea className="max-h-32 mt-2">
                                  <div className="space-y-1">
                                    {node.logs.map((log, logIndex) => (
                                      <Text 
                                        key={logIndex} 
                                        size="1" 
                                        className="text-[var(--color-text-secondary)] font-mono block"
                                      >
                                        {log}
                                      </Text>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </Collapsible.Content>
                            </Collapsible.Root>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </Collapsible.Content>
          </Card>
        </Collapsible.Root>
      )}
    </div>
  );
}; 