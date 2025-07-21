export interface NodeData {
  label: string;
  config: any;
}

export interface BranchNodeData extends NodeData {
  config: {
    condition: string;
  };
}

export interface HumanInLoopNodeData extends NodeData {
  config: {
    message: string;
    input_label: string;
    approval_label: string;
    rejection_label: string;
    require_comment: boolean;
  };
}

export interface HumanInputRequired {
  node_id: string;
  message: string;
  input_label: string;
  approval_label: string;
  rejection_label: string;
  require_comment: boolean;
  type: string;
}

export interface StreamResponse {
  type: 'start' | 'progress' | 'complete' | 'error' | 'human_input_required';
  data?: any;
  interrupt_info?: HumanInputRequired;
  thread_id?: string;
  timestamp: string;
} 