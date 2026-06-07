/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarkdownBlock, ListItem } from '../types';

/**
 * Checks if the text has RTL content (Persian / Arabic character range)
 */
export function isRTLText(text: string): boolean {
  if (!text) return false;
  // Persian and Arabic Unicode Blocks
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u08A0-\u08FF]/;
  return rtlRegex.test(text);
}

/**
 * Escapes HTML characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parse inline markdown characters into high-contrast HTML elements.
 * Uses a robust placeholder technique to avoid nested formatting corruption.
 */
export function parseInlineContent(text: string): string {
  if (!text) return '';
  
  let result = escapeHtml(text);
  
  // 1. Temporary placeholder array to hide inline code from subsequent regexes
  const codeSpans: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_, code) => {
    const placeholder = `___CODESPAN_PLACEHOLDER_${codeSpans.length}___`;
    codeSpans.push(`<code class="px-1.5 py-0.5 rounded bg-gray-100 text-rose-500 text-xs font-mono dark:bg-zinc-800 dark:text-rose-400 border border-gray-200 dark:border-zinc-700">${code}</code>`);
    return placeholder;
  });

  // 2. Parse Images: ! [alt] (url)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    return `<img class="max-w-full h-auto rounded-lg shadow-md my-4 border border-gray-100 dark:border-zinc-800 inline-block" src="${url}" alt="${alt}" referrerpolicy="no-referrer" />`;
  });

  // 3. Parse Links: [text] (url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    return `<a class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium underline transition-all active:text-indigo-900" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  // 4. Parse Formatting: Strikethrough (~~), Bold-Italic (*** or ___), Bold (** or __), Italic (* or _)
  result = result.replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-400 dark:text-zinc-500">$1</del>');
  result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  result = result.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 5. Restore code spans
  codeSpans.forEach((formattedCode, index) => {
    result = result.replace(`___CODESPAN_PLACEHOLDER_${index}___`, formattedCode);
  });

  return result;
}

/**
 * Parse structured document body to support dynamic line parsing,
 * block categorization, nested structures, table parsing, and RTL tagging.
 */
