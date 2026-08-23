// Arizalar moduli: forma qabul qilish (rate-limit bilan), Telegramga yuborish, admin ro'yxati.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ah, notFound } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { requestFormLimiter } from '../../middleware/rateLimit.js';
import { sendTelegramMessage, buildRequestMessage } from '../../lib/telegram.js';
import { writeAudit } from '../../lib/audit.js';
import { serialize, clientIp } from '../../lib/utils.js';
import { logger } from '../../lib/logger.js';

export const requestsRouter = Router();

const createBody = z.object({
  name: z.string().trim().min(2, 'Ism kamida 2 belgi').max(80),
  // react-phone-number-input E.164 formatda beradi: +998901234567
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,15}$/, 'Telefon raqam formati notoʻgʻri'),
  message: z.string().trim().max(2000).optional().nullable(),
  productId: z.string().trim().optional().nullable(),
  productName: z.string().trim().max(200).optional().nullable(),
  locale: z.enum(['uz', 'ru', 'uz-Cyrl']).default('uz'),
  // Sodda "honeypot" — bot to'ldiradigan yashirin maydon
  website: z.string().max(0).optional(),
  source: z.enum(['site', 'telegram-fallback']).default('site'),
});

/** POST /api/requests — ommaviy forma */
requestsRouter.post(
  '/',
  requestFormLimiter,
  validate({ body: createBody }),
  ah(async (req, res) => {
    const { name, phone, message, productId, locale, source } = req.body;

    // Honeypot to'ldirilgan bo'lsa — botga muvaffaqiyat qaytaramiz, lekin hech narsa qilmaymiz
    if (req.body.website) {
      return res.status(201).json({ ok: true, data: { id: 'ok' } });
    }

    // Mahsulot nomini bazadan olamiz (mijoz yuborgan nomga ishonmaymiz)
    let productName = req.body.productName ?? null;
    let validProductId = null;
    if (productId) {
      const p = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, nameUz: true, nameRu: true, nameUzCyrl: true },
      });
      if (p) {
        validProductId = p.id;
        productName = locale === 'ru' ? p.nameRu : locale === 'uz-Cyrl' ? p.nameUzCyrl : p.nameUz;
      }
    }

    const created = await prisma.request.create({
      data: {
        name, phone, message: message || null, locale, source,
        productId: validProductId, productName,
        ip: clientIp(req), userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
      },
    });

    // Telegramga yuborish — javobni kutamiz, lekin xato bo'lsa ariza baribir saqlangan
    const tg = await sendTelegramMessage(buildRequestMessage(created));
    await prisma.request.update({
      where: { id: created.id },
      data: { telegramSent: tg.ok, telegramError: tg.ok ? null : String(tg.error).slice(0, 500) },
    });

    if (!tg.ok) logger.warn({ id: created.id, err: tg.error }, 'Ariza Telegramga yuborilmadi (DB\'da saqlandi)');

    res.status(201).json({
      ok: true,
      data: { id: created.id, telegramSent: tg.ok },
      meta: { message: 'Arizangiz qabul qilindi. Tez orada bogʻlanamiz.' },
    });
  })
);

// ---------------- ADMIN ----------------

const listQuery = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'DONE', 'SPAM']).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** GET /api/requests — admin ro'yxati */
requestsRouter.get(
  '/',
  requireAuth,
  validate({ query: listQuery }),
  ah(async (req, res) => {
    const { status, q, page, limit } = req.validatedQuery;
    const where = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { productName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total, counts] = await Promise.all([
      prisma.request.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.request.count({ where }),
      prisma.request.groupBy({ by: ['status'], _count: true }),
    ]);

    res.json({
      ok: true,
      data: serialize(items),
      meta: {
        page, limit, total, pages: Math.ceil(total / limit) || 1,
        counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
      },
    });
  })
);

/** PATCH /api/requests/:id — holatni o'zgartirish / izoh qo'shish */
requestsRouter.patch(
  '/:id',
  requireAuth,
  validate({
    body: z.object({
      status: z.enum(['NEW', 'IN_PROGRESS', 'DONE', 'SPAM']).optional(),
      adminNote: z.string().trim().max(2000).optional().nullable(),
    }),
  }),
  ah(async (req, res) => {
    const before = await prisma.request.findUnique({ where: { id: req.params.id } });
    if (!before) throw notFound('Ariza topilmadi');

    const updated = await prisma.request.update({ where: { id: before.id }, data: req.body });

    await writeAudit({
      admin: req.admin, action: 'UPDATE', entity: 'Request', entityId: updated.id,
      before: { status: before.status }, after: { status: updated.status }, ip: clientIp(req),
    });

    res.json({ ok: true, data: serialize(updated) });
  })
);

/** DELETE /api/requests/:id */
requestsRouter.delete(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const before = await prisma.request.findUnique({ where: { id: req.params.id } });
    if (!before) throw notFound('Ariza topilmadi');
    await prisma.request.delete({ where: { id: before.id } });
    await writeAudit({
      admin: req.admin, action: 'DELETE', entity: 'Request', entityId: before.id,
      before: serialize(before), ip: clientIp(req),
    });
    res.json({ ok: true, data: { message: 'Ariza oʻchirildi' } });
  })
);

/** GET /api/requests/stats/summary — dashboard raqamlari */
requestsRouter.get(
  '/stats/summary',
  requireAuth,
  ah(async (_req, res) => {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [total, newCount, week, products, categories, failed] = await Promise.all([
      prisma.request.count(),
      prisma.request.count({ where: { status: 'NEW' } }),
      prisma.request.count({ where: { createdAt: { gte: since } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.request.count({ where: { telegramSent: false } }),
    ]);
    res.json({ ok: true, data: { total, newCount, week, products, categories, telegramFailed: failed } });
  })
);
