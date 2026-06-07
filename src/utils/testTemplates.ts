/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

export interface TestTemplate {
  name: string;
  fileName: string;
  description: string;
  content: string;
}

// Generates a massive 20,000+ words Markdown file for parsing speed tests
const generateWordyDocument = (): string => {
  const sections: string[] = [];
  sections.push('# سند تست بارگذاری و کارایی کاراکتر بالا (تست حجم بالا)');
  sections.push('## بخش اول: مقدمات پردازش اسناد و کارایی پارسر کلاینت-ساید');
  sections.push('این سند برای سنجش میزان مقاومت و سرعت بارگذاری پارسر سفارشی در مقابله با اسناد بالای ۲۰۰۰۰ کلمه طراحی شده است.');
  
  const paragraphText = 'پردازش زبان‌های طبیعی و تبدیل‌های قالب‌بندی اسناد در داخل مرورگر کلاینت مزایای فوق‌العاده‌ای از جمله امنیت مطلق داده‌ها و بی‌نیازی به سرورهای میانی را ارائه می‌دهد. این نرم‌افزار با جداسازی توکن‌ها و انجام پردازش‌های غیر انسدادی خط به خط مانع از فریز شدن کل سیستم و کاهش زمان تاخیر تایپ می‌گردد. ';
  const contentFiller = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ';
  
  for (let s = 1; s <= 30; s++) {
    sections.push(`## بخش آزمایشی شماره ${s}: تحلیل کارایی و پایداری سیستم`);
    sections.push(`در این بخش، الگوهای مختلف متن فارسی و انگلیسی را در کنار یکدیگر بررسی می‌کنیم تا کارایی تراز خودکار محک زده شود.`);
    sections.push(paragraphText.repeat(8));
    sections.push(contentFiller.repeat(15));
    sections.push(`### زیربخش تستی ${s}.۱: لیست‌ها و پیوندهای کمکی`);
    sections.push(`- بررسی شماره ${s} از ابزارهای بومی`);
    sections.push(`- تراز به راست [نمونه پیوند خارجی](https://example.com)`);
    sections.push(`- تحلیل عمق تاخیر تاخوردگی پارسر بومی`);
    sections.push(`\n`);
  }
  
  return sections.join('\n\n');
};

