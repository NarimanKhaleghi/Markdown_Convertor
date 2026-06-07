/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranslationSet {
  appName: string;
  autoSaving: string;
  saved: string;
  editorMode: string;
  splitView: string;
  previewMode: string;
  importDoc: string;
  exportDoc: string;
  installApp: string;
  darkMode: string;
  lightMode: string;
  info: string;
  clearWorkspaceConfirm: string;
  clearWorkspace: string;
  forceRtl: string;
  words: string;
  characters: string;
  align: string;
  googleImportTitle: string;
  googleImportDesc: string;
  smartPasteTab: string;
  publicLinkTab: string;
  pastedPlaceholder: string;
  pasteAction: string;
  linkPlaceholder: string;
  linkAction: string;
  linkDocsHelp: string;
  importSuccess: string;
  importError: string;
  copyPlainText: string;
  copyPlainTextSuccess: string;
  iosInstallTitle: string;
  iosInstallDesc: string;
  iosInstallStep1: string;
  iosInstallStep2: string;
  iosInstallStep3: string;
  iosInstallClose: string;
  rawMarkdown: string;
  htmlExport: string;
  wordExport: string;
  textExport: string;
  preparingExport: string;
  exportSuccess: string;
  errorGeneric: string;
  googleImportBtn: string;
  placeholderEditor: string;
  importFromLocal: string;
  importFromUrl: string;
  urlImportPlaceholder: string;
  urlImportBtn: string;
  urlImportTitle: string;
  formatMismatchError: string;
}

