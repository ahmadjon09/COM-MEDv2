// Admin panel layouti — ommaviy saytdan mustaqil (o'z html/body'si bilan).
import '@/styles/globals.css';
import AdminShell from '@/components/admin/AdminShell';
import { ToastProvider } from '@/components/ui/Toast';
import { sans, mono } from '@/lib/fonts';

export const metadata = {
  title: 'Boshqaruv paneli — COM MEDICAL SERVIS',
  robots: { index: false, follow: false, nocache: true },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b2a4f' };

export default function AdminLayout({ children }) {
  return (
    <html lang="uz" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink-50">
        <ToastProvider>
          <AdminShell>{children}</AdminShell>
        </ToastProvider>
      </body>
    </html>
  );
}
