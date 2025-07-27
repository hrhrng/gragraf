import React from 'react';
import { Node, Edge } from 'reactflow';
import { NodeData } from '../types';

interface RightPanelProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: Node<NodeData> | null;
  onConfigChange: (nodeId: string, config: any) => void;
  result: any;
  isLoading: boolean;
  onRetry?: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  nodes, 
  edges, 
  selectedNode, 
  onConfigChange, 
  result, 
  isLoading, 
  onRetry
}) => {



  // RightPanel现在不再显示任何内容，所有功能都已移到ConfigPanel
  return null;
};

export default RightPanel; 