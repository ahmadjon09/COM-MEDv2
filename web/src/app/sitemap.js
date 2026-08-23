// sitemap.xml avtomatik generatsiyasi — barcha tillar va sahifalar uchun.
import { getAllSlugs } from '@/lib/api';
import { LOCALES, HREFLANG_MAP } from '@/i18n';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const revalidate = 3600;

/** Har bir URL uchun tillar bo'yicha alternativalar */
function alternates(path) {
  const languages = {};
  for (const l of LOCALES) languages[HREFLANG_MAP[l]] = `${SITE}/${l}${path}`;
  return { languages };
}

export default async function sitemap() {
  const { products, categories } = await getAllSlugs();
  const now = new Date();

  const entries = [];

  // Statik sahifalar
  const staticPaths = [
    { path: '', priority: 1.0, freq: 'daily' },
    { path: '/parts', priority: 0.9, freq: 'daily' },
    { path: '/services', priority: 0.9, freq: 'weekly' },
    { path: '/contact', priority: 0.7, freq: 'monthly' },
    { path: '/terms', priority: 0.3, freq: 'yearly' },
    { path: '/privacy', priority: 0.3, freq: 'yearly' },
  ];

  for (const l of LOCALES) {
    for (const s of staticPaths) {
      entries.push({
        url: `${SITE}/${l}${s.path}`,
        lastModified: now,
        changeFrequency: s.freq,
        priority: s.priority,
        alternates: alternates(s.path),
      });
    }
  }

  // Kategoriyalar (zapchastlar katalogining filtrlangan ko'rinishi)
  for (const l of LOCALES) {
    for (const c of categories) {
      entries.push({
        url: `${SITE}/${l}/parts?category=${c.slug}`,
        lastModified: new Date(c.updatedAt || now),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: alternates(`/parts?category=${c.slug}`),
      });
    }
  }

  // Zapchastlar va xizmatlar (kind bo'yicha turli prefiks)
  for (const l of LOCALES) {
    for (const p of products) {
      const prefix = p.kind === 'SERVICE' ? 'services' : 'parts';
      entries.push({
        url: `${SITE}/${l}/${prefix}/${p.slug}`,
        lastModified: new Date(p.updatedAt || now),
        changeFrequency: 'weekly',
        priority: p.kind === 'SERVICE' ? 0.85 : 0.75,
        alternates: alternates(`/${prefix}/${p.slug}`),
      });
    }
  }

  return entries;
}
