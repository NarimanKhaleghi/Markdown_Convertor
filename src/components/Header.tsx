/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Edit3, Columns, Eye, RefreshCcw, Check } from 'lucide-react';
import { UIMode } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  uiMode: UIMode;
  onChangeUiMode: (mode: UIMode) => void;
  language: 'en' | 'fa';
  savingStatus: 'idle' | 'saving' | 'saved';
}

export const Header: React.FC<HeaderProps> = ({
  uiMode,
  onChangeUiMode,
  language,
  savingStatus
}) => {
  const t = translations[language];

  const menuModes: { value: UIMode; label: string; icon: React.ReactNode; className?: string }[] = [
    { value: 'editor', label: t.editorMode, icon: <Edit3 className="w-3.5 h-3.5" /> },
    { value: 'split', label: t.splitView, icon: <Columns className="w-3.5 h-3.5" />, className: 'hidden lg:inline-flex' },
    { value: 'preview', label: t.previewMode, icon: <Eye className="w-3.5 h-3.5" /> }
  ];

  return (
    <header className="relative flex flex-col md:flex-row items-center justify-between gap-3 px-6 py-3 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-850 shadow-xs shrink-0 z-35 font-sans-fa">
      <div className="flex flex-col items-center md:items-start text-center md:text-right font-sans-fa">
        <h1 className="text-sm font-black text-slate-900 dark:text-zinc-50 tracking-tight leading-none text-center md:text-initial">
          {t.appName}
        </h1>
      </div>

      {/* Editor Layout Options - Switching viewport mode */}
      <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-zinc-900/65 p-1 rounded-md border border-slate-200/60 dark:border-zinc-800/50">
        {menuModes.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChangeUiMode(opt.value)}
            className={`items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              opt.className || 'flex'
            } ${
              uiMode === opt.value
                ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
            type="button"
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Fixed floating save indicator as a layer to prevent layout shifts */}
      <div className="fixed top-3 z-50 pointer-events-none select-none rtl:left-4 ltr:right-4">
        {savingStatus === 'saving' && (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/40 rounded-lg shadow-sm animate-pulse">
            <RefreshCcw className="w-2.5 h-2.5 animate-spin text-amber-500" />
            <span>{t.autoSaving}</span>
          </span>
        )}
        {savingStatus === 'saved' && (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-emerald-650 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg shadow-sm">
            <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
            <span>{t.saved}</span>
          </span>
        )}
      </div>
    </header>
  );
};
