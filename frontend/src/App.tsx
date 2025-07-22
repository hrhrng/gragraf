import { useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
  BackgroundVariant,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Sidebar } from './components/Sidebar';
import { initialNodes, nodeTypes } from './nodes';
import { NodeData } from './types';
import RightPanel from './components/RightPanel';
import ConfigPanel from './components/ConfigPanel';
import { SaveWorkflowDialog } from './components/SaveWorkflowDialog';
import { WorkflowListDialog } from './components/WorkflowListDialog';
import { ApprovalModal } from './components/ApprovalModal';
import { Button, Tooltip } from '@radix-ui/themes';
import { PlayIcon, BookmarkIcon, MagnifyingGlassIcon, Cross1Icon, BorderSplitIcon, PlusIcon, FilePlusIcon } from '@radix-ui/react-icons';
import { workflowApi, Workflow } from './services/workflowApi';
import { DockToolbar } from './components/DockToolbar';

// Map frontend node types to backend expected types
const mapNodeTypeToBackend = (frontendType: string): string => {
  const typeMapping: { [key: string]: string } = {
    'knowledgeBase': 'knowledge_base',
    'httpRequest': 'http_request',
    'start': 'start',
    'end': 'end',
    'agent': 'agent',
    'branch': 'branch',
    'humanInLoop': 'human_in_loop'
  };
  
  return typeMapping[frontendType] || frontendType;
};

