'use client';
// Mahsulotlar ro'yxati — qidiruv, filtr, tez holat o'zgartirish.
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/admin-api';
import { PageHead, Panel, Badge, EmptyState, Input, Select } from '@/components/admin/Fields';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/Modal';
import { LineSkeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState('');
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (q) p.set('q', q);
      if (category) p.set('category', category);
      if (kind) p.set('kind', kind);
      const r = await api.get(`/api/products/admin/all?${p}`);
      setItems(r.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, kind]);

  useEffect(() => {
    api.get('/api/categories/admin/all').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300); // qidiruvni biroz kechiktiramiz
    return () => clearTimeout(t);
  }, [load]);

  async function toggleActive(p) {
    try {
      await api.patch(`/api/products/${p.id}`, { isActive: !p.isActive });
      setItems((s) => s.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x)));
      toast.success(p.isActive ? 'Saytdan yashirildi' : 'Saytda ko\'rinadi');
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await api.del(`/api/products/${target.id}`);
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
      <PageHead
        title="Mahsulot va xizmatlar"
        subtitle={`Jami ${items.length} ta pozitsiya`}
        action={<Button href="/admin/products/new" variant="accent" size="sm" icon={<Icon name="plus" size={15} />}>Yangi qo'shish</Button>}
      />

      {/* Filtrlar */}
      <div className="rounded-xl border border-ink-150 bg-white mb-6 grid gap-4 p-4 md:grid-cols-3">
        <Input icon="search" placeholder="Nomi yoki artikul bo'yicha qidirish..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.nameUz}</option>)}
        </Select>
        <Select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Barcha turlar</option>
          <option value="PART">Zapchastlar</option>
          <option value="SERVICE">Xizmatlar</option>
        </Select>
      </div>

      {/* Ro'yxat */}
      <Panel padded={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6"><LineSkeleton lines={6} /></div>
        ) : items.length === 0 ? (
          <EmptyState icon="box" title="Hech narsa topilmadi"
            text="Filtrlarni tozalang yoki birinchi pozitsiyani qo'shing."
            action={<Button href="/admin/products/new" variant="accent" size="sm" icon={<Icon name="plus" size={15} />}>Qo'shish</Button>} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {items.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink-25">
                <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg border border-ink-150 bg-ink-25">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-ink-300">
                      <Icon name={p.kind === 'SERVICE' ? 'wrench' : 'box'} size={22} />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/products/${p.id}`} className="truncate text-sm font-medium text-ink-900 hover:text-blue-700">
                      {p.nameUz}
                    </Link>
                    {p.isFeatured && (
                      <Badge tone="amber" icon="star">TOP</Badge>
                    )}
                    <Badge tone={p.kind === 'SERVICE' ? 'blue' : 'gray'} icon={p.kind === 'SERVICE' ? 'wrench' : 'box'}>
                      {p.kind === 'SERVICE' ? 'Xizmat' : 'Zapchast'}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-400">
                    {p.category?.nameUz}
                    {p.kind === 'PART' && p.sku ? ` · ${p.sku}` : ''}
                    {p.kind === 'PART' && p.originCountry ? ` · ${p.originCountry}` : ''}
                    {' · '}
                    {p.kind === 'SERVICE' ? 'narx ko\'rsatilmaydi' : formatPrice(p.price, p.currency, 'uz')}
                  </p>
                </div>

                <button
                  onClick={() => toggleActive(p)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    p.isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-ink-200 bg-ink-50 text-ink-500 hover:bg-ink-100'
                  }`}
                >
                  <Icon name={p.isActive ? 'eye' : 'eyeOff'} size={13} />
                  {p.isActive ? 'Saytda' : 'Yashirin'}
                </button>

                <div className="flex gap-1.5">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-ink-500
                               transition-colors hover:border-blue-300 hover:text-blue-600"
                    aria-label="Tahrirlash"
                  >
                    <Icon name="edit" size={15} />
                  </Link>
                  <button
                    onClick={() => setTarget(p)}
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

      <ConfirmModal
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        loading={deleting}
        danger
        title={`"${target?.nameUz}" o'chirilsinmi?`}
        description="Bu amalni orqaga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
      />
    </>
  );
}
