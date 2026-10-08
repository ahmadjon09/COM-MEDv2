// SEO yordamchilari: metadata, hreflang, OpenGraph, Geo teglar va Schema.org JSON-LD.
import { pick, LOCALES, HREFLANG_MAP, getDict } from '@/i18n';
import { truncate } from './utils';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://commedical.uz').replace(/\/$/, '');

/** To'liq (absolyut) URL yasash — allaqachon http(s) bo'lsa o'zini qaytaradi */
export const abs = (path = '') => {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : '/' + path}`;
};

/** Barcha tillar va mintaqalar uchun muqobil havolalar (hreflang matritsasi) */
export function altLanguages(pathWithoutLocale = '') {
  const cleanPath =
    pathWithoutLocale && !pathWithoutLocale.startsWith('/') ? '/' + pathWithoutLocale : pathWithoutLocale;
  const languages = {};
  for (const l of LOCALES) {
    languages[HREFLANG_MAP[l]] = abs(`/${l}${cleanPath}`);
  }
  // Umumiy ISO 639-1 / ISO 15924 kodlar (mintaqa tanlamagan brauzerlar uchun)
  languages['uz'] = abs(`/uz${cleanPath}`);
  languages['uz-Latn'] = abs(`/uz${cleanPath}`);
  languages['uz-Latn-UZ'] = abs(`/uz${cleanPath}`);
  languages['ru'] = abs(`/ru${cleanPath}`);
  languages['uz-Cyrl'] = abs(`/uz-cyrl${cleanPath}`);
  languages['x-default'] = abs(`/uz${cleanPath}`);
  return languages;
}

/**
 * Sarlavhani normallashtirish: brend nomi ikki marta takrorlanishining oldini oladi.
 */
export function formatSeoTitle(rawTitle, siteName = 'COM MEDICAL SERVIS') {
  const clean = String(rawTitle || siteName).replace(/\s+/g, ' ').trim();
  if (/com\s*medical/i.test(clean)) return clean;
  return `${clean} | ${siteName}`;
}

/** Markdown belgilarini (masalan **qalin**) tozalash — JSON-LD va meta uchun */
export function stripMarkdown(text = '') {
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sahifa metadata'sini yig'ish (Next.js `Metadata` obyekti).
 * @param {object} p
 */
export function buildMetadata({
  locale = 'uz',
  path = '',            // tilsiz yo'l, masalan '/parts' yoki '/parts?category=uzi'
  title,
  description,
  image,                // OG rasm URL (bo'lmasa dinamik generatsiya qilinadi)
  ogParams,             // dinamik OG uchun { title, subtitle, badge, price }
  type = 'website',
  noindex = false,
  keywords = [],
  useBanner = false,    // true bo'lsa - kompaniya banneri (og-default.jpg) ishlatiladi
}) {
  const dict = getDict(locale);
  const cleanPath = path && !path.startsWith('/') ? '/' + path : path;
  const url = abs(`/${locale}${cleanPath}`);

  const rawTitle = String(title || dict.seo.homeTitle).trim();
  const fullTitle = formatSeoTitle(rawTitle);
  const cleanDesc = stripMarkdown(description || dict.seo.homeDesc);
  const metaDesc = truncate(cleanDesc, 165);
  const ogDesc = truncate(cleanDesc, 220);

  // Rasm berilmasa: dinamik OG (mahsulot/xizmat uchun) yoki kompaniya banneri
  const ogImage = image
    ? abs(image)
    : useBanner
      ? abs('/og-default.jpg')
      : abs(
          `/api/og?${new URLSearchParams(
            Object.entries({
              title: (ogParams?.title || rawTitle || dict.seo.homeTitle).slice(0, 90),
              subtitle: (ogParams?.subtitle || cleanDesc || '').slice(0, 120),
              badge: ogParams?.badge || 'COM MEDICAL SERVIS',
              ...(ogParams?.price ? { price: ogParams.price } : {}),
            })
          ).toString()}`
        );

  // Kalit so'zlarni dublikatlardan tozalash
  const uniqueKeywords = Array.from(
    new Set(
      (Array.isArray(keywords) ? keywords : [keywords])
        .map((k) => String(k || '').trim())
        .filter(Boolean)
    )
  );

  const robotsConfig = noindex
    ? {
        index: false,
        follow: true,
        googleBot: { index: false, follow: true },
      }
    : {
        index: true,
        follow: true,
        nocache: false,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
        googleBot: {
          index: true,
          follow: true,
          noimageindex: false,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      };

  return {
    title: { absolute: fullTitle },
    description: metaDesc,
    keywords: uniqueKeywords.length ? uniqueKeywords.join(', ') : undefined,
    authors: [{ name: 'COM MEDICAL SERVIS', url: SITE_URL }],
    creator: 'COM MEDICAL SERVIS',
    publisher: 'COM MEDICAL SERVIS',
    category: 'Medical Equipment Service & Spare Parts',
    alternates: {
      canonical: url,
      languages: altLanguages(cleanPath),
    },
    robots: robotsConfig,
    openGraph: {
      type,
      url,
      title: fullTitle,
      description: ogDesc,
      siteName: 'COM MEDICAL SERVIS',
      locale: locale === 'ru' ? 'ru_RU' : 'uz_UZ',
      alternateLocale: locale === 'ru' ? ['uz_UZ'] : ['ru_RU'],
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: rawTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: truncate(cleanDesc, 200),
      images: [ogImage],
    },
    other: {
      'geo.region': 'UZ-NG',
      'geo.placename': 'Namangan, Uzbekistan',
      'geo.position': '40.9983;71.6726',
      ICBM: '40.9983, 71.6726',
    },
  };
}

// ---------------- JSON-LD (Schema.org Bilimlar Grafi) ----------------

export function organizationLd(settings, locale = 'uz') {
  const dict = getDict(locale);
  const name = pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS';
  const phones = Array.isArray(settings?.phones) && settings.phones.length
    ? settings.phones
    : [{ label: 'Asosiy', value: '+998902758883', isPrimary: true }];
  const streetAddress =
    pick(settings, 'address', locale) ||
    "Namangan viloyati, Namangan sh., Yangi Namangan tumani, Go'zal MFY, Go'zal massivi, 2-d uy";

  const sameAs = [
    settings?.telegramUrl,
    settings?.instagramUrl,
    settings?.youtubeUrl,
    ...(Array.isArray(settings?.socials) ? settings.socials.map((s) => s.url) : []),
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name,
    alternateName: ['COM MEDICAL SERVICE', 'COMMED', 'ComMedical', 'commedical.uz'],
    url: abs(`/${locale}`),
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: abs('/logo.png'),
      contentUrl: abs('/logo.png'),
      width: 512,
      height: 512,
      caption: name,
    },
    image: abs('/og-default.jpg'),
    description: pick(settings, 'metaDesc', locale) || pick(settings, 'about', locale) || dict.seo.homeDesc,
    foundingDate: '2014',
    email: settings?.emails?.[0] || 'mirzayev@mail.ru',
    telephone: phones[0]?.value || '+998902758883',
    address: {
      '@type': 'PostalAddress',
      streetAddress,
      addressLocality: 'Namangan',
      addressRegion: 'Namangan viloyati',
      postalCode: '160100',
      addressCountry: 'UZ',
    },
    areaServed: [
      { '@type': 'Country', name: 'Uzbekistan' },
      { '@type': 'AdministrativeArea', name: 'Namangan' },
      { '@type': 'AdministrativeArea', name: 'Andijon' },
      { '@type': 'AdministrativeArea', name: "Farg'ona" },
      { '@type': 'AdministrativeArea', name: 'Toshkent' },
    ],
    contactPoint: phones.map((p) => ({
      '@type': 'ContactPoint',
      telephone: p.value,
      contactType: 'customer service',
      areaServed: 'UZ',
      availableLanguage: ['uz', 'ru'],
    })),
    knowsAbout: [
      'Medical Equipment Repair',
      'Ultrasound Probe Repair',
      'ECG Calibration',
      'Ventilator Service',
      'Defibrillator Maintenance',
      'Autoclave Repair',
      'Medical Spare Parts',
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function localBusinessLd(settings, locale = 'uz', dict = null) {
  const d = dict || getDict(locale);
  const name = pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS';
  const phones = Array.isArray(settings?.phones) && settings.phones.length
    ? settings.phones
    : [{ label: 'Asosiy', value: '+998902758883', isPrimary: true }];
  const streetAddress =
    pick(settings, 'address', locale) ||
    "Namangan viloyati, Namangan sh., Yangi Namangan tumani, Go'zal MFY, Go'zal massivi, 2-d uy";
  const reviews = Array.isArray(d?.reviews) ? d.reviews : [];

  return {
    '@context': 'https://schema.org',
    '@type': ['MedicalBusiness', 'LocalBusiness'],
    '@id': `${SITE_URL}/#localbusiness`,
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
    name,
    image: [
      settings?.defaultOgImage ? abs(settings.defaultOgImage) : abs('/og-default.jpg'),
      abs('/logo.png'),
    ],
    logo: abs('/logo.png'),
    url: abs(`/${locale}`),
    telephone: phones[0]?.value || '+998902758883',
    email: settings?.emails?.[0] || 'mirzayev@mail.ru',
    priceRange: '$$',
    currenciesAccepted: 'UZS, USD',
    paymentAccepted: 'Cash, Bank Transfer, Uzcard, Humo',
    address: {
      '@type': 'PostalAddress',
      streetAddress,
      addressLocality: 'Namangan',
      addressRegion: 'Namangan viloyati',
      postalCode: '160100',
      addressCountry: 'UZ',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.9983,
      longitude: 71.6726,
    },
    hasMap: 'https://maps.google.com/?q=40.9983,71.6726',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:30',
        closes: '18:00',
      },
    ],
    ...(reviews.length > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: String(reviews.length),
            bestRating: '5',
            worstRating: '1',
          },
          review: reviews.map((r) => ({
            '@type': 'Review',
            author: {
              '@type': 'Person',
              name: r.author,
              jobTitle: r.role,
            },
            reviewBody: r.text,
            reviewRating: {
              '@type': 'Rating',
              ratingValue: '5',
              bestRating: '5',
              worstRating: '1',
            },
          })),
        }
      : {}),
  };
}

