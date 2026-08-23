// Server kirish nuqtasi: ishga tushirish va "graceful shutdown".
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';

const app = createApp();

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`🚀 API ishga tushdi: http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
});

// Kutilmagan xatolar — logga yozamiz, jarayonni darhol o'ldirmaymiz
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Ushlanmagan promise rejection'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err: err.message, stack: err.stack }, 'Ushlanmagan istisno — server toʻxtatilmoqda');
  shutdown('uncaughtException', 1);
});

async function shutdown(signal, code = 0) {
  logger.info({ signal }, 'Server toʻxtatilmoqda...');
  server.close(async () => {
    try {
      await prisma.$disconnect();
      if (redis) await redis.quit();
    } catch { /* e'tiborsiz */ }
    process.exit(code);
  });
  // 10 soniyada yopilmasa — majburan
  setTimeout(() => process.exit(code || 1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
