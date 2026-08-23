// robots.txt avtomatik generatsiyasi.
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
      // Yandex O'zbekistonda muhim — alohida ruxsat
      { userAgent: 'Yandex', allow: '/', disallow: ['/admin', '/api/'], crawlDelay: 1 },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/admin', '/api/'] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
