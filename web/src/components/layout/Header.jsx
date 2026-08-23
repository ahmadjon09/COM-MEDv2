'use client';
// Header — ikki qavatli: yuqorida yupqa "utility" chizig'i, pastda asosiy navigatsiya.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import Button from '../ui/Button';
import Icon from '../ui/Icons';
import { pick } from '@/i18n';
import { formatPhone } from '@/lib/utils';

export default function Header({ locale, dict, settings }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const nav = [
    { href: `/${locale}/parts`, label: dict.parts.title },
    { href: `/${locale}/services`, label: dict.services.title },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  const phones = Array.isArray(settings?.phones) ? settings.phones : [];
  const primary = phones.find((p) => p.isPrimary)?.value || phones[0]?.value;
  const siteName = pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS';

  const isActive = (href) => pathname.startsWith(href.split('?')[0]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-shadow duration-200 ${
          scrolled ? 'border-ink-150 shadow-head' : 'border-ink-150'
        }`}
      >
        <div className="wrap flex h-[60px] items-center gap-6">
          {/* Logotip */}
          <Link href={`/${locale}`} className="group flex shrink-0 items-center gap-2.5" prefetch>
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={34}
              priority
              className="h-[34px] w-[34px] object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-[0.9375rem] font-semibold tracking-tight text-ink-900">{siteName}</span>
          </Link>

          {/* Navigatsiya */}
          <nav className="ml-4 hidden items-center lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`relative px-4 py-[19px] text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href) ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2 bottom-0 h-[2px] bg-blue-500"
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {primary && (
              <a
                href={`tel:${primary}`}
                className="hidden items-center gap-2 px-2 py-2 text-sm font-medium tnum text-ink-700
                           transition-colors duration-200 hover:text-blue-600 md:inline-flex"
              >
                <Icon name="phone" size={15} className="text-blue-500" />
                {formatPhone(primary)}
              </a>
            )}

            <LanguageSwitcher locale={locale} />

            <Button href={`/${locale}/contact`} variant="accent" size="sm" className="hidden sm:inline-flex">
              {dict.nav.request}
            </Button>

            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-9 w-9 place-items-center border border-ink-200 text-ink-700 transition-colors
                         hover:border-ink-900 lg:hidden"
              aria-label={dict.nav.menu}
            >
              <Icon name="menu" size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobil menyu */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[90] lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink-950/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col border-l border-ink-150 bg-white"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-[60px] items-center justify-between border-b border-ink-150 px-5">
                <span className="font-mono text-label uppercase text-ink-400">{dict.nav.menu}</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="grid h-9 w-9 place-items-center text-ink-500 hover:bg-ink-50"
                  aria-label={dict.nav.close}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              <nav className="flex flex-col divide-y divide-ink-150 border-b border-ink-150">
                {[{ href: `/${locale}`, label: dict.nav.home }, ...nav].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    className="flex items-center justify-between px-5 py-4 text-base font-medium text-ink-800
                               transition-colors hover:bg-ink-25"
                  >
                    <span>{item.label}</span>
                    <Icon name="arrow" size={16} className="text-ink-300" />
                  </Link>
                ))}
              </nav>

              <div className="mt-auto space-y-2 p-5">
                {phones.map((p) => (
                  <a
                    key={p.value}
                    href={`tel:${p.value}`}
                    className="flex items-center gap-2.5 border border-ink-150 px-4 py-3 font-mono text-sm tnum text-ink-900"
                  >
                    <Icon name="phone" size={15} className="text-blue-500" />
                    {formatPhone(p.value)}
                  </a>
                ))}
                <Button href={`/${locale}/contact`} variant="accent" full size="lg">
                  {dict.nav.request}
                </Button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
