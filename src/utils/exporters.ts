/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarkdownBlock } from '../types';
import { stripMarkdown } from './markdownParser';

/**
 * Triggers interactive Browser Print rendering.
 * Overlays a printing-specialized stylesheet to hide app toolbars and panels,
 * and styles tables, quotes, headings, and font families recursively.
 */
/**
 * Exports a self-contained, beautiful, responsive HTML document with embedded styles and fonts.
 */
export function exportToHTML(htmlContent: string, fileName: string, isRTL: boolean) {
  const htmlTitle = fileName.replace(/\.[a-zA-Z0-9]+$/, '') || 'Document';
  
  const direction = isRTL ? 'rtl' : 'ltr';
  const align = isRTL ? 'right' : 'left';
  const font = isRTL ? '"Vazir", "Tahoma", system-ui, sans-serif' : 'Inter, system-ui, sans-serif';

  const inlineStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: ${font};
      color: #1e293b;
      line-height: 1.7;
      direction: ${direction};
      text-align: ${align};
    }
    .container {
      max-width: 800px;
      margin: 40px auto;
      padding: 48px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
      border: 1px solid #e2e8f0;
    }
    @media (max-width: 640px) {
      .container {
        margin: 12px;
        padding: 24px;
      }
    }
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a !important;
      font-weight: 700 !important;
      margin-top: 1.6em !important;
      margin-bottom: 0.6em !important;
    }
    h1 { font-size: 2.2em !important; border-bottom: 2px solid #e2e8f0 !important; padding-bottom: 12px !important; margin-top: 0 !important; }
    h2 { font-size: 1.65em !important; border-bottom: 1px solid #f1f5f9 !important; padding-bottom: 8px !important; }
    h3 { font-size: 1.35em !important; }
    h4 { font-size: 1.15em !important; }
    p { margin-top: 0 !important; margin-bottom: 1.25em !important; font-size: 15px !important; color: #334155 !important; }
    
    blockquote {
      margin: 1.5em 0 !important;
      padding: 12px 24px !important;
      border-${isRTL ? 'right' : 'left'}: 4px solid #6366f1 !important;
      background-color: #f8fafc !important;
      color: #475569 !important;
      font-style: italic !important;
    }
    pre {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      padding: 16px !important;
      border-radius: 8px !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      font-size: 13.5px !important;
      overflow-x: auto !important;
      white-space: pre !important;
      margin: 1.5em 0 !important;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      background-color: #f1f5f9 !important;
      padding: 3px 6px !important;
      border-radius: 4px !important;
      font-size: 13px !important;
      color: #0f172a !important;
    }
    pre code {
      background-color: transparent !important;
      padding: 0 !important;
      border-radius: 0 !important;
      font-size: inherit !important;
      color: inherit !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 1.8em 0 !important;
    }
    th, td {
      border: 1px solid #cbd5e1 !important;
      padding: 12px 14px !important;
      font-size: 14.5px !important;
      text-align: ${align} !important;
    }
    th {
      background-color: #f8fafc !important;
      font-weight: 600 !important;
      color: #0f172a !important;
    }
    ul, ol {
      margin-top: 0 !important;
      margin-bottom: 1.25em !important;
      padding-${isRTL ? 'right' : 'left'}: 24px !important;
    }
    li {
      margin-bottom: 6px !important;
      font-size: 15px !important;
      color: #334155 !important;
    }
    hr {
      border: 0 !important;
      border-top: 2px solid #e2e8f0 !important;
      margin: 2.2em 0 !important;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 8px !important;
      display: block;
      margin: 1.5em auto;
    }
    a {
      color: #4f46e5;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `;

  const finalHtml = `<!DOCTYPE html>
<html lang="${isRTL ? 'fa' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlTitle}</title>
  <style>
    ${inlineStyle}
  </style>
</head>
<body>
  <div class="container">
    ${htmlContent}
  </div>
</body>
</html>`;

  const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const formattedName = htmlTitle.replace(/\s+/g, '_') + '.html';
  link.download = formattedName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Packs HTML strings inside a compliant Microsoft Word XML frame,
 * defining properties for margins, heading configurations, fonts,
 * lists, tables, and alignment indices. Downloads it as DOCX container compatible .doc extension.
 */
export function exportToDOCX(htmlContent: string, fileName: string, isRTL: boolean) {
  const docTitle = fileName.replace(/\.[a-zA-Z0-9]+$/, '') || 'Document';
  const direction = isRTL ? 'rtl' : 'ltr';
  const align = isRTL ? 'right' : 'left';
  const font = isRTL ? 'System-UI, "B Nazanin", Arial, sans-serif' : 'Arial, Calibri';

  const docHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${docTitle}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: ${font};
          direction: ${direction};
          text-align: ${align};
          line-height: 1.5;
          margin: 1in;
        }
        h1 { font-size: 20pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 3pt; }
        h2 { font-size: 16pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; color: #1f2937; }
        h3 { font-size: 13pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; color: #374151; }
        p { font-size: 11pt; margin-top: 0; margin-bottom: 6pt; color: #374151; }
        blockquote {
          margin: 12pt 0;
          border-${isRTL ? 'right' : 'left'}: 3px solid #6366f1;
          padding: 6pt 12pt;
          background-color: #f9fafb;
          font-style: italic;
          color: #4b5563;
        }
        table { border-collapse: collapse; width: 100%; margin-top: 12pt; margin-bottom: 12pt; }
        th, td { border: 1px solid #d1d5db; padding: 6pt 8pt; text-align: ${align}; font-size: 10pt; }
        th { background-color: #f3f4f6; font-weight: bold; color: #111827; }
        ul, ol { margin-top: 0; margin-bottom: 6pt; padding-${isRTL ? 'right' : 'left'}: 18pt; }
        li { font-size: 11pt; margin-bottom: 3pt; color: #374151; }
        code { font-family: "Courier New", Courier, monospace; font-size: 9.5pt; background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 2px 4px; }
        pre { font-family: "Courier New", Courier, monospace; font-size: 9.5pt; background-color: #1e1e1e; color: #d4d4d4; padding: 12pt; border-radius: 6px; overflow-x: auto; margin-top: 12pt; margin-bottom: 12pt; }
      </style>
    </head>
    <body dir="${direction}">
      ${htmlContent}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const downloadName = docTitle.replace(/\s+/g, '_') + '.doc';
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Extracts and compiles ASCII Art and clear block representations into Plain Text files.
 * Custom implementation for converting complex tables into grid arrays is included.
 */
export function exportToTXT(blocks: MarkdownBlock[], fileName: string) {
  const resultLines: string[] = [];
  
  blocks.forEach(block => {
    switch (block.type) {
      case 'heading': {
        const prefix = '='.repeat(block.content?.length || 5);
        resultLines.push('', block.content?.toUpperCase() || '', prefix, '');
        break;
      }
      case 'paragraph': {
        const cleanP = stripMarkdown(block.content || '');
        resultLines.push(cleanP, '');
        break;
      }
      case 'blockquote': {
        const cleanQ = stripMarkdown(block.content || '');
        const quoted = cleanQ
          .split('\n')
          .map(line => `|  ${line}`)
          .join('\n');
        resultLines.push(quoted, '');
        break;
      }
      case 'code_block': {
        resultLines.push('--- CODE START ---', block.code || '', '---- CODE END ----', '');
        break;
      }
      case 'horizontal_rule': {
        resultLines.push('================================================================', '');
        break;
      }
      case 'list': {
        const items = block.items || [];
        items.forEach((item, idx) => {
          const indent = '  '.repeat(item.level);
          const bullet = item.checked !== undefined 
            ? (item.checked ? '[X]' : '[ ]')
            : (block.ordered ? `${idx + 1}.` : '•');
          const cleanItem = stripMarkdown(item.text);
          resultLines.push(`${indent}${bullet} ${cleanItem}`);
        });
        resultLines.push('');
        break;
      }
      case 'table': {
        // High fidelity ASCII Table calculation
        const headers = block.headers || [];
        const rows = block.rows || [];
        const alignments = block.alignments || [];
        
        // Measure maximum lengths across columns
        const colCount = Math.max(headers.length, ...rows.map(r => r.length));
        const maxColLengths = Array(colCount).fill(0);
        
        for (let c = 0; c < colCount; c++) {
          const hLen = headers[c] ? stripMarkdown(headers[c]).length : 0;
          maxColLengths[c] = Math.max(maxColLengths[c], hLen);
          
          rows.forEach(row => {
            const rLen = row[c] ? stripMarkdown(row[c]).length : 0;
            maxColLengths[c] = Math.max(maxColLengths[c], rLen);
          });
        }
        
        // Build Top/Divider/Bottom Row Borders
        const borderParts = maxColLengths.map(len => '-'.repeat(len + 2));
        const rowBorder = `+${borderParts.join('+')}+`;
        
        resultLines.push(rowBorder);
        
        // Construct Table Header
        const headerParts = maxColLengths.map((len, idx) => {
          const cellStr = headers[idx] ? stripMarkdown(headers[idx]) : '';
          const align = alignments[idx] || 'left';
          return padCell(cellStr, len, align);
        });
        resultLines.push(`| ${headerParts.join(' | ')} |`);
        resultLines.push(rowBorder);
        
        // Construct Rows
        rows.forEach(row => {
          const rowParts = maxColLengths.map((len, idx) => {
            const cellStr = row[idx] ? stripMarkdown(row[idx]) : '';
            const align = alignments[idx] || 'left';
            return padCell(cellStr, len, align);
          });
          resultLines.push(`| ${rowParts.join(' | ')} |`);
        });
        
        resultLines.push(rowBorder);
        resultLines.push('');
        break;
      }
    }
  });

  const rawText = resultLines.join('\n');
  const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const origName = fileName.replace(/\.[a-zA-Z0-9]+$/, '');
  const downloadName = (origName || 'document') + '_converted.txt';
  
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Alignment padding utility for cells in ASCII export tables
 */
function padCell(text: string, length: number, align: 'left' | 'center' | 'right' | null): string {
  const diff = length - text.length;
  if (diff <= 0) return text;
  
  if (align === 'right') {
    return ' '.repeat(diff) + text;
  } else if (align === 'center') {
    const leftPad = Math.floor(diff / 2);
    const rightPad = diff - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  } else {
    return text + ' '.repeat(diff);
  }
}
