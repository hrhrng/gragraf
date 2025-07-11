import React from 'react';
import { Box, Button, TextArea } from '@radix-ui/themes';

type SidebarProps = {
  onAddNode: (nodeType: string) => void;
  onRun: () => void;
  result: string;
};

const Sidebar: React.FC<SidebarProps> = ({ onAddNode, onRun, result }) => {
  return (
    <Box style={{ position: 'absolute', top: 10, left: 10, zIndex: 4, background: 'white', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Nodes</h3>
      <Button onClick={() => onAddNode('http_request')}>HTTP Request</Button>
      <Button onClick={() => onAddNode('code_executor')}>Code Executor</Button>
      <Button onClick={() => onAddNode('branch')}>Branch</Button>
      <Button onClick={() => onAddNode('knowledge_base')}>Knowledge Base</Button>
      <Button onClick={() => onAddNode('agent')}>Agent</Button>
      
      <hr />

      <Button onClick={onRun}>Run</Button>

      <h3>Result</h3>
      <TextArea value={result} readOnly style={{ width: '100%', height: '200px' }} />
    </Box>
  );
};

export default Sidebar; 