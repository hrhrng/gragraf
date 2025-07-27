// 工作流API服务
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  dsl?: any;
  definition?: any;  // 后端实际使用 definition 字段
  status: 'draft' | 'active' | 'inactive' | 'archived';
  tags: string[];
  created_at: string;
  updated_at: string;
  version: number;
}

export interface WorkflowCreateRequest {
  name: string;
  description?: string;
  dsl: any;
  tags?: string[];
}

export interface WorkflowUpdateRequest {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface WorkflowListResponse {
  workflows: Workflow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 使用/api前缀，前端代理会重写并转发到后端
const API_BASE = '/api';

class WorkflowApiService {
  // 创建工作流
  async createWorkflow(workflow: WorkflowCreateRequest): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create workflow');
    }

    return response.json();
  }

  // 获取工作流列表
  async getWorkflows(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    name_contains?: string;
    tags?: string[];
  }): Promise<WorkflowListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.name_contains) queryParams.append('name_contains', params.name_contains);
    if (params?.tags) params.tags.forEach(tag => queryParams.append('tags', tag));

    const response = await fetch(`${API_BASE}/workflows/?${queryParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch workflows');
    }

    return response.json();
  }

  // 根据ID获取工作流
  async getWorkflowById(id: string): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Workflow not found');
      }
      throw new Error('Failed to fetch workflow');
    }

    return response.json();
  }

  // 根据名称获取工作流
  async getWorkflowByName(name: string): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/name/${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Workflow not found');
      }
      throw new Error('Failed to fetch workflow');
    }

    return response.json();
  }

  // 更新工作流定义
  async updateWorkflowDefinition(id: string, dsl: any): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/${id}/definition`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dsl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update workflow');
    }

    return response.json();
  }

  // 更新工作流元数据
  async updateWorkflowMetadata(id: string, metadata: WorkflowUpdateRequest): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/${id}/metadata`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update workflow metadata');
    }

    return response.json();
  }

  // 激活工作流
  async activateWorkflow(id: string): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/${id}/activate`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to activate workflow');
    }

    return response.json();
  }

  // 停用工作流
  async deactivateWorkflow(id: string): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/${id}/deactivate`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to deactivate workflow');
    }

    return response.json();
  }

  // 归档工作流
  async archiveWorkflow(id: string): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/${id}/archive`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to archive workflow');
    }

    return response.json();
  }

  // 删除工作流
  async deleteWorkflow(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete workflow');
    }
  }
}

export const workflowApi = new WorkflowApiService(); 