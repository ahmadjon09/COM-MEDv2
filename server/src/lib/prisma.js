// Prisma klientining yagona nusxasi (singleton).
// Dev rejimida --watch qayta ishga tushganda ortiqcha ulanish ochilmasligi uchun global'da saqlaymiz.
import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['error', 'warn'],
  });

if (!isProd) globalForPrisma.__prisma = prisma;
