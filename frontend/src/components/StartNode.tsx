import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Text, Badge } from '@radix-ui/themes';
import { PlayIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { NodeData } from '../types';

export const StartNode = ({ data, selected }: NodeProps<NodeData>) => {
  const inputCount = data.config?.inputs?.length || 0;

  return (
    <div className="relative transition-all duration-200">
      {/* Lock icon to indicate non-deletable */}
      <div className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
        <LockClosedIcon className="w-3 h-3 text-green-400" />
      </div>
      
      <Card className={`w-56 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 ${
        selected 
          ? 'border-[var(--color-accent)] shadow-lg shadow-violet-500/20' 
          : 'border-green-500/50 hover:border-green-400'
      } transition-all duration-200`}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/20 border border-green-500/30">
              <PlayIcon className="w-4 h-4 text-green-400" />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1">
              {data.label}
            </Text>
            <Badge size="1" color="green" variant="soft">
              <Text size="1">Entry</Text>
            </Badge>
          </div>
          
          {inputCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Text size="1" className="text-[var(--color-text-secondary)]">
                  Input Fields
                </Text>
                <Badge size="1" variant="soft" color="green">
                  <Text size="1">{inputCount}</Text>
                </Badge>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <Handle 
        type="source" 
        position={Position.Right}
        className="w-3 h-3 border-2 border-green-400 bg-green-500/20"
      />
    </div>
  );
}; 