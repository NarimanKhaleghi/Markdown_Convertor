/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { isRTLText } from '../utils/markdownParser';
import { translations } from '../utils/translations';

interface EditorPanelProps {
  content: string;
  onContentChange: (value: string) => void;
  onImportFile: (file: File) => void;
  wordCount: number;
  characterCount: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  forceRTL: boolean;
  language: 'en' | 'fa';
  onSelectText?: (text: string) => void;
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  content,
  onContentChange,
  onImportFile,
  wordCount,
  characterCount,
  textareaRef,
  forceRTL,
  language,
  onSelectText,
  onScroll
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const t = translations[language];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onImportFile(files[0]);
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    if (!onSelectText) return;
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const selected = textarea.value.substring(start, end);
      onSelectText(selected);
    } else {
      onSelectText('');
    }
  };

  // Automated language reading line alignment analysis
  const autoDetectRTL = isRTLText(content.substring(0, 300));
  const isCurrentlyRTL = forceRTL || autoDetectRTL;

  return (
    <div 
      className="relative flex flex-col flex-1 h-full min-w-0 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-850"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Editorial Canvas Area */}
      <div className="flex-1 min-h-0 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onSelect={handleSelect}
          onScroll={onScroll}
          dir={isCurrentlyRTL ? 'rtl' : 'ltr'}
          className={`w-full h-full p-8 resize-none focus:outline-none bg-transparent text-slate-755 dark:text-zinc-200 font-mono text-sm leading-relaxed custom-scrollbar ${
            isCurrentlyRTL ? 'text-right font-sans-fa' : 'text-left'
          }`}
          placeholder={t.placeholderEditor}
          spellCheck={false}
          id="editorTextArea"
        />

        {/* Drag and Drop Upload Visual Overlay state */}
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-600/10 dark:bg-indigo-500/15 backdrop-blur-xs flex flex-col items-center justify-center border-4 border-dashed border-indigo-500 rounded-lg p-6 z-30 transition-all">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-lg text-indigo-600 dark:text-indigo-400 mb-4 animate-bounce">
              <FileDown className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1 font-sans-fa">
              {language === 'fa' ? 'سند خود را رها کنید' : 'Drop your document here'}
            </h4>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs font-sans-fa">
              {language === 'fa' ? 'پشتیبانی از فایل‌های MD، TXT و DOCX' : 'Supports MD, TXT and DOCX files'}
            </p>
          </div>
        )}
      </div>

      {/* Editor footer status bar */}
      <footer className="flex items-center justify-between gap-6 px-6 py-3 bg-white dark:bg-zinc-950 text-[11px] text-slate-500 dark:text-zinc-500 border-t border-slate-200 dark:border-zinc-850 select-none font-sans shrink-0">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-zinc-500 font-bold tracking-wider text-[10px]">{t.words}</span>
            <strong className="text-slate-700 dark:text-zinc-350">{wordCount}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-zinc-500 font-bold tracking-wider text-[10px]">{t.characters}</span>
            <strong className="text-slate-700 dark:text-zinc-350">{characterCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout alignment notification label */}
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-zinc-500 font-bold tracking-wider text-[10px]">{t.align}</span>
            <strong className="text-slate-705 dark:text-zinc-350 text-[11px] font-medium">{isCurrentlyRTL ? 'RTL' : 'LTR'}</strong>
          </span>
        </div>
      </footer>
    </div>
  );
};
