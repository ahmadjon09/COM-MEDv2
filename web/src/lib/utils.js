// Umumiy yordamchi funksiyalar (server va klientda ishlaydi).
import clsx from 'clsx';

export const cn = (...a) => clsx(...a);

/**
 * Raqamni uchlik guruhlarga bo'lish.
 * DIQQAT: bu yerda Intl.NumberFormat ATAYLAB ishlatilmaydi.
 * Node va brauzerdagi ICU kutubxonalari ajratgich sifatida turli bo'shliq belgisini
 * (oddiy probel / NBSP / narrow NBSP) qo'yadi — natijada SSR va klient matni farq qilib,
 * React "hydration failed" xatosini beradi. Qo'lda formatlash har joyda bir xil natija beradi.
 */
function groupDigits(n) {
  const s = Math.round(Math.abs(n)).toString();
  let out = '';
  for (let i = 0; i < s.length; i += 1) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ' '; // oddiy probel (U+0020)
    out += s[i];
  }
  return (n < 0 ? '-' : '') + out;
}

/** Narxni formatlash: 1500000 -> "1 500 000 so'm" */
export function formatPrice(price, currency = 'UZS', locale = 'uz', dict) {
  if (price === null || price === undefined || price === '') {
    return dict?.product?.negotiable ?? 'Kelishilgan holda';
  }
  const n = Number(price);
  if (Number.isNaN(n)) return '';
  const formatted = groupDigits(n);
  if (currency === 'USD') return `$${formatted}`;
  return `${formatted} ${dict?.common?.currency ?? "so'm"}`;
}

/**
 * Sanani ko'rsatish: 23.08.2026
 * toLocaleDateString ham SSR/klientda farq qilishi mumkin — shuning uchun qo'lda yig'amiz.
 */
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Telefonni ko'rinadigan formatga: +998901234567 -> +998 90 123 45 67 */
export function formatPhone(p = '') {
  const d = String(p).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('998')) {
    return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
  }
  return p;
}

/** Matndan xavfsiz qisqartma (meta description uchun) */
export function truncate(text = '', max = 160) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s\S*$/, '') + '…';
}

/** Ko'p qatorli tavsifni paragraflarga bo'lish */
export function toParagraphs(text = '') {
  return String(text).split(/\n{1,}/).map((s) => s.trim()).filter(Boolean);
}

/** Mahsulot uchun asosiy rasm (bo'lmasa null) */
export function mainImage(product) {
  return product?.images?.[0] || product?.imageUrl || null;
}
