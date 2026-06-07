/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from 'mammoth';

/**
 * Converts extracted DOCX-HTML into standard GFM Markdown structures
 */
export function convertHtmlToMarkdown(html: string): string {
  if (!html) return '';

  let temp = html;

  // 1. Process Headings
  temp = temp.replace(/<h1>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
  temp = temp.replace(/<h2>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
  temp = temp.replace(/<h3>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
  temp = temp.replace(/<h4>([\s\S]*?)<\/h4>/gi, '#### $1\n\n');
  temp = temp.replace(/<h5>([\s\S]*?)<\/h5>/gi, '##### $1\n\n');
  temp = temp.replace(/<h6>([\s\S]*?)<\/h6>/gi, '###### $1\n\n');

  // 2. Process Lists
  // Replace unordered list tags
  temp = temp.replace(/<ul>([\s\S]*?)<\/ul>/gi, '$1\n');
  temp = temp.replace(/<ol>([\s\S]*?)<\/ol>/gi, '$1\n');
  temp = temp.replace(/<li>([\s\S]*?)<\/li>/gi, '- $1\n');

  // 3. Process Tables
  // Simple table parser to construct GFM tables
  temp = temp.replace(/<table>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const rows: string[][] = [];
    const rowMatches = tableContent.match(/<tr>([\s\S]*?)<\/tr>/gi) || [];

    rowMatches.forEach((rowHTML: string) => {
      const cells: string[] = [];
      const cellMatches = rowHTML.match(/<(td|th)>([\s\S]*?)<\/(td|th)>/gi) || [];
      
      cellMatches.forEach((cellHTML: string) => {
        // Strip out tagging inside cell and trim
        const text = cellHTML
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        cells.push(text);
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });

    if (rows.length === 0) return '';

    const mdRows: string[] = [];
    
    // Header Row
    const headers = rows[0];
    mdRows.push(`| ${headers.join(' | ')} |`);

    // GFM Table Separator
    const sep = headers.map(() => '---');
    mdRows.push(`| ${sep.join(' | ')} |`);

    // Data Rows
    for (let r = 1; r < rows.length; r++) {
      mdRows.push(`| ${rows[r].join(' | ')} |`);
    }

    return '\n' + mdRows.join('\n') + '\n\n';
  });

  // 4. Bold, Italic, Strikethrough
  temp = temp.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  temp = temp.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  temp = temp.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  temp = temp.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');
  temp = temp.replace(/<strike>([\s\S]*?)<\/strike>/gi, '~~$1~~');
  temp = temp.replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~');

  // 5. Line Breaks / Paragraph wraps
  temp = temp.replace(/<p>([\s\S]*?)<\/p>/gi, '$1\n\n');
  temp = temp.replace(/<br\s*\/?>/gi, '\n');

  // 6. Inline code
  temp = temp.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`');

  // Strip remaining HTML tags
  temp = temp.replace(/<[^>]+>/g, '');

  // Consolidate repeating blank lines
  temp = temp.replace(/\n{3,}/g, '\n\n');

  return temp.trim();
}

/**
 * Reads any files matching TXT, MD, or DOCX formats and converts them to string content
 */
export async function importDocument(file: File): Promise<{ content: string; name: string; type: 'md' | 'txt' | 'docx' }> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'md' || file.type === 'text/markdown') {
    const text = await readFileAsText(file);
    return { content: text, name: file.name, type: 'md' };
  } else if (extension === 'txt' || file.type === 'text/plain') {
    const text = await readFileAsText(file);
    return { content: text, name: file.name, type: 'txt' };
  } else if (extension === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    try {
      // Use mammoth's convertToHtml to extract layout safely
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const docxHtml = result.value; // The generated HTML representation
      const markdown = convertHtmlToMarkdown(docxHtml);
      return { content: markdown, name: file.name, type: 'docx' };
    } catch (docxErr) {
      console.error('Word document extraction failed:', docxErr);
      throw new Error('This Word document could not be decoded. Make sure it is not corrupted and is a valid .docx file.');
    }
  } else {
    throw new Error(`The file format ".${extension || 'unknown'}" is not supported. Please upload MD, TXT, or DOCX files.`);
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read text file. Please confirm file properties and permissions.'));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read binary file. Please confirm file properties.'));
    reader.readAsArrayBuffer(file);
  });
}
