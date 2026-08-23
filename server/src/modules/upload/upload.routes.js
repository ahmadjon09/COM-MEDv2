// Rasm yuklash moduli — fayl imgbb.com'ga uzatiladi, serverda saqlanmaydi.
import { Router } from 'express';
import multer from 'multer';
import { uploadToImgbb } from '../../lib/imgbb.js';
import { ah, badRequest } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { writeAudit } from '../../lib/audit.js';
import { clientIp } from '../../lib/utils.js';

export const uploadRouter = Router();

// Faylni xotirada ushlaymiz (diskka yozmaymiz), maksimal 8 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.mimetype);
    cb(ok ? null : badRequest('Faqat rasm fayllari (jpg, png, webp, gif, avif) qabul qilinadi'), ok);
  },
});

/** POST /api/upload — bitta rasm */
uploadRouter.post(
  '/',
  requireAuth,
  upload.single('image'),
  ah(async (req, res) => {
    if (!req.file) throw badRequest('Rasm fayli yuborilmadi (maydon nomi: image)');
    const result = await uploadToImgbb(req.file.buffer, req.file.originalname);
    await writeAudit({
      admin: req.admin, action: 'CREATE', entity: 'Image', entityId: result.url, ip: clientIp(req),
    });
    res.status(201).json({ ok: true, data: result });
  })
);

/** POST /api/upload/multiple — bir nechta rasm (maks 5) */
uploadRouter.post(
  '/multiple',
  requireAuth,
  upload.array('images', 5),
  ah(async (req, res) => {
    if (!req.files?.length) throw badRequest('Rasmlar yuborilmadi (maydon nomi: images)');
    // Ketma-ket emas, parallel yuklaymiz — tezroq
    const results = await Promise.all(req.files.map((f) => uploadToImgbb(f.buffer, f.originalname)));
    res.status(201).json({ ok: true, data: results });
  })
);
