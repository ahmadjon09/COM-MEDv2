'use client';
// Admin panel uchun qayta ishlatiladigan forma elementlari.
import { useState, useRef } from 'react';
import Image from 'next/image';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { api } from '@/lib/admin-api';
import { useToast } from '../ui/Toast';
import Icon from '../ui/Icons';
import { Spinner } from '../ui/Button';

/** Oddiy matn maydoni */
export function Input({ label, hint, error, required, icon, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-600">
          {label} {required && <span className="text-blue-500">*</span>}
        </span>
      )}
      <span className="relative block">
        {icon && (
          <Icon name={icon} size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        )}
        <input
          {...props}
          className={`w-full rounded-lg border bg-white py-2.5 text-sm text-ink-900 outline-none
                      transition-colors duration-200 placeholder:text-ink-400
                      focus:border-blue-500 focus:shadow-focus
                      ${icon ? 'pl-9 pr-3.5' : 'px-3.5'}
                      ${error ? 'border-rose-300' : 'border-ink-200'}`}
        />
      </span>
      {hint && !error && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

/** Ko'p qatorli maydon */
export function Textarea({ label, hint, rows = 4, error, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-ink-600">{label}</span>
      )}
      <textarea
        rows={rows}
        {...props}
        className={`w-full resize-y rounded-lg border bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink-900
                    outline-none transition-all duration-300 placeholder:text-ink-400
                    focus:border-blue-500 focus:shadow-focus
                    ${error ? 'border-rose-300' : 'border-ink-200'}`}
      />
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

/** Tanlov ro'yxati */
export function Select({ label, children, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-ink-600">{label}</span>
      )}
      <select
        {...props}
        className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-ink-900
                   outline-none transition-colors focus:border-blue-500 focus:shadow-focus"
      >
        {children}
      </select>
    </label>
  );
}

/** Yoqish/o'chirish tugmasi */
export function Toggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-ink-200 bg-white px-4 py-3 text-left
                 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
    >
      <span>
        <span className="block text-sm font-semibold text-ink-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-400">{description}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? 'bg-blue-500' : 'bg-ink-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

/**
 * 3 tilli maydonlar guruhi — admin har bir mahsulot uchun uz / ru / uz-Cyrl kiritadi.
 * Tab ko'rinishida: chalkashmaydi va joy tejaydi.
 */
export function MultiLangField({ label, value, onChange, type = 'input', rows = 5, hint, required }) {
  const [tab, setTab] = useState('Uz');
  const tabs = [
    { key: 'Uz', label: "O'zbekcha", flag: 'UZ' },
    { key: 'Ru', label: 'Русский', flag: 'RU' },
    { key: 'UzCyrl', label: 'Ўзбекча', flag: 'ЎЗ' },
  ];

  const filled = (k) => Boolean(value?.[k]?.trim?.());

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-ink-600">
          {label} {required && <span className="text-blue-500">*</span>}
        </span>
        <div className="flex gap-1 rounded-lg bg-ink-50 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {t.flag}
              {/* To'ldirilganini ko'rsatuvchi nuqta */}
              <span
                className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
                  filled(t.key) ? 'bg-emerald-500' : 'bg-ink-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {type === 'textarea' ? (
        <textarea
          rows={rows}
          value={value?.[tab] ?? ''}
          onChange={(e) => onChange({ ...value, [tab]: e.target.value })}
          placeholder={tabs.find((t) => t.key === tab)?.label + ' matni'}
          className="w-full resize-y rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm leading-relaxed
                     outline-none transition-all focus:border-blue-500 focus:shadow-focus"
        />
      ) : (
        <input
          value={value?.[tab] ?? ''}
          onChange={(e) => onChange({ ...value, [tab]: e.target.value })}
          placeholder={tabs.find((t) => t.key === tab)?.label}
          className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none
                     transition-all focus:border-blue-500 focus:shadow-focus"
        />
      )}

      {hint && <p className="mt-2 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

/** Telefon raqami maydoni (react-phone-number-input) */
export function PhoneField({ label, value, onChange }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-ink-600">{label}</span>
      )}
      <PhoneInput international defaultCountry="UZ" value={value} onChange={(v) => onChange(v || '')} />
    </label>
  );
}

