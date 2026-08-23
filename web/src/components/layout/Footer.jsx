// Footer — chiziqli, jadval ritmida. Server komponent (JS yuklamaydi).
import Link from 'next/link';
import Image from 'next/image';
import { pick } from '@/i18n';
import Icon from '../ui/Icons';
import { formatPhone } from '@/lib/utils';

export default function Footer({ locale, dict, settings, categories = [] }) {
  const siteName = pick(settings, 'siteName', locale) || 'COM MEDICAL SERVIS';
  const phones = Array.isArray(settings?.phones) ? settings.phones : [];
  const socials = Array.isArray(settings?.socials) ? settings.socials : [];
  const year = new Date().getFullYear();

  const extra = [
    settings?.telegramUrl && { type: 'telegram', url: settings.telegramUrl },
    settings?.instagramUrl && { type: 'instagram', url: settings.instagramUrl },
    settings?.youtubeUrl && { type: 'youtube', url: settings.youtubeUrl },
  ].filter(Boolean);

  const allSocials = [...socials, ...extra].filter((s, i, a) => a.findIndex((x) => x.url === s.url) === i);

  const Col = ({ label, children }) => (
    <div>
      <p className="kicker border-b border-ink-150 pb-2">{label}</p>
      <div className="mt-3.5 space-y-2">{children}</div>
    </div>
  );

  return (
    <footer className="border-t border-ink-150 bg-ink-25">
      <div className="wrap py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.25fr] lg:gap-12">
          <div>
            <Link href={`/${locale}`} className="inline-flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-[0.9375rem] font-semibold text-ink-900">{siteName}</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              {pick(settings, 'tagline', locale) || dict.footer.madeNote}
            </p>

            {allSocials.length > 0 && (
              <div className="mt-5 flex gap-px bg-ink-150">
                {allSocials.map((s) => (
                  <a
                    key={s.url} href={s.url} target="_blank" rel="noopener noreferrer nofollow" aria-label={s.type}
                    className="grid h-9 w-9 place-items-center bg-ink-25 text-ink-500 transition-colors
                               hover:bg-blue-500 hover:text-white"
                  >
                    <Icon name={s.type} size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <Col label={dict.parts.title}>
            {categories.slice(0, 6).map((c) => (
              <Link key={c.id} href={`/${locale}/parts?category=${c.slug}`} prefetch={false}
                    className="block text-sm text-ink-600 transition-colors hover:text-blue-600">
                {pick(c, 'name', locale)}
              </Link>
            ))}
          </Col>

          <Col label={dict.nav.menu}>
            <Link href={`/${locale}/services`} className="block text-sm text-ink-600 hover:text-blue-600">{dict.services.title}</Link>
            <Link href={`/${locale}/parts`} className="block text-sm text-ink-600 hover:text-blue-600">{dict.parts.title}</Link>
            <Link href={`/${locale}/contact`} className="block text-sm text-ink-600 hover:text-blue-600">{dict.nav.contact}</Link>
            <Link href={`/${locale}/terms`} className="block text-sm text-ink-600 hover:text-blue-600">{dict.footer.terms}</Link>
            <Link href={`/${locale}/privacy`} className="block text-sm text-ink-600 hover:text-blue-600">{dict.footer.privacy}</Link>
          </Col>

          <Col label={dict.footer.contactCol}>
            {phones.map((p) => (
              <div key={p.value}>
                <a href={`tel:${p.value}`} className="block font-mono text-sm tnum text-ink-900 transition-colors hover:text-blue-600">
                  {formatPhone(p.value)}
                </a>
                {p.label && <span className="text-xs text-ink-400">{p.label}</span>}
              </div>
            ))}
            {settings?.emails?.map((e) => (
              <a key={e} href={`mailto:${e}`} className="block text-sm text-ink-600 transition-colors hover:text-blue-600">{e}</a>
            ))}
            {pick(settings, 'address', locale) && (
              <p className="text-sm leading-relaxed text-ink-500">{pick(settings, 'address', locale)}</p>
            )}
          </Col>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-ink-150 pt-5 font-mono text-label uppercase text-ink-400 sm:flex-row sm:justify-between">
          <span>© {year} {siteName} — {dict.footer.rights}</span>
          <span>{dict.footer.madeNote}</span>
        </div>
      </div>
    </footer>
  );
}