export function parseMarkdownToBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  let currentBlock: Partial<MarkdownBlock> | null = null;
  
  // Track continuous multi-line groups
  let i = 0;
  
  const generateId = () => Math.random().toString(36).substring(2, 11);

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Code Block starts
    if (trimmed.startsWith('```')) {
      // Flush previous block
      if (currentBlock) {
        blocks.push(currentBlock as MarkdownBlock);
        currentBlock = null;
      }

      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      blocks.push({
        id: generateId(),
        type: 'code_block',
        lang: lang || 'text',
        code: codeLines.join('\n')
      });
      i++; // skip closing ```
      continue;
    }

    // 2. Horizontal Rule: ---, ***, ___
    if (/^(---|===\*|\*\*\*|___)\s*$/.test(trimmed) && trimmed.length >= 3) {
      if (currentBlock) {
        blocks.push(currentBlock as MarkdownBlock);
        currentBlock = null;
      }
      blocks.push({
        id: generateId(),
        type: 'horizontal_rule'
      });
      i++;
      continue;
    }

    // 3. Headings: # to ######
    const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (currentBlock) {
        blocks.push(currentBlock as MarkdownBlock);
        currentBlock = null;
      }
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const content = headingMatch[2].trim();
      blocks.push({
        id: generateId(),
        type: 'heading',
        level,
        content,
        isRTL: isRTLText(content)
      });
      i++;
      continue;
    }

    // 4. Blockquotes: starting with >
    if (trimmed.startsWith('>')) {
      if (currentBlock && currentBlock.type !== 'blockquote') {
        blocks.push(currentBlock as MarkdownBlock);
        currentBlock = null;
      }

      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        // Remove leading > and match spacing
        const matchLine = lines[i].trim().replace(/^>\s?/, '');
        quoteLines.push(matchLine);
        i++;
      }

      const content = quoteLines.join('\n');
      blocks.push({
        id: generateId(),
        type: 'blockquote',
        content,
        isRTL: isRTLText(content)
      });
      continue;
    }

    // 5. Tables: Detect columns and divider indicators
    // Table indicator lookahead: checks if current line has | divider
    // and if the next line exists and matches the divider line like |---|---| or | :--- | :---: |
    if (trimmed.startsWith('|')) {
      const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
      const isTableHeaderDivider = /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(nextLine);
      
      if (isTableHeaderDivider) {
        if (currentBlock) {
          blocks.push(currentBlock as MarkdownBlock);
          currentBlock = null;
        }

        // Parse Table Heading
        const headerCells = trimmed
          .split('|')
          .map(c => c.trim())
          .filter((_, idx, arr) => {
            // Remove leading/trailing empty cells from splitting GFM rows
            if (idx === 0 && rawLine.trim().startsWith('|') && arr[idx] === '') return false;
            if (idx === arr.length - 1 && rawLine.trim().endsWith('|') && arr[idx] === '') return false;
            return true;
          });

        // Parse Aligments
        const dividerCells = nextLine
          .split('|')
          .map(c => c.trim())
          .filter((_, idx, arr) => {
            if (idx === 0 && nextLine.startsWith('|') && arr[idx] === '') return false;
            if (idx === arr.length - 1 && nextLine.endsWith('|') && arr[idx] === '') return false;
            return true;
          });

        const alignments = dividerCells.map(cell => {
          const l = cell.startsWith(':');
          const r = cell.endsWith(':');
          if (l && r) return 'center' as const;
          if (r) return 'right' as const;
          return 'left' as const;
        });

        const rows: string[][] = [];
        i += 2; // Skip headers and separator lines

        // Collect Table Data lines
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const currentLineTrimmed = lines[i].trim();
          const rawRow = lines[i];
          const dataCells = currentLineTrimmed
            .split('|')
            .map(c => c.trim())
            .filter((_, idx, arr) => {
              if (idx === 0 && currentLineTrimmed.startsWith('|') && arr[idx] === '') return false;
              if (idx === arr.length - 1 && currentLineTrimmed.endsWith('|') && arr[idx] === '') return false;
              return true;
            });
          
          rows.push(dataCells);
          i++;
        }

        const tableContentStr = headerCells.join(' ') + ' ' + rows.map(r => r.join(' ')).join(' ');
        
        blocks.push({
          id: generateId(),
          type: 'table',
          headers: headerCells,
          rows,
          alignments,
          isRTL: isRTLText(tableContentStr)
        });
        continue;
      }
    }

    // 6. Lists (Ordered, Unordered, and Tasks with Nesting)
    // Matches: - text, * text, + text, 1. text, - [ ] task, - [x] task
    const listRegex = /^(\s*)([-*+]|\d+\.)\s+(.*)$/;
    if (listRegex.test(rawLine)) {
      if (currentBlock && currentBlock.type !== 'list') {
        blocks.push(currentBlock as MarkdownBlock);
        currentBlock = null;
      }

      const listItems: ListItem[] = [];
      const isOrdered = /^\s*\d+\./.test(rawLine);

      // Recursive flat-list structure tracker to facilitate multi-level nesting
      while (i < lines.length && listRegex.test(lines[i])) {
        const itemMatch = lines[i].match(listRegex);
        if (!itemMatch) break;

        const spacesCount = itemMatch[1].length;
        const bodyContent = itemMatch[3];

        // Level calculated based on approximate 2 or 4 spaces indentation
        const itemLevel = spacesCount > 0 ? Math.floor(spacesCount / 2) : 0;

        // Check for task checkbox: [ ] or [x]
        let checked: boolean | undefined = undefined;
        let itemText = bodyContent;
        if (bodyContent.startsWith('[ ]') || bodyContent.startsWith('[x]') || bodyContent.startsWith('[X]')) {
          checked = bodyContent.startsWith('[x]') || bodyContent.startsWith('[X]');
          itemText = bodyContent.slice(3).trim();
        }

        listItems.push({
          id: generateId(),
          text: itemText,
          checked,
          level: itemLevel
        });

        i++;
      }

      // Detect if we have any RTL content in list
      const hasRTL = listItems.some(item => isRTLText(item.text));

      blocks.push({
        id: generateId(),
        type: 'list',
        ordered: isOrdered,
        items: listItems,
        isRTL: hasRTL
      });
      continue;
    }

    // 7. Empty lines: flush paragraph boundary
    if (!trimmed) {
      if (currentBlock) {
        blocks.push(currentBlock as MarkdownBlock);
        currentBlock = null;
      }
      i++;
      continue;
    }

    // 8. Plain Paragraph with multiline wrapping
    if (!currentBlock) {
      currentBlock = {
        id: generateId(),
        type: 'paragraph',
        content: trimmed,
        isRTL: isRTLText(trimmed)
      };
    } else {
      currentBlock.content = (currentBlock.content || '') + ' ' + trimmed;
      if (isRTLText(trimmed)) {
        currentBlock.isRTL = true;
      }
    }
    i++;
  }

  // Flush remaining paragraphs
  if (currentBlock) {
    blocks.push(currentBlock as MarkdownBlock);
  }

  return blocks;
}

