/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Heading1, Heading2, Heading3, Bold, Italic, Strikethrough, 
  Code, Terminal, Quote, List, ListOrdered, CheckSquare, 
  Table2, Link2, Image as ImageIcon, Minus, AlignRight, RefreshCw, Eraser
} from 'lucide-react';
import { translations } from '../utils/translations';

interface ToolbarProps {
  getTextarea: () => HTMLTextAreaElement | null;
  onContentChange: (newValue: string) => void;
  onClear: () => void;
  forceRTL: boolean;
  onToggleForceRTL: () => void;
  language: 'en' | 'fa';
}

export const Toolbar: React.FC<ToolbarProps> = ({
  getTextarea,
  onContentChange,
  onClear,
  forceRTL,
  onToggleForceRTL,
  language
}) => {
  const t = translations[language];
  const applyFormat = (syntaxStart: string, syntaxEnd: string, placeholder: string) => {
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    let replacement = '';
    let cursorOffset = 0;

    if (selectedText.length > 0) {
      replacement = `${syntaxStart}${selectedText}${syntaxEnd}`;
      cursorOffset = syntaxStart.length + selectedText.length + syntaxEnd.length;
    } else {
      replacement = `${syntaxStart}${placeholder}${syntaxEnd}`;
      cursorOffset = syntaxStart.length + placeholder.length;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onContentChange(newValue);

    // Refocus and place cursor elegantly
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  const insertBlockFormat = (syntax: string) => {
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;
    
    // Check if we are at the start of a line, if not add a newline prefix
    const needsPrevNewline = start > 0 && text[start - 1] !== '\n';
    const prefix = needsPrevNewline ? '\n' : '';
    const formattedText = `${prefix}${syntax}\n`;

    const newValue = text.substring(0, start) + formattedText + text.substring(start);
    onContentChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formattingOptions = [
    {
      label: 'H1 Heading',
      icon: <Heading1 className="w-4 h-4" />,
      action: () => insertBlockFormat('# Heading 1'),
      group: 'text'
    },
    {
      label: 'H2 Heading',
      icon: <Heading2 className="w-4 h-4" />,
      action: () => insertBlockFormat('## Heading 2'),
      group: 'text'
    },
    {
      label: 'H3 Heading',
      icon: <Heading3 className="w-4 h-4" />,
      action: () => insertBlockFormat('### Heading 3'),
      group: 'text'
    },
    {
      label: 'Bold',
      icon: <Bold className="w-4 h-4" />,
      action: () => applyFormat('**', '**', 'bold text'),
      group: 'emphasis'
    },
    {
      label: 'Italic',
      icon: <Italic className="w-4 h-4" />,
      action: () => applyFormat('*', '*', 'italic text'),
      group: 'emphasis'
    },
    {
      label: 'Strikethrough',
      icon: <Strikethrough className="w-4 h-4" />,
      action: () => applyFormat('~~', '~~', 'strikethrough text'),
      group: 'emphasis'
    },
    {
      label: 'Inline Code',
      icon: <Code className="w-4 h-4" />,
      action: () => applyFormat('`', '`', 'code'),
      group: 'code'
    },
    {
      label: 'Code Block',
      icon: <Terminal className="w-4 h-4" />,
      action: () => applyFormat('```javascript\n', '\n```', '// paste code snippet here'),
      group: 'code'
    },
    {
      label: 'Blockquote',
      icon: <Quote className="w-4 h-4" />,
      action: () => insertBlockFormat('> blockquote text'),
      group: 'structure'
    },
    {
      label: 'Bullet List',
      icon: <List className="w-4 h-4" />,
      action: () => insertBlockFormat('- Item 1\n- Item 2'),
      group: 'lists'
    },
    {
      label: 'Numbered List',
      icon: <ListOrdered className="w-4 h-4" />,
      action: () => insertBlockFormat('1. First item\n2. Second item'),
      group: 'lists'
    },
    {
      label: 'Task List',
      icon: <CheckSquare className="w-4 h-4" />,
      action: () => insertBlockFormat('- [ ] Complete task 1\n- [ ] Complete task 2'),
      group: 'lists'
    },
    {
      label: 'GFM Table',
      icon: <Table2 className="w-4 h-4" />,
      action: () => insertBlockFormat('| Column 1 | Column 2 |\n| :--- | :---: |\n| Row 1 Col 1 | Row 1 Col 2 |'),
      group: 'structure'
    },
    {
      label: 'Link',
      icon: <Link2 className="w-4 h-4" />,
      action: () => applyFormat('[', '](https://example.com)', 'link label'),
      group: 'assets'
    },
    {
      label: 'Image Link',
      icon: <ImageIcon className="w-4 h-4" />,
      action: () => applyFormat('![', '](https://images.unsplash.com/photo-1457369804613-52c61a468e7d)', 'image caption'),
      group: 'assets'
    },
    {
      label: 'Horizontal Divider',
      icon: <Minus className="w-4 h-4" />,
      action: () => insertBlockFormat('---'),
      group: 'structure'
    }
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 p-3 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shrink-0 sticky top-0 z-40 select-none">
      <div className="flex flex-wrap items-center gap-1">
        {/* Emphasis Group */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-zinc-800 pr-3 mr-3">
          {formattingOptions.filter(o => o.group === 'emphasis').map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              className="p-1.5 hover:bg-slate-200/80 dark:hover:bg-zinc-850 rounded-md text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={opt.label}
              type="button"
            >
              {opt.icon}
            </button>
          ))}
        </div>

        {/* Headings & Structure Group */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-zinc-800 pr-3 mr-3">
          {formattingOptions.filter(o => o.group === 'text' || o.label === 'Horizontal Divider').map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              className="p-1.5 hover:bg-slate-200/80 dark:hover:bg-zinc-850 rounded-md text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={opt.label}
              type="button"
            >
              {opt.icon}
            </button>
          ))}
        </div>

        {/* List Group */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-zinc-800 pr-3 mr-3">
          {formattingOptions.filter(o => o.group === 'lists').map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              className="p-1.5 hover:bg-slate-200/80 dark:hover:bg-zinc-850 rounded-md text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={opt.label}
              type="button"
            >
              {opt.icon}
            </button>
          ))}
        </div>

        {/* Table, Quote, Asset Group */}
        <div className="flex items-center gap-0.5">
          {formattingOptions.filter(o => o.group === 'assets' || o.group === 'code' || o.label === 'Blockquote' || o.label === 'GFM Table').map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              className="p-1.5 hover:bg-slate-200/80 dark:hover:bg-zinc-850 rounded-md text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={opt.label}
              type="button"
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Persian / RTL Assist Toggle */}
        <button
          onClick={onToggleForceRTL}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer border ${
            forceRTL 
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900' 
              : 'hover:bg-slate-200/80 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-transparent hover:text-slate-800'
          }`}
          title="Force Right-to-Left (RTL) Layout for Persian Documents"
          type="button"
        >
          <AlignRight className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">{t.forceRtl}</span>
        </button>

        {/* Erase / Clear Canvas */}
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 transition-all cursor-pointer"
          title="Clear Document Canvas"
          type="button"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">{t.clearWorkspace}</span>
        </button>
      </div>
    </div>
  );
};
