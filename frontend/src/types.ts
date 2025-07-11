export interface NodeData {
  label: string;
  config: any;
}

export interface BranchNodeData extends NodeData {
  config: {
    condition: string;
  };
} 