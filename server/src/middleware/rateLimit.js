// Rate limiting — umumiy API uchun yumshoq, ariza yuborish uchun qattiq limit (spam/bot himoyasi).
import rateLimit from 'express-rate-limit';
import { clientIp } from '../lib/utils.js';

const keyGenerator = (req) => clientIp(req) || 'unknown';

/** Umumiy API: 100 so'rov / 15 daqiqa / IP */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Juda ko\'p so\'rov. Biroz kuting.' } },
});

/** Ommaviy GET'lar biroz erkinroq (katalogni ko'rish uchun): 300 / 15 daqiqa */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Juda ko\'p so\'rov. Biroz kuting.' } },
});

/** Ariza formasi: 3 ta ariza / soat / IP */
export const requestFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    ok: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Siz yaqinda bir necha ariza yubordingiz. Iltimos, biroz kuting yoki telefon orqali bog\'laning.',
    },
  },
});

/** Login: 10 urinish / 15 daqiqa (brute-force himoyasi) */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skipSuccessfulRequests: true,
  message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Juda ko\'p urinish. 15 daqiqadan keyin qayta urinib ko\'ring.' } },
});
