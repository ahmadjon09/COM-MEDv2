'use client';
// Juda vazmin ochilish. SSR va qidiruv botlari (Googlebot/Yandexbot) hamda LCP uchun
// dastlabki HTML'da matnlar opacity:0 bilan yashirilmaydi (initial={false}).
import { motion, useReducedMotion } from 'framer-motion';

export default function Reveal({ children, delay = 0, className, y = 8, duration = 0.45 }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -30px 0px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({ children, className, stagger = 0.04, delay = 0 }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={{ show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={false}
      variants={{
        hidden: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