export function productLd(product, locale = 'uz', url, dict = null) {
  const d = dict || getDict(locale);
  const name = pick(product, 'name', locale);
  const isService = product?.kind === 'SERVICE';
  const catName = product?.category ? pick(product.category, 'name', locale) : undefined;
  const description = stripMarkdown(
    pick(product, 'short', locale) || truncate(pick(product, 'desc', locale), 300)
  );

  // Google Rich Results har bir Product/Service uchun kamida 1 ta rasm talab qiladi
  const images =
    product?.images?.length > 0
      ? product.images.map((img) => abs(img))
      : product?.ogImage
        ? [abs(product.ogImage)]
        : product?.category?.imageUrl
          ? [abs(product.category.imageUrl)]
          : [abs('/og-default.jpg')];

  const base = {
    '@context': 'https://schema.org',
    '@type': isService ? 'Service' : 'Product',
    '@id': `${url}#${isService ? 'service' : 'product'}`,
    name,
    description,
    image: images,
    url,
    ...(catName ? { category: catName } : {}),
  };

  if (isService) {
    const includes = pick(product, 'includes', locale) || [];
    return {
      ...base,
      serviceType: name,
      provider: {
        '@type': 'MedicalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: 'COM MEDICAL SERVIS',
        url: SITE_URL,
      },
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Namangan' },
        { '@type': 'Country', name: 'Uzbekistan' },
      ],
      ...(Array.isArray(includes) && includes.length > 0
        ? {
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: `${name} — ${d.services.includes}`,
              itemListElement: includes.map((inc, idx) => ({
                '@type': 'Offer',
                position: idx + 1,
                itemOffered: {
                  '@type': 'Service',
                  name: inc,
                },
              })),
            },
          }
        : {}),
    };
  }

  const specs = Array.isArray(product?.specs) ? product.specs : [];
  const specLabel = (s) => (locale === 'ru' ? s.labelRu : locale === 'uz-cyrl' ? s.labelUzCyrl : s.labelUz);
  const additionalProperty = [
    ...specs.map((s) => ({
      '@type': 'PropertyValue',
      name: specLabel(s),
      value: s.value,
    })),
    ...(product?.compatibility?.length
      ? [
          {
            '@type': 'PropertyValue',
            name: d.parts.compatibility,
            value: product.compatibility.join(', '),
          },
        ]
      : []),
    ...(product?.warranty && product.warranty !== '—'
      ? [
          {
            '@type': 'PropertyValue',
            name: d.parts.warranty,
            value: product.warranty,
          },
        ]
      : []),
  ];

  const conditionSchema =
    product?.condition === 'REFURBISHED'
      ? 'https://schema.org/RefurbishedCondition'
      : 'https://schema.org/NewCondition';

  const countryName = product?.originCountry
    ? d.countries?.[product.originCountry] || product.originCountry
    : undefined;

  return {
    ...base,
    sku: product?.sku || product?.slug,
    mpn: product?.model || product?.sku || product?.slug,
    brand: {
      '@type': 'Brand',
      name: product?.brand || 'COM MEDICAL SERVIS',
    },
    ...(product?.model ? { model: product.model } : {}),
    ...(product?.manufacturer
      ? { manufacturer: { '@type': 'Organization', name: product.manufacturer } }
      : {}),
    ...(countryName ? { countryOfOrigin: { '@type': 'Country', name: countryName } } : {}),
    itemCondition: conditionSchema,
    ...(additionalProperty.length > 0 ? { additionalProperty } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: product?.currency || 'UZS',
      price: product?.price ? String(product.price) : '0',
      priceValidUntil: '2027-12-31',
      itemCondition: conditionSchema,
      // Zapchast har doim ombordan yoki buyurtma bo'yicha yetkazib beriladi
      availability: 'https://schema.org/InStock',
      areaServed: { '@type': 'Country', name: 'UZ' },
      seller: {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'COM MEDICAL SERVIS',
        url: SITE_URL,
      },
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

export function websiteLd(locale = 'uz') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: abs(`/${locale}`),
    name: 'COM MEDICAL SERVIS',
    alternateName: ['COM MEDICAL SERVICE', 'COMMED', 'commedical.uz'],
    inLanguage: HREFLANG_MAP[locale] || 'uz-UZ',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: abs(`/${locale}/parts?q={search_term_string}`),
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function faqPageLd(faqItems = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: stripMarkdown(f.q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripMarkdown(f.a),
      },
    })),
  };
}