/**
 * Rasm yuklovchi — fayl imgbb'ga yuboriladi, natijada URL qaytadi.
 * Bir nechta rasm qo'llab-quvvatlanadi.
 */
export function ImageUploader({ images = [], onChange, max = 6, label = 'Rasmlar' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const toast = useToast();

  async function handleFiles(files) {
    const list = Array.from(files).slice(0, max - images.length);
    if (!list.length) return;

    setUploading(true);
    const uploaded = [];
    for (const f of list) {
      try {
        const r = await api.upload(f);
        uploaded.push(r.displayUrl || r.url);
      } catch (e) {
        toast.error(`${f.name}: ${e.message}`);
      }
    }
    if (uploaded.length) {
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} ta rasm yuklandi`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-ink-600">{label}</span>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((url, i) => (
          <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-ink-200">
            <Image src={url} alt="" fill sizes="200px" className="object-cover" />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-md bg-blue-600 px-2 py-0.5 text-[0.625rem] font-bold text-white">
                ASOSIY
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(images.filter((u) => u !== url))}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-rose-600
                         opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="O'chirish"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
                       border-ink-200 text-ink-400 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600"
          >
            {uploading ? <Spinner className="text-blue-500" /> : <Icon name="image" size={22} />}
            <span className="text-xs font-semibold">{uploading ? 'Yuklanmoqda...' : 'Rasm qo\'shish'}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-ink-400">
        Birinchi rasm asosiy hisoblanadi. Maksimal {max} ta, har biri 8 MB gacha. Rasmlar imgbb.com'ga yuklanadi.
      </p>
    </div>
  );
}

/** Sahifa sarlavhasi */
export function PageHead({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

/** Oq karta — admin sahifalaridagi asosiy konteyner */
export function Panel({ title, description, icon, action, children, className = '', padded = true }) {
  return (
    <section className={`rounded-xl border border-ink-150 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center gap-3 border-b border-ink-150 px-5 py-4">
          {icon && (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Icon name={icon} size={16} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {title && <h3 className="text-sm font-semibold text-ink-900">{title}</h3>}
            {description && <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? 'space-y-4 p-5' : ''}>{children}</div>
    </section>
  );
}

/** Rangli belgi (status, tur va h.k.) */
export function Badge({ children, tone = 'gray', icon }) {
  const tones = {
    gray: 'bg-ink-100 text-ink-600',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.6875rem] font-semibold ${tones[tone]}`}>
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}

/** Bo'sh holat */
export function EmptyState({ icon = 'inbox', title, text, action }) {
  return (
    <div className="px-6 py-16 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-ink-50 text-ink-300">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-ink-800">{title}</h3>
      {text && <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}


/* ------------------------------------------------------------------
   Ro'yxat muharriri — "nimalar kiradi", moslik ro'yxati va h.k.
   ------------------------------------------------------------------ */
export function ListEditor({ label, items = [], onChange, placeholder, hint, max = 30 }) {
  const set = (i, v) => { const a = [...items]; a[i] = v; onChange(a); };
  const add = () => onChange([...items, '']);
  const del = (i) => onChange(items.filter((_, j) => j !== i));
  const move = (i, d) => {
    const a = [...items];
    const t = a[i + d];
    if (t === undefined) return;
    a[i + d] = a[i]; a[i] = t; onChange(a);
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-ink-600">{label}</span>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <span className="grid h-10 w-8 shrink-0 place-items-center border border-ink-150 font-mono text-label text-ink-400">
              {String(i + 1).padStart(2, '0')}
            </span>
            <input
              value={it}
              onChange={(e) => set(i, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded border border-ink-200 px-3 py-2 text-sm outline-none
                         transition-colors focus:border-blue-500 focus:shadow-focus"
            />
            <div className="flex shrink-0">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                      className="grid h-10 w-8 place-items-center border border-ink-200 text-ink-400 disabled:opacity-30 hover:text-ink-900">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                      className="grid h-10 w-8 place-items-center border-y border-ink-200 text-ink-400 disabled:opacity-30 hover:text-ink-900">↓</button>
              <button type="button" onClick={() => del(i)}
                      className="grid h-10 w-8 place-items-center border border-ink-200 text-danger hover:bg-orange-50">✕</button>
            </div>
          </div>
        ))}
      </div>
      {items.length < max && (
        <button type="button" onClick={add}
                className="mt-2 border border-dashed border-ink-300 px-3 py-2 text-xs font-medium text-ink-500
                           transition-colors hover:border-blue-400 hover:text-blue-600">
          + Qator qo'shish
        </button>
      )}
      {hint && <p className="mt-2 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------
   Texnik xarakteristikalar jadvali (3 tilli yorliq + qiymat)
   ------------------------------------------------------------------ */
export function SpecEditor({ specs = [], onChange }) {
  const upd = (i, key, v) => { const a = [...specs]; a[i] = { ...a[i], [key]: v }; onChange(a); };
  const add = () => onChange([...specs, { labelUz: '', labelRu: '', labelUzCyrl: '', value: '' }]);
  const del = (i) => onChange(specs.filter((_, j) => j !== i));

  const cell =
    'w-full rounded border border-ink-200 px-2.5 py-2 text-sm outline-none transition-colors focus:border-blue-500';

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-ink-600">
        Texnik xarakteristikalar
      </span>

      {specs.length > 0 && (
        <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_36px] gap-2 pb-1.5 md:grid">
          {['Yorliq (UZ)', 'Yorliq (RU)', 'Yorliq (ЎЗ)', 'Qiymat', ''].map((h) => (
            <span key={h} className="text-xs font-medium text-ink-600">{h}</span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {specs.map((s, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_36px]">
            <input className={cell} value={s.labelUz} onChange={(e) => upd(i, 'labelUz', e.target.value)} placeholder="Chastota" />
            <input className={cell} value={s.labelRu} onChange={(e) => upd(i, 'labelRu', e.target.value)} placeholder="Частота" />
            <input className={cell} value={s.labelUzCyrl} onChange={(e) => upd(i, 'labelUzCyrl', e.target.value)} placeholder="Частота" />
            <input className={cell} value={s.value} onChange={(e) => upd(i, 'value', e.target.value)} placeholder="2–5 MGts" />
            <button type="button" onClick={() => del(i)}
                    className="grid h-10 w-9 place-items-center border border-ink-200 text-danger hover:bg-orange-50">✕</button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add}
              className="mt-2 border border-dashed border-ink-300 px-3 py-2 text-xs font-medium text-ink-500
                         transition-colors hover:border-blue-400 hover:text-blue-600">
        + Xarakteristika qo'shish
      </button>
      <p className="mt-2 text-xs text-ink-400">
        Qiymat bitta ustunda — u tarjima qilinmaydi (raqam, o'lcham birligi).
      </p>
    </div>
  );
}

/** Ishlab chiqarilgan davlat ro'yxati */
export const COUNTRIES = [
  { code: '', name: '— tanlanmagan —' },
  { code: 'CN', name: 'Xitoy (CN)' },
  { code: 'DE', name: 'Germaniya (DE)' },
  { code: 'JP', name: 'Yaponiya (JP)' },
  { code: 'KR', name: 'Janubiy Koreya (KR)' },
  { code: 'US', name: 'AQSh (US)' },
  { code: 'GB', name: 'Buyuk Britaniya (GB)' },
  { code: 'IL', name: 'Isroil (IL)' },
  { code: 'TR', name: 'Turkiya (TR)' },
  { code: 'IN', name: 'Hindiston (IN)' },
  { code: 'IT', name: 'Italiya (IT)' },
  { code: 'FR', name: 'Fransiya (FR)' },
  { code: 'PL', name: 'Polsha (PL)' },
  { code: 'RU', name: 'Rossiya (RU)' },
  { code: 'UZ', name: "O'zbekiston (UZ)" },
];
