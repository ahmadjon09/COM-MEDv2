'use client';
// Til almashtirgich — uchta kod yonma-yon (dropdown emas, bir bosishda almashadi).
import { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LOCALE_LABELS, LOCALES } from '@/i18n';
import { Spinner } from '../ui/Button';

export default function LanguageSwitcher({ locale }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(code) {
    if (code === locale) return;
    try {
      localStorage.setItem('ms-locale', code);
      document.cookie = `ms-locale=${code};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    } catch { /* private rejim */ }

    const segments = pathname.split('/').filter(Boolean);
    if (LOCALES.includes(segments[0])) segments[0] = code;
    else segments.unshift(code);

    startTransition(() => router.push('/' + segments.join('/'), { scroll: false }));
  }

  return (
    <div className="flex items-center border border-ink-200" role="group" aria-label="Til / Язык">
      {pending && (
        <span className="grid w-7 place-items-center text-blue-500">
          <Spinner size={12} />
        </span>
      )}
      {LOCALE_LABELS.map((l, i) => (
        <button
          key={l.code}
          onClick={() => switchTo(l.code)}
          aria-current={l.code === locale}
          title={l.label}
          className={`px-2.5 py-2 font-mono text-label uppercase transition-colors duration-200 ${
            i > 0 ? 'border-l border-ink-150' : ''
          } ${l.code === locale ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'}`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
