// Ildiz layout — HTML skeleti. Til-ga bog'liq qismlar [locale]/layout.jsx ichida.
import '@/styles/globals.css';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://commedical.uz').replace(/\/$/, '');

const yandexCodes = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      'a27bb787e06dfacb',
      'efa9a19ecb4d3e1c',
    ].filter(Boolean)
  )
);

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'COM MEDICAL SERVIS', template: '%s | COM MEDICAL SERVIS' },
  applicationName: 'COM MEDICAL SERVIS',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: true, email: true, address: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    yandex: yandexCodes,
  },
};

export const viewport = {
  themeColor: '#1e90ff',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return children;
}
