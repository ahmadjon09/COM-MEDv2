// Bosh sahifa — COM MEDICAL SERVIS.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDict, isValidLocale, pick } from '@/i18n';
import { getSettings, getCategories, getProducts } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

import Hero from '@/components/home/Hero';
import Guarantees from '@/components/home/Guarantees';
import SplitPaths from '@/components/home/SplitPaths';
import EquipmentGrid from '@/components/home/EquipmentGrid';
import Workflow from '@/components/home/Workflow';
import Reviews from '@/components/home/Reviews';
import Faq from '@/components/home/Faq';
import ContactBand from '@/components/home/ContactBand';
import Section from '@/components/ui/Section';
import PartCard from '@/components/catalog/PartCard';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icons';
import JsonLd from '@/components/ui/JsonLd';
import Reveal, { RevealGroup, RevealItem } from '@/components/ui/Reveal';

export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDict(locale);
  const settings = await getSettings();

  return buildMetadata({
    locale, path: '',
    title: pick(settings, 'metaTitle', locale) || dict.seo.homeTitle,
    description: pick(settings, 'metaDesc', locale) || dict.seo.homeDesc,
    image: settings?.defaultOgImage,
    useBanner: true,
    keywords: [
      // Brend
      'COM MEDICAL SERVIS',
      'COM MEDICAL SERVICE',
      'COMMED',
      'COM MEDICAL SERVIS Namangan',
      'COM MEDICAL SERVIS Uzbekistan',

      // Asosiy xizmatlar — Uzbek
      'tibbiy uskunalar ta’miri',
      'tibbiy apparatlar ta’miri',
      'tibbiy texnika ta’miri',
      'tibbiy uskunalarga texnik xizmat',
      'tibbiy apparatlarga servis xizmati',
      'tibbiy uskunalar servis xizmati',
      'tibbiy uskunalar diagnostikasi',
      'tibbiy uskunalar profilaktikasi',
      'tibbiy uskunalar kalibrovkasi',

      // Namangan lokal SEO
      'tibbiy uskunalar ta’miri Namangan',
      'tibbiy apparatlar ta’miri Namangan',
      'tibbiy texnika ta’miri Namangan',
      'tibbiy uskunalar servisi Namangan',
      'tibbiy apparatlar servisi Namangan',
      'tibbiy uskunalar servis markazi Namangan',
      'tibbiy texnika servis markazi Namangan',
      'meditsina uskunalari ta’miri Namangan',
      'tibbiy uskunalar ehtiyot qismlari Namangan',

      // UZI
      'UZI apparati ta’miri',
      'UZI apparatlari ta’miri',
      'UZI apparati servisi',
      'UZI apparatiga texnik xizmat',
      'UZI apparati diagnostikasi',
      'UZI apparati ehtiyot qismlari',
      'UZI apparati zapchastlari',
      'UZI apparati ta’miri Namangan',

      // EKG
      'EKG apparati ta’miri',
      'EKG apparati servisi',
      'EKG apparati kalibrovkasi',
      'EKG kalibrovka',
      'EKG apparati diagnostikasi',
      'EKG apparati ehtiyot qismlari',
      'EKG apparati ta’miri Namangan',

      // IVL
      'IVL apparati ta’miri',
      'IVL apparati servisi',
      'IVL apparati ehtiyot qismlari',
      'IVL apparati zapchastlari',
      'sun’iy nafas oldirish apparati ta’miri',
      'IVL apparati ta’miri Namangan',

      // Defibrillyator
      'defibrillyator ta’miri',
      'defibrillator ta’miri',
      'defibrillyator servisi',
      'defibrillator akkumulyatori',
      'defibrillyator akkumulyatori',
      'defibrillyator ehtiyot qismlari',
      'defibrillyator ta’miri Namangan',

      // Sterilizator
      'sterilizator ta’miri',
      'tibbiy sterilizator ta’miri',
      'avtoklav ta’miri',
      'sterilizator servisi',
      'sterilizator ehtiyot qismlari',
      'sterilizator ta’miri Namangan',

      // Ehtiyot qismlar
      'tibbiy uskunalar ehtiyot qismlari',
      'tibbiy apparatlar ehtiyot qismlari',
      'tibbiy texnika ehtiyot qismlari',
      'tibbiy uskunalar zapchastlari',
      'meditsina uskunalari zapchastlari',
      'tibbiy apparatlar uchun zapchastlar',

      // Ruscha SEO
      'ремонт медицинского оборудования',
      'ремонт медицинской техники',
      'сервис медицинского оборудования',
      'обслуживание медицинского оборудования',
      'ремонт медицинского оборудования Наманган',
      'сервис медицинского оборудования Наманган',
      'ремонт УЗИ аппарата',
      'ремонт УЗИ Наманган',
      'ремонт ЭКГ аппарата',
      'калибровка ЭКГ',
      'ремонт аппарата ИВЛ',
      'запчасти для аппаратов ИВЛ',
      'ремонт дефибриллятора',
      'аккумулятор для дефибриллятора',
      'ремонт стерилизатора',
      'запчасти для медицинского оборудования',
      'медицинское оборудование запчасти',

      // Uzbek Cyrillic
      'тиббий ускуналар таъмири',
      'тиббий аппаратлар таъмири',
      'тиббий техника таъмири',
      'тиббий ускуналар сервиси',
      'тиббий ускуналар эҳтиёт қисмлари',
      'тиббий ускуналар запчастлари',
      'УЗИ аппарати таъмири',
      'ЭКГ аппарати таъмири',
      'ИВЛ аппарати таъмири',
      'дефибриллятор таъмири',
      'стерилизатор таъмири',
      'тиббий ускуналар таъмири Наманган',
    ]
  });
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDict(locale);

  const [settings, categories, featuredParts, services] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ kind: 'PART', featured: 'true', limit: 8 }),
    getProducts({ kind: 'SERVICE', limit: 8 }),
  ]);

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dict.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={faqLd} />

      <Hero locale={locale} dict={dict} settings={settings} />
      <Guarantees dict={dict} />
      <SplitPaths locale={locale} dict={dict} />
      <EquipmentGrid locale={locale} dict={dict} categories={categories} />

      {/* Xizmatlar — narx ko'rsatilmaydi */}
      {services.items.length > 0 && (
        <Section
          title={dict.services.title}
          lead={dict.services.subtitle}
          action={
            <Button href={`/${locale}/services`} variant="outline" size="sm" iconRight={<Icon name="arrow" size={15} />}>
              {dict.services.allServices}
            </Button>
          }
        >
          <div className="mt-8 border-t border-ink-150">
            {services.items.map((s, i) => (
              <Reveal key={s.id} delay={Math.min(i, 6) * 0.03}>
                <Link
                  href={`/${locale}/services/${s.slug}`}
                  prefetch={false}
                  className="group grid gap-2 border-b border-ink-150 py-5 transition-colors duration-200 hover:bg-ink-25
                             md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_28px] md:items-baseline md:gap-8"
                >
                  <h3 className="text-base font-medium text-ink-900 transition-colors group-hover:text-blue-600">
                    {pick(s, 'name', locale)}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-500">{pick(s, 'short', locale)}</p>
                  <Icon
                    name="arrow"
                    size={15}
                    className="hidden justify-self-end text-ink-300 transition-transform duration-200
                               group-hover:translate-x-1 group-hover:text-blue-500 md:block"
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* Zapchastlar */}
      {featuredParts.items.length > 0 && (
        <Section
          title={dict.home.featuredTitle}
          lead={dict.parts.subtitle}
          action={
            <Button href={`/${locale}/parts`} variant="outline" size="sm" iconRight={<Icon name="arrow" size={15} />}>
              {dict.catalog.all}
            </Button>
          }
        >
          <RevealGroup className="mt-8 grid gap-5 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredParts.items.map((p, i) => (
              <RevealItem key={p.id} className="h-full">
                <PartCard item={p} locale={locale} dict={dict} priority={i < 4} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      )}

      <Workflow dict={dict} />
      <Reviews dict={dict} />
      <Faq dict={dict} />
      <ContactBand locale={locale} dict={dict} settings={settings} />
    </>
  );
}
