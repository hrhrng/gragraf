import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Button, TextField, Text, Flex, Badge, IconButton, Card, Select, AlertDialog } from '@radix-ui/themes';
import { MagnifyingGlassIcon, ReloadIcon, TrashIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import { Workflow, WorkflowListResponse, workflowApi } from '../services/workflowApi';

interface WorkflowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadWorkflow: (workflow: Workflow) => void;
}

export const WorkflowListDialog: React.FC<WorkflowListDialogProps> = ({
  open,
  onOpenChange,
  onLoadWorkflow
}) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);

  const loadWorkflows = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const params: any = {
        page,
        page_size: 10,
      };
      
      if (searchTerm) {
        params.name_contains = searchTerm;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response: WorkflowListResponse = await workflowApi.getWorkflows(params);
      setWorkflows(response.workflows);
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载工作流失败');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (open) {
      loadWorkflows(1);
    }
  }, [open, searchTerm, statusFilter, loadWorkflows]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadWorkflows(1);
  };

  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    try {
      await workflowApi.deleteWorkflow(workflowToDelete.id);
      setWorkflows(workflows.filter(w => w.id !== workflowToDelete.id));
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除工作流失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content maxWidth="800px" style={{ maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Dialog.Title>工作流管理</Dialog.Title>
          {/* 顶部搜索和过滤栏 */}
          <Flex gap="3" align="center" style={{ marginBottom: 16 }}>
            <TextField.Root 
              style={{ flex: 1 }}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="搜索工作流名称"
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>

            <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
              <Select.Trigger style={{ width: '120px' }} />
              <Select.Content>
                <Select.Item value="all">全部状态</Select.Item>
                <Select.Item value="draft">草稿</Select.Item>
                <Select.Item value="active">活跃</Select.Item>
                <Select.Item value="inactive">非活跃</Select.Item>
                <Select.Item value="archived">已归档</Select.Item>
              </Select.Content>
            </Select.Root>

            <IconButton onClick={() => loadWorkflows(currentPage)} disabled={loading}>
              <ReloadIcon />
            </IconButton>
          </Flex>
          {/* 错误提示 */}
          {error && (
            <Text color="red" size="2" style={{ marginBottom: 8 }}>
              {error}
            </Text>
          )}
          {/* 中部滚动区：工作流列表和分页 */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <Flex direction="column" gap="2">
              {loading ? (
                <Text size="2" color="gray">加载中...</Text>
              ) : workflows.length === 0 ? (
                <Text size="2" color="gray">没有找到工作流</Text>
              ) : (
                workflows.map((workflow) => (
                  <Card key={workflow.id} variant="surface">
                    <Flex direction="column" gap="2">
                      <Flex justify="between" align="start">
                        <Flex direction="column" gap="1" style={{ flex: 1 }}>
                          <Flex align="center" gap="2">
                            <Text weight="medium" size="3">
                              {workflow.name}
                            </Text>
                          </Flex>
                          {workflow.description && (
                            <Text size="2" color="gray">
                              {workflow.description}
                            </Text>
                          )}
                          <Text size="1" color="gray">
                            创建时间: {formatDate(workflow.created_at)} | 
                            更新时间: {formatDate(workflow.updated_at)} | 
                            版本: {workflow.version}
                          </Text>
                        </Flex>

                        <Flex gap="2">
                          <Button
                            size="1"
                            variant="soft"
                            onClick={() => {
                              onLoadWorkflow(workflow);
                              onOpenChange(false);
                            }}
                          >
                            <ExternalLinkIcon width="12" height="12" />
                            加载
                          </Button>
                          <IconButton
                            size="1"
                            color="red"
                            variant="soft"
                            onClick={() => {
                              setWorkflowToDelete(workflow);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <TrashIcon width="12" height="12" />
                          </IconButton>
                        </Flex>
                      </Flex>

                      {workflow.tags.length > 0 && (
                        <Flex gap="1" wrap="wrap">
                          {workflow.tags.map((tag) => (
                            <Badge key={tag} variant="outline" size="1">
                              {tag}
                            </Badge>
                          ))}
                        </Flex>
                      )}
                    </Flex>
                  </Card>
                ))
              )}
            </Flex>
            {/* 分页 */}
            {totalPages > 1 && (
              <Flex justify="center" gap="2" style={{ marginTop: 16 }}>
                <Button
                  size="1"
                  variant="soft"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => loadWorkflows(currentPage - 1)}
                >
                  上一页
                </Button>
                <Text size="2" color="gray">
                  {currentPage} / {totalPages}
                </Text>
                <Button
                  size="1"
                  variant="soft"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => loadWorkflows(currentPage + 1)}
                >
                  下一页
                </Button>
              </Flex>
            )}
          </div>
          {/* 底部按钮 */}
          <Flex justify="end" style={{ marginTop: 16 }}>
            <Button
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              关闭
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* 删除确认对话框 */}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>删除工作流</AlertDialog.Title>
          <AlertDialog.Description size="2">
            确定要删除工作流 "{workflowToDelete?.name}" 吗？此操作无法撤销。
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                取消
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={handleDeleteWorkflow}>
                删除
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}; 