function App() {
  const [nodes, setNodes] = useState<Node<NodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRunForm, setShowRunForm] = useState(false);
  const [startNodeInputs, setStartNodeInputs] = useState<{ name: string }[]>([]);
  
  // 工作流存储相关状态
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // 全局错误状态
  const [globalError, setGlobalError] = useState<string>('');
  const [showGlobalError, setShowGlobalError] = useState(false);
  
  // 全局成功提示状态
  const [globalSuccess, setGlobalSuccess] = useState<string>('');
  const [showGlobalSuccess, setShowGlobalSuccess] = useState(false);
  
  // Human-in-Loop 状态
  const [humanInputRequired, setHumanInputRequired] = useState<any>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const reactFlowInstance = useReactFlow();

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Filter out deletion of start and end nodes
      const filteredChanges = changes.filter(change => {
        if (change.type === 'remove') {
          const nodeToRemove = nodes.find(node => node.id === change.id);
          if (nodeToRemove?.type === 'start' || nodeToRemove?.type === 'end') {
            return false; // Don't allow start/end nodes to be removed
          }
        }
        return true;
      });
      
      setNodes((nds) => applyNodeChanges(filteredChanges, nds));
    },
    [setNodes, nodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onAddNode = (type: string, label: string) => {
    // 获取当前viewport中心点的画布坐标
    let position = { x: 400, y: 300 };
    if (reactFlowInstance && reactFlowInstance.getViewport) {
      const { x, y, zoom } = reactFlowInstance.getViewport();
      // 画布中心点（以容器宽高一半为中心，逆变换到画布坐标）
      const container = document.querySelector('.react-flow');
      if (container) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        position = {
          x: (centerX - x) / zoom,
          y: (centerY - y) / zoom
        };
      }
    }
    const newNode: Node<NodeData> = {
      id: `${type}_${nodes.length + 1}`,
      type,
      position,
      data: { 
        label, 
        config: {} 
      },
    };
    setNodes((nds) => nds.concat(newNode));
    // 不自动选中
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };
  
  const onConfigChange = (nodeId: string, newConfig: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, config: newConfig } } : node
      )
    );
  };
  
  const handleRunClick = () => {
    // 先关闭任何打开的节点配置面板
    setSelectedNode(null);
    
    const startNode = nodes.find(n => n.type === 'start');
    if (startNode) {
      setStartNodeInputs(startNode.data.config.inputs || []);
      setShowRunForm(true);
    } else {
      alert('No Start node found in the workflow.');
    }
  };

  const handleRunSubmit = (runData: any) => {
    onRun(runData);
  };

  const onRun = async (runData: any) => {
    setShowRunForm(false);
    setIsLoading(true);
    setResult(null);
    
    // Generate a unique thread ID for this workflow execution
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated thread ID:', threadId);
    
    const dsl = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: mapNodeTypeToBackend(node.type || 'unknown'),
        config: node.data.config, // 不再混入运行时数据
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        source_handle: edge.sourceHandle
      }))
    };

    // Log HiL node edges for debugging
    const hilEdges = edges.filter(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      return sourceNode?.type === 'humanInLoop';
    });
    if (hilEdges.length > 0) {
      console.log('Human-in-Loop edges:', hilEdges);
    }

    // 尝试使用流式执行
    try {
      await executeWithStreaming(dsl, threadId, undefined, runData);
    } catch (streamError) {
      console.warn('Streaming failed, falling back to regular execution:', streamError);
      await executeRegular(dsl);
    }
  };

  const executeWithStreaming = async (dsl: any, threadId?: string, humanInput?: any, runtimeInputs?: any): Promise<void> => {
    console.log('executeWithStreaming called with threadId:', threadId, 'humanInput:', !!humanInput, 'runtimeInputs:', !!runtimeInputs);
    
    return new Promise(async (resolve, reject) => {
      let hasStarted = false;
      
      // 初始化结果状态（如果不是恢复执行）
      if (!humanInput) {
        const initialResult = {
          status: 'running' as const,
          startTime: new Date().toISOString(),
          endTime: null,
          duration: 0,
          nodes: [] as any[],
          finalResult: null,
          error: null,
          totalNodes: nodes.length, // 使用实际的节点数量
          completedNodes: 0,
          globalLogs: [] as string[]
        };
        setResult(initialResult);
      } else {
        // 恢复执行时，确保有一个结果状态显示
        setResult((currentResult: any) => {
          if (!currentResult) {
            return {
              status: 'running' as const,
              startTime: new Date().toISOString(),
              endTime: null,
              duration: 0,
              nodes: [] as any[],
              finalResult: null,
              error: null,
              totalNodes: nodes.length,
              completedNodes: 0,
              globalLogs: []
            };
          }
          return { ...currentResult, status: 'running' };
        });
      }

      try {
        // 构建请求体
        const requestBody = {
          dsl,
          thread_id: threadId,
          human_input: humanInput,
          runtime_inputs: runtimeInputs
        };

        // 使用 fetch 的 ReadableStream 来处理流式响应
        const response = await fetch('/run/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is empty');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        hasStarted = true;

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          // 处理SSE格式的数据
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一行（可能不完整）
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                if (eventData.type === 'human_input_required') {
                  console.log('SSE Event:', eventData);
                }

                // Handle human input required events immediately
                if (eventData.type === 'human_input_required') {
                  console.log('Processing human_input_required event immediately:', eventData);
                  setHumanInputRequired(eventData.interrupt_info);
                  setCurrentThreadId(eventData.thread_id);
                  setShowApprovalModal(true);
                  console.log('Modal should show now');
                  
                  // Update result status if result exists
                  setResult((currentResult: any) => {
                    if (currentResult) {
                      return { ...currentResult, status: 'waiting_for_approval' };
                    }
                    return currentResult;
                  });
                  return; // Skip the rest of the processing for this event
                }

                // 更新结果状态
                setResult((currentResult: any) => {
                console.log('Current result exists:', !!currentResult, 'Event type:', eventData.type);
                if (!currentResult) {
                  console.log('No current result, skipping event processing');
                  return currentResult;
                }
                
                const newResult = { ...currentResult };
                
                console.log('Processing event type:', eventData.type);
                  switch (eventData.type) {
                    case 'start':
                    case 'execution_started':
                      newResult.totalNodes = eventData.data?.totalNodes || nodes.length;
                      newResult.startTime = eventData.data?.startTime || eventData.timestamp;
                      break;
                      
                    case 'progress':
                      // 处理后端发送的进度事件
                      if (eventData.data) {
                        // 计算已完成的节点数量
                        const completedNodeKeys = Object.keys(eventData.data);
                        if (completedNodeKeys.length > 0) {
                          newResult.completedNodes = Math.max(newResult.completedNodes, completedNodeKeys.length);
                        }
                        
                        // 更新节点执行状态
                        completedNodeKeys.forEach(nodeId => {
                          const existingNodeIndex = newResult.nodes.findIndex((n: any) => n.id === nodeId);
                          const nodeData = {
                            id: nodeId,
                            type: nodeId.includes('agent') ? 'agent' : nodeId.includes('start') ? 'start' : nodeId.includes('end') ? 'end' : 'unknown',
                            status: 'completed',
                            startTime: eventData.timestamp,
                            endTime: eventData.timestamp,
                            duration: 0,
                            result: eventData.data[nodeId],
                            error: null,
                            logs: []
                          };
                          
                          if (existingNodeIndex >= 0) {
                            newResult.nodes[existingNodeIndex] = nodeData;
                          } else {
                            newResult.nodes.push(nodeData);
                          }
                        });
                      }
                      break;
                      
                    case 'complete':
                    case 'execution_completed':
                    case 'execution_finished':
                      newResult.status = 'completed';
                      newResult.endTime = eventData.timestamp;
                      newResult.finalResult = eventData.result || eventData.data?.result;
                      newResult.completedNodes = newResult.totalNodes; // 设置为全部完成
                      if (newResult.startTime && newResult.endTime) {
                        const start = new Date(newResult.startTime);
                        const end = new Date(newResult.endTime);
                        newResult.duration = end.getTime() - start.getTime();
                      }
                      break;
                      
                    case 'error':
                    case 'execution_failed':
                      newResult.status = 'failed';
                      newResult.endTime = eventData.timestamp;
                      newResult.error = eventData.data?.error || eventData.error;
                      if (newResult.startTime && newResult.endTime) {
                        const start = new Date(newResult.startTime);
                        const end = new Date(newResult.endTime);
                        newResult.duration = end.getTime() - start.getTime();
                      }
                      break;
                      
                    case 'human_input_required':
                      // 处理 Human-in-Loop 中断
                      console.log('Processing human_input_required event:', eventData);
                      newResult.status = 'waiting_for_approval';
                      setHumanInputRequired(eventData.interrupt_info);
                      setCurrentThreadId(eventData.thread_id);
                      setShowApprovalModal(true);
                      console.log('Modal should show now');
                      break;
                  }
                  
                  return newResult;
                });
              } catch (error) {
                console.error('Error parsing SSE event:', error);
              }
            }
          }
        }

        setIsLoading(false);
        resolve();
      } catch (error) {
        console.error('Streaming error:', error);
        setIsLoading(false);
        if (!hasStarted) {
          reject(error);
        } else {
          // 如果已经开始但中途失败，设置错误状态
          setResult((currentResult: any) => currentResult ? {
            ...currentResult,
            status: 'failed',
            endTime: new Date().toISOString(),
            error: 'Connection lost during execution'
          } : null);
          resolve();
        }
      }
    });
  };

  const executeRegular = async (dsl: any) => {
    try {
      const startTime = new Date().toISOString();
      const response = await fetch('/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dsl),
      });
      const data = await response.json();
      const endTime = new Date().toISOString();
      
      // Transform the backend response to match our new format
      const transformedResult = {
        status: data.status === 'success' ? 'completed' : (data.status === 'error' ? 'failed' : 'completed'),
        startTime: data.startTime || startTime,
        endTime: data.endTime || endTime,
        duration: data.duration || (new Date(endTime).getTime() - new Date(startTime).getTime()),
        nodes: data.nodes || [],
        finalResult: data.result || data.finalResult || data, // 优先使用data.result，然后data.finalResult，最后回退到整个data
        error: data.error,
        totalNodes: data.totalNodes || nodes.length,
        completedNodes: data.completedNodes || (data.error ? 0 : nodes.length),
        globalLogs: data.globalLogs || []
      };
      
      setResult(transformedResult);
    } catch (error) {
      console.error('Error running workflow:', error);
      const errorResult = {
        status: 'failed' as const,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0,
        nodes: [],
        finalResult: null,
        error: 'Failed to execute workflow: ' + (error as Error).message,
        totalNodes: nodes.length,
        completedNodes: 0,
        globalLogs: []
      };
      setResult(errorResult);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const startNode = nodes.find(n => n.type === 'start');
    if (startNode) {
      setStartNodeInputs(startNode.data.config.inputs || []);
      setShowRunForm(true);
    }
  };

  const handleRunCancel = () => {
    setShowRunForm(false);
  };

  // Handle human approval/rejection
  const handleHumanDecision = async (decision: 'approved' | 'rejected', comment: string) => {
    console.log('handleHumanDecision called with:', { decision, comment, humanInputRequired, currentThreadId });
    
    if (!humanInputRequired || !currentThreadId) {
      console.error('No human input required or thread ID available', { humanInputRequired, currentThreadId });
      return;
    }

    const humanInput = {
      [`${humanInputRequired.node_id}_human_input`]: {
        decision,
        comment
      }
    };

    // Store required data before resetting state
    const nodeId = humanInputRequired.node_id;
    const threadId = currentThreadId;

    console.log('Resuming workflow with Thread ID:', threadId);

    // Reset HiL state
    setHumanInputRequired(null);
    setShowApprovalModal(false);

    // Resume execution with human input - use empty DSL since LangGraph will restore from checkpoint
    const emptyDsl = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: mapNodeTypeToBackend(node.type || 'unknown'),
        config: node.data.config,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        source_handle: edge.sourceHandle
      }))
    };

    // Resume execution with human input
    try {
      await executeWithStreaming(emptyDsl, threadId, humanInput);
    } catch (error) {
      console.error('Error resuming workflow:', error);
      setGlobalError('Failed to resume workflow after human input');
      setShowGlobalError(true);
    } finally {
      setCurrentThreadId(null);
    }
  };

  // Deselect node when clicking on empty space
  const onPaneClick = () => {
    setSelectedNode(null);
    // 关闭运行工作流面板（如果打开的话）
    setShowRunForm(false);
    // 清除工作流执行结果面板
    setResult(null);
  };

  // 工作流存储功能
  const getCurrentDSL = () => ({
    nodes: nodes.map(node => ({
      id: node.id,
      type: mapNodeTypeToBackend(node.type || 'unknown'),
      config: node.data.config,
      position: node.position
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      source_handle: edge.sourceHandle
    }))
  });

  // 带重试的元数据更新
  const updateWorkflowMetadataWithRetry = async (workflowId: string, metadata: { name: string; description?: string; tags: string[] }) => {
    try {
      return await workflowApi.updateWorkflowMetadata(workflowId, metadata);
    } catch (error) {
      if (error instanceof Error) {
        // 名称冲突：直接报错，不重试
        if (error.message.includes('already exists')) {
          throw new Error('工作流名称已存在，请使用其他名称');
        }
        // 版本冲突：获取最新版本后重试一次
        if (error.message.includes('版本冲突')) {
          const latestWorkflow = await workflowApi.getWorkflowById(workflowId);
          return await workflowApi.updateWorkflowMetadata(latestWorkflow.id, metadata);
        }
      }
      throw error;
    }
  };

  // 带重试的定义更新
  const updateWorkflowDefinitionWithRetry = async (workflowId: string, dsl: any) => {
    try {
      return await workflowApi.updateWorkflowDefinition(workflowId, dsl);
    } catch (error) {
      if (error instanceof Error && error.message.includes('版本冲突')) {
        // 版本冲突：获取最新版本后重试一次
        const latestWorkflow = await workflowApi.getWorkflowById(workflowId);
        return await workflowApi.updateWorkflowDefinition(latestWorkflow.id, dsl);
      }
      throw error;
    }
  };

  // 快速保存现有工作流
  const handleQuickSave = async () => {
    if (!currentWorkflow) return;
    
    // 直接使用当前工作流的名称、描述和标签
    await handleSaveWorkflow({
      name: currentWorkflow.name,
      description: currentWorkflow.description,
      tags: currentWorkflow.tags || []
    });
  };

  const handleSaveWorkflow = async (data: { name: string; description?: string; tags: string[] }) => {
    setSaveLoading(true);
    try {
      const dsl = getCurrentDSL();
      
      if (currentWorkflow) {
        // 更新现有工作流
        let updatedWorkflow = currentWorkflow;
        
        // 检查是否需要更新元数据
        const metadataChanged = data.name !== currentWorkflow.name || 
                              data.description !== currentWorkflow.description || 
                              JSON.stringify(data.tags) !== JSON.stringify(currentWorkflow.tags);
        
        if (metadataChanged) {
          updatedWorkflow = await updateWorkflowMetadataWithRetry(currentWorkflow.id, {
            name: data.name,
            description: data.description,
            tags: data.tags
          });
        }
        
        // 更新定义（总是需要更新，因为用户可能修改了画布）
        updatedWorkflow = await updateWorkflowDefinitionWithRetry(updatedWorkflow.id, dsl);
        
        setCurrentWorkflow({ ...updatedWorkflow, name: data.name, description: data.description, tags: data.tags });
      } else {
        // 创建新工作流
        const newWorkflow = await workflowApi.createWorkflow({
          name: data.name,
          description: data.description,
          dsl,
          tags: data.tags
        });
        setCurrentWorkflow(newWorkflow);
      }
      
      // 显示成功提示
      setGlobalSuccess('工作流保存成功');
      setShowGlobalSuccess(true);
      
      // 3秒后自动关闭成功提示
      setTimeout(() => {
        setShowGlobalSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('保存工作流失败:', error);
      
      // 显示友好的错误消息
      let errorMessage = '保存工作流失败';
      if (error instanceof Error) {
        if (error.message.includes('版本冲突')) {
          errorMessage = '保存失败：工作流已被其他操作修改，请重新尝试';
        } else if (error.message.includes('名称已存在')) {
          errorMessage = '保存失败：工作流名称已存在，请使用其他名称';
        } else if (error.message.includes('already exists')) {
          errorMessage = '保存失败：工作流名称已存在，请使用其他名称';
        } else if (error.message.includes('网络')) {
          errorMessage = '保存失败：网络连接问题，请检查网络后重试';
        } else {
          errorMessage = `保存失败：${error.message}`;
        }
      }
      
      setGlobalError(errorMessage);
      setShowGlobalError(true);
      
      // 3秒后自动关闭错误提示
      setTimeout(() => {
        setShowGlobalError(false);
      }, 3000);
      
      throw error; // 让组件处理错误显示
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLoadWorkflow = (workflow: Workflow) => {
    // 加载工作流的DSL到画布，优先使用definition，回退到dsl
    const dsl = workflow.definition || workflow.dsl;
    
    // 创建反向映射
    const reverseTypeMapping: { [key: string]: string } = {
      'knowledge_base': 'knowledgeBase',
      'http_request': 'httpRequest',
      'start': 'start',
      'end': 'end',
      'agent': 'agent',
      'branch': 'branch',
      'human_in_loop': 'humanInLoop'
    };
    
    if (dsl && dsl.nodes) {
      const loadedNodes = dsl.nodes.map((node: any) => ({
        id: node.id,
        type: reverseTypeMapping[node.type] || node.type,
        position: node.position || { x: Math.random() * 400, y: Math.random() * 300 },
        data: {
          label: node.config?.label || node.type,
          config: node.config || {}
        }
      }));
      setNodes(loadedNodes);
    }
    
    if (dsl && dsl.edges) {
      const loadedEdges = dsl.edges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.source_handle
      }));
      setEdges(loadedEdges);
    }
    
    // 创建带有dsl字段的工作流对象，供前端使用
    const workflowWithDsl = {
      ...workflow,
      dsl: dsl
    };
    
    setCurrentWorkflow(workflowWithDsl);
    setSelectedNode(null);
    setResult(null);
  };

  const handleNewWorkflow = () => {
    setNodes(initialNodes);
    setEdges([]);
    setCurrentWorkflow(null);
    setSelectedNode(null);
    setResult(null);
  };

  // 自动整理工作流节点（横向分层，分支上下分散）
  const autoLayout = () => {
    // 1. 构建节点和边的映射
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const outEdges: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    nodes.forEach(n => { inDegree[n.id] = 0; outEdges[n.id] = []; });
    edges.forEach(e => {
      outEdges[e.source].push(e.target);
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    });

    // 2. 拓扑排序分层
    const layers = [];
    let queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    let visited = new Set();
    while (queue.length > 0) {
      const layer = [];
      const nextQueue = [];
      for (const nodeId of queue) {
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        layer.push(nodeId);
        for (const tgt of outEdges[nodeId]) {
          inDegree[tgt]--;
          if (inDegree[tgt] === 0) nextQueue.push(tgt);
        }
      }
      if (layer.length > 0) layers.push(layer);
      queue = nextQueue;
    }
    // 3. 横向分层布局：每层纵向排列，整体从左到右
    const spacingX = 260;
    const spacingY = 140;
    let arrangedNodes = [...nodes];
    let x0 = 200;
    layers.forEach((layer, i) => {
      const totalHeight = (layer.length - 1) * spacingY;
      layer.forEach((nodeId, j) => {
        const x = x0 + i * spacingX;
        const y = 200 + j * spacingY - totalHeight / 2;
        arrangedNodes = arrangedNodes.map(n => n.id === nodeId ? { ...n, position: { x, y } } : n);
      });
    });
    setNodes(arrangedNodes);
  };

  return (
    <div className="flex h-screen w-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <Sidebar 
        onAddNode={onAddNode} 
        nodes={nodes}
      />
      
      <div className="flex-1 relative">
        {/* Flow Area */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[var(--color-bg-primary)]"
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            color="var(--color-border-primary)"
          />
          <Controls 
            className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg shadow-lg"
          />
        </ReactFlow>

        {/* Floating help text when no nodes selected */}
        {!selectedNode && nodes.length <= 2 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="bg-[var(--color-bg-secondary)]/90 backdrop-blur-sm border border-[var(--color-border-primary)] rounded-xl p-8 max-w-md">
              <h3 className="text-xl font-semibold text-white mb-2">
                Welcome to GraGraf
              </h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Start building your workflow by adding nodes from the sidebar. 
                Connect them together to create powerful automation flows.
              </p>
              <div className="mt-4 text-sm text-[var(--color-text-secondary)]">
                💡 Tip: Click on any node to configure its settings
              </div>
            </div>
          </div>
        )}

        {/* Workflow management and stats */}
        <div className="absolute top-4 right-4 flex flex-col gap-3">
          {/* 工作流管理按钮 */}
          <div className="flex gap-2">
            {/* 如果是现有工作流，显示快速保存和另存为按钮 */}
            {currentWorkflow ? (
              <>
                <Tooltip content="另存为">
                  <Button
                    size="2"
                    variant="outline"
                    onClick={() => setSaveDialogOpen(true)}
                    className="bg-[var(--color-bg-secondary)]/90 backdrop-blur-sm"
                  >
                    <FilePlusIcon className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="保存">
                  <Button
                    size="2"
                    variant="soft"
                    onClick={handleQuickSave}
                    disabled={saveLoading}
                    className="bg-[var(--color-bg-secondary)]/90 backdrop-blur-sm"
                  >
                    <BookmarkIcon className="w-4 h-4" />
                    {saveLoading ? '保存中...' : ''}
                  </Button>
                </Tooltip>
              </>
            ) : (
              <Tooltip content="保存">
                <Button
                  size="2"
                  variant="soft"
                  onClick={() => setSaveDialogOpen(true)}
                  className="bg-[var(--color-bg-secondary)]/90 backdrop-blur-sm"
                >
                  <BookmarkIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}
            
            <Tooltip content="新建工作流">
              <Button
                size="2"
                variant="soft"
                onClick={handleNewWorkflow}
                className="bg-[var(--color-bg-secondary)]/90 backdrop-blur-sm"
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="搜索工作流">
              <Button
                size="2"
                variant="soft"
                onClick={() => setListDialogOpen(true)}
                className="bg-[var(--color-bg-secondary)]/90 backdrop-blur-sm"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>

          {/* 当前工作流信息 */}
          {currentWorkflow && (
            <div className="bg-[var(--color-bg-secondary)]/90 backdrop-blur-sm border border-[var(--color-border-primary)] rounded-lg px-3 py-2">
              <div className="text-sm">
                <div className="text-white font-medium truncate max-w-48">
                  {currentWorkflow.name}
                </div>
                <div className="text-[var(--color-text-secondary)] text-xs">
                  v{currentWorkflow.version} • {currentWorkflow.status}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      <RightPanel 
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode} 
        onConfigChange={onConfigChange}
        result={result}
        isLoading={isLoading}
        onRetry={handleRetry}
        showRunForm={showRunForm}
        runFormInputs={startNodeInputs}
        onRunSubmit={handleRunSubmit}
        onRunCancel={handleRunCancel}
      />
      
      {/* Configuration Panel - 浮窗 */}
      <ConfigPanel 
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode} 
        onConfigChange={onConfigChange}
      />
      
      {/* macOS Dock Style Toolbar */}
      <DockToolbar 
        onRunWorkflow={handleRunClick}
        onAutoLayout={autoLayout}
      />

      {/* 工作流存储对话框 */}
      <SaveWorkflowDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveWorkflow}
        currentWorkflowName={currentWorkflow?.name || ''}
        isLoading={saveLoading}
      />

      <WorkflowListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        onLoadWorkflow={handleLoadWorkflow}
      />

      {/* Human-in-Loop Approval Modal */}
      <ApprovalModal
        open={showApprovalModal}
        onOpenChange={setShowApprovalModal}
        interruptInfo={humanInputRequired}
        onDecision={handleHumanDecision}
      />

      {/* 全局错误提示 */}
      {showGlobalError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="bg-red-500/90 backdrop-blur-sm border border-red-400 rounded-lg px-6 py-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <span className="text-white font-medium">
                  {globalError}
                </span>
              </div>
              <button
                onClick={() => setShowGlobalError(false)}
                className="ml-auto text-white hover:text-red-200 transition-colors"
              >
                <Cross1Icon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全局成功提示 */}
      {showGlobalSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="bg-green-500/90 backdrop-blur-sm border border-green-400 rounded-lg px-6 py-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <span className="text-white font-medium">
                  {globalSuccess}
                </span>
              </div>
              <button
                onClick={() => setShowGlobalSuccess(false)}
                className="ml-auto text-white hover:text-green-200 transition-colors"
              >
                <Cross1Icon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
