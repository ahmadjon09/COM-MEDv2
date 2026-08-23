// Non ushoqlari — mono uslubda.
import Link from 'next/link';

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 font-mono text-label uppercase text-ink-400">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={it.href || it.name} className="inline-flex items-center gap-2">
            {i > 0 && <span className="text-ink-300">/</span>}
            {last || !it.href ? (
              <span className="text-ink-700">{it.name}</span>
            ) : (
              <Link href={it.href} prefetch={false} className="transition-colors hover:text-blue-600">{it.name}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
