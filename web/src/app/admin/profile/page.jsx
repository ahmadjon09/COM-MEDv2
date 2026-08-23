'use client';
// Admin o'z profili: ism, login va parolni o'zgartirish.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/admin-api';
import { PageHead, Panel, Input } from '@/components/admin/Fields';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({ fullName: '', login: '', currentPassword: '', newPassword: '', repeat: '' });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    api.get('/api/auth/me').then((r) => {
      setMe(r.data);
      setForm((f) => ({ ...f, fullName: r.data.fullName, login: r.data.login }));
    }).catch((e) => toast.error(e.message));
    // eslint-disable-next-line
  }, []);

  function check() {
    if (form.newPassword) {
      if (form.newPassword.length < 8) { toast.error('Yangi parol kamida 8 belgi bo\'lsin'); return false; }
      if (form.newPassword !== form.repeat) { toast.error('Parollar mos kelmadi'); return false; }
      if (!form.currentPassword) { toast.error('Joriy parolni kiriting'); return false; }
    }
    return true;
  }

  async function save() {
    if (!check()) return;
    if (form.newPassword) { setConfirm(true); return; }
    await doSave();
  }

  async function doSave() {
    setSaving(true);
    try {
      const payload = {};
      if (form.fullName !== me.fullName) payload.fullName = form.fullName.trim();
      if (form.login !== me.login) payload.login = form.login.trim();
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      if (!Object.keys(payload).length) { toast.info('Hech narsa o\'zgarmadi'); setSaving(false); setConfirm(false); return; }

      const r = await api.patch('/api/auth/me', payload);

      if (form.newPassword) {
        toast.success('Parol o\'zgardi — qaytadan kiring');
        await api.logout();
        router.replace('/admin/login');
        return;
      }
      setMe(r.data);
      toast.success('Profil yangilandi');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
      setConfirm(false);
    }
  }

  return (
    <>
      <PageHead title="Mening profilim" subtitle="Ism, login va parolni shu yerdan o'zgartirasiz" />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-ink-150 bg-white p-6">
            <h2 className="mb-5 text-base font-semibold text-ink-900">Shaxsiy ma'lumot</h2>
            <div className="space-y-4">
              <Input label="To'liq ism" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <Input
                label="Login"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                hint="Tizimga kirishda ishlatiladi"
              />
            </div>
          </section>

          <section className="rounded-xl border border-ink-150 bg-white p-6">
            <h2 className="mb-2 text-base font-semibold text-ink-900">Parolni o'zgartirish</h2>
            <p className="mb-5 text-sm text-ink-500">
              Parolni o'zgartirsangiz, barcha qurilmalardagi seanslar yopiladi va qaytadan kirish talab qilinadi.
            </p>
            <div className="space-y-4">
              <Input
                label="Joriy parol"
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              />
              <Input
                label="Yangi parol"
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                hint="Kamida 8 belgi. Harf, raqam va belgilarni aralashtiring."
              />
              <Input
                label="Yangi parolni takrorlang"
                type="password"
                autoComplete="new-password"
                value={form.repeat}
                onChange={(e) => setForm({ ...form, repeat: e.target.value })}
              />
            </div>
          </section>

          <Button onClick={save} variant="accent" loading={saving} size="lg" icon={<Icon name="save" size={17} />}>
            Saqlash
          </Button>
        </div>

        <aside className="rounded-xl border border-ink-150 bg-white h-fit p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">Hisob ma'lumoti</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Rol" value={me?.role} />
            <Row label="Oxirgi kirish" value={me?.lastLoginAt ? formatDate(me.lastLoginAt) : '—'} />
            <Row label="Yaratilgan" value={me?.createdAt ? formatDate(me.createdAt) : '—'} />
          </dl>

          <div className="mt-6 rounded-xl bg-blue-50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
              <Icon name="shield" size={14} /> Maslahat
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-600">
              Parolni hech kimga aytmang. Kompyuteringizni tark etayotganda «Chiqish» tugmasini bosing.
            </p>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={doSave}
        loading={saving}
        title="Parolni o'zgartirasizmi?"
        description="Barcha qurilmalardan chiqarilasiz va yangi parol bilan qaytadan kirishingiz kerak bo'ladi."
        confirmText="Ha, o'zgartirilsin"
        cancelText="Bekor qilish"
      />
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-3">
      <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="font-semibold text-ink-800">{value}</dd>
    </div>
  );
}
