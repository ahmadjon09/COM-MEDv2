'use client';
// Kategoriyalar boshqaruvi — ro'yxat + modal ichida qo'shish/tahrirlash.
import { useEffect, useState } from 'react';
import { api } from '@/lib/admin-api';
import { PageHead, Panel, Badge, EmptyState, Input, MultiLangField, Toggle, Select, ImageUploader } from '@/components/admin/Fields';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icons';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { LineSkeleton } from '@/components/ui/Skeleton';

const ICONS = [
  { key: 'uzi', label: 'UZI' },
  { key: 'ekg', label: 'EKG' },
  { key: 'ivl', label: 'IVL' },
  { key: 'defib', label: 'Defibrillator' },
  { key: 'sterilizator', label: 'Sterilizator' },
  { key: 'lab', label: 'Laboratoriya' },
  { key: 'box', label: 'Umumiy' },
];

const empty = {
  name: { Uz: '', Ru: '', UzCyrl: '' },
  desc: { Uz: '', Ru: '', UzCyrl: '' },
  metaTitle: { Uz: '', Ru: '', UzCyrl: '' },
  metaDesc: { Uz: '', Ru: '', UzCyrl: '' },
  iconKey: 'box',
  images: [],
  sortOrder: 0,
  isActive: true,
};

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {id?} — modal ochiq
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/api/categories/admin/all');
      setItems(r.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function openNew() {
    setForm(empty);
    setEditing({});
  }

  function openEdit(c) {
    setForm({
      name: { Uz: c.nameUz || '', Ru: c.nameRu || '', UzCyrl: c.nameUzCyrl || '' },
      desc: { Uz: c.descUz || '', Ru: c.descRu || '', UzCyrl: c.descUzCyrl || '' },
      metaTitle: { Uz: c.metaTitleUz || '', Ru: c.metaTitleRu || '', UzCyrl: c.metaTitleUzCyrl || '' },
      metaDesc: { Uz: c.metaDescUz || '', Ru: c.metaDescRu || '', UzCyrl: c.metaDescUzCyrl || '' },
      iconKey: c.iconKey || 'box',
      images: c.imageUrl ? [c.imageUrl] : [],
      sortOrder: c.sortOrder ?? 0,
      isActive: c.isActive,
    });
    setEditing(c);
  }

  async function save() {
    if (!form.name.Uz.trim() || !form.name.Ru.trim() || !form.name.UzCyrl.trim()) {
      toast.error('Nomni uchala tilda ham to\'ldiring');
      return;
    }
    setSaving(true);
    const payload = {
      nameUz: form.name.Uz.trim(),
      nameRu: form.name.Ru.trim(),
      nameUzCyrl: form.name.UzCyrl.trim(),
      descUz: form.desc.Uz.trim() || null,
      descRu: form.desc.Ru.trim() || null,
      descUzCyrl: form.desc.UzCyrl.trim() || null,
      metaTitleUz: form.metaTitle.Uz.trim() || null,
      metaTitleRu: form.metaTitle.Ru.trim() || null,
      metaTitleUzCyrl: form.metaTitle.UzCyrl.trim() || null,
      metaDescUz: form.metaDesc.Uz.trim() || null,
      metaDescRu: form.metaDesc.Ru.trim() || null,
      metaDescUzCyrl: form.metaDesc.UzCyrl.trim() || null,
      iconKey: form.iconKey,
      imageUrl: form.images[0] || null,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    try {
      if (editing?.id) await api.patch(`/api/categories/${editing.id}`, payload);
      else await api.post('/api/categories', payload);
      toast.success('Saqlandi');
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await api.del(`/api/categories/${target.id}`);
      toast.success("O'chirildi");
      setTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHead
        title="Kategoriyalar"
        subtitle="Mahsulot va xizmatlar shu bo'limlarga taqsimlanadi"
        action={<Button onClick={openNew} variant="accent" size="sm" icon={<Icon name="plus" size={15} />}>Yangi kategoriya</Button>}
      />

      <Panel padded={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6"><LineSkeleton lines={5} /></div>
        ) : items.length === 0 ? (
          <EmptyState icon="tags" title="Hozircha kategoriya yo'q" text="Birinchi bo'limni qo'shing — mahsulotlar shunga biriktiriladi." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {items.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink-25">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon name={c.iconKey || 'box'} size={19} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">{c.nameUz}</p>
                  <p className="truncate text-xs text-ink-400">
                    {c.nameRu} · /{c.slug} · {c.productCount} ta pozitsiya
                  </p>
                </div>

                <Badge tone={c.isActive ? 'green' : 'gray'} icon={c.isActive ? 'eye' : 'eyeOff'}>
                  {c.isActive ? 'Faol' : 'Yashirin'}
                </Badge>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(c)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-ink-500
                               transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    aria-label="Tahrirlash"
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    onClick={() => setTarget(c)}
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

      {/* Qo'shish / tahrirlash modali */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
        description="Nom va tavsifni uchala tilda to'ldiring."
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Bekor qilish</Button>
            <Button onClick={save} loading={saving} icon={<Icon name="check" size={17} />}>Saqlash</Button>
          </>
        }
      >
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <MultiLangField label="Nomi" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <MultiLangField
            label="Tavsif"
            type="textarea"
            rows={4}
            value={form.desc}
            onChange={(v) => setForm({ ...form, desc: v })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Ikonka" value={form.iconKey} onChange={(e) => setForm({ ...form, iconKey: e.target.value })}>
              {ICONS.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
            </Select>
            <Input
              label="Tartib raqami"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>

          <ImageUploader
            label="Kategoriya rasmi (ixtiyoriy)"
            images={form.images}
            onChange={(v) => setForm({ ...form, images: v })}
            max={1}
          />

          <MultiLangField label="SEO: meta sarlavha" value={form.metaTitle} onChange={(v) => setForm({ ...form, metaTitle: v })} />
          <MultiLangField
            label="SEO: meta tavsif"
            type="textarea"
            rows={3}
            value={form.metaDesc}
            onChange={(v) => setForm({ ...form, metaDesc: v })}
          />

          <Toggle
            label="Saytda ko'rinsin"
            checked={form.isActive}
            onChange={(v) => setForm({ ...form, isActive: v })}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        loading={deleting}
        danger
        title={`"${target?.nameUz}" o'chirilsinmi?`}
        description="Ichida mahsulot bo'lsa o'chirilmaydi — avval ularni ko'chiring."
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
      />
    </>
  );
}
