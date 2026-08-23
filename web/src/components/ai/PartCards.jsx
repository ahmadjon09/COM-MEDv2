'use client';
// Chat ichidagi zapchast kartasi — rasm, narx, davlat va havola.
// AI matnda tushuntiradi, karta esa asosiy raqamlarni darhol ko'rsatadi.
import Link from 'next/link';
import Image from 'next/image';
import Icon from '../ui/Icons';

export default function PartCards({ items = [], dict }) {
  if (!items.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {items.map((p) => (
        <Link
          key={p.slug}
          href={p.url}
          prefetch={false}
          className="group flex items-stretch gap-3 border border-ink-150 bg-white transition-colors duration-200
                     hover:border-blue-400"
        >
          <div className="relative h-[74px] w-[74px] shrink-0 imgplate">
            {p.image ? (
              <Image src={p.image} alt="" fill sizes="74px" className="object-contain p-1.5" />
            ) : (
              <span className="grid h-full place-items-center text-ink-200">
                <Icon name="box" size={22} />
              </span>
            )}
            {p.country && (
              <span className="absolute left-0 top-0 bg-white/95 px-1 font-mono text-[0.5625rem] uppercase text-ink-600">
                {p.country}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 py-2 pr-3">
            <p className="line-clamp-2 text-xs font-medium leading-snug text-ink-900 transition-colors group-hover:text-blue-600">
              {p.name}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6875rem] text-ink-400">
              {p.sku && <span className="font-mono">{p.sku}</span>}
              {p.brand && <span>· {p.brand}</span>}
              {p.warranty && <span>· {dict.parts.warranty} {p.warranty}</span>}
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink-900 tnum">{p.price || '—'}</span>
              <Icon
                name="arrow"
                size={13}
                className="shrink-0 text-ink-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-blue-500"
              />
            </div>
          </div>
        </Link>
      ))}

      <p className="pt-0.5 text-[0.6875rem] leading-snug text-ink-400">{dict.parts.supplyShort}</p>
    </div>
  );
}
