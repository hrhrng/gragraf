import React, { useState, useRef, useEffect } from 'react';
import { DropdownMenu, Button, Text, Separator } from '@radix-ui/themes';
import { 
  HamburgerMenuIcon, 
  UploadIcon, 
  DownloadIcon,
  ClipboardIcon,
  FileTextIcon
} from '@radix-ui/react-icons';

interface WorkflowMenuProps {
  onImport: () => void;
  onExport: () => void;
}

export const WorkflowMenu: React.FC<WorkflowMenuProps> = ({
  onImport,
  onExport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('Click detected, menuRef:', menuRef.current, 'target:', event.target);
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        console.log('Clicking outside, closing menu');
        setIsOpen(false);
      }
    };

    // 使用 click 事件而不是 mousedown，并且添加捕获阶段
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded flex items-center justify-center border bg-gray-700/20 border-gray-600/30 text-gray-300 hover:bg-gray-600/30 hover:text-gray-200 hover:border-gray-500/40"
      >
        <HamburgerMenuIcon className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg shadow-lg z-50">
          {/* Import Section */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImport();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-white hover:bg-[var(--color-bg-tertiary)] cursor-pointer w-full text-left"
          >
            <UploadIcon className="w-4 h-4" />
            <Text size="2">Import Workflow</Text>
          </button>
          
          <div className="my-1 bg-[var(--color-border-primary)] h-px"></div>
          
          {/* Export Section */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-white hover:bg-[var(--color-bg-tertiary)] cursor-pointer w-full text-left"
          >
            <DownloadIcon className="w-4 h-4" />
            <Text size="2">Export Workflow</Text>
          </button>
        </div>
      )}
    </div>
  );
}; 