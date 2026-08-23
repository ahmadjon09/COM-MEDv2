'use client';
// Admin bosh sahifasi — statistika kartalari va oxirgi arizalar.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/admin-api';
import { PageHead, Panel, Badge, EmptyState } from '@/components/admin/Fields';
import Icon from '@/components/ui/Icons';
import Button from '@/components/ui/Button';
import { formatPhone, formatDate } from '@/lib/utils';

const CARDS = [
  { key: 'newCount', label: 'Yangi arizalar', icon: 'inbox', accent: 'bg-blue-50 text-blue-600', href: '/admin/requests' },
  { key: 'week', label: 'Oxirgi 7 kun', icon: 'refresh', accent: 'bg-emerald-50 text-emerald-600', href: '/admin/requests' },
  { key: 'total', label: 'Jami arizalar', icon: 'doc', accent: 'bg-ink-100 text-ink-600', href: '/admin/requests' },
  { key: 'products', label: 'Faol pozitsiyalar', icon: 'box', accent: 'bg-amber-50 text-amber-600', href: '/admin/products' },
];

const STATUS = {
  NEW: { label: 'Yangi', tone: 'blue' },
  IN_PROGRESS: { label: 'Jarayonda', tone: 'amber' },
  DONE: { label: 'Bajarildi', tone: 'green' },
  SPAM: { label: 'Spam', tone: 'gray' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([
          api.get('/api/requests/stats/summary'),
          api.get('/api/requests?limit=6'),
        ]);
        setStats(s.data);
        setRecent(r.data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <PageHead
        title="Xush kelibsiz"
        subtitle="Sayt holati va oxirgi murojaatlar"
        action={
          <>
            <Button href="/admin/products/new" variant="accent" size="sm" icon={<Icon name="plus" size={15} />}>
              Yangi pozitsiya
            </Button>
            <Button href="/admin/requests" variant="outline" size="sm" icon={<Icon name="inbox" size={15} />}>
              Arizalar
            </Button>
          </>
        }
      />

      {err && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <Icon name="warning" size={17} className="mt-0.5 shrink-0 text-rose-500" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Serverga ulanib bo&apos;lmadi</p>
            <p className="mt-0.5 text-xs text-rose-600">{err}</p>
          </div>
        </div>
      )}

      {/* Statistika */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={c.href}
              className="group block rounded-xl border border-ink-150 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)]
                         transition-all duration-200 hover:border-blue-300 hover:shadow-[0_4px_16px_-6px_rgba(16,24,40,.12)]"
            >
              <div className="flex items-start justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${c.accent}`}>
                  <Icon name={c.icon} size={19} />
                </span>
                <Icon
                  name="arrowUpRight"
                  size={16}
                  className="text-ink-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-500"
                />
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-ink-900 tnum">
                {loading ? <span className="sk inline-block h-7 w-14 rounded" /> : (stats?.[c.key] ?? 0)}
              </p>
              <p className="mt-0.5 text-sm text-ink-500">{c.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Telegram ogohlantirishi */}
      {stats?.telegramFailed > 0 && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Icon name="warning" size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {stats.telegramFailed} ta ariza Telegramga yuborilmagan
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
              Bot tokeni yoki chat ID sozlamalarini tekshiring. Arizalar bazada saqlangan — yo&apos;qolmadi.
            </p>
          </div>
        </div>
      )}

      {/* Oxirgi arizalar */}
      <Panel
        className="mt-6"
        padded={false}
        title="Oxirgi arizalar"
        icon="inbox"
        action={
          <Link href="/admin/requests" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            Barchasi →
          </Link>
        }
      >
        {loading ? (
          <div className="divide-y divide-ink-150">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="sk h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="sk h-3.5 w-1/4 rounded" />
                  <div className="sk h-2.5 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState title="Hozircha ariza yo'q" text="Saytdan kelgan murojaatlar shu yerda ko'rinadi." />
        ) : (
          <ul className="divide-y divide-ink-150">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink-25">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {r.name.slice(0, 1).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">{r.name}</p>
                  <p className="truncate text-xs text-ink-400">{r.productName || "Umumiy so'rov"}</p>
                </div>

                <a
                  href={`tel:${r.phone}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <Icon name="phone" size={13} />
                  {formatPhone(r.phone)}
                </a>

                <span className="hidden text-xs text-ink-400 sm:block">{formatDate(r.createdAt)}</span>

                <Badge tone={STATUS[r.status]?.tone}>{STATUS[r.status]?.label || r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
