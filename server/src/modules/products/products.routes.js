// Mahsulotlar/zapchastlar/xizmatlar moduli.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ah, notFound } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { cached } from '../../middleware/cache.js';
import { invalidate } from '../../lib/redis.js';
import { writeAudit } from '../../lib/audit.js';
import { uniqueSlug, serialize, clientIp } from '../../lib/utils.js';

export const productsRouter = Router();

const listQuery = z.object({
  category: z.string().trim().optional(),      // kategoriya slug
  kind: z.enum(['PART', 'SERVICE']).optional(),
  q: z.string().trim().max(100).optional(),    // qidiruv
  featured: z.coerce.boolean().optional(),
  brand: z.string().trim().max(60).optional(),        // brend bo'yicha filtr
  country: z.string().trim().max(4).optional(),       // ishlab chiqarilgan davlat kodi
  inStock: z.coerce.boolean().optional(),
  partType: z.enum(['SENSOR', 'SCREEN', 'POWER', 'CABLE', 'MECHANICAL', 'CONSUMABLE', 'OTHER']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
  sort: z.enum(['new', 'old', 'price_asc', 'price_desc', 'popular', 'manual']).default('manual'),
});

const productBody = z.object({
  categoryId: z.string().trim().min(1, 'Kategoriya tanlanmagan'),
  kind: z.enum(['PART', 'SERVICE']).default('PART'),

  nameUz: z.string().trim().min(2).max(200),
  nameRu: z.string().trim().min(2).max(200),
  nameUzCyrl: z.string().trim().min(2).max(200),

  shortUz: z.string().trim().max(500).optional().nullable(),
  shortRu: z.string().trim().max(500).optional().nullable(),
  shortUzCyrl: z.string().trim().max(500).optional().nullable(),

  descUz: z.string().trim().max(20000).optional().nullable(),
  descRu: z.string().trim().max(20000).optional().nullable(),
  descUzCyrl: z.string().trim().max(20000).optional().nullable(),

  price: z.coerce.number().min(0).max(1e11).optional().nullable(),
  currency: z.enum(['UZS', 'USD']).default('UZS'),
  priceNote: z.string().trim().max(100).optional().nullable(),

  // --- Zapchast maydonlari ---
  brand: z.string().trim().max(100).optional().nullable(),
  model: z.string().trim().max(100).optional().nullable(),
  sku: z.string().trim().max(100).optional().nullable(),
  inStock: z.coerce.boolean().default(true),
  warranty: z.string().trim().max(100).optional().nullable(),
  originCountry: z.string().trim().max(4).optional().nullable(),
  manufacturer: z.string().trim().max(120).optional().nullable(),
  condition: z.enum(['NEW', 'REFURBISHED']).default('NEW'),
  partType: z.enum(['SENSOR', 'SCREEN', 'POWER', 'CABLE', 'MECHANICAL', 'CONSUMABLE', 'OTHER']).default('OTHER'),
  packQty: z.coerce.number().int().min(1).max(10000).optional().nullable(),
  compatibility: z.array(z.string().trim().max(120)).max(40).default([]),
  // Texnik xarakteristikalar jadvali
  specs: z
    .array(
      z.object({
        labelUz: z.string().trim().min(1).max(80),
        labelRu: z.string().trim().min(1).max(80),
        labelUzCyrl: z.string().trim().min(1).max(80),
        value: z.string().trim().min(1).max(200),
      })
    )
    .max(40)
    .default([]),

  // --- Xizmat maydonlari ---
  includesUz: z.array(z.string().trim().max(300)).max(30).default([]),
  includesRu: z.array(z.string().trim().max(300)).max(30).default([]),
  includesUzCyrl: z.array(z.string().trim().max(300)).max(30).default([]),
  leadTimeUz: z.string().trim().max(120).optional().nullable(),
  leadTimeRu: z.string().trim().max(120).optional().nullable(),
  leadTimeUzCyrl: z.string().trim().max(120).optional().nullable(),

  images: z.array(z.string().url()).max(10).default([]),
  ogImage: z.string().url().optional().nullable(),

  metaTitleUz: z.string().trim().max(200).optional().nullable(),
  metaTitleRu: z.string().trim().max(200).optional().nullable(),
  metaTitleUzCyrl: z.string().trim().max(200).optional().nullable(),
  metaDescUz: z.string().trim().max(400).optional().nullable(),
  metaDescRu: z.string().trim().max(400).optional().nullable(),
  metaDescUzCyrl: z.string().trim().max(400).optional().nullable(),

  keywords: z.array(z.string().trim().max(60)).max(30).default([]),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  slug: z.string().trim().max(80).optional(),
});

// Ro'yxat uchun yengil tanlov (karta ko'rsatish uchun yetarli maydonlar)
const listSelect = {
  id: true, slug: true, kind: true,
  nameUz: true, nameRu: true, nameUzCyrl: true,
  shortUz: true, shortRu: true, shortUzCyrl: true,
  price: true, currency: true, priceNote: true,
  brand: true, model: true, sku: true, inStock: true, images: true,
  originCountry: true, manufacturer: true, condition: true, partType: true, warranty: true,
  includesUz: true, includesRu: true, includesUzCyrl: true,
  leadTimeUz: true, leadTimeRu: true, leadTimeUzCyrl: true,
  isFeatured: true, createdAt: true,
  category: { select: { slug: true, nameUz: true, nameRu: true, nameUzCyrl: true, iconKey: true } },
};

function orderBy(sort) {
  switch (sort) {
    case 'new': return [{ createdAt: 'desc' }];
    case 'old': return [{ createdAt: 'asc' }];
    case 'price_asc': return [{ price: 'asc' }];
    case 'price_desc': return [{ price: 'desc' }];
    case 'popular': return [{ views: 'desc' }];
    default: return [{ sortOrder: 'asc' }, { createdAt: 'desc' }];
  }
}

// ---------------- OMMAVIY ----------------

/** GET /api/products — filtr, qidiruv, sahifalash */
productsRouter.get(
  '/',
  cached('cache:products'),
  validate({ query: listQuery }),
  ah(async (req, res) => {
    const { category, kind, q, featured, brand, country, inStock, page, limit, sort } = req.validatedQuery;

    const where = { isActive: true };
    if (category) where.category = { slug: category, isActive: true };
    if (kind) where.kind = kind;
    if (featured !== undefined) where.isFeatured = featured;
    if (brand) where.brand = { equals: brand, mode: 'insensitive' };
    if (country) where.originCountry = country.toUpperCase();
    if (inStock !== undefined) where.inStock = inStock;
    if (req.validatedQuery.partType) where.partType = req.validatedQuery.partType;
    if (q) {
      // Qidiruv 3 tilda + brend/model/kalit so'zlar bo'yicha
      where.OR = [
        { nameUz: { contains: q, mode: 'insensitive' } },
        { nameRu: { contains: q, mode: 'insensitive' } },
        { nameUzCyrl: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { keywords: { has: q.toLowerCase() } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where, select: listSelect, orderBy: orderBy(sort),
        skip: (page - 1) * limit, take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      ok: true,
      data: serialize(items),
      meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  })
);

/** GET /api/products/:slug — to'liq maʼlumot + o'xshash mahsulotlar */
productsRouter.get(
  '/:slug',
  cached('cache:products'),
  ah(async (req, res) => {
    const item = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: { category: true },
    });
    if (!item) throw notFound('Mahsulot topilmadi');

    const related = await prisma.product.findMany({
      where: { categoryId: item.categoryId, isActive: true, NOT: { id: item.id } },
      select: listSelect,
      take: 4,
      orderBy: [{ isFeatured: 'desc' }, { views: 'desc' }],
    });

    // Ko'rishlar sonini fon rejimida oshiramiz (javobni kutib turmaydi)
    prisma.product.update({ where: { id: item.id }, data: { views: { increment: 1 } } }).catch(() => {});

    res.json({ ok: true, data: { ...serialize(item), related: serialize(related) } });
  })
);

/** GET /api/products/meta/filters — katalog filtrlari uchun mavjud brend va davlatlar */
productsRouter.get(
  '/meta/filters',
  cached('cache:products', 900),
  ah(async (_req, res) => {
    const [brands, countries, types] = await Promise.all([
      prisma.product.groupBy({
        by: ['brand'],
        where: { isActive: true, kind: 'PART', brand: { not: null } },
        _count: true,
        orderBy: { _count: { brand: 'desc' } },
      }),
      prisma.product.groupBy({
        by: ['originCountry'],
        where: { isActive: true, kind: 'PART', originCountry: { not: null } },
        _count: true,
      }),
      prisma.product.groupBy({
        by: ['partType'],
        where: { isActive: true, kind: 'PART' },
        _count: true,
      }),
    ]);
    res.json({
      ok: true,
      data: {
        brands: brands.map((b) => ({ value: b.brand, count: b._count })),
        countries: countries.map((c) => ({ value: c.originCountry, count: c._count })),
        types: types.map((t) => ({ value: t.partType, count: t._count })),
      },
    });
  })
);

/** GET /api/products/meta/slugs — sitemap uchun barcha sluglar */
productsRouter.get(
  '/meta/slugs',
  cached('cache:sitemap', 3600),
  ah(async (_req, res) => {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, kind: true, updatedAt: true } }),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
    res.json({ ok: true, data: { products, categories } });
  })
);

