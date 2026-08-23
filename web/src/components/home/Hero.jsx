'use client';
// Hero — sodda: chapda sarlavha va ikkita tugma, o'ngda surat.
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import Button from '../ui/Button';
import Icon from '../ui/Icons';
import { pick } from '@/i18n';

export default function Hero({ locale, dict, settings }) {
  const reduce = useReducedMotion();
  const tagline = pick(settings, 'tagline', locale) || dict.hero.subtitle;

  const step = (d = 0) =>
    reduce ? {} : {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, delay: d, ease: [0.22, 1, 0.36, 1] },
    };

  return (
    <section className="border-b border-ink-150">
      <div className="wrap">
        <div className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-18">
          <div>
            <motion.h1
              {...step(0)}
              className="max-w-[15ch] text-3xl font-semibold leading-[1.1] tracking-tight text-ink-900 md:text-4xl xl:text-5xl"
            >
              {dict.hero.title}
            </motion.h1>

            <motion.p {...step(0.06)} className="mt-5 max-w-text text-base leading-relaxed text-ink-500">
              {tagline}
            </motion.p>

            <motion.div {...step(0.12)} className="mt-8 flex flex-wrap gap-2.5">
              <Button href={`/${locale}/services`} variant="solid" size="lg" iconRight={<Icon name="arrow" size={17} />}>
                {dict.services.title}
              </Button>
              <Button href={`/${locale}/parts`} variant="outline" size="lg">
                {dict.parts.title}
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={reduce ? {} : { opacity: 0 }}
            animate={reduce ? {} : { opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative aspect-[4/3] w-full overflow-hidden border border-ink-150 bg-ink-50 lg:aspect-[5/4]"
          >
            <Image
              src="/equipment/hero.jpg"
              alt=""
              fill
              sizes="(max-width:1080px) 100vw, 50vw"
              priority
              className="object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
