'use client';
// Hero — sodda: chapda sarlavha va ikkita tugma, o'ngda surat.
// LCP (Largest Contentful Paint) tezligi uchun h1 va asosiy rasm SSR'da opacity:1 bilan chiqadi.
import Image from 'next/image';
import Button from '../ui/Button';
import Icon from '../ui/Icons';
import { pick } from '@/i18n';

export default function Hero({ locale, dict, settings }) {
  const tagline = pick(settings, 'tagline', locale) || dict.hero.subtitle;
  const siteName = pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS';
  const heroAlt = `${siteName} — ${dict.seo.homeTitle}`;

  return (
    <section className="border-b border-ink-150">
      <div className="wrap">
        <div className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-18">
          <div>
            <h1 className="max-w-[15ch] text-3xl font-semibold leading-[1.1] tracking-tight text-ink-900 md:text-4xl xl:text-5xl">
              {dict.hero.title}
            </h1>

            <p className="mt-5 max-w-text text-base leading-relaxed text-ink-500">
              {tagline}
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <Button href={`/${locale}/services`} variant="solid" size="lg" iconRight={<Icon name="arrow" size={17} />}>
                {dict.services.title}
              </Button>
              <Button href={`/${locale}/parts`} variant="outline" size="lg">
                {dict.parts.title}
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden border border-ink-150 bg-ink-50 lg:aspect-[5/4]">
            <Image
              src="/equipment/hero.jpg"
              alt={heroAlt}
              fill
              sizes="(max-width:1080px) 100vw, 50vw"
              priority
              fetchPriority="high"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
