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

- **بدون ورود:** در مرورگر ذخیره می‌شود (فقط همان دستگاه)
- **با ورود گوگل:** پیشرفت در Firebase ذخیره می‌شود و بین موبایل، لپ‌تاپ و… همگام می‌ماند

> **نکته:** Firebase فقط یک‌بار توسط **سازنده سایت** (تو) ساخته می‌شود. کاربران نهایی هیچ تنظیماتی ندارند — فقط دکمه «ورود با گوگل» را می‌زنند.

## راه‌اندازی Firebase (فقط یک‌بار — برای سازنده)

این مراحل را **فقط خودت** انجام می‌دهی. بعد از deploy، همه کاربران بدون هیچ کار اضافه‌ای می‌توانند لاگین کنند.

### ۱. پروژه Firebase بساز

1. برو به [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → یک پروژه بساز (مثلاً `language-learning`)
3. **Authentication** → **Sign-in method** → **Google** را فعال کن
4. **Firestore Database** → **Create database** (production)

### ۲. اپ وب اضافه کن

1. **Project settings** → **Your apps** → آیکون وب
2. Register → config را کپی کن

### ۳. تست محلی (اختیاری)

```bash
cp .env.example .env
# مقادیر Firebase را در .env بگذار
npm run dev
```

### ۴. دامنه سایت را مجاز کن

Firebase → **Authentication** → **Settings** → **Authorized domains**:

- `localhost`
- `USERNAME.github.io` (آدرس GitHub Pages خودت)

### ۵. قوانین Firestore

فایل `firestore.rules` را در Firebase Console → Firestore → Rules جایگذاری کن.

هر کاربر فقط به داده **خودش** دسترسی دارد (`users/{uid}/...`).

### ۶. Secrets در GitHub (برای deploy خودکار)

ریپو → **Settings** → **Secrets and variables** → **Actions**:

| Secret | مقدار |
|--------|-------|
| `VITE_FIREBASE_API_KEY` | apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
| `VITE_FIREBASE_APP_ID` | appId |

بعد `git push` — GitHub Actions سایت را با همان Firebase بیلد و منتشر می‌کند.

### تجربه کاربر نهایی

1. سایت را باز می‌کند
2. «ورود با گوگل» را می‌زند
3. پیشرفتش ذخیره و بین دستگاه‌ها sync می‌شود

**کاربر نهایی به Firebase Console، API key یا secret دسترسی ندارد و چیزی نصب نمی‌کند.**

## همگام‌سازی

- با ورود گوگل، پیشرفت محلی و ابری ادغام می‌شود
- هر تغییر خودکار به ابر ذخیره می‌شود
- اگر هنوز Firebase تنظیم نشده باشد، اپ بدون لاگین هم کار می‌کند (فقط localStorage)
