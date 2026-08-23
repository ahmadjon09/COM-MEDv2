// Umumiy yordamchi funksiyalar.
import slugify from 'slugify';
import { prisma } from './prisma.js';

/** Matndan URL uchun xavfsiz slug yasash (kirill ham transliteratsiya qilinadi) */
export function makeSlug(text) {
  return slugify(String(text || ''), { lower: true, strict: true, locale: 'ru' }).slice(0, 80) || 'item';
}

/** Slug band bo'lsa oxiriga -2, -3 ... qo'shib bo'sh variantini topadi */
export async function uniqueSlug(model, base, ignoreId = null) {
  const root = makeSlug(base);
  let candidate = root;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = await prisma[model].findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!found || found.id === ignoreId) return candidate;
    i += 1;
    candidate = `${root}-${i}`;
  }
}

/** Prisma Decimal -> number (JSON'da satr bo'lib ketmasligi uchun) */
export function serialize(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => {
      if (v && typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
      return v;
    })
  );
}

/** Cloudflare/proxy orqasidagi haqiqiy IP */
export function clientIp(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip ||
    null
  );
}
