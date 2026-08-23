// Ikkita yo'nalish: xizmat va zapchast. Sodda ikki karta.
import Link from 'next/link';
import Icon from '../ui/Icons';
import Reveal from '../ui/Reveal';

export default function SplitPaths({ locale, dict }) {
  const cards = [
    {
      href: `/${locale}/services`,
      title: dict.services.title,
      lead: dict.services.subtitle,
      icon: 'wrench',
      note: dict.services.notice,
    },
    {
      href: `/${locale}/parts`,
      title: dict.parts.title,
      lead: dict.parts.subtitle,
      icon: 'box',
      note: dict.parts.price,
    },
  ];

  return (
    <section className="band band-pad">
      <div className="wrap grid gap-6 md:grid-cols-2">
        {cards.map((c, i) => (
          <Reveal key={c.href} delay={i * 0.05}>
            <Link
              href={c.href}
              prefetch={false}
              className="group flex h-full flex-col border border-ink-150 bg-white p-6 transition-colors duration-200
                         hover:border-ink-400 hover:bg-ink-25 lg:p-8"
            >
              <span className="grid h-10 w-10 place-items-center border border-ink-150 text-ink-500
                               transition-colors duration-200 group-hover:border-blue-400 group-hover:text-blue-600">
                <Icon name={c.icon} size={19} />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink-900">{c.title}</h3>
              <p className="mt-2.5 max-w-text text-sm leading-relaxed text-ink-500">{c.lead}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
                {dict.common.more}
                <Icon name="arrow" size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
