// AI uchun keshlash qatlami.
//
// Ikki xil kesh bor:
//  1) TOOL KESHI — bazadan olingan natijalar (xizmatlar, zapchastlar, kontaktlar).
//     Bir xil so'rov qayta kelganda bazaga ham, modelga ham qayta bormaydi.
//  2) JAVOB KESHI — tez-tez beriladigan savollarning tayyor javobi.
//     "Qanday xizmatlar bor?" kabi savol takrorlansa, model umuman chaqirilmaydi —
//     ya'ni 0 ta token sarflanadi.
//
// Kesh Redis'da; Redis bo'lmasa xotiradagi zaxira ishlaydi (lib/redis.js).
import crypto from 'node:crypto';
import { cacheGet, cacheSet } from '../../lib/redis.js';

const TOOL_TTL = 600; // 10 daqiqa — katalog tez-tez o'zgarmaydi
const ANSWER_TTL = 3600; // 1 soat

/** Faqat o'qish tool'lari keshlanadi. create_request hech qachon keshlanmaydi. */
const CACHEABLE_TOOLS = new Set([
  'list_services', 'get_service', 'search_parts', 'compare_parts', 'recommend_parts', 'get_part', 'get_contacts',
]);

const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 20);

export const isCacheableTool = (name) => CACHEABLE_TOOLS.has(name);

/* ---------------- Tool keshi ---------------- */

function toolKey(name, args, locale) {
  // Argument tartibi farq qilmasligi uchun kalitlarni saralaymiz
  const norm = JSON.stringify(args ?? {}, Object.keys(args ?? {}).sort());
  return `cache:ai:tool:${locale}:${name}:${sha(norm)}`;
}

export async function getToolCache(name, args, locale) {
  if (!isCacheableTool(name)) return null;
  return cacheGet(toolKey(name, args, locale));
}

export async function setToolCache(name, args, locale, value) {
  if (!isCacheableTool(name)) return;
  await cacheSet(toolKey(name, args, locale), value, TOOL_TTL);
}

/* ---------------- Javob keshi ---------------- */

/**
 * Savolni normallashtirish: registr, ortiqcha bo'shliq va tinish belgilari olib tashlanadi.
 * "Qanday xizmatlar bor?" va "qanday xizmatlar bor" — bitta kalit bo'ladi.
 */
function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const answerKey = (locale, message) => `cache:ai:answer:${locale}:${sha(normalize(message))}`;

/**
 * Javob keshi FAQAT suhbatning birinchi xabari uchun ishlaydi.
 * Tarix bo'lsa javob kontekstga bog'liq bo'ladi — uni keshlash noto'g'ri natija beradi.
 */
export async function getAnswerCache(locale, message, historyLength) {
  if (historyLength > 0) return null;
  const hit = await cacheGet(answerKey(locale, message));
  return hit?.reply ? hit : null;
}

export async function setAnswerCache(locale, message, historyLength, payload) {
  if (historyLength > 0) return;
  // Ariza yaratilgan javob keshlanmaydi — u har safar yangi bo'lishi kerak
  if (payload?.requestCreated) return;
  if (!payload?.reply || payload.reply.length < 20) return;
  await cacheSet(answerKey(locale, message), payload, ANSWER_TTL);
}
