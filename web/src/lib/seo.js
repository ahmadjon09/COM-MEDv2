// SEO yordamchilari: metadata, hreflang, JSON-LD.
import { pick, LOCALES, HREFLANG_MAP, getDict } from '@/i18n';
import { truncate } from './utils';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** To'liq URL yasash */
export const abs = (path = '') => `${SITE_URL}${path.startsWith('/') ? path : '/' + path}`;

/** Barcha tillar uchun alternativ havolalar (hreflang) */
export function altLanguages(pathWithoutLocale) {
  const languages = {};
  for (const l of LOCALES) {
    languages[HREFLANG_MAP[l]] = abs(`/${l}${pathWithoutLocale}`);
  }
  languages['x-default'] = abs(`/uz${pathWithoutLocale}`);
  return languages;
}

/**
 * Sahifa metadata'sini yig'ish (Next.js `Metadata` obyekti).
 * @param {object} p
 */
export function buildMetadata({
  locale = 'uz',
  path = '',            // tilsiz yo'l, masalan '/catalog/uzi-apparatlari'
  title,
  description,
  image,                // OG rasm URL (bo'lmasa dinamik generatsiya qilinadi)
  ogParams,             // dinamik OG uchun { title, subtitle, badge }
  type = 'website',
  noindex = false,
  keywords = [],
  useBanner = false,   // true bo'lsa - kompaniya banneri (og-default.jpg) ishlatiladi
}) {
  const dict = getDict(locale);
  const url = abs(`/${locale}${path}`);

  // Rasm berilmasa: dinamik OG (mahsulot/xizmat uchun) yoki kompaniya banneri
  const ogImage =
    image ||
    (useBanner ? abs('/og-default.jpg') : null) ||
    abs(
      `/api/og?${new URLSearchParams({
        title: (ogParams?.title || title || dict.seo.homeTitle).slice(0, 90),
        subtitle: (ogParams?.subtitle || description || '').slice(0, 120),
        badge: ogParams?.badge || 'COM MEDICAL SERVIS',
      }).toString()}`
    );

  return {
    title,
    description: truncate(description, 300),
    keywords: keywords.length ? keywords.join(', ') : undefined,
    alternates: {
      canonical: url,
      languages: altLanguages(path),
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      type,
      url,
      title,
      description: truncate(description, 300),
      siteName: 'COM MEDICAL SERVIS',
      locale: locale === 'ru' ? 'ru_RU' : 'uz_UZ',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: truncate(description, 200),
      images: [ogImage],
    },
  };
}

// ---------------- JSON-LD ----------------

export function organizationLd(settings, locale) {
  const name = pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS';
  const phones = Array.isArray(settings?.phones) ? settings.phones : [];
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name,
    url: abs(`/${locale}`),
    description: pick(settings, 'metaDesc', locale) || pick(settings, 'about', locale),
    email: settings?.emails?.[0],
    telephone: phones[0]?.value,
    contactPoint: phones.map((p) => ({
      '@type': 'ContactPoint',
      telephone: p.value,
      contactType: 'customer service',
      availableLanguage: ['uz', 'ru'],
    })),
    sameAs: [
      settings?.telegramUrl,
      settings?.instagramUrl,
      settings?.youtubeUrl,
      ...(Array.isArray(settings?.socials) ? settings.socials.map((s) => s.url) : []),
    ].filter(Boolean),
  };
}

export function localBusinessLd(settings, locale) {
  const phones = Array.isArray(settings?.phones) ? settings.phones : [];
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'MedicalBusiness'],
    '@id': `${SITE_URL}/#localbusiness`,
    name: pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS',
    image: settings?.defaultOgImage || abs('/api/og?title=COM MEDICAL SERVIS'),
    url: abs(`/${locale}`),
    telephone: phones[0]?.value,
    address: {
      '@type': 'PostalAddress',
      streetAddress: pick(settings, 'address', locale),
      addressCountry: 'UZ',
    },
    openingHours: pick(settings, 'workHours', locale),
    priceRange: '$$',
  };
}

export function productLd(product, locale, url) {
  const name = pick(product, 'name', locale);
  const isService = product?.kind === 'SERVICE';
  const base = {
    '@context': 'https://schema.org',
    '@type': isService ? 'Service' : 'Product',
    name,
    description: pick(product, 'short', locale) || truncate(pick(product, 'desc', locale), 300),
    image: product?.images?.length ? product.images : undefined,
    url,
  };

  if (isService) {
    return {
      ...base,
      serviceType: name,
      provider: { '@type': 'Organization', name: 'COM MEDICAL SERVIS', url: SITE_URL },
      areaServed: { '@type': 'Country', name: 'Uzbekistan' },
      // Xizmat narxi e'lon qilinmaydi - schema.org'ga ham narx yozilmaydi
    };
  }

  return {
    ...base,
    sku: product?.sku || product?.slug,
    brand: product?.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    model: product?.model || undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: product?.currency || 'UZS',
      price: product?.price ? String(product.price) : '0',
      // Zapchast har doim buyurtma bo'yicha yetkazib beriladi
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'COM MEDICAL SERVIS' },
    },
  };
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function websiteLd(locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: abs(`/${locale}`),
    name: 'COM MEDICAL SERVIS',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: abs(`/${locale}/catalog?q={search_term_string}`) },
      'query-input': 'required name=search_term_string',
    },
  };
}
