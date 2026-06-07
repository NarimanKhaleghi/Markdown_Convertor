/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Eye, BookOpen, Copy } from 'lucide-react';
import { translations } from '../utils/translations';

interface PreviewPanelProps {
  htmlContent: string;
  isRTL: boolean;
  language: 'en' | 'fa';
  onCopyPlainText: () => void;
  selectedText: string;
  previewRef: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  htmlContent,
  isRTL,
  language,
  onCopyPlainText,
  selectedText,
  previewRef,
  onScroll
}) => {
  const isDocEmpty = !htmlContent || htmlContent.includes('Start typing your document');
  const t = translations[language];

  // Selection highlighting effect
  useEffect(() => {
    if (!previewRef || !previewRef.current) return;
    const container = previewRef.current;

    // 1. Clear current highlights
    const existingMarks = container.querySelectorAll('.decomark-highlight');
    existingMarks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });

    if (!selectedText || selectedText.trim().length < 3) return;

    // Remove common Markdown characters to match plain word sequences
    const cleanSearchStr = selectedText
      .trim()
      .replace(/[*_`#~[\]()|:x-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanSearchStr.length < 3) return;

    const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodesToReplace: { node: Text; index: number; length: number }[] = [];

    let textNode: Text | null = null;
    while ((textNode = walk.nextNode() as Text | null)) {
      const parent = textNode.parentNode as HTMLElement;
      if (
        parent && 
        (parent.tagName === 'SCRIPT' || 
         parent.tagName === 'STYLE' || 
         parent.classList.contains('decomark-highlight'))
      ) {
        continue;
      }
      const val = textNode.textContent || '';
      const idx = val.toLowerCase().indexOf(cleanSearchStr.toLowerCase());
      if (idx !== -1) {
        nodesToReplace.push({ node: textNode, index: idx, length: cleanSearchStr.length });
      }
    }

    // Replace from back to front
    for (let i = nodesToReplace.length - 1; i >= 0; i--) {
      const { node, index, length } = nodesToReplace[i];
      const val = node.textContent || '';
      const parent = node.parentNode;
      if (!parent) continue;

      const before = val.substring(0, index);
      const match = val.substring(index, index + length);
      const after = val.substring(index + length);

      const beforeNode = document.createTextNode(before);
      const markNode = document.createElement('mark');
      markNode.className = 'decomark-highlight bg-amber-200 dark:bg-yellow-500/35 text-slate-900 dark:text-zinc-50 rounded px-1 py-0.5 cursor-default transition-all pointer-events-none select-none';
      (markNode.style as any).userSelect = 'none';
      markNode.textContent = match;
      const afterNode = document.createTextNode(after);

      parent.insertBefore(beforeNode, node);
      parent.insertBefore(markNode, node);
      parent.insertBefore(afterNode, node);
      parent.removeChild(node);
    }
  }, [selectedText, htmlContent, previewRef]);

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-slate-50 dark:bg-zinc-950">
      {/* Header bar for Preview container */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 font-sans text-xs text-slate-500 select-none shrink-0">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-zinc-400">
          <Eye className="w-4 h-4 text-indigo-650" />
          <span>{language === 'fa' ? 'پیش‌نمایش سند زنده' : 'Live Document Preview'}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Copy Plain Text Button */}
          <button
            onClick={onCopyPlainText}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-indigo-650 dark:text-zinc-350 dark:hover:text-indigo-400 bg-slate-50 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded border border-slate-200 hover:border-indigo-200 dark:border-zinc-800 transition-colors shadow-xs cursor-pointer mr-2"
            type="button"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{t.copyPlainText}</span>
          </button>
          
          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-100/50 uppercase tracking-wider">
            {isRTL ? (language === 'fa' ? 'تراز راست‌گرد (RTL)' : 'RTL Layout') : (language === 'fa' ? 'تراز چپ‌گرد (LTR)' : 'LTR Layout')}
          </span>
        </div>
      </div>

      {/* Main Preview Render Canvas */}
      <div ref={previewRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        {/* Render HTML content wrapper */}
        <div 
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`markdown-body prose prose-slate dark:prose-invert max-w-none transition-all duration-200 ${
            isRTL ? 'text-right font-sans-fa' : 'text-left font-sans'
          }`}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Dynamic empty helper panel visible to users */}
        {isDocEmpty && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center select-none font-sans-fa">
            <BookOpen className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
            <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {language === 'fa' ? 'راهنمای سریع نشانه‌گذاری' : 'Markdown Formatting Guide'}
            </h4>
            <div className="grid grid-cols-2 gap-4 mt-4 max-w-xs text-[10px] text-zinc-500 text-right font-mono">
              <div className="bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded">
                <div className="font-bold text-indigo-500 mb-0.5">{language === 'fa' ? 'برجسته کردن' : 'Bold / Italic'}</div>
                <div dir="ltr">**bold** / *italic*</div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded">
                <div className="font-bold text-indigo-500 mb-0.5">{language === 'fa' ? 'عناوین اصلی' : 'Headings'}</div>
                <div dir="ltr"># H1 to ###### H6</div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded">
                <div className="font-bold text-indigo-500 mb-0.5">{language === 'fa' ? 'لیست وظایف' : 'Task Lists'}</div>
                <div dir="ltr">- [ ] open <br />- [x] done</div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded">
                <div className="font-bold text-indigo-500 mb-0.5">{language === 'fa' ? 'جداول داده' : 'GFM Tables'}</div>
                <div dir="ltr">| header | cell |</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
