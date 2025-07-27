import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Text } from '@radix-ui/themes';
import { ExitIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { NodeData } from '../types';

export const EndNode = ({ data, selected }: NodeProps<NodeData>) => {

  return (
    <div className="relative transition-all duration-200">
      {/* Lock icon to indicate non-deletable */}
      <div className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-[#d94224]/20 border border-[#d94224]/30 rounded-full flex items-center justify-center">
        <LockClosedIcon className="w-3 h-3 text-[#d94224]" />
      </div>
      
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-3 h-3 border-2"
        style={{ borderColor: '#d94224', background: '#d94224' + '33' }}
      />
      
      <div className={`w-44 border-2 rounded-lg ${
        selected 
          ? 'border-[var(--color-accent)] shadow-lg shadow-violet-500/20' 
          : ''
      } transition-all duration-200`}
        style={{ background: '#d9422433', borderColor: selected ? undefined : '#d94224', borderRadius: '8px' }}
      >
        <div className="py-5 px-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#d94224' + '33', border: '1px solid #d94224', minWidth: '32px', minHeight: '32px' }}>
              <ExitIcon className="w-5 h-5" style={{ color: '#d94224' }} />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1 truncate">
              {data.label}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}; 