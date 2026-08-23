'use client';
// FAQ — sodda akkordeon.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Section from '../ui/Section';
import Icon from '../ui/Icons';

export default function Faq({ dict }) {
  const [open, setOpen] = useState(0);

  return (
    <Section title={dict.faqTitle} lead={dict.faqLead}>
      <div className="mt-8 max-w-3xl border-t border-ink-150">
        {dict.faq.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-ink-150">
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 py-4 text-left"
              >
                <span className={`flex-1 text-base font-medium transition-colors ${isOpen ? 'text-blue-600' : 'text-ink-900'}`}>
                  {item.q}
                </span>
                <span className={`shrink-0 text-ink-400 transition-transform duration-300 ${isOpen ? 'rotate-45 text-blue-500' : ''}`}>
                  <Icon name="plus" size={16} />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 pr-8 text-sm leading-[1.75] text-ink-600">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
