// Redis qatlami: kesh + refresh tokenlar uchun.
// REDIS_URL berilmasa — jarayon xotirasidagi zaxira kesh ishlatiladi (lokal ishlab chiqish uchun).
import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let redis = null;
let usingMemory = false;

// Xotiradagi zaxira kesh: Map(key -> { value, expiresAt })
const memory = new Map();

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 500, 5000),
  });
  redis.on('error', (e) => logger.warn({ err: e.message }, 'Redis xatosi — kesh vaqtincha o\'tkazib yuboriladi'));
  redis.on('connect', () => logger.info('Redis ulandi'));
} else {
  usingMemory = true;
  logger.warn('REDIS_URL yo\'q — xotiradagi zaxira kesh ishlatilmoqda (faqat development uchun)');
}

// ---- Ichki yordamchilar (xotira rejimi) ----
function memGet(key) {
  const item = memory.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return item.value;
}
function memSet(key, value, ttlSec) {
  memory.set(key, { value, expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : null });
}

// ---- Ommaviy API ----

/** Keshdan JSON o'qish. Xato bo'lsa null qaytaradi (kesh hech qachon so'rovni buzmasligi kerak). */
export async function cacheGet(key) {
  try {
    const raw = usingMemory ? memGet(key) : await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    logger.debug({ err: e.message, key }, 'cacheGet o\'tkazib yuborildi');
    return null;
  }
}

/** Keshga JSON yozish (TTL soniyalarda). */
export async function cacheSet(key, value, ttlSec = env.CACHE_TTL) {
  try {
    const raw = JSON.stringify(value);
    if (usingMemory) memSet(key, raw, ttlSec);
    else await redis.set(key, raw, 'EX', ttlSec);
  } catch (e) {
    logger.debug({ err: e.message, key }, 'cacheSet o\'tkazib yuborildi');
  }
}

/** Bitta yoki bir nechta kalitni o'chirish. */
export async function cacheDel(...keys) {
  const flat = keys.flat().filter(Boolean);
  if (!flat.length) return;
  try {
    if (usingMemory) flat.forEach((k) => memory.delete(k));
    else await redis.del(...flat);
  } catch (e) {
    logger.debug({ err: e.message }, 'cacheDel o\'tkazib yuborildi');
  }
}

/**
 * Naqsh (pattern) bo'yicha kalitlarni o'chirish — masalan `cache:products:*`.
 * SCAN ishlatiladi (KEYS production'da bloklab qo'yadi).
 */
export async function cacheDelPattern(pattern) {
  try {
    if (usingMemory) {
      const rx = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      for (const k of memory.keys()) if (rx.test(k)) memory.delete(k);
      return;
    }
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  } catch (e) {
    logger.debug({ err: e.message, pattern }, 'cacheDelPattern o\'tkazib yuborildi');
  }
}

/**
 * Kesh invalidatsiyasi — admin biror narsani o'zgartirganda chaqiriladi.
 * Bog'liq bo'limlarni ham tozalaymiz (masalan mahsulot o'zgarsa — bosh sahifa bloklari ham).
 */
export async function invalidate(scope) {
  const map = {
    products: ['cache:products:*', 'cache:home:*', 'cache:sitemap:*'],
    categories: ['cache:categories:*', 'cache:products:*', 'cache:home:*', 'cache:sitemap:*'],
    settings: ['cache:settings:*', 'cache:home:*'],
    requests: ['cache:requests:*'],
    all: ['cache:*'],
  };
  const patterns = map[scope] ?? map.all;
  await Promise.all(patterns.map((p) => cacheDelPattern(p)));
  logger.info({ scope }, 'Kesh invalidatsiya qilindi');
}

// ---- Refresh tokenlar uchun (Redis'da saqlanadi) ----

const rtKey = (adminId, jti) => `rt:${adminId}:${jti}`;

export async function saveRefreshToken(adminId, jti, ttlSec, meta = {}) {
  const payload = JSON.stringify({ ...meta, createdAt: Date.now() });
  if (usingMemory) memSet(rtKey(adminId, jti), payload, ttlSec);
  else await redis.set(rtKey(adminId, jti), payload, 'EX', ttlSec);
}

export async function isRefreshTokenValid(adminId, jti) {
  if (usingMemory) return memGet(rtKey(adminId, jti)) !== null;
  return (await redis.exists(rtKey(adminId, jti))) === 1;
}

export async function revokeRefreshToken(adminId, jti) {
  await cacheDel(rtKey(adminId, jti));
}

/** Barcha seanslarni bekor qilish (parol o'zgarganda). */
export async function revokeAllRefreshTokens(adminId) {
  await cacheDelPattern(`rt:${adminId}:*`);
}

export { redis };
