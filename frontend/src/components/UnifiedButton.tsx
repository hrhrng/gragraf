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
            h-8 px-3 rounded-lg flex items-center justify-center
            transition-all duration-200
            border border-[var(--color-border-primary)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${variant === 'primary' 
              ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white' 
              : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
            }
            ${isHovered && !disabled ? 'border-[var(--color-accent)] shadow-lg shadow-violet-500/20 scale-110 -translate-y-0.5' : ''}
            ${className}
          `}
        >
          {children}
          
          {/* Subtle inner highlight */}
          <div
            className={`
              absolute inset-0 rounded-lg
              pointer-events-none
              transition-opacity duration-200
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />
        </button>
      </div>
    </Tooltip>
  );
};