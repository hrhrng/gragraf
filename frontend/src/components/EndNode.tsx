import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Text, Badge } from '@radix-ui/themes';
import { ExitIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { NodeData } from '../types';

export const EndNode = ({ data, selected }: NodeProps<NodeData>) => {
  const outputCount = data.config?.outputs?.length || 0;

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
      
      <Card className={`w-56 border-2 ${
        selected 
          ? 'border-[var(--color-accent)] shadow-lg shadow-violet-500/20' 
          : ''
      } transition-all duration-200`}
        style={{ background: '#d9422433', borderColor: selected ? undefined : '#d94224' }}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#d94224' + '33', border: '1px solid #d94224' }}>
              <ExitIcon className="w-4 h-4" style={{ color: '#d94224' }} />
            </div>
            <Text size="3" weight="medium" className="text-white flex-1">
              {data.label}
            </Text>
            <Badge size="1" style={{ background: '#d94224' + '22', color: '#d94224' }} variant="soft">
              <Text size="1">Exit</Text>
            </Badge>
          </div>
          
          {outputCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Text size="1" className="text-[var(--color-text-secondary)]">
                  Output Fields
                </Text>
                <Badge size="1" variant="soft" style={{ background: '#d94224' + '22', color: '#d94224' }}>
                  <Text size="1">{outputCount}</Text>
                </Badge>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}; 