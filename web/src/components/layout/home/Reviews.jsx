// Mijozlar fikri — uchta qisqa sharh.
import Section from '../../ui/Section';
import { RevealGroup, RevealItem } from '../../ui/Reveal';

export default function Reviews({ dict }) {
  return (
    <Section title={dict.reviewsTitle} lead={dict.reviewsLead}>
      <RevealGroup className="mt-8 grid gap-6 md:grid-cols-3">
        {dict.reviews.map((r) => (
          <RevealItem key={r.author} className="h-full">
            <figure className="flex h-full flex-col border border-ink-150 bg-white p-5">
              <blockquote className="flex-1 text-sm leading-relaxed text-ink-700">{r.text}</blockquote>
              <figcaption className="mt-4 border-t border-ink-150 pt-3">
                <span className="block text-sm font-medium text-ink-900">{r.author}</span>
                <span className="block text-xs text-ink-400">{r.role}</span>
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
