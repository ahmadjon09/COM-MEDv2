// JWT himoyasi — faqat admin panel endpointlari uchun.
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { unauthorized, forbidden, ah } from '../lib/errors.js';

/** Authorization: Bearer <token> sarlavhasini tekshiradi */
export const requireAuth = ah(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.access_token;

  if (!token) throw unauthorized('Token topilmadi');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (e) {
    throw unauthorized(e.name === 'TokenExpiredError' ? 'Token muddati tugagan' : 'Token yaroqsiz');
  }
  if (payload.typ !== 'access') throw unauthorized('Token turi noto\'g\'ri');

  const admin = await prisma.admin.findUnique({
    where: { id: payload.sub },
    select: { id: true, login: true, fullName: true, role: true, isActive: true },
  });
  if (!admin || !admin.isActive) throw unauthorized('Foydalanuvchi bloklangan yoki topilmadi');

  req.admin = admin;
  next();
});

/** Rol tekshiruvi (kelajakda ko'p rolli tizim uchun) */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) return next(forbidden());
  next();
};
