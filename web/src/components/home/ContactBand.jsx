// Aloqa bloki — chapda telefonlar, o'ngda forma.
import RequestForm from '../forms/RequestForm';
import Reveal from '../ui/Reveal';
import Icon from '../ui/Icons';
import { formatPhone } from '@/lib/utils';
import { pick } from '@/i18n';

export default function ContactBand({ locale, dict, settings }) {
  const phones = Array.isArray(settings?.phones) ? settings.phones : [];

  return (
    <section className="border-t border-ink-150 bg-ink-25" id="cta">
      <div className="wrap grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <Reveal>
          <h2 className="max-w-[18ch] text-2xl font-semibold leading-tight tracking-tight text-ink-900 md:text-3xl">
            {dict.home.ctaTitle}
          </h2>
          <p className="mt-4 max-w-text text-base leading-relaxed text-ink-500">{dict.home.ctaText}</p>

          <div className="mt-8 space-y-4">
            {phones.map((p) => (
              <a key={p.value} href={`tel:${p.value}`} className="group flex items-center gap-3">
                <Icon name="phone" size={17} className="text-blue-500" />
                <span className="font-mono text-lg tnum text-ink-900 transition-colors group-hover:text-blue-600">
                  {formatPhone(p.value)}
                </span>
              </a>
            ))}

            {settings?.emails?.[0] && (
              <a href={`mailto:${settings.emails[0]}`} className="flex items-center gap-3 text-sm text-ink-600 hover:text-blue-600">
                <Icon name="mail" size={17} className="text-blue-500" />
                {settings.emails[0]}
              </a>
            )}

            {pick(settings, 'address', locale) && (
              <p className="flex items-start gap-3 text-sm leading-relaxed text-ink-600">
                <Icon name="pin" size={17} className="mt-0.5 shrink-0 text-blue-500" />
                {pick(settings, 'address', locale)}
              </p>
            )}

          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <RequestForm locale={locale} dict={dict} compact />
        </Reveal>
      </div>
    </section>
  );
}
