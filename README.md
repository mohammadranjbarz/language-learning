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

- **بدون ورود:** در `localStorage` مرورگر ذخیره می‌شود
- **با ورود گوگل:** پیشرفت در Firebase Firestore همگام می‌شود و بین دستگاه‌ها قابل دسترسی است

## راه‌اندازی ورود با گوگل (Firebase)

### ۱. پروژه Firebase بساز

1. برو به [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → یک پروژه بساز
3. **Build** → **Authentication** → **Sign-in method** → **Google** را فعال کن
4. **Build** → **Firestore Database** → **Create database** (حالت production)

### ۲. اپ وب اضافه کن

1. **Project settings** → **Your apps** → آیکون وب `</>`
2. نام اپ را بزن → Register
3. مقادیر config را کپی کن

### ۳. فایل `.env` بساز (محلی)

از `.env.example` کپی بگیر:

```bash
cp .env.example .env
```

مقادیر Firebase را پر کن و `npm run dev` بزن.

### ۴. دامنه GitHub Pages را مجاز کن

در Firebase → **Authentication** → **Settings** → **Authorized domains**:

- `localhost` (پیش‌فرض است)
- `USERNAME.github.io`

### ۵. قوانین Firestore

فایل `firestore.rules` را در Firebase Console → Firestore → Rules آپلود کن.

### ۶. Secrets برای GitHub Actions

در ریپو → **Settings** → **Secrets and variables** → **Actions** → این secretها را اضافه کن:

| Secret | مقدار |
|--------|-------|
| `VITE_FIREBASE_API_KEY` | apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
| `VITE_FIREBASE_APP_ID` | appId |

بعد push کن تا CI با Firebase بیلد شود.

## همگام‌سازی

- با ورود گوگل، پیشرفت محلی و ابری **ادغام** می‌شود (بهترین وضعیت هر لغت حفظ می‌شود)
- هر تغییر (درس، مرور، آزمون) خودکار به ابر ذخیره می‌شود
- بدون Firebase هم اپ کار می‌کند؛ فقط همگام‌سازی غیرفعال است