export const translations: Record<'en' | 'fa', TranslationSet> = {
  en: {
    appName: "Markdown Convertor | تبدیل کننده مارکداون",
    autoSaving: "Saving...",
    saved: "Saved",
    editorMode: "Editor",
    splitView: "Split View",
    previewMode: "Preview",
    importDoc: "Import Document",
    exportDoc: "Export",
    installApp: "Install App",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    info: "About",
    clearWorkspaceConfirm: "Are you sure you want to completely clear the workspace and start fresh?",
    clearWorkspace: "Clear",
    forceRtl: "RTL Mode",
    words: "WORDS",
    characters: "CHARACTERS",
    align: "ALIGN",
    googleImportTitle: "Import from Google Workspace (Drive, Docs, Keep)",
    googleImportDesc: "Import documents or notes without logging in to your Google Account.",
    smartPasteTab: "Smart Copy-Paste (Keep / Docs)",
    publicLinkTab: "Public Google Docs Link",
    pastedPlaceholder: "Paste the copied text from Google Docs or Google Keep here. Rich formatting will be beautifully converted to Markdown automatically...",
    pasteAction: "Convert & Import",
    linkPlaceholder: "Paste public Google Docs share link or published to web HTML link...",
    linkAction: "Fetch & Import",
    linkDocsHelp: "To get link: In Google Docs go to File > Share > Publish to Web. Paste the resulting link here.",
    importSuccess: "Document loaded successfully",
    importError: "Failed to load document. Make sure the file is valid and has correct permissions.",
    copyPlainText: "Copy Plain Text",
    copyPlainTextSuccess: "Plain text copied to clipboard successfully!",
    iosInstallTitle: "Install as PWA Web App",
    iosInstallDesc: "Add Markdown Convertor to your home screen for rapid offline-enabled native access:",
    iosInstallStep1: "1. Open this website in Safari browser.",
    iosInstallStep2: "2. Tap the Share button in Safari menu.",
    iosInstallStep3: "3. Choose 'Add to Home Screen' option from the list.",
    iosInstallClose: "Got it",
    rawMarkdown: "Download Raw Markdown",
    htmlExport: "Download Compiled HTML",
    wordExport: "Export Microsoft Word",
    textExport: "Export Text without codes",
    preparingExport: "Preparing and downloading...",
    exportSuccess: "Successfully exported!",
    errorGeneric: "An error occurred. Please try again.",
    googleImportBtn: "Import from Google",
    placeholderEditor: "Type markdown formatting instructions here...",
    importFromLocal: "Upload from Local device",
    importFromUrl: "Add via Link/URL",
    urlImportPlaceholder: "Paste document direct URL (e.g., .md, .txt, .docx)...",
    urlImportBtn: "Fetch & Load",
    urlImportTitle: "Import Document from Web URL",
    formatMismatchError: "Format mismatch! Only .md, .txt, or .docx files are permitted.",
  },
  fa: {
    appName: "Markdown Convertor | تبدیل کننده مارکداون",
    autoSaving: "در حال ذخیره‌سازی...",
    saved: "ذخیره شد",
    editorMode: "ویرایشگر",
    splitView: "نمای دوگانه",
    previewMode: "پیش‌نمایش",
    importDoc: "بارگذاری سند",
    exportDoc: "خروجی گرفتن",
    installApp: "نصب برنامه",
    darkMode: "حالت تاریک",
    lightMode: "حالت روشن",
    info: "درباره",
    clearWorkspaceConfirm: "آیا مایل به تخلیه کامل ویرایشگر و شروع مجدد هستید؟",
    clearWorkspace: "پاک کردن",
    forceRtl: "بخش راست به چپ",
    words: "کلمات",
    characters: "حروف",
    align: "تراز",
    googleImportTitle: "بارگذاری از گوگل (درایو، Keep و Docs)",
    googleImportDesc: "بدون نیاز به ورود به حساب کاربری گوگل خود، فایل یا متن دلخواه را وارد کنید.",
    smartPasteTab: "کپی و چسباندن هوشمند (Keep / Docs)",
    publicLinkTab: "لینک عمومی سند گوگل داکس",
    pastedPlaceholder: "متن کپی شده از داکس یا کیپ را در اینجا بچسبانید. قالب‌بندی غنی به‌طور خودکار و هوشمند به ساختار مارکداون تبدیل می‌شود...",
    pasteAction: "تبدیل و بارگذاری سند",
    linkPlaceholder: "لینک عمومی یا منتشر شده در وب سند گوگل داکس خود را وارد کنید...",
    linkAction: "فراخوانی و بارگذاری",
    linkDocsHelp: "راهنمای لینک: در سند گوگل داکس به مسیر «فایل > اشتراک‌گذاری > انتشار در وب» رفته و آدرس دریافتی را در فیلد بالا قرار دهید.",
    importSuccess: "سند با موفقیت بارگذاری شد",
    importError: "خطا در بارگذاری فایل. از صحت فرمت و سطح دسترسی مناسب مطمئن شوید.",
    copyPlainText: "کپی متن خام",
    copyPlainTextSuccess: "متن خام بدون سورس مارکداون با موفقیت کپی شد!",
    iosInstallTitle: "نصب نسخه وب اپلیکیشن (PWA)",
    iosInstallDesc: "برای دسترسی سریع، کاملا آفلاین و بومی در سیستم عامل خود، برنامه را به صفحه اصلی اضافه کنید:",
    iosInstallStep1: "۱. این سایت را در مرورگر (مانند Safari در آیفون) باز کنید.",
    iosInstallStep2: "۲. روی دکمه اشتراک‌گذاری (Share) ضربه بزنید.",
    iosInstallStep3: "۳. گزینه «Add to Home Screen» را انتخاب کنید.",
    iosInstallClose: "متوجه شدم",
    rawMarkdown: "دانلود مارکداون خام",
    htmlExport: "دانلود فایل HTML کامپایل شده",
    wordExport: "خروجی Microsoft Word",
    textExport: "خروجی متن بدون کد",
    preparingExport: "در حال آماده‌سازی و بارگیری خروجی...",
    exportSuccess: "خروجی با موفقیت بارگیری شد.",
    errorGeneric: "خطایی رخ داد. مجددا تلاش کنید.",
    googleImportBtn: "افزودن سند از گوگل",
    placeholderEditor: "نوشتن متن سند خود را با قالب‌بندی‌های استاندارد Markdown از اینجا آغاز نمایید...",
    importFromLocal: "بارگذاری از حافظه دستگاه",
    importFromUrl: "افزودن از طریق لینک",
    urlImportPlaceholder: "لینک مستقیم فایل مَد، متنی یا ورد را وارد کنید...",
    urlImportBtn: "دریافت و فراخوانی فایل",
    urlImportTitle: "دریافت سند از آدرس اینترنتی",
    formatMismatchError: "فرمت فایل پشتیبانی نمی‌شود! فقط فایل‌های دارای پسوند .md، .txt یا .docx پذیرفته می‌شوند.",
  }
};
