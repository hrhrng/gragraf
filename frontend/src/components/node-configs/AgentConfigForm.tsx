import React, { useState, useEffect } from 'react';
import { Box, TextField, Text, TextArea } from '@radix-ui/themes';
import { Node } from 'reactflow';

type AgentConfigFormProps = {
  node: Node;
  onConfigChange: (nodeId: string, config: any) => void;
};

const AgentConfigForm: React.FC<AgentConfigFormProps> = ({ node, onConfigChange }) => {
  const [modelName, setModelName] = useState(node.data.model_name || 'gpt-4o-mini');
  const [promptTemplate, setPromptTemplate] = useState(node.data.prompt_template || '');

  useEffect(() => {
    onConfigChange(node.id, { model_name: modelName, prompt_template: promptTemplate });
  }, [modelName, promptTemplate, node.id, onConfigChange]);

  return (
    <Box>
      <Text as="label">
        Model Name
        <TextField.Root
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="Enter model name"
        />
      </Text>
      <Text as="label">
        Prompt Template
        <TextArea
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          placeholder="Enter prompt template"
        />
      </Text>
    </Box>
  );
};

export default AgentConfigForm; 