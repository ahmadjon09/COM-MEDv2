// Foydalanish shartlari — matn admin sozlamalaridan, bo'lmasa standart matndan olinadi.
import { notFound } from 'next/navigation';
import { getDict, isValidLocale, pick } from '@/i18n';
import { getSettings } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { TERMS } from '@/lib/legal';
import LegalPage from '@/components/layout/LegalPage';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDict(locale);
  return buildMetadata({
    locale,
    path: '/terms',
    title: dict.footer.terms,
    description: dict.footer.terms + ' — COM MEDICAL SERVIS',
    useBanner: true,
  });
}

export default async function TermsPage({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = getDict(locale);
  const settings = await getSettings();
  const content = pick(settings, 'terms', locale) || TERMS[locale] || TERMS.uz;

  return <LegalPage locale={locale} dict={dict} title={dict.footer.terms} content={content} />;
}
