/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UIMode = 'editor' | 'preview' | 'split';

export type ExportStatus = 'idle' | 'converting' | 'success' | 'error';

export interface MarkdownBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'blockquote' | 'code_block' | 'list' | 'table' | 'horizontal_rule';
  level?: 1 | 2 | 3 | 4 | 5 | 6; // for heading
  content?: string; // raw markdown text of the block or inner content
  code?: string; // for code block code content
  lang?: string; // for code block language
  ordered?: boolean; // for lists (ordered vs unordered)
  items?: ListItem[]; // for lists
  headers?: string[]; // for tables
  rows?: string[][]; // for tables
  alignments?: ('left' | 'center' | 'right' | null)[]; // for tables
  isRTL?: boolean; // RTL auto-detected for this specific block
}

export interface ListItem {
  id: string;
  text: string;
  checked?: boolean; // undefined = standard item, true = checked task, false = unchecked task
  level: number; // nesting level (0-indexed)
  items?: ListItem[]; // sub items
}

export interface DocumentState {
  editorContent: string;
  blocks: MarkdownBlock[];
  renderedHTML: string;
  wordCount: number;
  characterCount: number;
  currentFileName: string;
  fileType: 'md' | 'txt' | 'docx';
  exportStatus: ExportStatus;
  uiMode: UIMode;
  isInstallable: boolean;
  isOffline: boolean;
  detectedRTL: boolean; // Overall document RTL indicator
}

export const SUPPORTED_LANGUAGES = [
  { name: 'Plain Text', value: 'text' },
  { name: 'JavaScript', value: 'javascript' },
  { name: 'TypeScript', value: 'typescript' },
  { name: 'HTML', value: 'html' },
  { name: 'CSS', value: 'css' },
  { name: 'Python', value: 'python' },
  { name: 'JSON', value: 'json' },
  { name: 'SQL', value: 'sql' },
  { name: 'Bash', value: 'bash' },
  { name: 'Rust', value: 'rust' }
];
