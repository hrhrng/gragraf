import React, { useState } from 'react';
import { PlayIcon, LayoutIcon } from '@radix-ui/react-icons';

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
          absolute -top-12 left-1/2 transform -translate-x-1/2 
          bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]
          text-[var(--color-text-primary)] text-xs px-3 py-1.5 rounded-lg 
          backdrop-blur-sm whitespace-nowrap transition-all duration-200
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          pointer-events-none
        `}
        style={{
          fontFamily: 'Inter, Arial, sans-serif',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-[var(--color-bg-secondary)]"></div>
      </div>
      
      {/* Dock Item */}
      <div
        className={`
          relative overflow-hidden
          transition-all duration-200 ease-out
          ${isHovered ? 'scale-110 -translate-y-0.5' : 'scale-100'}
          cursor-pointer
        `}
        onClick={onClick}
      >
        <div
          className={`
            w-7 h-7 rounded flex items-center justify-center
            transition-all duration-200
            border
            ${variant === 'primary' 
              ? 'bg-blue-900/20 border-blue-700/30 text-blue-300'
              : 'bg-gray-700/20 border-gray-600/30 text-gray-300'
            }
            ${isHovered && variant === 'primary' ? 'bg-blue-800/30 text-blue-200 border-blue-600/40' : ''}
            ${isHovered && variant === 'secondary' ? 'bg-gray-600/30 text-gray-200 border-gray-500/40' : ''}
          `}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export const DockToolbar: React.FC<DockToolbarProps> = ({ onRunWorkflow, onAutoLayout }) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      {/* Dock Container */}
      <div
        className="
          flex items-center gap-2 px-4 py-3
          bg-[var(--color-bg-secondary)]
          border border-[var(--color-border-primary)]
          rounded-xl
          relative
          transition-all duration-200 ease-out
          hover:shadow-lg hover:shadow-violet-500/10
          animate-fade-in
        "
        style={{
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Dock Items */}
        <DockItem
          onClick={onRunWorkflow}
          label="Run Workflow"
          variant="primary"
        >
          <PlayIcon className="w-3 h-3" />
        </DockItem>
        
        {/* Separator */}
        <div 
          className="w-px h-6 mx-1 bg-[var(--color-border-primary)] rounded-full"
        />
        
        <DockItem
          onClick={onAutoLayout}
          label="Auto Layout"
          variant="secondary"
        >
          <LayoutIcon className="w-3 h-3" />
        </DockItem>
      </div>
    </div>
  );
};