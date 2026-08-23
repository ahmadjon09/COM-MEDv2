'use client';
// Rasm galereyasi — texnik chizma foni, kichik rasmlar qatori.
import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../ui/Icons';

export default function Gallery({ images = [], alt, kind }) {
  const [active, setActive] = useState(0);
  const has = images && images.length > 0;

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden border border-ink-150 imgplate">
        {has ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <Image src={images[active]} alt={alt} fill sizes="(max-width:1080px) 96vw, 60vw" priority
                     className="object-contain p-6" />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-ink-200">
            <Icon name={kind === 'SERVICE' ? 'wrench' : 'box'} size={72} />
          </div>
        )}

        {/* Burchak belgilari — "chizma" hissi */}
        <span aria-hidden className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-ink-300" />
        <span aria-hidden className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-ink-300" />
        <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-ink-300" />
        <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-ink-300" />
      </div>

      {has && images.length > 1 && (
        <div className="mt-2 flex gap-px overflow-x-auto bg-ink-150 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img} onClick={() => setActive(i)} aria-label={`${alt} — ${i + 1}`}
              className={`relative h-16 w-20 shrink-0 imgplate transition-opacity duration-200 ${
                i === active ? 'opacity-100 ring-1 ring-inset ring-blue-500' : 'opacity-55 hover:opacity-100'
              }`}
            >
              <Image src={img} alt="" fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
