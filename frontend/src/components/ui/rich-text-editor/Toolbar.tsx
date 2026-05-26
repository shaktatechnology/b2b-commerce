'use client';

import * as React from 'react';
import { Editor } from '@tiptap/react';
import { ToolbarButton, ToolbarSeparator, HeadingDropdown } from './ToolbarPrimitives';

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor, disabled }) => {
  if (!editor) return null;

  // Determine current active heading
  let currentHeading = 'paragraph';
  if (editor.isActive('heading', { level: 1 })) currentHeading = '1';
  else if (editor.isActive('heading', { level: 2 })) currentHeading = '2';
  else if (editor.isActive('heading', { level: 3 })) currentHeading = '3';
  else if (editor.isActive('heading', { level: 4 })) currentHeading = '4';

  const handleHeadingSelect = (level: string) => {
    if (level === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: parseInt(level) as any }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50/50 p-2">
      {/* 1. Heading Dropdown */}
      <HeadingDropdown
        currentValue={currentHeading}
        onSelect={handleHeadingSelect}
        disabled={disabled}
      />

      <ToolbarSeparator />

      {/* 2. Bold */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </svg>
      </ToolbarButton>

      {/* 3. Italic */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4" />
          <line x1="14" y1="20" x2="5" y2="20" />
          <line x1="15" y1="4" x2="9" y2="20" />
        </svg>
      </ToolbarButton>

      {/* 4. Underline */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        disabled={disabled || !editor.can().chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3v7a6 6 0 0 0 12 0V3" />
          <line x1="4" y1="21" x2="20" y2="21" />
        </svg>
      </ToolbarButton>

      {/* 5. Strike */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        disabled={disabled || !editor.can().chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4H9a3 3 0 0 0-2.83 4H17a4 4 0 0 1-3.13 4H7" />
          <path d="M14 12v.5a3.5 3.5 0 0 1-5 3H16" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </ToolbarButton>

      <ToolbarSeparator />

      {/* 6. Bullet List */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        disabled={disabled || !editor.can().chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3" cy="6" r="1.5" fill="currentColor" />
          <circle cx="3" cy="12" r="1.5" fill="currentColor" />
          <circle cx="3" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </ToolbarButton>

      {/* 7. Ordered List */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        disabled={disabled || !editor.can().chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <path d="M4 4h1v4H3" />
          <path d="M4 14a1 1 0 0 1 1 1c0 .72-.5 1-1 1.5L3 18h2" />
        </svg>
      </ToolbarButton>

      {/* 8. Blockquote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        disabled={disabled || !editor.can().chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M10 8h4" />
          <path d="M10 12h4" />
        </svg>
      </ToolbarButton>

      <ToolbarSeparator />

      {/* 9. Undo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </ToolbarButton>

      {/* 10. Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
      </ToolbarButton>
    </div>
  );
};
