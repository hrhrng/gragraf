import React, { useState } from 'react';
import { Button } from '@radix-ui/themes';
import { PlayIcon, BorderSplitIcon } from '@radix-ui/react-icons';

interface DockToolbarProps {
  onRunWorkflow: () => void;
  onAutoLayout: () => void;
}

interface DockItemProps {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
}

const DockItem: React.FC<DockItemProps> = ({ children, onClick, label, variant = 'secondary' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip */}
      <div 
        className={`
          absolute -top-14 left-1/2 transform -translate-x-1/2 
          bg-gray-800/95 text-white text-xs px-3 py-1.5 rounded-md 
          backdrop-blur-sm whitespace-nowrap transition-all duration-200
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          pointer-events-none
        `}
        style={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-800/95"></div>
      </div>
      
      {/* Dock Item */}
      <div
        className={`
          relative overflow-hidden
          transition-all duration-500 ease-out
          ${isHovered ? 'scale-150 -translate-y-2' : 'scale-100'}
          cursor-pointer
          transform-gpu
        `}
        onClick={onClick}
        style={{
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className={`
            w-12 h-12 rounded-2xl
            flex items-center justify-center
            transition-all duration-300
            relative
            ${variant === 'primary' 
              ? 'text-white' 
              : 'text-gray-700 dark:text-gray-200'
            }
            ${isHovered ? 'shadow-2xl' : 'shadow-lg'}
          `}
          style={{
            background: variant === 'primary' 
              ? `linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)`
              : `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)`,
            boxShadow: variant === 'primary'
              ? `
                0 4px 20px rgba(59,130,246,0.3),
                0 1px 3px rgba(0,0,0,0.2),
                inset 0 1px 1px rgba(255,255,255,0.2)
              `
              : `
                0 4px 20px rgba(0,0,0,0.1),
                0 1px 3px rgba(0,0,0,0.1),
                inset 0 1px 1px rgba(255,255,255,0.2),
                inset 0 -1px 1px rgba(0,0,0,0.1)
              `,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {children}
          
          {/* Inner glow effect */}
          <div
            className={`
              absolute inset-0 rounded-2xl
              pointer-events-none
              transition-opacity duration-300
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              background: variant === 'primary'
                ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 70%)',
            }}
          />
        </div>
        
        {/* Reflection at bottom */}
        <div
          className={`
            absolute top-full left-0 right-0 h-full rounded-b-2xl
            pointer-events-none transition-opacity duration-300
            ${isHovered ? 'opacity-40' : 'opacity-20'}
          `}
          style={{
            background: variant === 'primary' 
              ? 'linear-gradient(to bottom, rgba(59,130,246,0.2) 0%, transparent 60%)'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 60%)',
            transform: 'scaleY(-1)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, transparent 50%)',
          }}
        />
      </div>
    </div>
  );
};

export const DockToolbar: React.FC<DockToolbarProps> = ({ onRunWorkflow, onAutoLayout }) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      {/* Dock Container */}
      <div
        className="
          flex items-end gap-1 px-4 py-3
          backdrop-blur-xl
          rounded-3xl
          relative
          transition-all duration-300 ease-out
          hover:scale-105
        "
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(255,255,255,0.12) 0%, 
              rgba(255,255,255,0.06) 50%, 
              rgba(255,255,255,0.08) 100%
            )
          `,
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.12),
            0 2px 8px rgba(0,0,0,0.08),
            inset 0 1px 1px rgba(255,255,255,0.25),
            inset 0 -1px 1px rgba(0,0,0,0.05)
          `,
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      >
        {/* Top highlight */}
        <div 
          className="absolute top-0 left-2 right-2 h-px rounded-full opacity-50"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)'
          }}
        />
        
        {/* Dock reflection at bottom */}
        <div 
          className="absolute top-full left-0 right-0 h-full rounded-b-3xl pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 50%)',
            transform: 'scaleY(-1)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%)',
          }}
        />
        
        {/* Dock Items */}
        <DockItem
          onClick={onRunWorkflow}
          label="Run Workflow"
          variant="primary"
        >
          <PlayIcon className="w-6 h-6" />
        </DockItem>
        
        {/* Separator */}
        <div 
          className="w-0.5 h-8 mx-2 rounded-full opacity-40"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
          }}
        />
        
        <DockItem
          onClick={onAutoLayout}
          label="Auto Layout"
          variant="secondary"
        >
          <BorderSplitIcon className="w-6 h-6" />
        </DockItem>
      </div>
    </div>
  );
};