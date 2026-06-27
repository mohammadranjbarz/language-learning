import { defineConfig } from 'vite';

// برای GitHub Pages: base را به نام ریپو تنظیم کنید
// مثلاً اگر ریپو language-learning است: '/language-learning/'
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/language-learning/' : '/',
  build: {
    outDir: 'dist',
  },
});
