# language-learning

اپلیکیشن یادگیری زبان با دو حالت **درس** و **مرور لایتنر** — مناسب GitHub Pages.

## حالت‌ها

1. **درس‌ها** — هر درس شامل چند لغت است. برای هر لغت:
   - کلمه
   - چند جمله نمونه (انگلیسی + فارسی)
   - ترجمه فارسی
   - تعریف انگلیسی
   - در پایان درس: آزمون تستی

2. **مرور (لایتنر)** — الگوریتم جعبه لایتنر:
   - پاسخ درست → جعبه بعدی (فاصله مرور بیشتر)
   - پاسخ غلط → برگشت به جعبه ۱
   - همه لغات همیشه در صف مرور می‌مانند

## ساختار JSON

فایل اصلی: `public/data/vocabulary.json`

```json
{
  "meta": {
    "title": "عنوان اپ",
    "description": "توضیح",
    "sourceLanguage": "en",
    "targetLanguage": "fa"
  },
  "lessons": [
    {
      "id": "lesson-1",
      "title": "عنوان درس",
      "description": "توضیح درس",
      "words": [
        {
          "id": "unique-word-id",
          "word": "hello",
          "translationFa": "سلام",
          "translationEn": "a greeting",
          "sentences": [
            { "en": "Hello!", "fa": "سلام!" }
          ],
          "quiz": [
            {
              "question": "English question",
              "questionFa": "سوال فارسی",
              "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
              "correctIndex": 0
            }
          ]
        }
      ]
    }
  ]
}
```

## اجرای محلی

```bash
npm install
npm run dev
```

## دیپلوی GitHub Pages

```bash
GITHUB_PAGES=true npm run build
```

خروجی در پوشه `dist` — آن را روی GitHub Pages آپلود کنید.

اگر نام ریپو متفاوت است، `base` را در `vite.config.js` تغییر دهید.

## پیشرفت کاربر

در `localStorage` ذخیره می‌شود (جعبه لایتنر، درس‌های مطالعه‌شده، آمار).
