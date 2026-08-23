'use client';
// Sodda toast tizimi.
import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icons';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message, type = 'success', ttl = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, message, type }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), ttl);
  }, []);

  const api = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error', 6000),
    info: (m) => push(m, 'info'),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-white p-3.5 shadow-pop ${
                t.type === 'error' ? 'border-rose-200' : t.type === 'info' ? 'border-blue-200' : 'border-emerald-200'
              }`}
            >
              <Icon
                name={t.type === 'error' ? 'warning' : t.type === 'info' ? 'info' : 'check'}
                size={16}
                className={`mt-0.5 shrink-0 ${
                  t.type === 'error' ? 'text-rose-500' : t.type === 'info' ? 'text-blue-500' : 'text-emerald-500'
                }`}
              />
              <p className="text-sm leading-snug text-ink-800">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx) ?? { success: () => {}, error: () => {}, info: () => {} };
