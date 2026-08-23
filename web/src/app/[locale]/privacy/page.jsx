// Maxfiylik siyosati.
import { notFound } from 'next/navigation';
import { getDict, isValidLocale, pick } from '@/i18n';
import { getSettings } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { PRIVACY } from '@/lib/legal';
import LegalPage from '@/components/layout/LegalPage';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDict(locale);
  return buildMetadata({
    locale,
    path: '/privacy',
    title: dict.footer.privacy,
    description: dict.footer.privacy + ' — COM MEDICAL SERVIS',
    useBanner: true,
  });
}

export default async function PrivacyPage({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = getDict(locale);
  const settings = await getSettings();
  const content = pick(settings, 'privacy', locale) || PRIVACY[locale] || PRIVACY.uz;

  return <LegalPage locale={locale} dict={dict} title={dict.footer.privacy} content={content} />;
}
