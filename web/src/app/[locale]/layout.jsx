// Til bo'yicha layout: header, footer, JSON-LD, hreflang.
import { notFound } from 'next/navigation';
import { getDict, isValidLocale, LOCALES } from '@/i18n';
import { getSettings, getCategories } from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/ui/JsonLd';
import { ToastProvider } from '@/components/ui/Toast';
import AiAssistant from '@/components/ai/AiAssistant';
import { organizationLd, localBusinessLd, websiteLd, buildMetadata } from '@/lib/seo';
import { sans, mono } from '@/lib/fonts';

// Uch til uchun statik generatsiya
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const revalidate = 600; // 10 daqiqa (ISR)

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDict(locale);
  const settings = await getSettings();

  const { pick } = await import('@/i18n');
  return buildMetadata({
    locale,
    path: '',
    title: pick(settings, 'metaTitle', locale) || dict.seo.homeTitle,
    description: pick(settings, 'metaDesc', locale) || dict.seo.homeDesc,
    image: settings?.defaultOgImage,
  });
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDict(locale);
  // Sozlamalar va kategoriyalar parallel yuklanadi (waterfall bo'lmasin)
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);

  const htmlLang = locale === 'ru' ? 'ru' : locale === 'uz-cyrl' ? 'uz-Cyrl' : 'uz';

  return (
    <html lang={htmlLang} className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Shriftlar next/font orqali o'z domenimizdan beriladi - tashqi so'rov yo'q.
            Faqat imgbb rasmlariga oldindan ulanamiz. */}
        <link rel="preconnect" href="https://i.ibb.co" crossOrigin="anonymous" />
        {/* API boshqa domenda bo'lsagina oldindan DNS so'raymiz.
            Bo'sh yoki nisbiy manzilda <link href=""> chiqib qolmasligi kerak. */}
        {/^https?:\/\//.test(process.env.NEXT_PUBLIC_API_URL || '') && (
          <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
        )}
      </head>
      <body className="min-h-screen">
        <JsonLd data={[organizationLd(settings, locale), localBusinessLd(settings, locale), websiteLd(locale)]} />

        {/* Klaviatura foydalanuvchilari uchun */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[999]
                     focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Asosiy kontentga o'tish
        </a>

        <ToastProvider>
          <Header locale={locale} dict={dict} settings={settings} />
          <main id="main">{children}</main>
          <Footer locale={locale} dict={dict} settings={settings} categories={categories} />
          <AiAssistant locale={locale} dict={dict} />
        </ToastProvider>
      </body>
    </html>
  );
}
