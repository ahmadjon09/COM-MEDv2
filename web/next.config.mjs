import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM'da __dirname yo'q — o'zimiz hisoblaymiz
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'src');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    // imgbb'dan keladigan rasmlar uchun ruxsat
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'i.ibb.co.com' },
      { protocol: 'https', hostname: 'image.ibb.co' },
      { protocol: 'https', hostname: 'ibb.co' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 kun
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920, 2100],
  },

  experimental: {
    optimizePackageImports: ['framer-motion'],
  },

  // Dev rejimida boshqa domendan (masalan onlayn preview) kelgan so'rovlarga ruxsat.
  // Production'ga ta'sir qilmaydi.
  allowedDevOrigins: ['*.e2b.app', 'localhost', '127.0.0.1'],

  /**
   * "@/..." alias'i.
   *
   * Odatda buni jsconfig.json belgilaydi. Lekin agar shu fayl yo'qolsa, buzilsa
   * yoki loyihada tsconfig.json paydo bo'lsa (Next uni ustun qo'yadi) — barcha
   * "@/components/...", "@/i18n" importlari "Module not found" beradi.
   * Shuning uchun alias shu yerda ham qattiq belgilangan: ikkala holatda ham ishlaydi.
   */
  webpack: (config) => {
    config.resolve.alias = { ...(config.resolve.alias || {}), '@': SRC };
    return config;
  },

  // Turbopack ishlatilsa (next dev --turbopack) — u uchun alohida
  turbopack: {
    root: __dirname,
    resolveAlias: { '@/*': './src/*' },
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Statik assetlar — Cloudflare va brauzer uzoq keshlasin
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Admin panel hech qachon indekslanmasin
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },

  async rewrites() {
    // /api/* so'rovlarini backendga uzatuvchi proxy.
    //
    // Lokal ishlab chiqishda NEXT_PUBLIC_API_URL bo'sh qoldirilsa, brauzer nisbiy
    // manzilga (/api/...) murojaat qiladi — va u Next serveriga tushib 404 beradi.
    // Shuning uchun development'da target avtomatik http://localhost:4000 bo'ladi.
    //
    // Production'da odatda NEXT_PUBLIC_API_URL=https://api.domen.uz beriladi va
    // proxy umuman ishlatilmaydi.
    const target =
      process.env.API_PROXY_TARGET ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '');

    if (!target) return [];
    // /api/og — Next.js ning o'z route'i, uni proxy qilmaymiz
    return [{ source: '/api/:path((?!og).*)', destination: `${target}/api/:path` }];
  },

  async redirects() {
    return [
      { source: '/', destination: '/uz', permanent: false },
      // Eski struktura (bitta umumiy katalog) — yangi bo'limlarga yo'naltiramiz
      { source: '/:locale(uz|ru|uz-cyrl)/catalog', destination: '/:locale/parts', permanent: true },
      { source: '/:locale(uz|ru|uz-cyrl)/catalog/:cat', destination: '/:locale/parts?category=:cat', permanent: true },
      { source: '/:locale(uz|ru|uz-cyrl)/product/:slug', destination: '/:locale/parts/:slug', permanent: true },
      // commedical.uz ning eski manzillari
      { source: '/products', destination: '/uz/parts', permanent: true },
      { source: '/services', destination: '/uz/services', permanent: true },
      { source: '/contact', destination: '/uz/contact', permanent: true },
      { source: '/faq', destination: '/uz', permanent: true },
      { source: '/:locale(uz|ru|uz-cyrl)/products', destination: '/:locale/parts', permanent: true },
      { source: '/:locale(uz|ru|uz-cyrl)/faq', destination: '/:locale', permanent: true },
    ];
  },
};

export default nextConfig;