// ---------------- ADMIN ----------------

/** GET /api/products/admin/all */
productsRouter.get(
  '/admin/all',
  requireAuth,
  validate({ query: listQuery.extend({ limit: z.coerce.number().int().min(1).max(200).default(50) }) }),
  ah(async (req, res) => {
    const { category, kind, q, page, limit, sort } = req.validatedQuery;
    const where = {};
    if (category) where.category = { slug: category };
    if (kind) where.kind = kind;
    if (q) {
      where.OR = [
        { nameUz: { contains: q, mode: 'insensitive' } },
        { nameRu: { contains: q, mode: 'insensitive' } },
        { nameUzCyrl: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy: orderBy(sort), skip: (page - 1) * limit, take: limit,
        include: { category: { select: { id: true, slug: true, nameUz: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ ok: true, data: serialize(items), meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
  })
);

/** GET /api/products/admin/:id */
productsRouter.get(
  '/admin/id/:id',
  requireAuth,
  ah(async (req, res) => {
    const item = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!item) throw notFound('Mahsulot topilmadi');
    res.json({ ok: true, data: serialize(item) });
  })
);

/** POST /api/products */
productsRouter.post(
  '/',
  requireAuth,
  validate({ body: productBody }),
  ah(async (req, res) => {
    const slug = await uniqueSlug('product', req.body.slug || req.body.nameUz);
    const data = { ...req.body, slug, keywords: (req.body.keywords || []).map((k) => k.toLowerCase()) };

    const created = await prisma.product.create({ data, include: { category: true } });

    await invalidate('products');
    await writeAudit({
      admin: req.admin, action: 'CREATE', entity: 'Product', entityId: created.id,
      after: serialize(created), ip: clientIp(req),
    });

    res.status(201).json({ ok: true, data: serialize(created) });
  })
);

/** PATCH /api/products/:id */
productsRouter.patch(
  '/:id',
  requireAuth,
  validate({ body: productBody.partial() }),
  ah(async (req, res) => {
    const before = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!before) throw notFound('Mahsulot topilmadi');

    const data = { ...req.body };
    if (data.keywords) data.keywords = data.keywords.map((k) => k.toLowerCase());
    if (data.slug || data.nameUz) {
      data.slug = await uniqueSlug('product', data.slug || data.nameUz, before.id);
    }

    const updated = await prisma.product.update({
      where: { id: before.id }, data, include: { category: true },
    });

    await invalidate('products');
    await writeAudit({
      admin: req.admin, action: 'UPDATE', entity: 'Product', entityId: updated.id,
      before: serialize(before), after: serialize(updated), ip: clientIp(req),
    });

    res.json({ ok: true, data: serialize(updated) });
  })
);

/** DELETE /api/products/:id */
productsRouter.delete(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const before = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!before) throw notFound('Mahsulot topilmadi');

    await prisma.product.delete({ where: { id: before.id } });

    await invalidate('products');
    await writeAudit({
      admin: req.admin, action: 'DELETE', entity: 'Product', entityId: before.id,
      before: serialize(before), ip: clientIp(req),
    });

    res.json({ ok: true, data: { message: 'Mahsulot oʻchirildi' } });
  })
);
