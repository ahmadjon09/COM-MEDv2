'use client';
// Zapchast — jadval qatori ko'rinishi (desktop uchun zich ro'yxat).
import Link from 'next/link';
import Image from 'next/image';
import Icon from '../ui/Icons';
import { pick } from '@/i18n';
import { formatPrice } from '@/lib/utils';

export default function PartRow({ item, locale, dict }) {
  const name = pick(item, 'name', locale);
  const href = `/${locale}/parts/${item.slug}`;
  const country = item.originCountry ? dict.countries[item.originCountry] || item.originCountry : '—';

  return (
    <Link
      href={href}
      prefetch={false}
      className="group grid grid-cols-[64px_minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1fr)_36px]
                 items-center gap-4 border-b border-ink-150 bg-white px-4 py-3 transition-colors duration-200 hover:bg-ink-25"
    >
      <div className="relative h-14 w-16 shrink-0 overflow-hidden border border-ink-150 imgplate">
        {item.images?.[0] ? (
          <Image src={item.images[0]} alt="" fill sizes="64px" className="object-contain p-1" />
        ) : (
          <span className="grid h-full place-items-center text-ink-200"><Icon name="box" size={18} /></span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink-900 transition-colors group-hover:text-blue-600">{name}</p>
        <p className="mt-0.5 font-mono text-label uppercase text-ink-400">{item.sku || '—'}</p>
      </div>

      <div className="min-w-0 text-sm text-ink-600">
        <p className="truncate">{item.brand || '—'}</p>
        <p className="truncate font-mono text-label uppercase text-ink-400">{item.model || ''}</p>
      </div>

      <div className="min-w-0 text-sm text-ink-600">
        <span className="font-mono text-label uppercase text-ink-400">{item.originCountry || ''}</span>
        <p className="truncate">{country}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="dot bg-ok" />
        <span className="text-xs text-ink-600">{dict.parts.supplyShort}</span>
      </div>

      <div className="text-right">
        <span className="text-sm font-semibold text-ink-900 tnum">
          {formatPrice(item.price, item.currency, locale, dict)}
        </span>
        {item.priceNote && <p className="text-xs text-ink-400">{item.priceNote}</p>}
      </div>

      <span className="grid h-8 w-8 place-items-center border border-ink-200 text-ink-400
                       transition-colors duration-200 group-hover:border-blue-500 group-hover:bg-blue-500 group-hover:text-white">
        <Icon name="arrow" size={14} />
      </span>
    </Link>
  );
}
