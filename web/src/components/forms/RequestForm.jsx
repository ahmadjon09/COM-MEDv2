'use client';
// Ariza formasi — o'tkir burchakli maydonlar, loading holati, fallback bilan.
import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Button from '../ui/Button';
import Icon from '../ui/Icons';
import { submitRequest } from '@/lib/client-api';
import { toDbLocale } from '@/i18n';

export default function RequestForm({ locale, dict, product = null, compact = false, className = '' }) {
  const [form, setForm] = useState({ name: '', phone: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | loading | success | error
  const [note, setNote] = useState('');

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: null }));
  };

  function validate() {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = dict.form.tooShort;
    if (!form.phone) e.phone = dict.form.required;
    else if (!isValidPhoneNumber(form.phone)) e.phone = dict.form.invalidPhone;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (state === 'loading') return;
    if (!validate()) return;

    setState('loading');
    setNote('');

    const res = await submitRequest({
      name: form.name.trim(),
      phone: form.phone,
      message: form.message.trim() || null,
      productId: product?.id ?? null,
      productName: product?.name ?? null,
      locale: toDbLocale(locale),
      website: form.website,
      source: 'site',
    });

    if (res.ok) {
      setState('success');
      if (res.via === 'telegram-fallback') setNote('Zaxira kanal orqali yuborildi');
      setForm({ name: '', phone: '', message: '', website: '' });
    } else {
      setState('error');
      setNote(res.message || dict.form.errorText);
    }
  }

  if (state === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        className={`border border-ink-200 bg-white p-8 ${className}`}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center bg-ok text-white"><Icon name="check" size={18} /></span>
          <h3 className="text-base font-semibold text-ink-900">{dict.form.successTitle}</h3>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-500">{dict.form.successText}</p>
        {note && <p className="mt-2 font-mono text-micro uppercase text-warn">{note}</p>}
        <Button variant="outline" size="sm" className="mt-6" onClick={() => setState('idle')}>
          {dict.form.again}
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`border border-ink-200 bg-white ${className}`} noValidate>
      <div className="flex items-center justify-between border-b border-ink-150 px-5 py-3">
        <span className="kicker">{dict.product.requestTitle}</span>
        <span className="kicker text-ink-300">FORM / 01</span>
      </div>

      <div className={compact ? 'p-5' : 'p-5 md:p-6'}>
        {!compact && <p className="mb-5 text-sm leading-relaxed text-ink-500">{dict.product.requestText}</p>}

        {product?.name && (
          <div className="mb-5 border-l-2 border-blue-500 bg-ink-25 px-3.5 py-2.5">
            <p className="kicker">{dict.form.productLabel}</p>
            <p className="mt-1 text-sm font-medium text-ink-900">{product.name}</p>
          </div>
        )}

        <div className="space-y-4">
          <Field label={dict.form.name} error={errors.name} required>
            <input
              type="text" value={form.name} onChange={set('name')}
              placeholder={dict.form.namePlaceholder} autoComplete="name"
              className={inputCls(errors.name)}
            />
          </Field>

          <Field label={dict.form.phone} error={errors.phone} required>
            <PhoneInput
              international defaultCountry="UZ" countryCallingCodeEditable={false}
              value={form.phone} onChange={(v) => set('phone')(v || '')}
              placeholder="+998 90 123 45 67"
              className={errors.phone ? '!border-danger' : ''}
            />
          </Field>

          <Field label={dict.form.message}>
            <textarea
              rows={compact ? 3 : 4} value={form.message} onChange={set('message')}
              placeholder={dict.form.messagePlaceholder}
              className={`${inputCls()} resize-none`}
            />
          </Field>

          <input
            type="text" name="website" value={form.website} onChange={set('website')}
            tabIndex={-1} autoComplete="off" aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />
        </div>

        <AnimatePresence>
          {state === 'error' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="border-l-2 border-danger bg-orange-50 px-3.5 py-2.5">
                <p className="text-sm font-medium text-danger">{dict.form.errorTitle}</p>
                <p className="mt-0.5 text-xs text-ink-600">{note}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" variant="accent" size="lg" full loading={state === 'loading'} className="mt-6"
                iconRight={state !== 'loading' ? <Icon name="arrow" size={17} /> : null}>
          {state === 'loading' ? dict.form.submitting : dict.form.submit}
        </Button>

        <p className="mt-3 text-center text-xs leading-relaxed text-ink-400">
          {dict.form.agree}{' '}
          <Link href={`/${locale}/privacy`} className="text-blue-600 underline-offset-2 hover:underline">
            {dict.form.agreeLink}
          </Link>{' '}
          {dict.form.agreeEnd}
        </p>
      </div>
    </form>
  );
}

function Field({ label, error, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 font-mono text-label uppercase text-ink-400">
        {label}{required && <span className="text-blue-500">*</span>}
      </span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-1 block text-xs text-danger"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

const inputCls = (error) =>
  `w-full rounded border bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors duration-200
   placeholder:text-ink-400 focus:border-blue-500 focus:shadow-focus ${error ? 'border-danger' : 'border-ink-200'}`;
