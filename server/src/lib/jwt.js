// JWT: qisqa muddatli access token + uzoq muddatli refresh token (refresh Redis'da saqlanadi).
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function signAccessToken(admin) {
  return jwt.sign(
    { sub: admin.id, login: admin.login, role: admin.role, typ: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL }
  );
}

export function signRefreshToken(admin) {
  // jti — token identifikatori, Redis'da shu kalit bo'yicha saqlaymiz (bekor qilish uchun)
  const jti = crypto.randomUUID();
  const ttlSec = env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60;
  const token = jwt.sign({ sub: admin.id, jti, typ: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d`,
  });
  return { token, jti, ttlSec };
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
