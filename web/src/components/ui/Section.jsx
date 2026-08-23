// Bo'lim: sodda sarlavha + izoh. Raqamlar va ortiqcha yorliqlarsiz.
import Reveal from './Reveal';

export default function Section({ title, lead, action, children, id, className = '' }) {
  return (
    <section id={id} className={`band band-pad ${className}`}>
      <div className="wrap">
        {(title || action) && (
          <Reveal>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                {title && (
                  <h2 className="text-2xl font-semibold leading-tight text-ink-900 md:text-3xl">{title}</h2>
                )}
                {lead && <p className="mt-3 text-base leading-relaxed text-ink-500">{lead}</p>}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
