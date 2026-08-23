// Auth moduli: login, refresh, logout, profil (me), profilni yangilash.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import {
  saveRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} from '../../lib/redis.js';
import { ah, unauthorized, badRequest, conflict } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginLimiter } from '../../middleware/rateLimit.js';
import { writeAudit } from '../../lib/audit.js';
import { clientIp } from '../../lib/utils.js';
import { isProd } from '../../config/env.js';

export const authRouter = Router();

const loginSchema = z.object({
  login: z.string().trim().min(3, 'Login kamida 3 belgi').max(50),
  password: z.string().min(6, 'Parol kamida 6 belgi').max(200),
});

// Refresh tokenni httpOnly cookie'da ham qaytaramiz (frontend uchun qulay va xavfsizroq)
const refreshCookieOpts = (maxAgeSec) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: maxAgeSec * 1000,
});

/** POST /api/auth/login */
authRouter.post(
  '/login',
  loginLimiter,
  validate({ body: loginSchema }),
  ah(async (req, res) => {
    const { login, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { login } });
    // Vaqt hujumlarini kamaytirish uchun admin topilmasa ham hash tekshiriladi
    const hash = admin?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    const ok = await bcrypt.compare(password, hash);

    if (!admin || !ok || !admin.isActive) throw unauthorized('Login yoki parol notoʻgʻri');

    const accessToken = signAccessToken(admin);
    const { token: refreshToken, jti, ttlSec } = signRefreshToken(admin);
    await saveRefreshToken(admin.id, jti, ttlSec, { ip: clientIp(req), ua: req.headers['user-agent'] });

    await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    await writeAudit({ admin, action: 'LOGIN', entity: 'Admin', entityId: admin.id, ip: clientIp(req) });

    res.cookie('refresh_token', refreshToken, refreshCookieOpts(ttlSec));
    res.json({
      ok: true,
      data: {
        accessToken,
        refreshToken,
        admin: { id: admin.id, login: admin.login, fullName: admin.fullName, role: admin.role },
      },
    });
  })
);

/** POST /api/auth/refresh — access tokenni yangilash (refresh rotatsiyasi bilan) */
authRouter.post(
  '/refresh',
  ah(async (req, res) => {
    const token = req.body?.refreshToken || req.cookies?.refresh_token;
    if (!token) throw unauthorized('Refresh token yoʻq');

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw unauthorized('Refresh token yaroqsiz yoki muddati tugagan');
    }
    if (payload.typ !== 'refresh') throw unauthorized('Token turi notoʻgʻri');

    // Redis'da mavjudligini tekshiramiz — logout qilingan token qayta ishlamasin
    if (!(await isRefreshTokenValid(payload.sub, payload.jti))) {
      throw unauthorized('Sessiya tugatilgan, qaytadan kiring');
    }

    const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
    if (!admin || !admin.isActive) throw unauthorized('Foydalanuvchi faol emas');

    // Rotatsiya: eski refreshni bekor qilib, yangisini beramiz
    await revokeRefreshToken(admin.id, payload.jti);
    const accessToken = signAccessToken(admin);
    const { token: newRefresh, jti, ttlSec } = signRefreshToken(admin);
    await saveRefreshToken(admin.id, jti, ttlSec, { ip: clientIp(req) });

    res.cookie('refresh_token', newRefresh, refreshCookieOpts(ttlSec));
    res.json({ ok: true, data: { accessToken, refreshToken: newRefresh } });
  })
);

/** POST /api/auth/logout */
authRouter.post(
  '/logout',
  ah(async (req, res) => {
    const token = req.body?.refreshToken || req.cookies?.refresh_token;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await revokeRefreshToken(payload.sub, payload.jti);
      } catch {
        /* yaroqsiz token — shunchaki e'tiborsiz qoldiramiz */
      }
    }
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.json({ ok: true, data: { message: 'Tizimdan chiqdingiz' } });
  })
);

/** GET /api/auth/me */
authRouter.get(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { id: true, login: true, fullName: true, role: true, lastLoginAt: true, createdAt: true },
    });
    res.json({ ok: true, data: admin });
  })
);

const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    login: z.string().trim().min(3).max(50).optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(8, 'Yangi parol kamida 8 belgi').max(200).optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: 'Parolni oʻzgartirish uchun joriy parolni kiriting',
    path: ['currentPassword'],
  });

/** PATCH /api/auth/me — o'z profilini yangilash (ism, login, parol) */
authRouter.patch(
  '/me',
  requireAuth,
  validate({ body: updateProfileSchema }),
  ah(async (req, res) => {
    const { fullName, login, currentPassword, newPassword } = req.body;
    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });

    const data = {};
    if (fullName) data.fullName = fullName;

    if (login && login !== admin.login) {
      const busy = await prisma.admin.findUnique({ where: { login } });
      if (busy) throw conflict('Bu login band');
      data.login = login;
    }

    if (newPassword) {
      const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!ok) throw badRequest('Joriy parol notoʻgʻri');
      data.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (!Object.keys(data).length) throw badRequest('Oʻzgartirish uchun maʼlumot yuborilmadi');

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data,
      select: { id: true, login: true, fullName: true, role: true },
    });

    // Parol o'zgarsa — barcha qurilmalardagi sessiyalarni bekor qilamiz
    if (newPassword) await revokeAllRefreshTokens(admin.id);

    await writeAudit({
      admin: req.admin,
      action: 'UPDATE',
      entity: 'Admin',
      entityId: admin.id,
      before: { login: admin.login, fullName: admin.fullName },
      after: { login: updated.login, fullName: updated.fullName, passwordChanged: !!newPassword },
      ip: clientIp(req),
    });

    res.json({
      ok: true,
      data: updated,
      meta: newPassword ? { message: 'Parol oʻzgardi — qaytadan kiring' } : undefined,
    });
  })
);
