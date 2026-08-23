// Sayt sozlamalari moduli — bitta singleton yozuv (id = "main").
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { ah } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { cached } from '../../middleware/cache.js';
import { invalidate } from '../../lib/redis.js';
import { writeAudit } from '../../lib/audit.js';
import { serialize, clientIp } from '../../lib/utils.js';

export const settingsRouter = Router();

const phoneSchema = z.object({
  label: z.string().trim().max(60).default(''),
  value: z.string().trim().min(5).max(30), // E.164 formatda saqlaymiz: +998901234567
  isPrimary: z.boolean().default(false),
});

const socialSchema = z.object({
  type: z.enum(['telegram', 'instagram', 'facebook', 'youtube', 'whatsapp', 'other']),
  url: z.string().url(),
});

const settingsBody = z.object({
  siteNameUz: z.string().trim().max(100).optional(),
  siteNameRu: z.string().trim().max(100).optional(),
  siteNameUzCyrl: z.string().trim().max(100).optional(),

  taglineUz: z.string().trim().max(300).optional().nullable(),
  taglineRu: z.string().trim().max(300).optional().nullable(),
  taglineUzCyrl: z.string().trim().max(300).optional().nullable(),

  aboutUz: z.string().trim().max(10000).optional().nullable(),
  aboutRu: z.string().trim().max(10000).optional().nullable(),
  aboutUzCyrl: z.string().trim().max(10000).optional().nullable(),

  addressUz: z.string().trim().max(500).optional().nullable(),
  addressRu: z.string().trim().max(500).optional().nullable(),
  addressUzCyrl: z.string().trim().max(500).optional().nullable(),

  workHoursUz: z.string().trim().max(200).optional().nullable(),
  workHoursRu: z.string().trim().max(200).optional().nullable(),
  workHoursUzCyrl: z.string().trim().max(200).optional().nullable(),

  phones: z.array(phoneSchema).max(10).optional(),
  socials: z.array(socialSchema).max(10).optional(),
  emails: z.array(z.string().email()).max(5).optional(),

  telegramUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  youtubeUrl: z.string().url().optional().nullable(),
  mapEmbedUrl: z.string().url().optional().nullable(),

  metaTitleUz: z.string().trim().max(200).optional().nullable(),
  metaTitleRu: z.string().trim().max(200).optional().nullable(),
  metaTitleUzCyrl: z.string().trim().max(200).optional().nullable(),
  metaDescUz: z.string().trim().max(400).optional().nullable(),
  metaDescRu: z.string().trim().max(400).optional().nullable(),
  metaDescUzCyrl: z.string().trim().max(400).optional().nullable(),
  defaultOgImage: z.string().url().optional().nullable(),

  termsUz: z.string().max(50000).optional().nullable(),
  termsRu: z.string().max(50000).optional().nullable(),
  termsUzCyrl: z.string().max(50000).optional().nullable(),
  privacyUz: z.string().max(50000).optional().nullable(),
  privacyRu: z.string().max(50000).optional().nullable(),
  privacyUzCyrl: z.string().max(50000).optional().nullable(),
});

/** Sozlamalar yozuvini olish (bo'lmasa yaratadi) */
async function getOrCreateSettings() {
  let s = await prisma.siteSetting.findUnique({ where: { id: 'main' } });
  if (!s) s = await prisma.siteSetting.create({ data: { id: 'main' } });
  return s;
}

/** GET /api/settings — ommaviy */
settingsRouter.get(
  '/',
  cached('cache:settings'),
  ah(async (_req, res) => {
    const s = await getOrCreateSettings();
    res.json({ ok: true, data: serialize(s) });
  })
);

/** PATCH /api/settings — admin */
settingsRouter.patch(
  '/',
  requireAuth,
  validate({ body: settingsBody }),
  ah(async (req, res) => {
    const before = await getOrCreateSettings();
    const updated = await prisma.siteSetting.update({ where: { id: 'main' }, data: req.body });

    await invalidate('settings');
    await writeAudit({
      admin: req.admin, action: 'UPDATE', entity: 'SiteSetting', entityId: 'main',
      before: serialize(before), after: serialize(updated), ip: clientIp(req),
    });

    res.json({ ok: true, data: serialize(updated) });
  })
);
