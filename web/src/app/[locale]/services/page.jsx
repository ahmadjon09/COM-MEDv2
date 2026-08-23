// Xizmatlar sahifasi — narx yo'q, har bir xizmat uchun "nimalar kiradi" ro'yxati.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDict, isValidLocale, pick } from '@/i18n';
import { getProducts, getSettings } from '@/lib/api';
import { buildMetadata, breadcrumbLd, abs } from '@/lib/seo';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import JsonLd from '@/components/ui/JsonLd';
import Reveal from '@/components/ui/Reveal';
import Icon from '@/components/ui/Icons';
import Workflow from '@/components/home/Workflow';
import ContactBand from '@/components/home/ContactBand';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDict(locale);
  const settings = await getSettings();

  return buildMetadata({
    locale, path: '/services',
    title: `${dict.services.title} — ${pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS'}`,
    description: dict.services.subtitle,
    ogParams: { title: dict.services.title, subtitle: dict.services.subtitle, badge: 'SERVICE' },
    keywords: ['UZI remont', 'ремонт УЗИ', 'EKG kalibrovka', 'ИВЛ сервис', 'avtoklav xizmat', 'тиббий ускуна таъмири'],
  });
}

export default async function ServicesPage({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDict(locale);
  const [settings, services] = await Promise.all([
    getSettings(),
    getProducts({ kind: 'SERVICE', limit: 40 }),
  ]);

  return (
    <>
      <JsonLd data={[
        breadcrumbLd([
          { name: dict.product.breadcrumbHome, url: abs(`/${locale}`) },
          { name: dict.services.title, url: abs(`/${locale}/services`) },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: dict.services.title,
          itemListElement: services.items.map((s, i) => ({
            '@type': 'ListItem', position: i + 1,
            name: pick(s, 'name', locale),
            url: abs(`/${locale}/services/${s.slug}`),
          })),
        },
      ]} />

      <section className="border-b border-ink-150">
        <div className="wrap py-9 lg:py-12">
          <Breadcrumbs items={[{ name: dict.product.breadcrumbHome, href: `/${locale}` }, { name: dict.services.title }]} />
          <Reveal>
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
              <h1 className="text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl xl:text-5xl">
                {dict.services.title}
              </h1>
              <p className="max-w-text self-end text-sm leading-relaxed text-ink-500">{dict.services.subtitle}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Narx haqida ogohlantirish — sotmaymiz, tushuntiramiz */}
      <section className="border-b border-ink-150 bg-ink-25">
        <div className="wrap flex flex-col gap-3 py-5 md:flex-row md:items-center md:gap-8">
          <span className="shrink-0 text-sm font-semibold text-blue-600">{dict.services.notice}</span>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-600">{dict.services.noticeText}</p>
        </div>
      </section>

      {/* Xizmatlar ro'yxati — har biri ish tarkibi bilan */}
      <section className="wrap py-10 lg:py-14">
        <div className="space-y-5">
          {services.items.map((s, i) => {
            const includes = pick(s, 'includes', locale) || [];
            return (
              <Reveal key={s.id} delay={Math.min(i, 6) * 0.04}>
                <article className="border border-ink-150 bg-white p-6 lg:p-8">
                  <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
                    <div>
                      <span className="text-xs text-ink-400">{pick(s.category, 'name', locale)}</span>

                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink-900 md:text-2xl">
                        <Link href={`/${locale}/services/${s.slug}`} className="transition-colors hover:text-blue-600">
                          {pick(s, 'name', locale)}
                        </Link>
                      </h2>

                      <p className="mt-3 max-w-text text-sm leading-relaxed text-ink-500">{pick(s, 'short', locale)}</p>

                      {s.warranty && s.warranty !== '—' && (
                        <dl className="mt-6">
                          <dt className="text-xs text-ink-400">{dict.services.warranty}</dt>
                          <dd className="mt-1 text-sm font-medium text-ink-900">{s.warranty}</dd>
                        </dl>
                      )}

                      <Link
                        href={`/${locale}/services/${s.slug}`}
                        prefetch={false}
                        className="mt-7 inline-flex items-center gap-2 border border-ink-200 px-4 py-2.5 text-sm font-medium
                                   text-ink-900 transition-colors duration-200 hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                      >
                        {dict.common.more}
                        <Icon name="arrow" size={15} />
                      </Link>
                    </div>

                    {/* Nimalar kiradi */}
                    {Array.isArray(includes) && includes.length > 0 && (
                      <div className="border-t border-ink-150 pt-6 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0">
                        <p className="text-sm font-semibold text-ink-900">{dict.services.includes}</p>
                        <ul className="mt-4 space-y-0">
                          {includes.map((it, k) => (
                            <li key={k} className="flex gap-3 border-b border-dashed border-ink-150 py-2.5 last:border-0">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                              <span className="text-sm leading-relaxed text-ink-700">{it}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <Workflow dict={dict} />
      <ContactBand locale={locale} dict={dict} settings={settings} />
    </>
  );
}
