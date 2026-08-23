// Markazlashgan logger (pino). Development'da chiroyli chiqadi, production'da JSON.
import pino from 'pino';
import { isProd } from '../config/env.js';

export const logger = pino(
  isProd
    ? { level: 'info' }
    : {
        level: 'debug',
        transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
      }
);
