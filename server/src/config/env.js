// .env o'zgaruvchilarini o'qish va zod bilan tekshirish.
// Maqsad: ishga tushishda noto'g'ri konfiguratsiyani darhol aniqlash (production'da "jim" xatoliklar bo'lmasin).
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL majburiy'),
  REDIS_URL: z.string().optional(), // ixtiyoriy: bo'lmasa xotira keshi ishlatiladi

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET kamida 16 belgi'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET kamida 16 belgi'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

  IMGBB_API_KEY: z.string().optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  CACHE_TTL: z.coerce.number().int().positive().default(600),

  // ---- AI yordamchi (ixtiyoriy) ----
  // AI_PROVIDER tanlansa, manzil va model avtomatik to'ldiriladi (ai.provider.js).
  // Faqat AI_API_KEY yozish yetarli.
  AI_PROVIDER: z.enum(['groq', 'openai', 'openrouter', 'custom']).optional(),
  AI_API_URL: z.string().url().optional(),   // presetni bekor qilish uchun
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),           // presetni bekor qilish uchun
  AI_MAX_TOKENS: z.coerce.number().int().min(100).max(4000).default(500),

  SEED_ADMIN_LOGIN: z.string().default('admin'),
  SEED_ADMIN_PASSWORD: z.string().default('StrongPass123!'),
  SEED_ADMIN_NAME: z.string().default('Administrator'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Konfiguratsiya xato bo'lsa — serverni umuman ishga tushirmaymiz
  console.error('❌ .env konfiguratsiyasi noto\'g\'ri:');
  for (const issue of parsed.error.issues) {
    console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

// CORS uchun ruxsat etilgan manzillar ro'yxati
export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const isProd = env.NODE_ENV === 'production';
