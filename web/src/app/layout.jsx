// Ildiz layout — HTML skeleti. Til-ga bog'liq qismlar [locale]/layout.jsx ichida.
import '@/styles/globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'COM MEDICAL SERVIS', template: '%s | COM MEDICAL SERVIS' },
  applicationName: 'COM MEDICAL SERVIS',
  formatDetection: { telephone: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },
};

export const viewport = {
  themeColor: '#1e90ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return children;
}
