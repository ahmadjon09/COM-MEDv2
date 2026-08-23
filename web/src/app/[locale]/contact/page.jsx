// Aloqa sahifasi.
import { notFound } from 'next/navigation';
import { getDict, isValidLocale, pick } from '@/i18n';
import { getSettings } from '@/lib/api';
import { buildMetadata, breadcrumbLd, abs } from '@/lib/seo';
import { formatPhone } from '@/lib/utils';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import JsonLd from '@/components/ui/JsonLd';
import Reveal from '@/components/ui/Reveal';
import RequestForm from '@/components/forms/RequestForm';

export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDict(locale);
  const settings = await getSettings();
  return buildMetadata({
    locale, path: '/contact',
    title: `${dict.contact.title} — ${pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS'}`,
    description: `${dict.contact.subtitle} ${pick(settings, 'address', locale) || ''}`.trim(),
    ogParams: { title: dict.contact.title, subtitle: dict.contact.subtitle, badge: 'CONTACT' },
    useBanner: true,
  });
}

export default async function ContactPage({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDict(locale);
  const settings = await getSettings();
  const phones = Array.isArray(settings?.phones) ? settings.phones : [];

  const rows = [
    ...phones.map((p) => ({ k: p.label || dict.contact.phones, v: formatPhone(p.value), href: `tel:${p.value}`, mono: true })),
    ...(settings?.emails || []).map((e) => ({ k: dict.contact.email, v: e, href: `mailto:${e}` })),
    pick(settings, 'address', locale) && { k: dict.contact.address, v: pick(settings, 'address', locale) },
  ].filter(Boolean);

  return (
    <>
      <JsonLd data={breadcrumbLd([
        { name: dict.product.breadcrumbHome, url: abs(`/${locale}`) },
        { name: dict.contact.title, url: abs(`/${locale}/contact`) },
      ])} />

      <section className="border-b border-ink-150">
        <div className="wrap py-9 lg:py-12">
          <Breadcrumbs items={[{ name: dict.product.breadcrumbHome, href: `/${locale}` }, { name: dict.contact.title }]} />
          <Reveal>
            <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-16">
              <h1 className="text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl xl:text-5xl">{dict.contact.title}</h1>
              <p className="max-w-text self-end text-sm leading-relaxed text-ink-500">{dict.contact.subtitle}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="wrap py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16">
          <div>
            <Reveal>
              <dl className="border-t border-ink-150">
                {rows.map((r, i) => (
                  <div key={i} className="grid gap-1 border-b border-ink-150 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
                    <dt className="kicker sm:pt-1">{r.k}</dt>
                    <dd className={`text-base text-ink-900 ${r.mono ? 'font-mono tnum' : ''}`}>
                      {r.href ? <a href={r.href} className="ul-link">{r.v}</a> : r.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {settings?.mapEmbedUrl && (
              <Reveal delay={0.08}>
                <div className="mt-8 border border-ink-150">
                  <iframe src={settings.mapEmbedUrl} title="map" loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade" className="h-[360px] w-full border-0" />
                </div>
              </Reveal>
            )}
          </div>

          <Reveal delay={0.06}>
            <div className="lg:sticky lg:top-[76px]">
              <RequestForm locale={locale} dict={dict} />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
