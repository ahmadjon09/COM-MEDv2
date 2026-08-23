'use client';
// Admin kirish sahifasi.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { api } from '@/lib/admin-api';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icons';
import { Input } from '@/components/admin/Fields';

export default function LoginPage() {
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(form.login.trim(), form.password);
      router.replace('/admin');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-5">
      {/* Fon */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-200/40 blur-[100px]" />
        <div className="absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-blob bg-[#15c5a8]/15 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="" width={56} height={56} className="h-14 w-14 object-contain" />
          <h1 className="mt-5 text-2xl font-bold text-ink-900">Boshqaruv paneli</h1>
          <p className="mt-1.5 text-sm text-ink-500">Davom etish uchun tizimga kiring</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-ink-150 bg-white space-y-4 p-7">
          <Input
            label="Login"
            icon="user"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            placeholder="admin"
            autoComplete="username"
            required
          />
          <Input
            label="Parol"
            icon="shield"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <Icon name="warning" size={16} className="mt-0.5 shrink-0 text-rose-500" />
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          )}

          <Button type="submit" variant="accent" size="lg" full loading={loading}>
            Kirish
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-400">
          Bu sahifa qidiruv tizimlarida indekslanmaydi.
        </p>
      </motion.div>
    </div>
  );
}
