'use client';
// Klient tomonidagi ma'lumot qatlami:
//  1) SWR — so'rovlarni deduplikatsiya qiladi va fonda yangilaydi
//  2) IndexedDB — ma'lumotni qurilmada saqlaydi (ertasi kuni ham darhol ko'rinadi)
//  3) Server yiqilsa — eski keshdagi ma'lumot ko'rsatiladi, sayt "o'lmaydi"

import { get as idbGet, set as idbSet } from 'idb-keyval';
import useSWR from 'swr';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const CACHE_PREFIX = 'ms-cache:';
const CACHE_VERSION = 'v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 kun — bundan eski kesh ishlatilmaydi

const key = (path) => `${CACHE_PREFIX}${CACHE_VERSION}:${path}`;

/** IndexedDB'dan o'qish (SSR paytida yoki xatoda null) */
export async function readCache(path) {
  if (typeof window === 'undefined') return null;
  try {
    const entry = await idbGet(key(path));
    if (!entry) return null;
    if (Date.now() - entry.savedAt > MAX_AGE_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

/** IndexedDB'ga yozish */
export async function writeCache(path, data) {
  if (typeof window === 'undefined') return;
  try {
    await idbSet(key(path), { data, savedAt: Date.now() });
  } catch {
    /* xotira to'lgan bo'lishi mumkin — jim o'tkazamiz */
  }
}

/**
 * Asosiy fetcher: serverdan oladi, muvaffaqiyatli bo'lsa keshga yozadi.
 * Server ishlamasa — keshdagi eski ma'lumotni qaytaradi va `stale: true` belgisini qo'yadi.
 */
export async function swrFetcher(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json?.ok) throw new Error(json?.error?.message || 'API xatosi');

    await writeCache(path, json);
    return { ...json, stale: false };
  } catch (err) {
    // ---- Fallback: eski kesh ----
    const cached = await readCache(path);
    if (cached) return { ...cached.data, stale: true, cachedAt: cached.savedAt };
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * stale-while-revalidate hook.
 * fallbackData sifatida serverdan (RSC) kelgan ma'lumotni berish mumkin —
 * shunda birinchi render darhol, keyin fonda yangilanadi.
 */
export function useApi(path, { fallbackData, refreshInterval = 0 } = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(path, swrFetcher, {
    fallbackData: fallbackData ? { ...fallbackData, stale: false } : undefined,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    keepPreviousData: true,
    dedupingInterval: 30_000,
    errorRetryCount: 2,
    errorRetryInterval: 4000,
    refreshInterval,
    // Sahifa ochilishida IndexedDB'dan darhol boshlang'ich ma'lumot berish
    onErrorRetry: (err, k, cfg, revalidate, { retryCount }) => {
      if (retryCount >= 2) return;
      setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
    },
  });

  return {
    data: data?.data,
    meta: data?.meta,
    isStale: !!data?.stale,
    cachedAt: data?.cachedAt,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

/**
 * Ariza yuborish.
 * 1) Avval backend API'ga urinadi.
 * 2) Backend javob bermasa — to'g'ridan-to'g'ri Telegram Bot API'ga yuboradi (fallback).
 * Shu tarzda server yiqilgan paytda ham ariza yo'qolmaydi.
 */
export async function submitRequest(payload) {
  // ---- 1-urinish: backend ----
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(`${API_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const json = await res.json().catch(() => ({}));

    if (res.ok && json?.ok) return { ok: true, via: 'api' };

    // Rate limit — bu haqiqiy javob, fallback qilmaymiz
    if (res.status === 429) {
      return { ok: false, via: 'api', rateLimited: true, message: json?.error?.message };
    }
    // Validatsiya xatosi — foydalanuvchiga aytamiz
    if (res.status === 400) {
      return { ok: false, via: 'api', message: json?.error?.message, details: json?.error?.details };
    }
    throw new Error(json?.error?.message || `HTTP ${res.status}`);
  } catch {
    // ---- 2-urinish: to'g'ridan-to'g'ri Telegram ----
    const tg = await sendDirectToTelegram(payload);
    if (tg.ok) return { ok: true, via: 'telegram-fallback' };
    return { ok: false, via: 'none', message: tg.error };
  }
}

/** Zaxira kanal: brauzerdan Telegram Bot API'ga sendMessage */
async function sendDirectToTelegram(p) {
  const token = process.env.NEXT_PUBLIC_TG_FALLBACK_TOKEN;
  const chatId = process.env.NEXT_PUBLIC_TG_FALLBACK_CHAT_ID;
  if (!token || !chatId) return { ok: false, error: 'Zaxira kanal sozlanmagan' };

  const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const text = [
    '⚠️ <b>Ariza (zaxira kanal — server javob bermadi)</b>',
    '',
    `👤 <b>Ism:</b> ${esc(p.name)}`,
    `📞 <b>Telefon:</b> ${esc(p.phone)}`,
    p.productName ? `🔧 <b>Mavzu:</b> ${esc(p.productName)}` : null,
    p.message ? `💬 <b>Izoh:</b> ${esc(p.message)}` : null,
    '',
    `🌐 ${esc(p.locale || 'uz')} · ${new Date().toLocaleString('ru-RU')}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const json = await res.json();
    return json?.ok ? { ok: true } : { ok: false, error: json?.description };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
