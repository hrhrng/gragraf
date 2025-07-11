import React, { useState, useEffect } from 'react';
import { Box, TextField, Text } from '@radix-ui/themes';
import { Node } from 'reactflow';

type BranchConfigFormProps = {
  node: Node;
  onConfigChange: (nodeId: string, config: any) => void;
};

const BranchConfigForm: React.FC<BranchConfigFormProps> = ({ node, onConfigChange }) => {
  const [condition, setCondition] = useState(node.data.condition || '');

  useEffect(() => {
    onConfigChange(node.id, { condition });
  }, [condition, node.id, onConfigChange]);

  return (
    <Box>
      <Text as="label">
        Condition
        <TextField.Root
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="Enter condition expression"
        />
      </Text>
    </Box>
  );
};

export default BranchConfigForm; 