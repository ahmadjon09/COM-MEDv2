'use client';
// Til almashtirgich — uchta kod yonma-yon (dropdown emas, bir bosishda almashadi).
// SEO uchun har bir til haqiqiy <Link href="..." hrefLang="..."> sifatida render qilinadi.
import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LOCALE_LABELS, LOCALES, HREFLANG_MAP } from '@/i18n';
import { Spinner } from '../ui/Button';

export default function LanguageSwitcher({ locale }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;

  function buildTargetHref(code) {
    const segments = pathname.split('/').filter(Boolean);
    if (LOCALES.includes(segments[0])) segments[0] = code;
    else segments.unshift(code);
    return '/' + segments.join('/');
  }

  function onSelectLocale(e, code, targetHref) {
    if (code === locale) {
      e.preventDefault();
      return;
    }
    try {
      localStorage.setItem('ms-locale', code);
      document.cookie = `ms-locale=${code};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    } catch {
      /* private rejim */
    }
    e.preventDefault();
    startTransition(() => router.push(targetHref, { scroll: false }));
  }

  return (
    <div className="flex items-center border border-ink-200" role="group" aria-label="Til / Язык">
      {pending && (
        <span className="grid w-7 place-items-center text-blue-500">
          <Spinner size={12} />
        </span>
      )}
      {LOCALE_LABELS.map((l, i) => {
        const targetHref = buildTargetHref(l.code);
        return (
          <Link
            key={l.code}
            href={targetHref}
            hrefLang={HREFLANG_MAP[l.code]}
            prefetch={false}
            onClick={(e) => onSelectLocale(e, l.code, targetHref)}
            aria-current={l.code === locale ? 'page' : undefined}
            title={l.label}
            className={`px-2.5 py-2 font-mono text-label uppercase transition-colors duration-200 ${
              i > 0 ? 'border-l border-ink-150' : ''
            } ${l.code === locale ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'}`}
          >
            {l.short}
          </Link>
        );
      })}
    </div>
  );
}
