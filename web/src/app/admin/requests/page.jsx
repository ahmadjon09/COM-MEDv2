'use client';
// Kelib tushgan arizalar — bot ishlamay qolsa ham hammasi shu yerda ko'rinadi.
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/admin-api';
import { PageHead, Panel, EmptyState, Input, Textarea } from '@/components/admin/Fields';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icons';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { LineSkeleton } from '@/components/ui/Skeleton';
import { formatPhone } from '@/lib/utils';

const STATUSES = [
  { key: '', label: 'Barchasi' },
  { key: 'NEW', label: 'Yangi' },
  { key: 'IN_PROGRESS', label: 'Jarayonda' },
  { key: 'DONE', label: 'Bajarildi' },
  { key: 'SPAM', label: 'Spam' },
];

const STATUS_STYLE = {
  NEW: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SPAM: 'bg-ink-100 text-ink-500 border-ink-200',
};

export default function RequestsPage() {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (status) p.set('status', status);
      if (q) p.set('q', q);
      const r = await api.get(`/api/requests?${p}`);
      setItems(r.data);
      setCounts(r.meta?.counts || {});
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function setStatusOf(item, newStatus) {
    try {
      await api.patch(`/api/requests/${item.id}`, { status: newStatus });
      setItems((s) => s.map((x) => (x.id === item.id ? { ...x, status: newStatus } : x)));
      if (open?.id === item.id) setOpen({ ...open, status: newStatus });
      toast.success('Holat yangilandi');
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function saveNote() {
    setSaving(true);
    try {
      await api.patch(`/api/requests/${open.id}`, { adminNote: note });
      setItems((s) => s.map((x) => (x.id === open.id ? { ...x, adminNote: note } : x)));
      toast.success('Izoh saqlandi');
      setOpen(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await api.del(`/api/requests/${target.id}`);
      setItems((s) => s.filter((x) => x.id !== target.id));
      toast.success("O'chirildi");
      setTarget(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHead title="Arizalar" subtitle="Saytdan kelgan barcha so'rovlar" />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key || 'all'}
              onClick={() => setStatus(s.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
                status === s.key
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-25'
              }`}
            >
              {s.label}
              {s.key && counts[s.key] ? <span className="ml-1.5 text-xs opacity-70">{counts[s.key]}</span> : null}
            </button>
          ))}
        </div>
        <div className="lg:ml-auto lg:w-80">
          <Input icon="search" placeholder="Ism, telefon yoki mahsulot..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Panel padded={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6"><LineSkeleton lines={6} /></div>
        ) : items.length === 0 ? (
          <EmptyState icon="inbox" title="Ariza topilmadi" text="Filtrni o'zgartiring yoki qidiruvni tozalang." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink-25">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                  {r.name.slice(0, 1).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">{r.name}</p>
                  <p className="truncate text-xs text-ink-400">
                    {r.productName || 'Umumiy so\'rov'} · {new Date(r.createdAt).toLocaleString('ru-RU')}
                    {!r.telegramSent && <span className="ml-2 font-bold text-amber-600">⚠ TG yuborilmadi</span>}
                  </p>
                </div>

                <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
                  {formatPhone(r.phone)}
                </a>

                <select
                  value={r.status}
                  onChange={(e) => setStatusOf(r, e.target.value)}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none ${STATUS_STYLE[r.status]}`}
                >
                  {STATUSES.filter((s) => s.key).map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setOpen(r); setNote(r.adminNote || ''); }}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-ink-500
                               transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    aria-label="Ko'rish"
                  >
                    <Icon name="eye" size={15} />
                  </button>
                  <button
                    onClick={() => setTarget(r)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-ink-500
                               transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="O'chirish"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Ariza tafsilotlari */}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.name}
        description={open ? new Date(open.createdAt).toLocaleString('ru-RU') : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(null)}>Yopish</Button>
            <Button onClick={saveNote} loading={saving}>Izohni saqlash</Button>
          </>
        }
      >
        {open && (
          <div className="space-y-4">
            <Row label="Telefon">
              <a href={`tel:${open.phone}`} className="font-bold text-blue-600">{formatPhone(open.phone)}</a>
            </Row>
            {open.productName && <Row label="Mahsulot / xizmat">{open.productName}</Row>}
            {open.message && <Row label="Mijoz izohi"><span className="whitespace-pre-wrap">{open.message}</span></Row>}
            <Row label="Til">{open.locale}</Row>
            <Row label="Manba">{open.source === 'telegram-fallback' ? 'Zaxira kanal' : 'Sayt'}</Row>
            <Row label="Telegram">
              {open.telegramSent ? (
                <span className="text-emerald-600">✔ Yuborildi</span>
              ) : (
                <span className="text-amber-600">⚠ {open.telegramError || 'Yuborilmadi'}</span>
              )}
            </Row>

            <Textarea
              label="Ichki izoh (faqat siz ko'rasiz)"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Masalan: qo'ng'iroq qilindi, ertaga chiqamiz"
            />
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        loading={deleting}
        danger
        title="Ariza o'chirilsinmi?"
        description="Bu amalni orqaga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
      />
    </>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 pb-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</span>
      <span className="max-w-[70%] text-right text-sm text-ink-800">{children}</span>
    </div>
  );
}
