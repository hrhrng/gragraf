import React, { useState } from 'react';
import { Tooltip } from '@radix-ui/themes';

interface UnifiedButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  tooltip: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  size?: '1' | '2' | '3';
  className?: string;
}

export const UnifiedButton: React.FC<UnifiedButtonProps> = ({ 
  children, 
  onClick, 
  tooltip, 
  variant = 'secondary',
  disabled = false,
  size = '2',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip content={tooltip}>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={onClick}
          disabled={disabled}
          className={`
            w-7 h-7 rounded flex items-center justify-center
            transition-all duration-200
            border
            disabled:opacity-50 disabled:cursor-not-allowed
            ${variant === 'primary' 
              ? 'bg-blue-900/20 border-blue-700/30 text-blue-300'
              : 'bg-gray-700/20 border-gray-600/30 text-gray-300'
            }
            ${isHovered && !disabled && variant === 'primary' ? 'bg-blue-800/30 text-blue-200 border-blue-600/40 scale-110 -translate-y-0.5' : ''}
            ${isHovered && !disabled && variant === 'secondary' ? 'bg-gray-600/30 text-gray-200 border-gray-500/40 scale-110 -translate-y-0.5' : ''}
            ${className}
          `}
        >
          {children}
        </button>
      </div>
    </Tooltip>
  );
};