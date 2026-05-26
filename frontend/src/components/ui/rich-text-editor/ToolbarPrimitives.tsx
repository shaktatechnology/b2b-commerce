'use client';

import * as React from 'react';
import { cn } from '@/src/lib/utils';

// Toolbar Button Primitive
interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ className, active, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          active && 'bg-zinc-100 text-zinc-900 font-bold',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ToolbarButton.displayName = 'ToolbarButton';

// Toolbar Separator Primitive
export const ToolbarSeparator = () => (
  <div className="w-px h-6 bg-zinc-200 self-center mx-1" />
);

// Heading Dropdown Option
export interface HeadingOption {
  label: string;
  value: string;
  styleClass: string;
}

interface HeadingDropdownProps {
  currentValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

const HEADING_OPTIONS: HeadingOption[] = [
  { label: 'Paragraph', value: 'paragraph', styleClass: 'text-sm font-normal' },
  { label: 'Heading 1', value: '1', styleClass: 'text-xl font-bold' },
  { label: 'Heading 2', value: '2', styleClass: 'text-lg font-bold' },
  { label: 'Heading 3', value: '3', styleClass: 'text-md font-bold' },
  { label: 'Heading 4', value: '4', styleClass: 'text-sm font-bold' },
];

export const HeadingDropdown: React.FC<HeadingDropdownProps> = ({
  currentValue,
  onSelect,
  disabled,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption = HEADING_OPTIONS.find(opt => opt.value === currentValue) || HEADING_OPTIONS[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-9 min-w-[110px]"
      >
        <span className="truncate">{activeOption.label}</span>
        <svg
          className={cn('h-4 w-4 text-zinc-400 transition-transform duration-200', isOpen && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-44 origin-top-left rounded-xl border border-zinc-100 bg-white p-1 shadow-lg focus:outline-none animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-col gap-0.5" role="none">
            {HEADING_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2 text-left text-zinc-700 hover:bg-zinc-50 transition-colors',
                  option.value === currentValue && 'bg-zinc-50 text-zinc-900 font-bold',
                  option.styleClass
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
