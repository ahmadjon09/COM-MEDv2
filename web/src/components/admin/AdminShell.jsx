'use client';
// Admin qobig'i: yon menyu, yuqori qator, autentifikatsiya tekshiruvi.
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { api, tokens } from '@/lib/admin-api';
import Icon from '../ui/Icons';
import { Spinner } from '../ui/Button';

const AdminCtx = createContext(null);
export const useAdmin = () => useContext(AdminCtx) ?? {};

const MENU = [
  {
    label: 'Asosiy',
    items: [
      { href: '/admin', label: 'Boshqaruv', icon: 'dashboard', exact: true },
      { href: '/admin/requests', label: 'Arizalar', icon: 'inbox', badge: 'newCount' },
    ],
  },
  {
    label: 'Katalog',
    items: [
      { href: '/admin/products', label: 'Mahsulot va xizmatlar', icon: 'box' },
      { href: '/admin/categories', label: 'Kategoriyalar', icon: 'tags' },
    ],
  },
  {
    label: 'Sozlamalar',
    items: [
      { href: '/admin/settings', label: 'Sayt sozlamalari', icon: 'settings' },
      { href: '/admin/profile', label: 'Mening profilim', icon: 'user' },
    ],
  },
];

/** Sahifa sarlavhasini yo'lga qarab topamiz */
function titleFor(pathname) {
  for (const g of MENU) {
    for (const it of g.items) {
      if (it.exact ? pathname === it.href : pathname.startsWith(it.href)) return it.label;
    }
  }
  return 'Boshqaruv paneli';
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';

  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (isLogin) { setChecking(false); return; }
      if (!tokens.access && !tokens.refresh) { router.replace('/admin/login'); return; }
      try {
        const r = await api.get('/api/auth/me');
        if (!alive) return;
        setAdmin(r.data);
        setChecking(false);
        api.get('/api/requests/stats/summary').then((s) => alive && setStats(s.data)).catch(() => {});
      } catch {
        if (alive) router.replace('/admin/login');
      }
    })();
    return () => { alive = false; };
  }, [isLogin, router, pathname]);

  useEffect(() => setSidebarOpen(false), [pathname]);

  async function logout() {
    setLoggingOut(true);
    await api.logout();
    router.replace('/admin/login');
  }

  if (isLogin) return children;

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-50">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <Spinner className="h-7 w-7 text-blue-500" />
          <p className="text-sm">Tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  const isActive = (item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      {/* Logotip */}
      <div className="flex h-16 items-center gap-2.5 border-b border-ink-150 px-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
          <span className="leading-tight">
            <span className="block text-[0.8125rem] font-bold text-ink-900">COM MEDICAL</span>
            <span className="block text-[0.625rem] font-medium uppercase tracking-widest text-blue-500">Admin panel</span>
          </span>
        </Link>
      </div>

      {/* Menyu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {MENU.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((m) => {
                const active = isActive(m);
                const count = m.badge ? stats?.[m.badge] : 0;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                      active
                        ? 'bg-blue-50 font-semibold text-blue-700'
                        : 'font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-blue-500" />}
                    <Icon name={m.icon} size={17} className={active ? 'text-blue-600' : 'text-ink-400 group-hover:text-ink-600'} />
                    <span className="flex-1 truncate">{m.label}</span>
                    {count > 0 && (
                      <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-blue-500 px-1.5 text-[0.625rem] font-bold text-white">
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pastki qism */}
      <div className="border-t border-ink-150 p-3">
        <a
          href="/uz"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
        >
          <Icon name="external" size={16} className="text-ink-400" />
          Saytni ochish
        </a>

        <div className="flex items-center gap-2.5 rounded-lg bg-ink-50 px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-500 text-xs font-bold text-white">
            {(admin?.fullName || 'A').slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-ink-900">{admin?.fullName}</span>
            <span className="block truncate text-[0.6875rem] text-ink-400">@{admin?.login}</span>
          </span>
          <button
            onClick={logout}
            disabled={loggingOut}
            title="Chiqish"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-white hover:text-rose-600"
          >
            {loggingOut ? <Spinner size={14} /> : <Icon name="logout" size={16} />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminCtx.Provider value={{ admin, setAdmin, stats }}>
      <div className="flex min-h-screen bg-ink-50">
        {/* Desktop yon menyu */}
        <aside className="hidden w-[264px] shrink-0 border-r border-ink-150 lg:block">
          <div className="sticky top-0 h-screen">{sidebar}</div>
        </aside>

        {/* Mobil yon menyu */}
        <AnimatePresence>
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                className="absolute inset-0 bg-ink-950/40"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                className="absolute left-0 top-0 h-full w-[264px] shadow-2xl"
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {sidebar}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Yuqori qator */}
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-ink-150 bg-white/95 px-4 backdrop-blur md:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-ink-600 lg:hidden"
              aria-label="Menyu"
            >
              <Icon name="menu" size={18} />
            </button>

            <h1 className="truncate text-base font-semibold text-ink-900">{titleFor(pathname)}</h1>

            <div className="ml-auto flex items-center gap-2">
              {stats?.newCount > 0 && (
                <Link
                  href="/admin/requests"
                  className="hidden items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5
                             text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 sm:inline-flex"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </span>
                  {stats.newCount} yangi ariza
                </Link>
              )}
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 xl:p-8">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </AdminCtx.Provider>
  );
}
