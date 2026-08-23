// Global 404 sahifasi
import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="uz">
      <body className="grid min-h-screen place-items-center bg-white p-6 text-center">
        <div>
          <p className="text-6xl font-bold text-brand-500">404</p>
          <h1 className="mt-4 text-2xl font-semibold text-ink-900">Sahifa topilmadi</h1>
          <p className="mt-2 text-ink-500">Siz qidirgan sahifa oʻchirilgan yoki manzil notoʻgʻri.</p>
          <Link
            href="/uz"
            className="mt-7 inline-flex h-12 items-center rounded-xl bg-brand-500 px-6 font-semibold text-white
                       transition-transform hover:scale-[1.02]"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </body>
    </html>
  );
}
