/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, ShieldCheck, HelpCircle, Laptop, Settings, 
  Menu, X, Sparkles, RefreshCcw, FileSignature, AlertCircle, Check,
  CloudLightning, Smartphone, Globe, Copy, Info, Edit3, Eye, Github
} from 'lucide-react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { UIMode, ExportStatus, MarkdownBlock } from './types';
import { parseMarkdownToBlocks, renderBlocksToHTML, isRTLText, stripMarkdown } from './utils/markdownParser';
import { importDocument, convertHtmlToMarkdown } from './utils/importers';
import { exportToHTML, exportToDOCX, exportToTXT } from './utils/exporters';
import { TEST_TEMPLATES } from './utils/testTemplates';
import { translations } from './utils/translations';
import mammoth from 'mammoth';

const LOCAL_STORAGE_KEY = 'decomark_editor_content';
const LOCAL_STORAGE_LANG_KEY = 'decomark_editor_language';

const DEFAULT_WELCOME_CONTENT = '';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'loading';
  duration?: number;
}

export default function App() {
  // Sync window height with visual viewport to prevent iOS/Android keyboard scroll bugs
  const [viewportHeight, setViewportHeight] = useState<string>('100vh');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateHeight = () => {
      const heightVal = window.visualViewport ? `${window.visualViewport.height}px` : '100vh';
      setViewportHeight(heightVal);
    };

    updateHeight();

    window.visualViewport?.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('scroll', updateHeight);
    window.addEventListener('resize', updateHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('scroll', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // --- Toast Notifications State ---
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'loading' = 'success', duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Translation and Localization State ---
  const [language, setLanguage] = useState<'en' | 'fa'>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_LANG_KEY) as 'en' | 'fa') || 'en';
  });

  const t = translations[language];

  // Sync language selection to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_LANG_KEY, language);
  }, [language]);

  // --- Core Application States ---
  const [editorContent, setEditorContent] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || DEFAULT_WELCOME_CONTENT;
  });

  // Current filename state remains for exporter file nomenclature
  const [currentFileName, setCurrentFileName] = useState<string>('document.md');
  const [uiMode, setUiMode] = useState<UIMode>('split');
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  
  // PWA and offline parameters
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  // Additional Interactive UI Dialog States
  const [showTestMatrix, setShowTestMatrix] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showUrlImportModal, setShowUrlImportModal] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [importUrlInput, setImportUrlInput] = useState<string>('');
  const [showIosInstallModal, setShowIosInstallModal] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('md_converter_onboarded_v2');
    }
    return false;
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const handleCloseOnboarding = () => {
    localStorage.setItem('md_converter_onboarded_v2', 'true');
    setShowOnboarding(false);
  };
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const handleToggleFullScreen = () => {
    setIsFullScreen(prev => {
      const next = !prev;
      if (next) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Auto-saving visual engine state
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Text selection tracking state (interactive highlighting sync)
  const [selectedText, setSelectedText] = useState<string>('');

  // Refs for scroll elements and inputs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Scroll Sync Flag locks (prevents infinite recursive scroll loops)
  const isSyncingScrollRef = useRef<boolean>(false);
  const activeScrollerRef = useRef<'editor' | 'preview' | null>(null);
  const lastScrollRatioRef = useRef<number>(0);

  // --- Optimization: Debounced Editor State for AST Parsing ---
  const [debouncedContent, setDebouncedContent] = useState<string>(editorContent);

  // Detect iOS Safari environment on startup
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(isIOS);
  }, []);

  // Monitor text changes to triggers saving indicators
  useEffect(() => {
    if (editorContent !== debouncedContent) {
      setSavingStatus('saving');
    }

    const handler = setTimeout(() => {
      setDebouncedContent(editorContent);
      
      // Auto-save logic: clean standard caches completely when user empties workspace
      if (editorContent.trim() === '') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, editorContent);
      }

      setSavingStatus('saved');
      const resetSavingState = setTimeout(() => {
        setSavingStatus('idle');
      }, 1500);

      return () => clearTimeout(resetSavingState);
    }, 450);

    return () => clearTimeout(handler);
  }, [editorContent, debouncedContent]);

  // --- Parse AST and HTML ---
  const blocks = useMemo(() => {
    return parseMarkdownToBlocks(debouncedContent);
  }, [debouncedContent]);

  const renderedHTML = useMemo(() => {
    return renderBlocksToHTML(blocks);
  }, [blocks]);

  // --- Calculate Statistics ---
  const wordCount = useMemo(() => {
    const text = editorContent.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }, [editorContent]);

  const characterCount = useMemo(() => {
    return editorContent.length;
  }, [editorContent]);

  const overallRTL = useMemo(() => {
    return isRTLText(editorContent.substring(0, 300));
  }, [editorContent]);

  // --- Synchronized Scrolling Engine ---
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    if (!textarea) return;

    // Save scroll position ratio
    const denom = textarea.scrollHeight - textarea.clientHeight;
    const percentage = denom > 0 ? (textarea.scrollTop / denom) : 0;
    lastScrollRatioRef.current = percentage;

    if (uiMode !== 'split' || isSyncingScrollRef.current) return;
    if (activeScrollerRef.current && activeScrollerRef.current !== 'editor') return;

    activeScrollerRef.current = 'editor';
    isSyncingScrollRef.current = true;

    const preview = previewRef.current;
    if (preview) {
      preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
    }

    setTimeout(() => {
      isSyncingScrollRef.current = false;
      activeScrollerRef.current = null;
    }, 50);
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const preview = e.currentTarget;
    if (!preview) return;

    // Save scroll position ratio
    const denom = preview.scrollHeight - preview.clientHeight;
    const percentage = denom > 0 ? (preview.scrollTop / denom) : 0;
    lastScrollRatioRef.current = percentage;

    if (uiMode !== 'split' || isSyncingScrollRef.current) return;
    if (activeScrollerRef.current && activeScrollerRef.current !== 'preview') return;

    activeScrollerRef.current = 'preview';
    isSyncingScrollRef.current = true;

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.scrollTop = percentage * (textarea.scrollHeight - textarea.clientHeight);
    }

    setTimeout(() => {
      isSyncingScrollRef.current = false;
      activeScrollerRef.current = null;
    }, 50);
  };

  // Sync scroll ratio section on mode changes (editor <=> preview <=> split)
  useEffect(() => {
    const timer = setTimeout(() => {
      const ratio = lastScrollRatioRef.current;
      const textarea = textareaRef.current;
      if (textarea && uiMode !== 'preview') {
        const denom = textarea.scrollHeight - textarea.clientHeight;
        if (denom > 0) {
          textarea.scrollTop = ratio * denom;
        }
      }
      const preview = previewRef.current;
      if (preview && uiMode !== 'editor') {
        const denom = preview.scrollHeight - preview.clientHeight;
        if (denom > 0) {
          preview.scrollTop = ratio * denom;
        }
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [uiMode]);

  // --- Network status callbacks ---
  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false);
      showToast(language === 'fa' ? 'شبکه متصل شد' : 'Network connected', 'info');
    };
    const goOffline = () => {
      setIsOffline(true);
      showToast(language === 'fa' ? 'شما کماکان به صورت کاملا آفلاین کار می‌کنید' : 'Operating in full offline mode', 'info');
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [language]);

  // --- PWA Installation hooks ---
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] SW loaded correctly', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] SW register missed', err);
        });
    }

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      showToast(language === 'fa' ? 'امکان نصب به صورت اپلیکیشن بومی مستقل آفلاین وجود دارد' : 'Install locally as a native offline PWA app', 'info', 5000);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, [language]);

  // --- Theme configurations ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- Responsive layout split screen checks ---
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        if (uiMode === 'split') {
          setUiMode('editor');
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [uiMode]);

  // --- Handlers: File Import ---
  const handleImportFile = async (file: File) => {
    setGeneralError(null);
    try {
      const result = await importDocument(file);
      setEditorContent(result.content);
      setCurrentFileName(result.name);
      
      if (window.innerWidth < 1024) {
        setUiMode('editor');
      }
      showToast(t.importSuccess, 'success');
    } catch (err: any) {
      const errMsg = err.message || t.importError;
      setGeneralError(errMsg);
      showToast(errMsg, 'error', 4500);
    }
  };

  // --- Handlers: Document Exporter ---
  const handleExportDocument = (format: 'html' | 'docx' | 'txt' | 'md') => {
    setExportStatus('converting');
    setGeneralError(null);
    
    const toastId = showToast(t.preparingExport, 'loading', 0);

    try {
      if (format === 'md') {
        const blob = new Blob([editorContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = currentFileName.endsWith('.md') ? currentFileName : 'document.md';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'html') {
        exportToHTML(renderedHTML, currentFileName, overallRTL);
      } else if (format === 'docx') {
        exportToDOCX(renderedHTML, currentFileName, overallRTL);
      } else if (format === 'txt') {
        exportToTXT(blocks, currentFileName);
      }
      
      dismissToast(toastId);
      showToast(t.exportSuccess, 'success');
      setExportStatus('idle');
    } catch (err) {
      console.error('Exporting error occurred:', err);
      dismissToast(toastId);
      setGeneralError(t.errorGeneric);
      showToast(t.errorGeneric, 'error', 4500);
      setExportStatus('idle');
    }
  };

  // --- Handlers: Fetch file from target URL ---
  const handleFetchUrlImport = async () => {
    if (!importUrlInput.trim()) {
      showToast(language === 'fa' ? 'لطفا آدرس سند را وارد نمایید' : 'Please input document link text', 'error');
      return;
    }

    const toastId = showToast(language === 'fa' ? 'در حال دریافت سند...' : 'Fetching document...', 'loading', 0);

    try {
      let cleanUrl = importUrlInput.trim();
      
      // Automatic conversion of GitHub blob URLs to direct raw content URLs
      if (cleanUrl.toLowerCase().includes('github.com') && cleanUrl.toLowerCase().includes('/blob/')) {
        const ghRegex = /https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/i;
        const match = cleanUrl.match(ghRegex);
        if (match) {
          const [_, user, repo, branch, filepath] = match;
          cleanUrl = `https://raw.githubusercontent.com/${user}/${repo}/refs/heads/${branch}/${filepath}`;
        }
      }

      const lowerUrl = cleanUrl.toLowerCase().split('?')[0].split('#')[0];
      
      let format: 'md' | 'txt' | 'docx' | null = null;
      if (lowerUrl.endsWith('.md')) format = 'md';
      else if (lowerUrl.endsWith('.txt')) format = 'txt';
      else if (lowerUrl.endsWith('.docx')) format = 'docx';

      // Verify extension criteria
      const invalidExtensions = ['pdf', 'html', 'png', 'jpg', 'jpeg', 'gif', 'exe', 'zip', 'json', 'mp3', 'mp4', 'ppt', 'pptx', 'xls', 'xlsx'];
      const extMatch = lowerUrl.match(/\.([a-zA-Z0-9]+)$/);
      const extension = extMatch ? extMatch[1] : '';

      if (extension && invalidExtensions.includes(extension)) {
        dismissToast(toastId);
        showToast(t.formatMismatchError, 'error', 4500);
        return;
      }

      if (!format) {
        format = 'md'; // fallback to standard text/markdown if unknown raw stream
      }

      if (format === 'docx') {
        // Direct download fetch as arrayBuffer
        const directRes = await fetch(cleanUrl);
        if (directRes.ok) {
          const buf = await directRes.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          const markdown = convertHtmlToMarkdown(result.value);
          setEditorContent(markdown);
          const fileName = cleanUrl.split('/').pop() || 'document.docx';
          setCurrentFileName(fileName);
          showToast(t.importSuccess, 'success');
          setShowUrlImportModal(false);
          setImportUrlInput('');
        } else {
          throw new Error('CORS or fetch unresolved');
        }
      } else {
        let textContent = '';
        try {
          const directRes = await fetch(cleanUrl);
          if (directRes.ok) {
            textContent = await directRes.text();
          } else {
            throw new Error();
          }
        } catch {
          // Bypasses CORS using the lightweight allorigins CORS-escape API Proxy
          const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`);
          if (proxyRes.ok) {
            const json = await proxyRes.json();
            textContent = json.contents;
          } else {
            throw new Error('Connection failed');
          }
        }

        if (textContent && typeof textContent === 'string') {
          setEditorContent(textContent);
          const fileName = cleanUrl.split('/').pop() || 'document.md';
          setCurrentFileName(fileName.endsWith('.md') || fileName.endsWith('.txt') ? fileName : `${fileName}.md`);
          showToast(t.importSuccess, 'success');
          setShowUrlImportModal(false);
          setImportUrlInput('');
        } else {
          throw new Error('Empty text content');
        }
      }
    } catch (e) {
      console.error(e);
      showToast(t.importError, 'error', 4500);
    } finally {
      dismissToast(toastId);
    }
  };

  // --- Handlers: Copy Plain Text Without Markdown symbols in Live Preview ---
  const handleCopyPlainTextFromPreview = () => {
    const rawPlain = stripMarkdown(editorContent);
    if (!rawPlain.trim()) {
      showToast(language === 'fa' ? 'سند خالی است' : 'Workspace empty', 'error');
      return;
    }
    
    navigator.clipboard.writeText(rawPlain)
      .then(() => {
        showToast(t.copyPlainTextSuccess, 'success');
      })
      .catch(() => {
        showToast(t.errorGeneric, 'error');
      });
  };

  // Enhanced OS and Browser Detection for step-by-step PWA Instructions Modal
  const getPwaInstructions = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent) && !/Edge/i.test(userAgent) && !/OPR/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

    if (language === 'fa') {
      if (isIOS) {
        return {
          platform: 'iOS (آیفون / آیپد)',
          browser: isSafari ? 'Safari' : 'مرورگر پیش‌فرض',
          icon: '🍏',
          steps: [
            '۱. این وب‌سایت را حتماً در مرورگر Safari آیفون خود باز کنید.',
            '۲. در منوی پایین روی دکمه اشتراک‌گذاری (Share 📤) ضربه بزنید.',
            '۳. به پایین اسکرول کنید و گزینه «Add to Home Screen» (افزودن به صفحه اصلی ➕) را انتخاب نمایید.',
            '۴. برنامه با آیکون مستقل روی صفحه ظاهر شده و به صورت کاملاً آفلاین قابل استفاده خواهد بود!'
          ]
        };
      } else if (isAndroid) {
        return {
          platform: 'اندروید (Android)',
          browser: isChrome ? 'Google Chrome' : 'مرورگر فرعی',
          icon: '🤖',
          steps: [
            '۱. این صفحه را در مرورگر Google Chrome گوشی خود باز کنید.',
            '۲. روی آیکون سه نقطه (⋮) در گوشه بالای صفحه ضربه بزنید.',
            '۳. گزینه «Install App» (نصب برنامه) یا «Add to Home screen» را انتخاب کنید.',
            '۴. برنامه به صورت کاملا آفلاین و مستقل روی دستگاه شما نصب می‌شود.'
          ]
        };
      } else {
        return {
          platform: 'دسکتاپ (ویندوز / مک)',
          browser: 'مرورگر استاندارد دسکتاپ',
          icon: '💻',
          steps: [
            '۱. در نوار آدرس بالای مرورگر (مانند Chrome یا Edge) به دنبال آیکون «نصب» بگردید.',
            '۲. بر روی دکمه Install کلیک کرده و با افزودن برنامه موافقت نمایید.',
            '۳. این ابزار کارآمد هم‌اکنون به صورت ۱۰۰٪ آفلاین و بدون تاخیر مانند برنامه‌های بومی در دسترس شماست.'
          ]
        };
      }
    } else {
      if (isIOS) {
        return {
          platform: 'iOS (iPhone / iPad)',
          browser: isSafari ? 'Safari' : 'Default Browser',
          icon: '🍏',
          steps: [
            '1. Ensure you have opened this web application inside Safari browser.',
            '2. Tap the Share button (📤) in the default bottom navigation bar.',
            '3. Choose the "Add to Home Screen" (➕) option from the menu list.',
            '4. Launch it anytime from your home screen directly, keeping the tool fully offline!'
          ]
        };
      } else if (isAndroid) {
        return {
          platform: 'Android Device',
          browser: isChrome ? 'Chrome' : 'Default Browser',
          icon: '🤖',
          steps: [
            '1. Open this page inside the Google Chrome browser on your device.',
            '2. Tap the triple-dots menu (⋮) located in the upper corner.',
            '3. Select "Install App" or "Add to Home Screen" from the menu options.',
            '4. A native-like standalone app icon is added supporting complete offline operations.'
          ]
        };
      } else {
        return {
          platform: 'Desktop / Laptop',
          browser: 'Chromium Browser',
          icon: '💻',
          steps: [
            '1. Look for the "Install App" button in the address bar (top right).',
            '2. Alternatively, open the browser settings menu and click "Save and Share > Install App".',
            '3. Run and compile documents with native performances even when fully offline!'
          ]
        };
      }
    }
  };

  // --- Handlers: Chrome manual installing prompt ---
  const triggerInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install status outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div style={{ height: viewportHeight }} className={`fixed inset-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-200 ${language === 'fa' ? 'rtl text-right' : 'ltr text-left'}`}>
      
      {/* Dynamic SEO Head Title Synchronized Content (Implicit document rendering values) */}
      {!isFullScreen && (
        <Header
          uiMode={uiMode}
          onChangeUiMode={setUiMode}
          language={language}
          savingStatus={savingStatus}
        />
      )}

      {/* Main Sandbox Workspace Layout */}
      <div className="flex flex-1 min-h-0 relative pb-[68px] md:pb-0">
        
        {/* Workspace core container */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Editor control tools */}
          <Toolbar
            getTextarea={() => textareaRef.current}
            onContentChange={setEditorContent}
            onClear={() => {
              setShowClearConfirmModal(true);
            }}
            language={language}
            isFullScreen={isFullScreen}
            onToggleFullScreen={handleToggleFullScreen}
            onImportFile={handleImportFile}
            onExport={handleExportDocument}
            exportStatus={exportStatus}
            isInstallable={isInstallable}
            onTriggerInstall={triggerInstallApp}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onToggleLanguage={() => setLanguage(language === 'en' ? 'fa' : 'en')}
            onOpenUrlImport={() => setShowUrlImportModal(true)}
            onOpenIosInstallGuide={() => setShowIosInstallModal(true)}
            isStandalone={isStandalone}
            onOpenGithubModal={() => setShowGithubModal(true)}
            onCopyPlainText={handleCopyPlainTextFromPreview}
          />

          {/* Action alerts panel for visual diagnostics */}
          {generalError && (
            <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 justify-between font-sans-fa">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{generalError}</span>
              </div>
              <button 
                onClick={() => setGeneralError(null)} 
                className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Dual Panel Split/Full Screen Router */}
          <div className="flex-1 flex min-h-0">
            {/* Editor viewport */}
            <div className={`flex-1 min-w-0 h-full ${uiMode === 'preview' ? 'hidden' : 'flex'}`}>
              <EditorPanel
                content={editorContent}
                onContentChange={setEditorContent}
                onImportFile={handleImportFile}
                wordCount={wordCount}
                characterCount={characterCount}
                textareaRef={textareaRef}
                language={language}
                onSelectText={setSelectedText}
                onScroll={handleEditorScroll}
              />
            </div>

            {/* Compiled Preview rendering viewport */}
            <div className={`flex-1 min-w-0 h-full ${uiMode === 'editor' ? 'hidden' : 'flex'}`}>
              <PreviewPanel
                htmlContent={renderedHTML}
                isRTL={overallRTL}
                language={language}
                onCopyPlainText={handleCopyPlainTextFromPreview}
                selectedText={selectedText}
                previewRef={previewRef}
                onScroll={handlePreviewScroll}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Beautiful URL Link Importer Dialog --- */}
      {showUrlImportModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xs" dir={language === 'fa' ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-hidden flex flex-col font-sans-fa">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-zinc-100">
                    {t.urlImportTitle}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => { setShowUrlImportModal(false); setImportUrlInput(''); }}
                className="p-1.5 hover:bg-slate-150 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <input
                type="url"
                value={importUrlInput}
                onChange={(e) => setImportUrlInput(e.target.value)}
                placeholder={t.urlImportPlaceholder}
                className="w-full text-xs p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-505 dark:text-zinc-350 placeholder:text-zinc-400"
              />

              <button
                onClick={handleFetchUrlImport}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                type="button"
              >
                {t.urlImportBtn}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- Beautiful Dynamic Confirmation Modal for Clearing Workspace --- */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xs" dir={language === 'fa' ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col font-sans-fa relative">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-850 mb-4">
              <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 shrink-0">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                {language === 'fa' ? 'تایید پاک‌سازی بوم' : 'Confirm Clear Canvas'}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-bold">
              {language === 'fa' 
                ? 'آیا از پاک کردن کامل متن ادیتور اطمینان دارید؟ این عمل غیرقابل بازگشت است.' 
                : 'Are you sure you want to completely clear the editor content? This action cannot be undone.'}
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-805 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-black transition-colors cursor-pointer"
                type="button"
              >
                {language === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setEditorContent('');
                  setShowClearConfirmModal(false);
                }}
                className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-black rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/10"
                type="button"
              >
                {language === 'fa' ? 'بله، پاک شود' : 'Yes, clear it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-only Preview Stats Bar - Hides completely when keyboard/editor has precedence */}
      {uiMode === 'preview' && (
        <div className="md:hidden fixed bottom-[72px] left-4 right-4 z-[90] flex items-center justify-between bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-850 py-2.5 px-4 rounded-2xl shadow-xl flex-row text-[11px] text-zinc-500 dark:text-zinc-505 font-sans-fa">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-zinc-500 font-bold tracking-wider text-[10px]">{t.words}</span>
              <strong className="text-slate-705 dark:text-zinc-350">{wordCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-zinc-500 font-bold tracking-wider text-[10px]">{t.characters}</span>
              <strong className="text-slate-705 dark:text-zinc-350">{characterCount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-zinc-500 font-bold tracking-wider text-[10px]">{t.align}</span>
            <strong className="text-slate-705 dark:text-zinc-350 font-bold">{overallRTL ? 'RTL' : 'LTR'}</strong>
          </div>
        </div>
      )}

      {/* --- Responsive Floating Mobile View Switching Bar --- */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-[90] flex items-center justify-around bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-850 py-2 px-3 rounded-full shadow-2xl">
        <button
          type="button"
          onClick={() => setUiMode('editor')}
          className={`flex items-center gap-2 justify-center px-6 py-2 rounded-full text-xs font-bold transition-all w-[45%] cursor-pointer ${
            uiMode === 'editor'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-100'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{t.editorMode}</span>
        </button>
        <button
          type="button"
          onClick={() => setUiMode('preview')}
          className={`flex items-center gap-2 justify-center px-6 py-2 rounded-full text-xs font-bold transition-all w-[45%] cursor-pointer ${
            uiMode === 'preview'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-500 dark:text-zinc-455 hover:text-slate-800 dark:hover:text-zinc-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t.previewMode}</span>
        </button>
      </div>

      {/* --- Beautiful iOS Manual Installation Instruction Sheet --- */}
      {showIosInstallModal && (() => {
        const pwa = getPwaInstructions();
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xs" dir={language === 'fa' ? 'rtl' : 'ltr'}>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col font-sans-fa">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                    {language === 'fa' ? 'نصب وب‌اپلیکیشن آفلاین (PWA)' : 'PWA Offline App Installation'}
                  </span>
                </div>
                <button 
                  onClick={() => setShowIosInstallModal(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-lg cursor-pointer"
                  type="button"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350 transition-colors" />
                </button>
              </div>

              {/* Detected system badge */}
              <div className="flex items-center gap-2 mb-4 p-2.5 bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-150/40 dark:border-indigo-900/45 rounded-xl">
                <span className="text-xl shrink-0">{pwa.icon}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase leading-none">
                    {language === 'fa' ? 'سیستم شناسایی‌شده شما' : 'Your Detected Platform'}
                  </span>
                  <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 mt-1 leading-none">
                    {pwa.platform} — {pwa.browser}
                  </span>
                </div>
              </div>

              {/* Information description about offline usability */}
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                {language === 'fa' 
                  ? '💡 با نصب نسخه وب‌اپلیکیشن مستقل، می‌توانید به صورت کاملاً آفلاین و دائم، بدون نیاز به اینترنت و با سرعت بسیار بالا از این مبدل اسناد استفاده نمایید.' 
                  : '💡 Activating the standalone web application allows you to write, edit, and compile documents completely offline, bypass browser loads, and gain instantaneous starting times.'}
              </p>

              {/* Guided dynamic steps */}
              <div className="space-y-3 text-xs text-zinc-850 dark:text-zinc-300 mb-5 bg-slate-50 dark:bg-zinc-950/20 p-4 rounded-xl border border-slate-100 dark:border-zinc-850">
                {pwa.steps.map((step, idx) => (
                  <div key={idx} className="font-semibold leading-relaxed">
                    {step}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowIosInstallModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm shadow-indigo-600/10"
                type="button"
              >
                {t.iosInstallClose}
              </button>
            </div>
          </div>
        );
      })()}

      {/* --- Beautiful GitHub Star Invitation Modal --- */}
      {showGithubModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xs" dir={language === 'fa' ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col font-sans-fa relative">
            
            {/* Top Close Button (X) */}
            <button 
              onClick={() => setShowGithubModal(false)}
              className="absolute top-4 left-4 rtl:left-auto rtl:right-4 ltr:right-4 ltr:left-auto p-1.5 hover:bg-slate-150 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon Content */}
            <div className="flex flex-col items-center text-center mt-3">
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 animate-bounce">
                <Github className="w-7 h-7" />
              </div>
              
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-50 mb-2 leading-none">
                {language === 'fa' ? 'حمایت از پروژه با ستاره گیت‌هاب ⭐️' : 'Support with a GitHub Star ⭐'}
              </h3>
              
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[280px] mb-6">
                {language === 'fa'
                  ? 'اگر مبدل مارکداون (MD Converter) براتون مفید بوده و کارتون رو راه انداخته، با دادن یک ستاره به پروژه در گیت‌هاب از من حمایت کنید، دمتون گرم!'
                  : 'If MD Converter has helped you translate or process files, consider supporting the development by giving the project a star on GitHub.'}
              </p>

              {/* Action Buttons */}
              <div className="w-full space-y-2">
                <a
                  href="https://github.com/NarimanKhaleghi"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowGithubModal(false)}
                  className="block w-full text-center py-2.5 bg-zinc-900 hover:bg-zinc-850 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md text-slate-100 font-sans-fa"
                >
                  {language === 'fa' ? '⭐️ ثبت ستاره در گیت‌هاب' : '⭐ See Profile & Give Star'}
                </a>
                
                <button
                  onClick={() => setShowGithubModal(false)}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-805 text-zinc-650 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer font-sans-fa"
                  type="button"
                >
                  {language === 'fa' ? 'بستن' : 'Close'}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* --- Elegant Step-by-Step Interactive Onboarding Modal --- */}
      {showOnboarding && (() => {
        const activeStepData = [
          {
            step: 1,
            title: language === 'fa' ? 'زبان نشانه‌گذاری مارکداون چیست؟ 📝' : 'What is Markdown? 📝',
            desc: language === 'fa'
              ? 'مارکداون (Markdown) یک سیستم نوشتن فوق‌العاده ساده و بی‌دردسر است. به جای منوهای پیچیده، با تایپ کردن کاراکترهای ساده متن خود را فرمت‌دهی می‌کنید (مثلاً # برای عنوان و ** برای ضخیم کردن). این مبدل، کدهای شما را فوراً به خروجی‌های استاندارد تبدیل می‌کند.'
              : 'Markdown is a lightweight markup language. Rather than fighting complex formatting menus, easily structure headings, links, tables, and bold texts using pure, clear characters.',
            icon: <Sparkles className="w-8 h-8 text-indigo-500 animate-spin-slow" />,
            features: language === 'fa'
              ? [
                  'تراز هوشمند خودکار متون راست‌به‌چپ (RTL/فارسی)',
                  'پیش‌نمایش زنده بی‌وقت و ویرایشگر سریع دوطرفه',
                  'پشتیبانی از فرمت‌های Word (docx.)، مارکداون و کدهای برنامه'
                ]
              : [
                  'Smart RTL alignment tailored perfectly for Persian fonts',
                  'Zero-delay side-by-side editing & dual real-time rendering',
                  'Imports files like Word (.docx), converting them to clean markdown offline'
                ]
          },
          {
            step: 2,
            title: language === 'fa' ? 'نصب مستقل و کارکرد ۱۰۰٪ آفلاین 📱' : 'Install PWA for 100% Offline Power 📱',
            desc: language === 'fa'
              ? 'بزرگترین مزیت این برنامه مستقل بودن کامل آن از اینترنت و سرور (کلاینت ساید) است! با نصب وب‌اپلیکیشن (PWA) روی دسکتاپ یا گوشی همراه خود، همواره میانبر سریعی دارید که بدون نیاز به اینترنت و با بیشترین سرعت بالا می‌آید.'
              : 'Our application executes entirely on your local browser engine. By installing it as a Progressive Web App (PWA), you get a launcher that boots instantly, securely, and offline without requiring active headers.',
            icon: <Smartphone className="w-8 h-8 text-emerald-500 animate-bounce" />,
            features: language === 'fa'
              ? [
                  'اجرای پرسرعت و کاملاً مستقل از اینترنت و شبکه',
                  'میانبر بومی روی صفحه خانگی و تسک‌بار شما',
                  'حفظ ۱۰۰٪ محرمانگی کل اسناد در لوکال استورج'
                ]
              : [
                  'Run at ultra-speed with zero internet connection needed',
                  'Clean launch shortcut directly from your desktop or mobile dock',
                  'Secure browser sandboxed storage prioritizing document privacy'
                ]
          },
          {
            step: 3,
            title: language === 'fa' ? 'حمایت از نویسنده با ستاره گیت‌هاب ⭐️' : 'Give Us a GitHub Support Star ⭐',
            desc: language === 'fa'
              ? 'توسعه این برنامه کاملاً رایگان، متن‌باز و بدون تبلیغات انجام شده است. اگر این ابزار به کارتون اومده و تجربه‌تون رو بهتر کرده، با اهدا یک ستاره به پروژه در گیت‌هاب از کارهای مستقل حمایت کنید. بی‌نهایت سپاسگزارم!'
              : 'This library is completely open-source, advertising-free, and gratis. If MD Converter has helped you parse syntax, build HTML tables, or import Word documents (.docx), consider giving the project a quick star on GitHub!',
            icon: <Github className="w-8 h-8 text-indigo-600 dark:text-zinc-200" />,
            features: language === 'fa'
              ? [
                  'حمایت مستقیم و بی‌هزینه از توسعه برنامه‌های بومی مستقل',
                  'کمک به دیده شدن ابزار برای سایر نویسندگان و کاربران',
                  'پشتیبانی از کارهای رایگان بعدی نویسنده'
                ]
              : [
                  'No cost, quick developer motivation support',
                  'Help other writers and typists discover this independent editor',
                  'Help independent creators make helpful software for free'
                ]
          }
        ][onboardingStep - 1] || {
          step: 1,
          title: '',
          desc: '',
          icon: null,
          features: []
        };

        return (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs" dir={language === 'fa' ? 'rtl' : 'ltr'}>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col font-sans-fa relative animate-fade-in">
              
              {/* Skip / Close Top Button */}
              <button 
                onClick={handleCloseOnboarding}
                className="absolute top-4 left-4 rtl:left-auto rtl:right-4 ltr:right-4 ltr:left-auto p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-450 hover:text-slate-650 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                type="button"
                title={language === 'fa' ? 'رد کردن راهنما' : 'Skip walkthrough'}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress Tracker bar */}
              <div className="flex items-center gap-1.5 justify-center mb-5 mt-1">
                {[1, 2, 3].map(s => (
                  <button
                    key={s}
                    onClick={() => setOnboardingStep(s)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      s === onboardingStep 
                        ? 'w-7 bg-indigo-600 dark:bg-indigo-500' 
                        : 'w-1.5 bg-slate-200 dark:bg-zinc-805 hover:bg-slate-300 dark:hover:bg-zinc-700'
                    }`}
                    type="button"
                  />
                ))}
              </div>

              {/* Step Content Icon */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-850/60 flex items-center justify-center mb-4 border border-slate-100 dark:border-zinc-800">
                  {activeStepData.icon}
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-zinc-50 mb-3 tracking-tight">
                  {activeStepData.title}
                </h3>

                <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed max-w-sm mb-5">
                  {activeStepData.desc}
                </p>

                {/* Nice Features checklist for step */}
                <div className="w-full bg-slate-50 dark:bg-zinc-850/40 rounded-xl p-4 border border-slate-100/70 dark:border-zinc-850/60 mb-6 text-right rtl:text-right ltr:text-left space-y-2.5">
                  {activeStepData.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-350 text-[11px] font-bold">
                      <span className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span className="leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Custom Action details (e.g., PWA install or stars) */}
                {onboardingStep === 2 && !isStandalone && (
                  <button
                    onClick={() => {
                      if (isInstallable) {
                        triggerInstallApp();
                      } else {
                        setShowIosInstallModal(true);
                      }
                      handleCloseOnboarding();
                    }}
                    className="w-full mb-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center gap-1.5"
                    type="button"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{language === 'fa' ? '📱 نصب نسخه مستقل وب‌اپلیکیشن' : '📱 Install Web App Version'}</span>
                  </button>
                )}

                {onboardingStep === 3 && (
                  <a
                    href="https://github.com/NarimanKhaleghi"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCloseOnboarding}
                    className="w-full mb-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/25 dark:text-indigo-400 dark:hover:bg-indigo-950/45 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center gap-1.5"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>{language === 'fa' ? '⭐️ ثبت ستاره و حمایت در گیت‌هاب' : '⭐ Star Us on GitHub'}</span>
                  </a>
                )}

                {/* Primary navigation Buttons */}
                <div className="flex gap-2 w-full mt-1.5">
                  {onboardingStep > 1 ? (
                    <button
                      onClick={() => setOnboardingStep(prev => prev - 1)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs font-black transition-colors cursor-pointer font-sans-fa"
                      type="button"
                    >
                      {language === 'fa' ? 'قبلی' : 'Back'}
                    </button>
                  ) : (
                    <button
                      onClick={handleCloseOnboarding}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-450 dark:text-zinc-400 border border-slate-100 dark:border-zinc-850 rounded-xl text-xs font-semibold transition-colors cursor-pointer font-sans-fa"
                      type="button"
                    >
                      {language === 'fa' ? 'متوجه شدم' : 'Got it'}
                    </button>
                  )}

                  {onboardingStep < 3 ? (
                    <button
                      onClick={() => setOnboardingStep(prev => prev + 1)}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs transition-colors cursor-pointer font-sans-fa shadow-md hover:shadow-indigo-500/10"
                      type="button"
                    >
                      {language === 'fa' ? 'بعدی' : 'Next'}
                    </button>
                  ) : (
                    <button
                      onClick={handleCloseOnboarding}
                      className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-slate-100 dark:text-white font-black rounded-xl text-xs transition-colors cursor-pointer font-sans-fa shadow-md"
                      type="button"
                    >
                      {language === 'fa' ? 'اتمام و شروع کار 🚀' : 'Start Writing! 🚀'}
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Beautiful Toast Notifications Container */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-right shadow-2xl pointer-events-auto transition-all duration-300 ${
              toast.type === 'success' ? 'border-r-4 border-r-emerald-500' :
              toast.type === 'error' ? 'border-r-4 border-r-rose-500' :
              toast.type === 'info' ? 'border-r-4 border-r-indigo-500' :
              'border-r-4 border-r-amber-500'
            }`}
            dir={language === 'fa' ? 'rtl' : 'ltr'}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Check className="w-3.5 h-3.5 stroke-[3]" /></div>}
              {toast.type === 'error' && <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500"><AlertCircle className="w-3.5 h-3.5 stroke-[3]" /></div>}
              {toast.type === 'info' && <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500"><HelpCircle className="w-3.5 h-3.5" /></div>}
              {toast.type === 'loading' && <div className="w-6 h-6 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400"><RefreshCcw className="w-3.5 h-3.5 animate-spin" /></div>}
            </div>
            <div className="flex-1 text-xs font-bold font-sans-fa text-zinc-800 dark:text-zinc-200 leading-normal">
              {toast.message}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-all cursor-pointer pointer-events-auto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
