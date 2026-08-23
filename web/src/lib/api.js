// Server tomonidagi API klient (Server Components uchun).
// Next.js fetch keshi + xatoga bardoshlilik: API yiqilsa sahifa ishlashda davom etadi.
import 'server-only';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Ichki fetch: timeout, ISR revalidate va xatolarni yumshoq ushlash bilan.
 * @param {string} path '/api/products' kabi
 * @param {{revalidate?:number, tags?:string[], fallback?:any}} opts
 */
async function apiGet(path, { revalidate = 300, tags = [], fallback = null } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      signal: controller.signal,
      next: { revalidate, tags },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    return json?.ok ? json : fallback;
  } catch {
    // Backend yiqilgan bo'lsa - sahifa "oq ekran" bermasligi uchun fallback
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

// ---- Ommaviy so'rovlar ----

export async function getSettings() {
  const r = await apiGet('/api/settings', { revalidate: 600, tags: ['settings'] });
  return r?.data ?? null;
}

export async function getCategories() {
  const r = await apiGet('/api/categories', { revalidate: 600, tags: ['categories'] });
  return r?.data ?? [];
}

export async function getCategory(slug) {
  const r = await apiGet(`/api/categories/${encodeURIComponent(slug)}`, {
    revalidate: 600,
    tags: ['categories'],
  });
  return r?.data ?? null;
}

export async function getProducts(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const r = await apiGet(`/api/products${qs ? '?' + qs : ''}`, { revalidate: 300, tags: ['products'] });
  return { items: r?.data ?? [], meta: r?.meta ?? { page: 1, pages: 1, total: 0 } };
}

export async function getProduct(slug) {
  const r = await apiGet(`/api/products/${encodeURIComponent(slug)}`, {
    revalidate: 300,
    tags: ['products'],
  });
  return r?.data ?? null;
}

export async function getFilters() {
  const r = await apiGet('/api/products/meta/filters', { revalidate: 900, tags: ['products'] });
  return r?.data ?? { brands: [], countries: [] };
}

export async function getAllSlugs() {
  const r = await apiGet('/api/products/meta/slugs', { revalidate: 3600, tags: ['sitemap'] });
  return r?.data ?? { products: [], categories: [] };
}
