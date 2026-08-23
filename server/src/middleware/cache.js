// Ommaviy GET javoblarini Redis'da keshlash middleware'i.
import { cacheGet, cacheSet } from '../lib/redis.js';
import { env } from '../config/env.js';

/**
 * @param {string} prefix kesh kaliti prefiksi, masalan 'cache:products'
 * @param {number} [ttl] soniyalarda
 */
export const cached = (prefix, ttl = env.CACHE_TTL) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  // Kalit: prefiks + to'liq yo'l + query (tartiblangan)
  const qs = new URLSearchParams(
    Object.entries(req.query).sort(([a], [b]) => a.localeCompare(b))
  ).toString();
  const key = `${prefix}:${req.baseUrl}${req.path}${qs ? '?' + qs : ''}`;

  const hit = await cacheGet(key);
  if (hit) {
    res.set('X-Cache', 'HIT');
    // Cloudflare/brauzer uchun stale-while-revalidate
    res.set('Cache-Control', `public, max-age=60, s-maxage=${ttl}, stale-while-revalidate=86400`);
    return res.json(hit);
  }

  res.set('X-Cache', 'MISS');
  res.set('Cache-Control', `public, max-age=60, s-maxage=${ttl}, stale-while-revalidate=86400`);

  // res.json'ni "ushlab olamiz" va muvaffaqiyatli javobni keshga yozamiz
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && body?.ok !== false) {
      cacheSet(key, body, ttl);
    }
    return originalJson(body);
  };
  next();
};
