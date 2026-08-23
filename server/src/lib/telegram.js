// Telegram bot integratsiyasi — yangi ariza kelganda guruhga xabar yuboradi.
import { env } from '../config/env.js';
import { logger } from './logger.js';

const API = (method) => `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;

/** HTML rejimi uchun maxsus belgilarni ekranlash */
function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Ariza obyektidan chiroyli xabar matnini yig'ish */
export function buildRequestMessage(r) {
  const lines = [
    '🩺 <b>Yangi ariza — MedService</b>',
    '',
    `👤 <b>Ism:</b> ${esc(r.name)}`,
    `📞 <b>Telefon:</b> ${esc(r.phone)}`,
  ];
  if (r.productName) lines.push(`🔧 <b>Mahsulot/xizmat:</b> ${esc(r.productName)}`);
  if (r.message) lines.push(`💬 <b>Izoh:</b> ${esc(r.message)}`);
  lines.push('', `🌐 <b>Til:</b> ${esc(r.locale || 'uz')}`);
  lines.push(`🕒 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}`);
  if (r.id) lines.push(`🆔 <code>${esc(r.id)}</code>`);
  return lines.join('\n');
}

/**
 * Guruhga xabar yuborish. Xato bo'lsa — istisno tashlamaydi, natijani qaytaradi
 * (ariza baribir bazaga yozilgan bo'ladi, admin panelda ko'rinadi).
 */
export async function sendTelegramMessage(text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { ok: false, error: 'Telegram sozlanmagan (token/chat id yo\'q)' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(API('sendMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!json.ok) {
      logger.error({ json }, 'Telegram xabar yuborilmadi');
      return { ok: false, error: json.description || 'Nomaʼlum xato' };
    }
    return { ok: true };
  } catch (e) {
    logger.error({ err: e.message }, 'Telegram so\'rovi xatosi');
    return { ok: false, error: e.name === 'AbortError' ? 'Timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}