/**
 * Compile AST/Blocks representation into static HTML strings styled via Tailwind
 */
export function renderBlocksToHTML(blocks: MarkdownBlock[]): string {
  if (!blocks || blocks.length === 0) {
    return `<div class="text-zinc-400 dark:text-zinc-500 italic py-10 text-center select-none font-sans">Start typing your document in Markdown to see the preview...</div>`;
  }

  return blocks
    .map(block => {
      const dirAttr = block.isRTL ? 'dir="rtl"' : 'dir="ltr"';
      const alignClass = block.isRTL ? 'text-right font-sans-fa' : 'text-left';
      const containerClass = `mb-6 leading-relaxed ${alignClass}`;

      switch (block.type) {
        case 'heading': {
          const contentHTML = parseInlineContent(block.content || '');
          const classes: Record<number, string> = {
            1: 'text-3xl font-extrabold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2 mt-8 mb-4 tracking-tight',
            2: 'text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-6 mb-3 tracking-tight',
            3: 'text-xl font-semibold text-zinc-800 dark:text-zinc-200 mt-5 mb-2.5',
            4: 'text-lg font-semibold text-zinc-700 dark:text-zinc-300 mt-4 mb-2',
            5: 'text-base font-medium text-zinc-600 dark:text-zinc-450 mt-4 mb-1.5',
            6: 'text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase mt-4 mb-1.5 tracking-wider'
          };
          const styleLevel = block.level || 1;
          const tag = `h${styleLevel}`;
          return `<${tag} ${dirAttr} class="${classes[styleLevel]}">${contentHTML}</${tag}>`;
        }
        case 'paragraph': {
          const contentHTML = parseInlineContent(block.content || '');
          return `<p ${dirAttr} class="${containerClass} text-zinc-700 dark:text-zinc-300 antialiased font-sans text-base">${contentHTML}</p>`;
        }
        case 'blockquote': {
          const innerParagraphs = (block.content || '')
            .split('\n')
            .map(p => `<p>${parseInlineContent(p)}</p>`)
            .join('');
          const borderSide = block.isRTL ? 'border-r-4 pr-4 pl-0' : 'border-l-4 pl-4 pr-0';
          return `<blockquote ${dirAttr} class="my-6 ${borderSide} border-indigo-500/80 bg-zinc-50 dark:bg-zinc-900/40 rounded-r py-3.5 text-zinc-600 dark:text-zinc-400 italic ${alignClass}">${innerParagraphs}</blockquote>`;
        }
        case 'code_block': {
          const codeString = escapeHtml(block.code || '');
          return `<div class="relative group my-6 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 shadow-sm font-mono text-zinc-200 text-sm">
            <div class="flex items-center justify-between px-4 py-2 bg-zinc-900 text-zinc-400 text-xs select-none">
              <span>${block.lang || 'code'}</span>
            </div>
            <pre class="p-4 overflow-x-auto text-left leading-relaxed"><code class="language-${block.lang}">${codeString}</code></pre>
          </div>`;
        }
        case 'horizontal_rule': {
          return `<hr class="my-8 border-t-2 border-zinc-200 dark:border-zinc-800" />`;
        }
        case 'table': {
          const alignmentsMap = block.alignments || [];
          const headersHTML = (block.headers || [])
            .map((header, idx) => {
              const align = alignmentsMap[idx] || 'left';
              const alignCls = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
              return `<th class="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold border-b border-zinc-200 dark:border-zinc-800 text-sm ${alignCls}">${parseInlineContent(header)}</th>`;
            })
            .join('');

          const rowsHTML = (block.rows || [])
            .map(row => {
              const cellsHTML = row
                .map((cell, idx) => {
                  const align = alignmentsMap[idx] || 'left';
                  const alignCls = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                  return `<td class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 text-sm ${alignCls}">${parseInlineContent(cell)}</td>`;
                })
                .join('');
              return `<tr class="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">${cellsHTML}</tr>`;
            })
            .join('');

          return `<div class="my-6 max-w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <table ${dirAttr} class="w-full border-collapse text-left ${alignClass}">
              <thead>
                <tr>${headersHTML}</tr>
              </thead>
              <tbody>
                ${rowsHTML}
              </tbody>
            </table>
          </div>`;
        }
        case 'list': {
          // Re-assemble list into structured nested nodes using absolute levels
          let html = '';
          const items = block.items || [];
          let currentLevel = -1;
          const openTags: string[] = [];

          const tagType = block.ordered ? 'ol' : 'ul';
          const listCls = block.ordered 
            ? 'list-decimal list-inside space-y-2' 
            : 'list-disc list-inside space-y-2';

          for (let k = 0; k < items.length; k++) {
            const item = items[k];
            
            // Manage level structures and nested block indentations
            while (item.level > currentLevel) {
              openTags.push(tagType);
              html += `<${tagType} class="${listCls} ml-5 ${k === 0 ? '' : 'mt-2'}">`;
              currentLevel++;
            }
            while (item.level < currentLevel) {
              const closedTag = openTags.pop();
              html += `</${closedTag}>`;
              currentLevel--;
            }

            const isTask = item.checked !== undefined;
            const itemContent = parseInlineContent(item.text);

            if (isTask) {
              const checkIcon = item.checked
                ? `<span class="inline-flex items-center justify-center w-4 h-4 mr-2 bg-indigo-500 rounded text-white text-[10px] font-bold">✓</span>`
                : `<span class="inline-block w-4 h-4 mr-2 border-2 border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900"></span>`;
              html += `<li class="flex items-start text-zinc-700 dark:text-zinc-300 leading-normal mb-1">
                <span class="mt-1 flex-shrink-0 cursor-default">${checkIcon}</span>
                <span class="flex-1">${itemContent}</span>
              </li>`;
            } else {
              html += `<li class="text-zinc-700 dark:text-zinc-300 leading-normal mb-1">${itemContent}</li>`;
            }
          }

          while (openTags.length > 0) {
            const closedTag = openTags.pop();
            html += `</${closedTag}>`;
          }

          return `<div ${dirAttr} class="my-4 ${alignClass}">${html}</div>`;
        }
        default:
          return '';
      }
    })
    .join('');
}

