import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Text } from '@radix-ui/themes';
import { PlayIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { NodeData } from '../types';

export const StartNode = ({ data, selected }: NodeProps<NodeData>) => {

  return (
    <div className="relative transition-all duration-200">
      {/* Lock icon to indicate non-deletable */}
      <div className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
        <LockClosedIcon className="w-3 h-3 text-green-400" />
      </div>
      
      <div className={`w-44 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 rounded-lg ${
        selected 
          ? 'border-[var(--color-accent)] shadow-lg shadow-violet-500/20' 
          : 'border-green-500/50 hover:border-green-400'
      } transition-all duration-200`}
        style={{ borderRadius: '8px' }}>
        <div className="py-5 px-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/20 border border-green-500/30" style={{ minWidth: '32px', minHeight: '32px' }}>
              <PlayIcon className="w-5 h-5 text-green-400" />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1 truncate">
              {data.label}
            </Text>
          </div>
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right}
        className="w-3 h-3 border-2 border-green-400 bg-green-500/20"
      />
    </div>
  );
}; 