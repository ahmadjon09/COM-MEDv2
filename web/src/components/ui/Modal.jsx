'use client';
// Modal — o'tkir burchak, ingichka chegara, vazmin animatsiya.
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import Button from './Button';
import Icon from './Icons';

export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink-950/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className={`relative w-full ${widths[size]} border border-ink-200 bg-white p-6 shadow-pop`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={onClose}
              className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded text-ink-400
                         transition-colors hover:bg-ink-50 hover:text-ink-900"
              aria-label="Yopish"
            >
              <Icon name="close" size={16} />
            </button>

            {title && <h3 className="pr-10 text-lg font-semibold text-ink-900">{title}</h3>}
            {description && <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>}
            {children && <div className="mt-5">{children}</div>}
            {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ConfirmModal({ open, onClose, onConfirm, loading, title, description, confirmText, cancelText, danger }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title} description={description} size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>{cancelText || 'Bekor qilish'}</Button>
          <Button variant={danger ? 'danger' : 'accent'} onClick={onConfirm} loading={loading}>
            {confirmText || 'Tasdiqlash'}
          </Button>
        </>
      }
    />
  );
}
