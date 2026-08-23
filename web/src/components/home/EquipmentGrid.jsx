// Uskuna yo'nalishlari — surat + nom.
import Link from 'next/link';
import Image from 'next/image';
import Section from '../ui/Section';
import Icon from '../ui/Icons';
import { RevealGroup, RevealItem } from '../ui/Reveal';
import { pick } from '@/i18n';

export default function EquipmentGrid({ locale, dict, categories = [] }) {
  const items = categories.filter((c) => c.scope !== 'SERVICE');

  return (
    <Section title={dict.equipment.title} lead={dict.equipment.lead}>
      <RevealGroup className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.04}>
        {items.map((c) => (
          <RevealItem key={c.id} className="h-full">
            <Link
              href={`/${locale}/parts?category=${c.slug}`}
              prefetch={false}
              className="group flex h-full flex-col border border-ink-150 bg-white transition-colors duration-200
                         hover:border-ink-400"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-ink-50">
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={pick(c, 'name', locale)}
                    fill
                    sizes="(max-width:640px) 92vw, (max-width:1080px) 46vw, 24vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-ink-200">
                    <Icon name={c.iconKey || 'box'} size={36} />
                  </span>
                )}
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 p-4">
                <h3 className="text-sm font-medium text-ink-900 transition-colors group-hover:text-blue-600">
                  {pick(c, 'name', locale)}
                </h3>
                <Icon name="arrow" size={15} className="shrink-0 text-ink-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-500" />
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
