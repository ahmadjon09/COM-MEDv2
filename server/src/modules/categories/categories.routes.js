// Kategoriyalar moduli: ommaviy o'qish (keshlangan) + admin CRUD (kesh invalidatsiyasi bilan).
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ah, notFound, badRequest } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { cached } from '../../middleware/cache.js';
import { invalidate } from '../../lib/redis.js';
import { writeAudit } from '../../lib/audit.js';
import { uniqueSlug, serialize, clientIp } from '../../lib/utils.js';

export const categoriesRouter = Router();

// 3 tilli matn maydonlari uchun umumiy sxema bo'laklari
const trText = (min = 2, max = 200) => ({
  uz: z.string().trim().min(min).max(max),
  ru: z.string().trim().min(min).max(max),
  uzCyrl: z.string().trim().min(min).max(max),
});

const categoryBody = z.object({
  nameUz: trText().uz,
  nameRu: trText().ru,
  nameUzCyrl: trText().uzCyrl,
  descUz: z.string().trim().max(5000).optional().nullable(),
  descRu: z.string().trim().max(5000).optional().nullable(),
  descUzCyrl: z.string().trim().max(5000).optional().nullable(),
  metaTitleUz: z.string().trim().max(200).optional().nullable(),
  metaTitleRu: z.string().trim().max(200).optional().nullable(),
  metaTitleUzCyrl: z.string().trim().max(200).optional().nullable(),
  metaDescUz: z.string().trim().max(400).optional().nullable(),
  metaDescRu: z.string().trim().max(400).optional().nullable(),
  metaDescUzCyrl: z.string().trim().max(400).optional().nullable(),
  iconKey: z.string().trim().max(40).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.coerce.boolean().default(true),
  slug: z.string().trim().max(80).optional(),
});

// ---------------- OMMAVIY ----------------

/** GET /api/categories — faol kategoriyalar + mahsulotlar soni */
categoriesRouter.get(
  '/',
  cached('cache:categories'),
  ah(async (_req, res) => {
    const items = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    res.json({
      ok: true,
      data: items.map((c) => ({ ...serialize(c), productCount: c._count.products, _count: undefined })),
    });
  })
);

/** GET /api/categories/:slug — bitta kategoriya */
categoriesRouter.get(
  '/:slug',
  cached('cache:categories'),
  ah(async (req, res) => {
    const item = await prisma.category.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    if (!item) throw notFound('Kategoriya topilmadi');
    res.json({ ok: true, data: { ...serialize(item), productCount: item._count.products, _count: undefined } });
  })
);

// ---------------- ADMIN ----------------

/** GET /api/categories/admin/all — nofaollari bilan birga */
categoriesRouter.get(
  '/admin/all',
  requireAuth,
  ah(async (_req, res) => {
    const items = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { products: true } } },
    });
    res.json({
      ok: true,
      data: items.map((c) => ({ ...serialize(c), productCount: c._count.products, _count: undefined })),
    });
  })
);

/** POST /api/categories */
categoriesRouter.post(
  '/',
  requireAuth,
  validate({ body: categoryBody }),
  ah(async (req, res) => {
    const slug = await uniqueSlug('category', req.body.slug || req.body.nameUz);
    const created = await prisma.category.create({ data: { ...req.body, slug } });

    await invalidate('categories');
    await writeAudit({
      admin: req.admin, action: 'CREATE', entity: 'Category', entityId: created.id,
      after: serialize(created), ip: clientIp(req),
    });

    res.status(201).json({ ok: true, data: serialize(created) });
  })
);

/** PATCH /api/categories/:id */
categoriesRouter.patch(
  '/:id',
  requireAuth,
  validate({ body: categoryBody.partial() }),
  ah(async (req, res) => {
    const before = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!before) throw notFound('Kategoriya topilmadi');

    const data = { ...req.body };
    if (data.slug || data.nameUz) {
      data.slug = await uniqueSlug('category', data.slug || data.nameUz, before.id);
    }

    const updated = await prisma.category.update({ where: { id: before.id }, data });

    await invalidate('categories');
    await writeAudit({
      admin: req.admin, action: 'UPDATE', entity: 'Category', entityId: updated.id,
      before: serialize(before), after: serialize(updated), ip: clientIp(req),
    });

    res.json({ ok: true, data: serialize(updated) });
  })
);

/** DELETE /api/categories/:id — ichida mahsulot bo'lsa o'chirilmaydi */
categoriesRouter.delete(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const cat = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { products: true } } },
    });
    if (!cat) throw notFound('Kategoriya topilmadi');
    if (cat._count.products > 0) {
      throw badRequest(
        `Bu kategoriyada ${cat._count.products} ta mahsulot bor. Avval ularni oʻchiring yoki boshqa kategoriyaga koʻchiring.`
      );
    }

    await prisma.category.delete({ where: { id: cat.id } });
    await invalidate('categories');
    await writeAudit({
      admin: req.admin, action: 'DELETE', entity: 'Category', entityId: cat.id,
      before: serialize(cat), ip: clientIp(req),
    });

    res.json({ ok: true, data: { message: 'Kategoriya oʻchirildi' } });
  })
);
