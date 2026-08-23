// Bitta zapchast sahifasi — datasheet ko'rinishi: rasm, xarakteristika jadvali,
// ishlab chiqarilgan davlat, moslik ro'yxati, narx va so'rov formasi.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDict, isValidLocale, pick } from '@/i18n';
import { getProduct, getAllSlugs } from '@/lib/api';
import { buildMetadata, breadcrumbLd, productLd, abs } from '@/lib/seo';
import { formatPrice, toParagraphs, truncate } from '@/lib/utils';

import Breadcrumbs from '@/components/ui/Breadcrumbs';
import JsonLd from '@/components/ui/JsonLd';
import Reveal from '@/components/ui/Reveal';
import Icon from '@/components/ui/Icons';
import RequestForm from '@/components/forms/RequestForm';
import Gallery from '@/components/catalog/Gallery';
import PartCard from '@/components/catalog/PartCard';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { products } = await getAllSlugs();
  return products
    .filter((p) => p.kind !== 'SERVICE')
    .slice(0, 60)
    .flatMap((p) => ['uz', 'ru', 'uz-cyrl'].map((locale) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const item = await getProduct(slug);
  if (!item || item.kind !== 'PART') return { title: 'Topilmadi', robots: { index: false, follow: false } };

  const dict = getDict(locale);
  const name = pick(item, 'name', locale);
  const country = item.originCountry ? dict.countries[item.originCountry] || item.originCountry : '';
  const short = pick(item, 'short', locale);

  return buildMetadata({
    locale, path: `/parts/${slug}`, type: 'article',
    title: pick(item, 'metaTitle', locale) || `${name}${item.sku ? ` — ${item.sku}` : ''}`,
    description:
      pick(item, 'metaDesc', locale) ||
      truncate(`${short} ${item.brand ? `Brend: ${item.brand}.` : ''} ${country ? `${dict.parts.country}: ${country}.` : ''}`, 300),
    image: item.ogImage || item.images?.[0],
    ogParams: { title: name, subtitle: [item.brand, item.model, country].filter(Boolean).join(' · '), badge: item.sku || 'PART' },
    keywords: [name, item.brand, item.model, item.sku, country, ...(item.keywords || [])].filter(Boolean),
  });
}

export default async function PartPage({ params }) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const item = await getProduct(slug);
  if (!item || item.kind !== 'PART') notFound();

  const dict = getDict(locale);
  const name = pick(item, 'name', locale);
  const short = pick(item, 'short', locale);
  const desc = pick(item, 'desc', locale);
  const catName = pick(item.category, 'name', locale);
  const country = item.originCountry ? dict.countries[item.originCountry] || item.originCountry : null;
  const url = abs(`/${locale}/parts/${slug}`);

  const specs = Array.isArray(item.specs) ? item.specs : [];
  const specLabel = (s) => (locale === 'ru' ? s.labelRu : locale === 'uz-cyrl' ? s.labelUzCyrl : s.labelUz);

  // Asosiy ma'lumot jadvali
  const main = [
    item.sku && { k: dict.parts.sku, v: item.sku, mono: true },
    item.brand && { k: dict.parts.brand, v: item.brand },
    item.model && { k: dict.product.model, v: item.model, mono: true },
    country && { k: dict.parts.country, v: `${country} (${item.originCountry})` },
    item.manufacturer && { k: dict.parts.manufacturer, v: item.manufacturer },
    { k: dict.parts.condition, v: item.condition === 'REFURBISHED' ? dict.parts.conditionRefurb : dict.parts.conditionNew },
    item.warranty && item.warranty !== '—' && { k: dict.parts.warranty, v: item.warranty },
  ].filter(Boolean);

  return (
    <>
      <JsonLd data={[
        breadcrumbLd([
          { name: dict.product.breadcrumbHome, url: abs(`/${locale}`) },
          { name: dict.parts.title, url: abs(`/${locale}/parts`) },
          { name, url },
        ]),
        productLd(item, locale, url),
      ]} />

      <div className="border-b border-ink-150">
        <div className="wrap py-5">
          <Breadcrumbs items={[
            { name: dict.product.breadcrumbHome, href: `/${locale}` },
            { name: dict.parts.title, href: `/${locale}/parts` },
            { name: catName, href: `/${locale}/parts?category=${item.category.slug}` },
            { name },
          ]} />
        </div>
      </div>

      <section className="wrap py-9 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-14">
          {/* Chap ustun */}
          <div>
            <Reveal>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-ink-900 px-2 py-1 font-mono text-label uppercase text-white">
                  {item.sku || 'PART'}
                </span>
                <span className="border border-ink-150 px-2 py-1 font-mono text-label uppercase text-ink-500">
                  {catName}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-ink-600">
                  <span className="dot bg-ok" />
                  {dict.parts.supply}
                </span>
              </div>

              <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-ink-900 md:text-3xl xl:text-4xl">
                {name}
              </h1>
              {short && <p className="mt-4 max-w-text text-base leading-relaxed text-ink-600">{short}</p>}
            </Reveal>

            <Reveal delay={0.05}>
              <div className="mt-8">
                <Gallery images={item.images} alt={name} kind="PART" />
              </div>
            </Reveal>

            {/* Texnik xarakteristikalar */}
            {specs.length > 0 && (
              <Reveal delay={0.08}>
                <div className="mt-10">
                  <h2 className="border-b border-ink-150 pb-2 text-lg font-semibold text-ink-900">{dict.parts.specs}</h2>
                  <dl className="mt-4 grid gap-x-12 md:grid-cols-2">
                    {specs.map((s, i) => (
                      <div key={i} className="spec-row">
                        <dt className="spec-key">{specLabel(s)}</dt>
                        <dd className="spec-val tnum">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            )}

            {/* Moslik */}
            {item.compatibility?.length > 0 && (
              <Reveal delay={0.1}>
                <div className="mt-10">
                  <h2 className="border-b border-ink-150 pb-2 text-lg font-semibold text-ink-900">{dict.parts.compatibility}</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {item.compatibility.map((c) => (
                      <li key={c} className="border border-ink-150 bg-ink-25 px-3 py-1.5 font-mono text-micro text-ink-700">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            {/* Tavsif */}
            {desc && (
              <Reveal delay={0.12}>
                <div className="mt-10">
                  <h2 className="border-b border-ink-150 pb-2 text-lg font-semibold text-ink-900">{dict.product.description}</h2>
                  <div className="mt-4 max-w-text space-y-4">
                    {toParagraphs(desc).map((p, i) => (
                      <p key={i} className="text-sm leading-[1.78] text-ink-600">{p}</p>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>

          {/* O'ng ustun — narx paneli + forma */}
          <div className="lg:sticky lg:top-[76px] lg:self-start">
            <Reveal>
              <div className="border border-ink-200 bg-white">
                <div className="border-b border-ink-150 px-5 py-3">
                  <span className="kicker">{dict.parts.price}</span>
                </div>
                <div className="px-5 py-5">
                  <p className="text-3xl font-semibold tracking-tight text-ink-900 tnum">
                    {formatPrice(item.price, item.currency, locale, dict)}
                  </p>
                  {item.priceNote && <p className="mt-1 text-sm text-ink-400">{item.priceNote}</p>}

                  <dl className="mt-5 border-t border-ink-150">
                    {main.map((r) => (
                      <div key={r.k} className="spec-row">
                        <dt className="spec-key">{r.k}</dt>
                        <dd className={`spec-val ${r.mono ? 'font-mono' : ''}`}>{r.v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 border-l-2 border-ok bg-ink-25 px-3.5 py-3">
                    <p className="text-xs font-semibold text-ink-900">{dict.parts.supply}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{dict.parts.supplyNote}</p>
                  </div>

                  <div className="mt-3 border-l-2 border-blue-500 bg-ink-25 px-3.5 py-3">
                    <p className="text-xs font-semibold text-ink-900">{dict.parts.checkFit}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{dict.parts.checkFitText}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <RequestForm locale={locale} dict={dict} product={{ id: item.id, name }} className="mt-5" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* O'xshash zapchastlar */}
      {item.related?.length > 0 && (
        <section className="band band-pad">
          <div className="wrap">
            <div className="flex items-center justify-between gap-4 border-b border-ink-150 pb-2">
              <h2 className="text-lg font-semibold text-ink-900">{dict.product.related}</h2>
              <Link href={`/${locale}/parts?category=${item.category.slug}`} className="ul-link text-sm">
                {catName} →
              </Link>
            </div>
            <div className="mt-6 grid gap-5 xs:grid-cols-2 lg:grid-cols-4">
              {item.related.map((p) => <PartCard key={p.id} item={p} locale={locale} dict={dict} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
