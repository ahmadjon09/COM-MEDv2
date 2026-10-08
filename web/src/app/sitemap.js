// sitemap.xml avtomatik generatsiyasi — barcha tillar va sahifalar uchun.
import { getAllSlugs } from '@/lib/api';
import { LOCALES } from '@/i18n';
import { SITE_URL, altLanguages } from '@/lib/seo';

export const revalidate = 3600;

/** Har bir URL uchun tillar bo'yicha alternativalar (x-default bilan) */
function alternates(path) {
  return { languages: altLanguages(path) };
}

export default async function sitemap() {
  const { products, categories } = await getAllSlugs();
  const now = new Date();

  const entries = [];

  // Statik sahifalar
  const staticPaths = [
    { path: '', priority: 1.0, freq: 'daily' },
    { path: '/parts', priority: 0.95, freq: 'daily' },
    { path: '/services', priority: 0.95, freq: 'weekly' },
    { path: '/contact', priority: 0.8, freq: 'monthly' },
    { path: '/terms', priority: 0.3, freq: 'yearly' },
    { path: '/privacy', priority: 0.3, freq: 'yearly' },
  ];

  for (const l of LOCALES) {
    for (const s of staticPaths) {
      entries.push({
        url: `${SITE_URL}/${l}${s.path}`,
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
      if (c.scope === 'SERVICE') continue;
      entries.push({
        url: `${SITE_URL}/${l}/parts?category=${c.slug}`,
        lastModified: new Date(c.updatedAt || now),
        changeFrequency: 'weekly',
        priority: 0.85,
        alternates: alternates(`/parts?category=${c.slug}`),
      });
    }
  }

  // Zapchastlar va xizmatlar (kind bo'yicha turli prefiks)
  for (const l of LOCALES) {
    for (const p of products) {
      const prefix = p.kind === 'SERVICE' ? 'services' : 'parts';
      entries.push({
        url: `${SITE_URL}/${l}/${prefix}/${p.slug}`,
        lastModified: new Date(p.updatedAt || now),
        changeFrequency: 'weekly',
        priority: p.kind === 'SERVICE' ? 0.9 : 0.8,
        alternates: alternates(`/${prefix}/${p.slug}`),
      });
    }
  }

  return entries;
}
