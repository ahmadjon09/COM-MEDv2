// Ish tartibi — sodda raqamli qatorlar.
import Section from '../ui/Section';
import { RevealGroup, RevealItem } from '../ui/Reveal';

export default function Workflow({ dict }) {
  return (
    <Section title={dict.home.processTitle} lead={dict.home.processSubtitle}>
      <RevealGroup className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {dict.process.map((p, i) => (
          <RevealItem key={p.title}>
            <div>
              <span className="text-sm font-semibold text-blue-500 tnum">{i + 1}</span>
              <h3 className="mt-2 text-base font-semibold text-ink-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.text}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
