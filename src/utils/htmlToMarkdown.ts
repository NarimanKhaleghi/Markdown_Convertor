/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts rich HTML content (e.g., from clipboard when copying from Google Docs, Keeps, or Word)
 * to clean, readable Markdown syntax. Supports headings, bold/italics, lists, tables, and links.
 */
export function convertHtmlToMarkdown(htmlString: string): string {
  if (!htmlString) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const body = doc.body;

  function cleanString(str: string): string {
    return str.replace(/\s+/g, ' ');
  }

  function traverse(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    // Map children nodes recursively
    let childrenContent = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      childrenContent += traverse(element.childNodes[i]);
    }

    switch (tagName) {
      case 'h1':
        return `\n# ${childrenContent.trim()}\n`;
      case 'h2':
        return `\n## ${childrenContent.trim()}\n`;
      case 'h3':
        return `\n### ${childrenContent.trim()}\n`;
      case 'h4':
        return `\n#### ${childrenContent.trim()}\n`;
      case 'h5':
        return `\n##### ${childrenContent.trim()}\n`;
      case 'h6':
        return `\n###### ${childrenContent.trim()}\n`;
      case 'p': {
        const text = childrenContent.trim();
        return text ? `\n${text}\n` : '';
      }
      case 'strong':
      case 'b': {
        const text = childrenContent.trim();
        return text ? `**${text}**` : '';
      }
      case 'em':
      case 'i': {
        const text = childrenContent.trim();
        return text ? `*${text}*` : '';
      }
      case 'del':
      case 'strike':
      case 's': {
        const text = childrenContent.trim();
        return text ? `~~${text}~~` : '';
      }
      case 'code': {
        const text = childrenContent;
        return text ? `\`${text}\`` : '';
      }
      case 'pre': {
        const text = childrenContent;
        return text ? `\n\`\`\`\n${text.trim()}\n\`\`\`\n` : '';
      }
      case 'li': {
        const text = childrenContent.trim();
        return `\n- ${text}`;
      }
      case 'ul':
        return `\n${childrenContent}\n`;
      case 'ol': {
        // Simple conversion to numbers
        let i = 1;
        const lines = childrenContent.split('\n').filter(Boolean);
        const mapped = lines.map(line => {
          if (line.startsWith('- ')) {
            return `${i++}. ${line.substring(2)}`;
          }
          return line;
        });
        return `\n${mapped.join('\n')}\n`;
      }
      case 'a': {
        const href = element.getAttribute('href') || '';
        const text = childrenContent.trim() || href;
        return href ? `[${text}](${href})` : text;
      }
      case 'img': {
        const alt = element.getAttribute('alt') || 'Image';
        const src = element.getAttribute('src') || '';
        return src ? `![${alt}](${src})` : '';
      }
      case 'table':
        return `\n\n${childrenContent.trim()}\n\n`;
      case 'thead':
        return childrenContent;
      case 'tbody':
        return childrenContent;
      case 'tr': {
        // Collect th/td values
        const cells: string[] = [];
        element.childNodes.forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const childTag = (child as HTMLElement).tagName.toLowerCase();
            if (childTag === 'th' || childTag === 'td') {
              cells.push(traverse(child).trim().replace(/\|/g, '\\|'));
            }
          }
        });
        if (cells.length === 0) return '';
        
        let rowStr = `| ${cells.join(' | ')} |`;
        // If this is the header row or if it contains headers, add separator row
        const isHeader = element.querySelector('th') !== null || element.parentNode?.nodeName?.toLowerCase() === 'thead';
        if (isHeader) {
          const dividers = cells.map(() => '---');
          rowStr += `\n| ${dividers.join(' | ')} |`;
        }
        return `${rowStr}\n`;
      }
      case 'br':
        return '\n';
      case 'div':
      case 'span':
      default:
        return childrenContent;
    }
  }

  // Convert and replace excessive consecutive newlines nicely
  const converted = traverse(body);
  return converted
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
