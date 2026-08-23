// Audit log ro'yxati — faqat admin ko'radi.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ah } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { serialize } from '../../lib/utils.js';

export const auditRouter = Router();

const q = z.object({
  entity: z.string().trim().max(40).optional(),
  action: z.string().trim().max(20).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** GET /api/audit */
auditRouter.get(
  '/',
  requireAuth,
  validate({ query: q }),
  ah(async (req, res) => {
    const { entity, action, page, limit } = req.validatedQuery;
    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        select: {
          id: true, action: true, entity: true, entityId: true,
          adminLogin: true, ip: true, createdAt: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ ok: true, data: serialize(items), meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
  })
);

/** GET /api/audit/:id — bitta yozuvning before/after tafsilotlari */
auditRouter.get(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const item = await prisma.auditLog.findUnique({ where: { id: req.params.id } });
    res.json({ ok: true, data: item ? serialize(item) : null });
  })
);