export const TEST_TEMPLATES: TestTemplate[] = [
  {
    name: 'تست ۱: سند فوق‌العاده بزرگ (۲۵۰۰۰+ کلمه)',
    fileName: 'scenario1_performance_huge.md',
    description: 'سنجش عملکرد برنامه در پردازش اسناد بسیار حجیم بدون افت فریم',
    content: generateWordyDocument()
  },
  {
    name: 'تست ۲: جدول‌های سراسری (۱۰+ جدول بزرگ)',
    fileName: 'scenario2_ten_large_tables.md',
    description: 'سند شامل بیش از ۱۰ جدول بزرگ با جهت‌گیری و ترازهای مختلف ستون‌ها',
    content: `# تست عملکرد و رندر جداول فشرده GFM

این سند صحت عملکرد و هماهنگی جدول‌ها را در تبدیل‌های PDF و DOCX همزمان با حفظ تراز چپ و راست ارزیابی می‌کند.

${Array(12).fill(0).map((_, idx) => `
### جدول نمونه شماره ${idx + 1} - گزارش عملکرد آماری
| ستون اول تستی | دوم مرکزگرا | سوم راست‌گرا | چهارم ارزیابی |
| :--- | :---: | ---: | :--- |
| بررسی اول | مرکز ${idx} | ۹۸,۰۰۰ تومان | عالی |
| داده‌های تو در تو | مقدار ${idx * 50} | ۱,۲۰۰,۰۰۰ ریال | متوسط |
| تصحیح خط تراز | فعال | ۳,۵۰۰ | موفق |
`).join('\n')}
`
  },
  {
    name: 'تست ۳: سند دو زبانه (فارسی و انگلیسی)',
    fileName: 'scenario3_mixed_rtl_ltr.md',
    description: 'تست رندر متون ادغام شده راست به چپ (فارسی) و چپ به راست (انگلیسی)',
    content: `# تراز جهت نگارش خودکار (Bilingual Document Test)

این سند برای بررسی الگوریتم تشخیص خودکار زبان پارسر طراحی شده است. متون بر اساس زبان غالب هر بند تراز متفاوتی خواهند داشت.

این جمله فارسی است و باید در سمت راست صفحه تراز داده شود. تمام نشانه‌گذاری‌ها مانند بولد (**برجسته**) و کدهای درون خطی (\`Inline Code\`) باید به درستی در الگوی راست‌به‌چپ قرار گیرند.

This is an English paragraph within the same document. It must be automatically aligned to the left side with standard LTR font configurations. Note how **bold words**, *italics*, and [hyperlinks](https://google.com) parse correctly without interfering with Persian blocks.

> این یک نقل قول با متن فارسی و جهت تراز راست‌به‌چپ است که باید حاشیه تزیینی آن در سمت راست قرار گیرد.

> This is an LTR blockquote that should display with its decoration border on the left side, formatted in elegant italics.

#### ترکیب فارسی و انگلیسی در یک خط (Mixed Line):
گاهی در یک بند فارسی از کلمات انگلیسی استفاده می‌شود. به عنوان مثال: فریم‌ورک React با کتابخانه Tailwind CSS برای کارهای طراحی فوق‌العاده است. این باید تراز کلی راست را حفظ نماید.
`
  },
  {
    name: 'تست ۴: لیست‌های چند‌سطحی و وظایف',
    fileName: 'scenario4_nested_and_task_lists.md',
    description: 'آزمون بررسی کدهای تو در توی لیست‌های ترتیبی، غیرترتیبی و چک‌لیست‌ها',
    content: `# رندر لیست‌های پیچیده و چک‌لیست‌های وظایف

این سند گستردگی ابعاد لیست‌های تو در تو را در مبدل نشان می‌دهد.

### چک‌لیست کارهای پروژه جاری
- [x] پیاده‌سازی مکانیزم پارسر اختصاصی در کلاینت
- [x] ایجاد قابلیت ذخیره خودکار در مرورگر (Local Draft)
- [ ] تست نهایی سازگاری با Safari iOS
- [ ] ارائه نمونه‌های آماری به ناظر پایداری

### لیست ساختار درختی و تو در تو
- بخش اول: ملزومات طراحی پیشرفته
  - زیربخش اول-یک: گزینش پالت رنگی
  - زیربخش اول-دو: خانواده فونت‌ها
    1. فونت فرانسوی برای متون غربی
    2. فونت وزیر و تاهوما برای متون فارسی
- بخش دوم: موتور تولید خروجی آفلاین
  - زیربخش دوم-یک: ساختار XML برای مایکروسافت ورد
  - زیربخش دوم-دو: کوئری چاپ برای خروجی پی‌دی‌اف
`
  },
  {
    name: 'تست ۵: بلوک‌های چندگانه کد',
    fileName: 'scenario5_code_syntax_blocks.md',
    description: 'تست کدهای زبان‌های مختلف برنامه‌نویسی با تبر در پیش‌نمایش',
    content: `# سنجش خروجی‌های برنامه‌نویسی و کدهای منبع

اسناد فنی اغلب حاوی بلوک‌های مختلف کد هستند که نباید تحت تراز راست‌به‌چپ اسناد فارسی خراب شوند. کدهای منبع همواره باید چپ‌تراز باقی بمانند.

### نمونه کد TypeScript (توسعه کلاینت):
\`\`\`typescript
interface UserProfile {
  id: string;
  username: string;
  email: string;
  isRegisteredOffline: boolean;
}

export function registerLocalUser(profile: UserProfile): Promise<boolean> {
  localStorage.setItem('local_user', JSON.stringify(profile));
  return Promise.resolve(true);
}
\`\`\`

### نمونه کد HTML & Tailwind CSS (طراحی رابط):
\`\`\`html
<div class="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border rounded-lg shadow-sm">
  <div class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
  <p class="text-xs text-zinc-600 dark:text-zinc-400">سیستم ذخیره آفلاین آماده است</p>
</div>
\`\`\`

### نمونه کد Python (تحلیل داده‌ها):
\`\`\`python
def calculate_word_count(markdown_text):
    if not markdown_text:
        return 0
    words = markdown_text.split()
    return len(words)

# Test execution
print(f"Total Words parsed: {calculate_word_count('# Hello World')}")
\`\`\`
`
  }
];
