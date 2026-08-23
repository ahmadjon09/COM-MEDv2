// Shriftlar next/font orqali yuklanadi: build paytida yuklab olinib, o'z domenimizdan beriladi.
// Natijada Google'ga tashqi so'rov ketmaydi — sahifa tezroq ochiladi va FOUT kamayadi.
import { Inter_Tight, JetBrains_Mono } from 'next/font/google';

export const sans = Inter_Tight({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

export const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
  preload: false, // mono faqat kichik yorliqlarda ishlatiladi
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});
