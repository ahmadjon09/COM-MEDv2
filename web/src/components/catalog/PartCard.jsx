'use client';
// Zapchast kartasi — texnik chizma foni, artikul, davlat, narx.
import Link from 'next/link';
import Image from 'next/image';
import Icon from '../ui/Icons';
import { pick } from '@/i18n';
import { formatPrice } from '@/lib/utils';

export default function PartCard({ item, locale, dict, priority = false }) {
  const name = pick(item, 'name', locale);
  const img = item.images?.[0];
  const href = `/${locale}/parts/${item.slug}`;
  const country = item.originCountry ? dict.countries[item.originCountry] || item.originCountry : null;

  return (
    <article className="tile tile-i group flex h-full flex-col">
      <Link href={href} prefetch={false} className="relative block aspect-[5/4] overflow-hidden imgplate">
        {img ? (
          <Image
            src={img} alt={name} fill
            sizes="(max-width:640px) 92vw, (max-width:1080px) 46vw, (max-width:1760px) 30vw, 20vw"
            priority={priority} loading={priority ? 'eager' : 'lazy'}
            className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-ink-200">
            <Icon name="box" size={44} />
          </span>
        )}

        {/* Artikul — chap yuqorida */}
        {item.sku && (
          <span className="absolute left-0 top-0 bg-ink-900 px-2 py-1 font-mono text-label uppercase text-white">
            {item.sku}
          </span>
        )}

        {/* Davlat kodi — o'ng yuqorida */}
        {item.originCountry && (
          <span className="absolute right-0 top-0 border-b border-l border-ink-150 bg-white px-2 py-1 font-mono text-label uppercase text-ink-600">
            {item.originCountry}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span className="dot bg-ok" />
          <span className="text-xs text-ink-500">{dict.parts.supplyShort}</span>
          {item.condition === 'REFURBISHED' && (
            <span className="text-xs text-warn">· {dict.parts.conditionRefurb}</span>
          )}
        </div>

        <h3 className="mt-2.5 text-sm font-semibold leading-snug text-ink-900">
          <Link href={href} prefetch={false} className="transition-colors group-hover:text-blue-600">{name}</Link>
        </h3>

        {(item.brand || item.model) && (
          <p className="mt-1.5 font-mono text-micro uppercase text-ink-400">
            {[item.brand, item.model].filter(Boolean).join(' · ')}
          </p>
        )}

        {country && (
          <p className="mt-2 text-xs text-ink-500">
            <span className="text-ink-400">{dict.parts.country}: </span>{country}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink-150 pt-3.5" style={{ marginTop: '1rem' }}>
          <div>
            <span className="kicker block">{dict.parts.price}</span>
            <span className="text-base font-semibold text-ink-900 tnum">
              {formatPrice(item.price, item.currency, locale, dict)}
            </span>
            {item.priceNote && <span className="ml-1 text-xs text-ink-400">{item.priceNote}</span>}
          </div>
          <Link
            href={href} prefetch={false} aria-label={name}
            className="grid h-8 w-8 shrink-0 place-items-center border border-ink-200 text-ink-400
                       transition-colors duration-200 group-hover:border-blue-500 group-hover:bg-blue-500 group-hover:text-white"
          >
            <Icon name="arrow" size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
