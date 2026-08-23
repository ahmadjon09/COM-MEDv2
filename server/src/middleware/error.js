// Global xatolik ishlovchisi va 404.
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { isProd } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    error: { code: 'NOT_FOUND', message: `Yo'nalish topilmadi: ${req.method} ${req.originalUrl}` },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Prisma xatolarini foydalanuvchiga tushunarli holga keltiramiz
  if (err?.code === 'P2002') {
    err = new AppError(409, `Bunday yozuv allaqachon mavjud (${err.meta?.target ?? 'unique'})`, 'DUPLICATE');
  } else if (err?.code === 'P2025') {
    err = new AppError(404, 'Yozuv topilmadi', 'NOT_FOUND');
  } else if (err?.code === 'P2003') {
    err = new AppError(409, 'Bu yozuv boshqa maʼlumotlarga bogʻlangan, avval ularni oʻchiring', 'FK_CONSTRAINT');
  } else if (err?.type === 'entity.too.large') {
    err = new AppError(413, 'Fayl yoki soʻrov hajmi juda katta', 'PAYLOAD_TOO_LARGE');
  }

  const status = err.status || 500;

  if (status >= 500) {
    logger.error({ err: { message: err.message, stack: err.stack }, url: req.originalUrl }, 'Server xatosi');
  } else {
    logger.warn({ msg: err.message, url: req.originalUrl }, 'Mijoz xatosi');
  }

  res.status(status).json({
    ok: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status >= 500 && isProd ? 'Serverda kutilmagan xatolik yuz berdi' : err.message,
      details: err.details,
    },
  });
}
