import React, { useState, useEffect } from 'react';
import { Box, TextField, Text } from '@radix-ui/themes';
import { Node } from 'reactflow';

type HttpRequestConfigFormProps = {
  node: Node;
  onConfigChange: (nodeId: string, config: any) => void;
};

const HttpRequestConfigForm: React.FC<HttpRequestConfigFormProps> = ({ node, onConfigChange }) => {
  const [url, setUrl] = useState(node.data.url || '');

  useEffect(() => {
    onConfigChange(node.id, { url });
  }, [url, node.id, onConfigChange]);

  return (
    <Box>
      <Text as="label">
        URL
        <TextField.Root
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
        />
      </Text>
    </Box>
  );
};

export default HttpRequestConfigForm; 