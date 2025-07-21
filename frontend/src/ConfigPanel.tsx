import React from 'react';
import { Box } from '@radix-ui/themes';
import { Node } from 'reactflow';

import { HttpRequestConfigForm } from './components/HttpRequestConfigForm';
import { BranchConfigForm } from './components/BranchConfigForm';
import { KnowledgeBaseConfigForm } from './components/KnowledgeBaseConfigForm';
import { AgentConfigForm } from './components/AgentConfigForm';

type ConfigPanelProps = {
  selectedNode: Node | null;
  onConfigChange: (nodeId: string, config: any) => void;
};

const ConfigPanel: React.FC<ConfigPanelProps> = ({ selectedNode, onConfigChange }) => {
  if (!selectedNode) {
    return null;
  }

  const renderConfigForm = () => {
    switch (selectedNode.data.label) {
      case 'HTTP Request':
        return <HttpRequestConfigForm node={selectedNode} onConfigChange={onConfigChange} availableVariables={[]} />;
      case 'Branch':
        return <BranchConfigForm node={selectedNode} onConfigChange={onConfigChange} availableVariables={[]} />;
      case 'Knowledge Base':
        return <KnowledgeBaseConfigForm node={selectedNode} onConfigChange={onConfigChange} availableVariables={[]} />;
      case 'Agent':
        return <AgentConfigForm node={selectedNode} onConfigChange={onConfigChange} availableVariables={[]} />;
      default:
        return null;
    }
  };

  return (
    <Box style={{ position: 'absolute', top: 10, right: 10, zIndex: 4, background: 'white', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Configuration</h3>
      {renderConfigForm()}
    </Box>
  );
};

export default ConfigPanel; 