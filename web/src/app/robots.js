// robots.txt avtomatik generatsiyasi.
import { SITE_URL } from '@/lib/seo';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/og'],
        disallow: ['/admin', '/admin/', '/api/', '/*?q=*'],
      },
      // Yandex O'zbekistonda muhim — alohida ruxsat
      {
        userAgent: 'Yandex',
        allow: ['/', '/api/og'],
        disallow: ['/admin', '/admin/', '/api/', '/*?q=*'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/api/og'],
        disallow: ['/admin', '/admin/', '/api/', '/*?q=*'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/', '/equipment/', '/api/og'],
        disallow: ['/admin', '/admin/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
