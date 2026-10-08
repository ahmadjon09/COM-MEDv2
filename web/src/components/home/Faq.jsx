'use client';
// FAQ — akkordeon. Barcha javoblar SSR DOM'da doim mavjud (Googlebot va FAQPage schema uchun).
import { useState } from 'react';
import Section from '../ui/Section';
import Icon from '../ui/Icons';

/** Matndagi **qalin** belgilarni <strong> tegiga aylantirish */
function renderFormattedText(text = '') {
  const parts = String(text).split(/(\*\*.+?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-ink-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function Faq({ dict }) {
  const [open, setOpen] = useState(0);

  return (
    <Section id="faq" title={dict.faqTitle} lead={dict.faqLead}>
      <div className="mt-8 max-w-3xl border-t border-ink-150">
        {dict.faq.map((item, i) => {
          const isOpen = open === i;
          const answerId = `faq-answer-${i}`;
          const questionId = `faq-question-${i}`;
          return (
            <div key={i} className="border-b border-ink-150">
              <h3 className="m-0 font-normal">
                <button
                  id={questionId}
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="flex w-full items-center gap-4 py-4 text-left"
                >
                  <span
                    className={`flex-1 text-base font-medium transition-colors ${
                      isOpen ? 'text-blue-600' : 'text-ink-900'
                    }`}
                  >
                    {item.q}
                  </span>
                  <span
                    className={`shrink-0 text-ink-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-45 text-blue-500' : ''
                    }`}
                  >
                    <Icon name="plus" size={16} />
                  </span>
                </button>
              </h3>

              <div
                id={answerId}
                role="region"
                aria-labelledby={questionId}
                className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 pr-8 text-sm leading-[1.75] text-ink-600">
                    {renderFormattedText(item.a)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
