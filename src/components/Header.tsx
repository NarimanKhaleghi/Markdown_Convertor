/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  FileUp, Download, Eye, Edit3, Columns, Sun, Moon, 
  Check, Info, Smartphone, Globe, RefreshCcw, Cloud, CloudOff, CloudLightning, Github
} from 'lucide-react';
import { UIMode, ExportStatus } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  uiMode: UIMode;
  onChangeUiMode: (mode: UIMode) => void;
  onImportFile: (file: File) => void;
  onExport: (format: 'html' | 'docx' | 'txt' | 'md') => void;
  exportStatus: ExportStatus;
  isInstallable: boolean;
  onTriggerInstall: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  
  language: 'en' | 'fa';
  onToggleLanguage: () => void;
  savingStatus: 'idle' | 'saving' | 'saved';
  onOpenUrlImport: () => void;
  onOpenIosInstallGuide: () => void;
  isIOS: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  uiMode,
  onChangeUiMode,
  onImportFile,
  onExport,
  exportStatus,
  isInstallable,
  onTriggerInstall,
  darkMode,
  onToggleDarkMode,
  language,
  onToggleLanguage,
  savingStatus,
  onOpenUrlImport,
  onOpenIosInstallGuide,
  isIOS
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const t = translations[language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImportFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const menuModes: { value: UIMode; label: string; icon: React.ReactNode; className?: string }[] = [
    { value: 'editor', label: t.editorMode, icon: <Edit3 className="w-3.5 h-3.5" /> },
    { value: 'split', label: t.splitView, icon: <Columns className="w-3.5 h-3.5" />, className: 'hidden lg:inline-flex' },
    { value: 'preview', label: t.previewMode, icon: <Eye className="w-3.5 h-3.5" /> }
  ];

  return (
    <header className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-850 shadow-xs shrink-0 z-50">
      {/* Brand Title and Auto-saving Status indicator */}
      <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight leading-none">
              Markdown Convertor | تبدیل کننده مارکداون
            </h1>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-sans-fa">
              {language === 'fa' 
                ? 'پردازشگر مستقل، سرعت بالا، بدون نیاز به سرور' 
                : 'Offline-First Professional Client-Side Document Transformer'}
            </p>
          </div>

          {/* Clean, Non-intrusive Safe Auto-saving Indicator */}
          <div className="flex items-center gap-1.5 ml-2">
            {savingStatus === 'saving' && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-900/40 font-sans-fa animate-pulse">
                <RefreshCcw className="w-2.5 h-2.5 animate-spin text-amber-500" />
                <span className="hidden sm:inline">{t.autoSaving}</span>
              </span>
            )}
            {savingStatus === 'saved' && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-900/40 font-sans-fa">
                <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                <span className="hidden sm:inline">{t.saved}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor Layout Options - Switching viewport mode (hidden on mobile, shown on md and above) */}
      <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-md border border-slate-200/60 dark:border-zinc-800/50">
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
            <span className="hidden md:inline">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Primary Action Buttons & Workspace controls */}
      <div className="flex items-center gap-2 w-full lg:w-auto justify-center lg:justify-end flex-wrap">
        
        {/* Dropdown Document Uploader */}
        <div className="relative">
          <button
            onClick={() => setShowImportMenu(!showImportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-705 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-850 transition-all cursor-pointer shadow-xs font-sans-fa"
            title="Import Document Option"
            type="button"
          >
            <FileUp className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{t.importDoc}</span>
          </button>
          
          {showImportMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowImportMenu(false)}
              />
              <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md shadow-lg py-1.5 z-50 text-right font-sans-fa">
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowImportMenu(false); }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-slate-705 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  type="button"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.importFromLocal}</span>
                </button>
                <button
                  onClick={() => { onOpenUrlImport(); setShowImportMenu(false); }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-slate-705 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  type="button"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-505" />
                  <span>{t.importFromUrl}</span>
                </button>
              </div>
            </>
          )}
        </div>
        
        <input
          id="fileUploader"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".md,text/markdown,.txt,text/plain,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />

        {/* Master Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-slate-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-xs transition-colors cursor-pointer font-sans-fa"
            title="Export into multiple client formats"
            type="button"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.exportDoc}</span>
            {exportStatus === 'converting' && (
              <svg className="animate-spin h-3.5 w-3.5 text-white ml-1" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </button>

          {showExportMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md shadow-lg py-1.5 z-50 text-right font-sans-fa">
                <button
                  onClick={() => { onExport('md'); setShowExportMenu(false); }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-slate-705 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="font-mono text-slate-400 dark:text-zinc-500">.md</span>
                  <span>{t.rawMarkdown}</span>
                </button>
                <button
                  onClick={() => { onExport('html'); setShowExportMenu(false); }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-slate-705 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="font-mono text-indigo-500 font-bold">HTML</span>
                  <span>{t.htmlExport}</span>
                </button>
                <button
                  onClick={() => { onExport('docx'); setShowExportMenu(false); }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-slate-705 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="font-mono text-sky-500 font-bold">Word</span>
                  <span>{t.wordExport}</span>
                </button>
                <button
                  onClick={() => { onExport('txt'); setShowExportMenu(false); }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-slate-705 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="font-mono text-slate-400 dark:text-zinc-500">.txt</span>
                  <span>{t.textExport}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Global PWA Install trigger (Chrome) or instructions (iOS) */}
        {isInstallable && (
          <button
            onClick={onTriggerInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-55 dark:bg-indigo-950/30 border border-indigo-150/65 dark:border-indigo-900/60 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all cursor-pointer font-sans-fa"
            title="Install App locally as native PWA"
            type="button"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.installApp}</span>
          </button>
        )}

        {/* Custom iOS Install Guide Activator */}
        {isIOS && (
          <button
            onClick={onOpenIosInstallGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-150/60 dark:border-teal-900/60 rounded-md hover:bg-teal-100 dark:hover:bg-teal-950/50 transition-all cursor-pointer font-sans-fa"
            title="Show instructions to install PWA on iOS"
            type="button"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-505" />
            <span className="hidden sm:inline">{t.installApp} (iOS)</span>
          </button>
        )}

        {/* Language Selection switcher */}
        <button
          onClick={onToggleLanguage}
          className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-sans"
          title="Switch Language"
          type="button"
        >
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="font-extrabold uppercase text-[10px] tracking-wider">{language === 'en' ? 'FA' : 'EN'}</span>
        </button>

        {/* Dark Mode Switcher */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-450 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 rounded-md transition-colors cursor-pointer"
          title="Toggle Light/Dark Theme"
          type="button"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* GitHub External Profile Link */}
        <a
          href="https://github.com/NarimanKhaleghi"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-450 border border-transparent hover:border-slate-200 dark:border-zinc-800 rounded-md transition-colors cursor-pointer flex items-center justify-center mr-1"
          title="GitHub Profile"
          id="github-profile-link"
        >
          <Github className="w-4 h-4 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" />
        </a>

        {/* Info Box Toggle */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-450 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 rounded-md transition-colors cursor-pointer"
          title="App Compatibility and Constraints Information"
          type="button"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-2xl max-w-md w-full text-right leading-relaxed text-sm select-none">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-3 font-sans-fa">
              {language === 'fa' ? 'درباره ویرایشگر و مبدل اسناد' : 'About Markdown Convertor'}
            </h3>
            <p className="text-zinc-650 dark:text-zinc-400 mb-4 text-xs font-sans-fa">
              {language === 'fa' 
                ? 'این برنامه یک محیط پردازشگر سند است که ۱۰۰٪ مستقل از سرور (کلاینت ساید) اجرا می‌شود. امکان تبدیل آفلاین، ویرایش دوگانه همزمان، و تراز خودکار متون مخلوط فارسی/عمومی (RTL) به صورت بی‌وقفه طراحی شده است.'
                : 'This system is a comprehensive, client-side browser document editor. It compiles rich styling offline instantly. It provides Persian layout adjustment, and exports formats seamlessly.'}
            </p>
            <div className="space-y-2 text-xs mb-5 font-sans-fa">
              <div className="flex items-center gap-2 text-zinc-750 dark:text-zinc-300">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                <span>{language === 'fa' ? 'پشتیبانی کامل از جداول Markdown، کدهای برنامه‌نویسی و لیست‌ها' : 'Supports advanced tables, block codes and checklists.'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-755 dark:text-zinc-300">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                <span>{language === 'fa' ? 'تبدیل اسناد چند‌صفحه‌ای Word (.docx) به فرمت قابل ویرایش' : 'Converts Microsoft Word documents directly contextually.'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-755 dark:text-zinc-300">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                <span>{language === 'fa' ? 'الگوریتم تشخیص تندنویسی و تراز متون فارسی/راست‌به‌چپ' : 'Real-time layout sensing block-wise.'}</span>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-xs cursor-pointer font-sans-fa"
              type="button"
            >
              {language === 'fa' ? 'متوجه شدم' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
