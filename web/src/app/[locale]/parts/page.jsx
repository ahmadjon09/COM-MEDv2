// Zapchastlar katalogi sahifasi.
import { notFound } from 'next/navigation';
import { getDict, isValidLocale, pick } from '@/i18n';
import { getCategories, getProducts, getSettings, getFilters } from '@/lib/api';
import { buildMetadata, breadcrumbLd, abs } from '@/lib/seo';
import PartsCatalog from '@/components/catalog/PartsCatalog';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import JsonLd from '@/components/ui/JsonLd';
import Reveal from '@/components/ui/Reveal';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDict(locale);
  const settings = await getSettings();

  return buildMetadata({
    locale, path: '/parts',
    title: `${dict.parts.title} — ${pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS'}`,
    description: dict.parts.subtitle,
    ogParams: { title: dict.parts.title, subtitle: dict.parts.subtitle, badge: 'CATALOG' },
    keywords: ['tibbiy zapchastlar', 'медицинские запчасти', 'UZI datchik narxi', 'запчасти для узи', 'ehtiyot qismlar'],
  });
}

export default async function PartsPage({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!isValidLocale(locale)) notFound();

  const dict = getDict(locale);
  const category = typeof sp?.category === 'string' ? sp.category : null;

  const [categories, filters, initial] = await Promise.all([
    getCategories(),
    getFilters(),
    getProducts({ kind: 'PART', limit: 24, category: category || undefined }),
  ]);

  const crumbs = [
    { name: dict.product.breadcrumbHome, url: abs(`/${locale}`) },
    { name: dict.parts.title, url: abs(`/${locale}/parts`) },
  ];

  return (
    <>
      <JsonLd data={[
        breadcrumbLd(crumbs),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: dict.parts.title,
          description: dict.parts.subtitle,
          url: abs(`/${locale}/parts`),
        },
      ]} />

      {/* Sahifa boshi */}
      <section className="border-b border-ink-150">
        <div className="wrap py-9 lg:py-12">
          <Breadcrumbs items={[{ name: dict.product.breadcrumbHome, href: `/${locale}` }, { name: dict.parts.title }]} />
          <Reveal>
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
              <h1 className="text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl xl:text-5xl">
                {dict.parts.title}
              </h1>
              <p className="max-w-text self-end text-sm leading-relaxed text-ink-500">{dict.parts.subtitle}</p>
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
            initialData={{ ok: true, data: initial.items, meta: initial.meta }}
          />
        </div>
      </section>
    </>
  );
}