/**
 * Strips all Markdown characters and renders a pure layout suitable for TXT conversion
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  // Strip Headings
  let txt = markdown.replace(/^#{1,6}\s+(.*)$/gm, '$1');
  
  // Strip Bold & Italic
  txt = txt.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  txt = txt.replace(/___([^_]+)___/g, '$1');
  txt = txt.replace(/\*\*([^*]+)\*\*/g, '$1');
  txt = txt.replace(/__([^_]+)__/g, '$1');
  txt = txt.replace(/\*([^*]+)\*/g, '$1');
  txt = txt.replace(/_([^_]+)_/g, '$1');
  
  // Strip code ticks
  txt = txt.replace(/`([^`]+)`/g, '$1');
  txt = txt.replace(/^```[a-zA-Z0-9]*\n([\s\S]*?)^```/gm, '$1');
  
  // Strip Link/Image Syntax
  txt = txt.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1 ($2)');
  txt = txt.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  
  // Strip Task indicators
  txt = txt.replace(/^\s*([-*+])\s+\[([ xX])\]\s+/gm, (_, bullet, check) => {
    return check.trim() ? '[x] ' : '[ ] ';
  });

  // Strip blockquote symbols
  txt = txt.replace(/^\s*>\s?/gm, '');

  return txt;
}
