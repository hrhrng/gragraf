import React, { useState, useEffect } from 'react';
import { Box, TextArea, Text } from '@radix-ui/themes';
import { Node } from 'reactflow';

type KnowledgeBaseConfigFormProps = {
  node: Node;
  onConfigChange: (nodeId: string, config: any) => void;
};

const KnowledgeBaseConfigForm: React.FC<KnowledgeBaseConfigFormProps> = ({ node, onConfigChange }) => {
  const [documents, setDocuments] = useState((node.data.documents || []).join(', '));

  useEffect(() => {
    onConfigChange(node.id, { documents: documents.split(',').map((d: string) => d.trim()) });
  }, [documents, node.id, onConfigChange]);

  return (
    <Box>
      <Text as="label">
        Documents (comma-separated)
        <TextArea
          value={documents}
          onChange={(e) => setDocuments(e.target.value)}
          placeholder="Enter documents"
        />
      </Text>
    </Box>
  );
};

export default KnowledgeBaseConfigForm; 