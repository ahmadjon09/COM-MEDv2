// Express ilovasi: xavfsizlik, CORS, loglash, marshrutlar.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { env, corsOrigins, isProd } from './config/env.js';
import { logger } from './lib/logger.js';
import { apiLimiter, publicLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

import { authRouter } from './modules/auth/auth.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';
import { requestsRouter } from './modules/requests/requests.routes.js';
import { uploadRouter } from './modules/upload/upload.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';

export function createApp() {
  const app = express();

  // Cloudflare/hosting proxy orqasida ishlaymiz — haqiqiy IP olish uchun
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Xavfsizlik sarlavhalari. API JSON qaytargani uchun CSP shart emas.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // SSE (AI streaming) siqilmasligi kerak — aks holda javob bo'lak-bo'lak kelmaydi
  app.use(
    compression({
      filter: (req, res) => {
        if (req.path.startsWith('/api/ai/stream')) return false;
        return compression.filter(req, res);
      },
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        if (
          /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(
            origin
          )
        ) {
          return callback(null, true);
        }

        return callback(
          new Error(
            `CORS: ${origin} manziliga ruxsat yo‘q`
          )
        );
      },

      credentials: true,

      methods: [
        'GET',
        'POST',
        'PATCH',
        'PUT',
        'DELETE',
        'OPTIONS',
      ],

      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
      ],

      exposedHeaders: [
        'Content-Length',
        'Content-Range',
      ],

      maxAge: 86400,

      optionsSuccessStatus: 204,
    })
  );

  app.use(
    morgan(isProd ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
      skip: (req) => req.path === '/health',
    })
  );

  // Sog'liq tekshiruvi (hosting/Cloudflare uchun)
  app.get('/health', (_req, res) =>
    res.json({ ok: true, data: { status: 'up', env: env.NODE_ENV, time: new Date().toISOString() } })
  );
  const keepServerAlive = () => {
    if (!process.env.API_PUBLIC_URL) return;

    setInterval(async () => {
      try {
        await fetch(`${process.env.API_PUBLIC_URL}/health`);
        console.log('🔄 Alive');
      } catch (e) {
        console.log('Ping failed');
      }
    }, 10 * 60 * 1000);
  };

  keepServerAlive()
  // Ommaviy o'qish uchun yumshoqroq limit
  app.use('/api/products', publicLimiter, productsRouter);
  app.use('/api/categories', publicLimiter, categoriesRouter);
  app.use('/api/settings', publicLimiter, settingsRouter);

  // Qolgan endpointlar uchun umumiy limit
  app.use('/api/auth', apiLimiter, authRouter);
  app.use('/api/requests', apiLimiter, requestsRouter);
  app.use('/api/upload', apiLimiter, uploadRouter);
  app.use('/api/audit', apiLimiter, auditRouter);
  app.use('/api/ai', aiRouter); // o'z limiteri bor

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
