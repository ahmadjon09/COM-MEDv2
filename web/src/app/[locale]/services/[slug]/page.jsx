// Bitta xizmat sahifasi — ish tarkibi, muddat, kafolat. Narx ko'rsatilmaydi.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDict, isValidLocale, pick } from '@/i18n';
import { getProduct, getProducts, getAllSlugs } from '@/lib/api';
import { buildMetadata, breadcrumbLd, productLd, abs } from '@/lib/seo';
import { toParagraphs, truncate } from '@/lib/utils';

import Breadcrumbs from '@/components/ui/Breadcrumbs';
import JsonLd from '@/components/ui/JsonLd';
import Reveal from '@/components/ui/Reveal';
import Icon from '@/components/ui/Icons';
import RequestForm from '@/components/forms/RequestForm';
import PartCard from '@/components/catalog/PartCard';
import Gallery from '@/components/catalog/Gallery';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { products } = await getAllSlugs();
  return products
    .filter((p) => p.kind === 'SERVICE')
    .slice(0, 60)
    .flatMap((p) => ['uz', 'ru', 'uz-cyrl'].map((locale) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const item = await getProduct(slug);
  if (!item || item.kind !== 'SERVICE') return { title: 'Topilmadi', robots: { index: false, follow: false } };

  const dict = getDict(locale);
  const name = pick(item, 'name', locale);

  return buildMetadata({
    locale, path: `/services/${slug}`, type: 'article',
    title: pick(item, 'metaTitle', locale) || `${name} — ${dict.services.title}`,
    description: pick(item, 'metaDesc', locale) || truncate(pick(item, 'short', locale) || pick(item, 'desc', locale), 300),
    image: item.ogImage || item.images?.[0],
    ogParams: { title: name, subtitle: truncate(pick(item, 'short', locale), 110), badge: 'SERVICE' },
    keywords: [name, pick(item.category, 'name', locale), ...(item.keywords || [])].filter(Boolean),
  });
}

export default async function ServicePage({ params }) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const item = await getProduct(slug);
  if (!item || item.kind !== 'SERVICE') notFound();

  const dict = getDict(locale);
  const name = pick(item, 'name', locale);
  const short = pick(item, 'short', locale);
  const desc = pick(item, 'desc', locale);
  const includes = pick(item, 'includes', locale) || [];
  const catName = pick(item.category, 'name', locale);
  const url = abs(`/${locale}/services/${slug}`);

  // Shu kategoriyadagi zapchastlar
  const related = await getProducts({ kind: 'PART', category: item.category.slug, limit: 4 });

  return (
    <>
      <JsonLd data={[
        breadcrumbLd([
          { name: dict.product.breadcrumbHome, url: abs(`/${locale}`) },
          { name: dict.services.title, url: abs(`/${locale}/services`) },
          { name, url },
        ]),
        productLd(item, locale, url),
      ]} />

      <div className="border-b border-ink-150">
        <div className="wrap py-5">
          <Breadcrumbs items={[
            { name: dict.product.breadcrumbHome, href: `/${locale}` },
            { name: dict.services.title, href: `/${locale}/services` },
            { name },
          ]} />
        </div>
      </div>

      <section className="wrap py-9 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-14">
          <div>
            <Reveal>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="border border-ink-150 px-2.5 py-1 text-xs text-ink-600">{catName}</span>
              </div>

              <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-ink-900 md:text-3xl xl:text-4xl">
                {name}
              </h1>
              {short && <p className="mt-4 max-w-text text-base leading-relaxed text-ink-600">{short}</p>}
            </Reveal>

            {item.images?.length > 0 && (
              <Reveal delay={0.05}>
                <div className="mt-8"><Gallery images={item.images} alt={name} kind="SERVICE" /></div>
              </Reveal>
            )}

            {/* Nimalar kiradi */}
            {Array.isArray(includes) && includes.length > 0 && (
              <Reveal delay={0.06}>
                <div className="mt-10">
                  <h2 className="border-b border-ink-150 pb-2 text-lg font-semibold text-ink-900">{dict.services.includes}</h2>
                  <ul className="mt-2">
                    {includes.map((it, i) => (
                      <li key={i} className="flex gap-4 border-b border-ink-150 py-3.5">
                        <span className="kicker mt-1 shrink-0 text-ink-300 tnum">{String(i + 1).padStart(2, '0')}</span>
                        <span className="flex-1 text-sm leading-relaxed text-ink-700">{it}</span>
                        <Icon name="check" size={15} className="mt-0.5 shrink-0 text-ok" />
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            {/* Tavsif */}
            {desc && (
              <Reveal delay={0.08}>
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

            {/* Ish bosqichlari */}
            <Reveal delay={0.1}>
              <div className="mt-10">
                <h2 className="border-b border-ink-150 pb-2 text-lg font-semibold text-ink-900">{dict.services.steps}</h2>
                <ol className="mt-4 grid gap-px bg-ink-150 sm:grid-cols-2 xl:grid-cols-4">
                  {dict.process.map((p, i) => (
                    <li key={p.title} className="bg-white p-4">
                      <span className="font-mono text-lg font-semibold text-ink-200 tnum">{String(i + 1).padStart(2, '0')}</span>
                      <h3 className="mt-2 text-sm font-semibold text-ink-900">{p.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{p.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>

          {/* O'ng ustun */}
          <div className="lg:sticky lg:top-[76px] lg:self-start">
            <Reveal>
              <div className="border border-ink-200 bg-white">
                <div className="border-b border-ink-150 px-5 py-3">
                  <span className="kicker">{dict.services.notice}</span>
                </div>
                <div className="px-5 py-5">
                  <p className="text-sm leading-relaxed text-ink-600">{dict.services.noticeText}</p>

                  <dl className="mt-5 border-t border-ink-150">
                    {item.warranty && item.warranty !== '—' && (
                      <div className="spec-row">
                        <dt className="spec-key">{dict.services.warranty}</dt>
                        <dd className="spec-val">{item.warranty}</dd>
                      </div>
                    )}
                    <div className="spec-row">
                      <dt className="spec-key">{dict.why[0].title}</dt>
                      <dd className="spec-val text-ok">✓</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <RequestForm locale={locale} dict={dict} product={{ id: item.id, name }} className="mt-5" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Shu yo'nalishdagi zapchastlar */}
      {related.items.length > 0 && (
        <section className="band band-pad">
          <div className="wrap">
            <div className="flex items-center justify-between gap-4 border-b border-ink-150 pb-2">
              <h2 className="text-lg font-semibold text-ink-900">{dict.services.relatedParts}</h2>
              <Link href={`/${locale}/parts?category=${item.category.slug}`} className="ul-link text-sm">
                {dict.parts.title} →
              </Link>
            </div>
            <div className="mt-6 grid gap-px bg-ink-150 xs:grid-cols-2 lg:grid-cols-4">
              {related.items.map((p) => <PartCard key={p.id} item={p} locale={locale} dict={dict} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
