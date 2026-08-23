// imgbb.com orqali rasm yuklash. Serverda fayl saqlanmaydi — faqat qaytgan URL bazaga yoziladi.
import { env } from '../config/env.js';
import { AppError } from './errors.js';
import { logger } from './logger.js';

/**
 * @param {Buffer} buffer rasm bayt-massivi
 * @param {string} name fayl nomi (imgbb'da ko'rinadi)
 * @returns {Promise<{url:string, deleteUrl:string, thumb:string, width:number, height:number}>}
 */
export async function uploadToImgbb(buffer, name = 'image') {
  if (!env.IMGBB_API_KEY) {
    throw new AppError(500, 'IMGBB_API_KEY sozlanmagan', 'IMGBB_NOT_CONFIGURED');
  }

  const form = new FormData();
  form.append('key', env.IMGBB_API_KEY);
  form.append('image', buffer.toString('base64')); // imgbb base64 qabul qiladi
  form.append('name', name.replace(/\.[^.]+$/, '').slice(0, 100));

  // 20 soniyalik timeout — imgbb javob bermasa so'rov osilib qolmasin
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json?.success) {
      logger.error({ status: res.status, body: json }, 'imgbb yuklash muvaffaqiyatsiz');
      throw new AppError(502, 'Rasmni yuklab bo\'lmadi. Keyinroq urinib ko\'ring.', 'IMGBB_FAILED');
    }

    return {
      url: json.data.url,
      displayUrl: json.data.display_url,
      thumb: json.data.thumb?.url ?? json.data.url,
      deleteUrl: json.data.delete_url,
      width: Number(json.data.width) || 0,
      height: Number(json.data.height) || 0,
    };
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (e.name === 'AbortError') throw new AppError(504, 'Rasm yuklash vaqti tugadi', 'IMGBB_TIMEOUT');
    throw new AppError(502, 'Rasm serveriga ulanib bo\'lmadi', 'IMGBB_UNREACHABLE');
  } finally {
    clearTimeout(timer);
  }
}
