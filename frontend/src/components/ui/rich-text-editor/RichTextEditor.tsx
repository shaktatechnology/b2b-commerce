'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { RichTextEditorProps } from './types';
import { Toolbar } from './Toolbar';
import { cn } from '@/src/lib/utils';
import './editor-styles.css';

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  disabled = false,
  className,
  error,
  label,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // If it's just an empty paragraph, send an empty string
      if (html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    },
  });

  // Sync external value changes to Tiptap editor
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Don't set content if it's empty paragraph equivalent
      if (value === '' && editor.getHTML() === '<p></p>') {
        return;
      }
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Sync disabled state
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <div className={cn('flex flex-col w-full gap-1.5', className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          {label}
        </label>
      )}
      
      <div
        className={cn(
          'flex flex-col w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors focus-within:border-zinc-400',
          error && 'border-red-400 focus-within:border-red-400',
          disabled && 'bg-zinc-50 opacity-60 pointer-events-none'
        )}
      >
        <Toolbar editor={editor} disabled={disabled} />
        <div className="relative flex-1">
          <EditorContent editor={editor} />
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 mt-0.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
