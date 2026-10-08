// Zapchastlar katalogi sahifasi (umumiy katalog va kategoriya bo'yicha SEO sahifalari).
import { notFound } from 'next/navigation';
import { getDict, isValidLocale, pick } from '@/i18n';
import { getCategories, getProducts, getSettings, getFilters } from '@/lib/api';
import { buildMetadata, breadcrumbLd, abs } from '@/lib/seo';
import PartsCatalog from '@/components/catalog/PartsCatalog';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import JsonLd from '@/components/ui/JsonLd';
import Reveal from '@/components/ui/Reveal';

export const revalidate = 300;

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!isValidLocale(locale)) return {};

  const dict = getDict(locale);
  const categorySlug = typeof sp?.category === 'string' ? sp.category.trim() : '';
  const searchQuery = typeof sp?.q === 'string' ? sp.q.trim() : '';

  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const siteName = pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS';
  const activeCat = categorySlug ? categories.find((c) => c.slug === categorySlug) : null;

  if (activeCat) {
    const catName = pick(activeCat, 'name', locale);
    const catDesc = pick(activeCat, 'metaDesc', locale) || pick(activeCat, 'desc', locale) || dict.parts.subtitle;
    const catTitle = pick(activeCat, 'metaTitle', locale) || `${catName} — ${dict.parts.title} | ${siteName}`;

    return buildMetadata({
      locale,
      path: `/parts?category=${encodeURIComponent(activeCat.slug)}`,
      title: catTitle,
      description: catDesc,
      image: activeCat.ogImage || activeCat.imageUrl,
      ogParams: { title: catName, subtitle: catDesc, badge: 'CATALOG' },
      noindex: Boolean(searchQuery),
      keywords: [
        catName,
        `${catName} zapchastlari`,
        `${catName} ehtiyot qismlari`,
        'tibbiy zapchastlar',
        'медицинские запчасти',
        'COM MEDICAL SERVIS',
      ],
    });
  }

  return buildMetadata({
    locale,
    path: '/parts',
    title: `${dict.parts.title} — ${siteName}`,
    description: dict.parts.subtitle,
    ogParams: { title: dict.parts.title, subtitle: dict.parts.subtitle, badge: 'CATALOG' },
    noindex: Boolean(searchQuery),
    keywords: [
      'tibbiy zapchastlar',
      'tibbiy uskunalar ehtiyot qismlari',
      'медицинские запчасти',
      'запчасти для медоборудования',
      'UZI datchik narxi',
      'запчасти для узи',
      'EKG kabel narxi',
      'defibrillator akkumulyatori',
      'IVL oqim sensori',
      'avtoklav qizdirgich ten',
      'тиббий ускуналар эҳтиёт қисмлари',
    ],
  });
}

export default async function PartsPage({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!isValidLocale(locale)) notFound();

  const dict = getDict(locale);
  const category = typeof sp?.category === 'string' ? sp.category.trim() : null;
  const q = typeof sp?.q === 'string' ? sp.q.trim() : '';

  const [categories, filters, initial] = await Promise.all([
    getCategories(),
    getFilters(),
    getProducts({
      kind: 'PART',
      limit: 24,
      category: category || undefined,
      q: q || undefined,
    }),
  ]);

  const activeCat = category ? categories.find((c) => c.slug === category) : null;
  const catName = activeCat ? pick(activeCat, 'name', locale) : null;
  const pageTitle = activeCat ? `${catName} — ${dict.parts.title}` : dict.parts.title;
  const pageLead = activeCat ? pick(activeCat, 'desc', locale) || dict.parts.subtitle : dict.parts.subtitle;
  const pageUrl = abs(`/${locale}/parts${activeCat ? `?category=${encodeURIComponent(activeCat.slug)}` : ''}`);

  const crumbs = [
    { name: dict.product.breadcrumbHome, url: abs(`/${locale}`), href: `/${locale}` },
    {
      name: dict.parts.title,
      url: abs(`/${locale}/parts`),
      href: activeCat ? `/${locale}/parts` : undefined,
    },
    ...(activeCat ? [{ name: catName, url: pageUrl }] : []),
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(crumbs.map(({ name, url }) => ({ name, url }))),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            '@id': `${pageUrl}#collection`,
            name: pageTitle,
            description: pageLead,
            url: pageUrl,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: initial.meta?.total ?? initial.items.length,
              itemListElement: initial.items.map((item, idx) => ({
                '@type': 'ListItem',
                position: idx + 1,
                name: pick(item, 'name', locale),
                url: abs(`/${locale}/parts/${item.slug}`),
              })),
            },
          },
        ]}
      />

      {/* Sahifa boshi */}
      <section className="border-b border-ink-150">
        <div className="wrap py-9 lg:py-12">
          <Breadcrumbs items={crumbs.map(({ name, href }) => ({ name, href }))} />
          <Reveal>
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
              <h1 className="text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl xl:text-5xl">
                {pageTitle}
              </h1>
              <p className="max-w-text self-end text-sm leading-relaxed text-ink-500">{pageLead}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-8 lg:py-10">
        <div className="wrap">
          <PartsCatalog
            locale={locale}
            dict={dict}
            categories={categories}
            filters={filters}
            fixedCategory={category}
            initialQuery={q}
            initialData={{ ok: true, data: initial.items, meta: initial.meta }}
          />
        </div>
      </section>
    </>
  );
}
