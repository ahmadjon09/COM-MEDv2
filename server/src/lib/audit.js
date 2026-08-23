// Audit log yozish yordamchisi — kim, qachon, nimani o'zgartirdi.
import { prisma } from './prisma.js';
import { logger } from './logger.js';

/**
 * @param {object} p
 * @param {object} [p.admin] req.admin
 * @param {string} p.action CREATE | UPDATE | DELETE | LOGIN | LOGOUT
 * @param {string} p.entity Product | Category | SiteSetting | Request | Admin
 */
export async function writeAudit({ admin, action, entity, entityId, before, after, ip }) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: admin?.id ?? null,
        adminLogin: admin?.login ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        before: before ?? undefined,
        after: after ?? undefined,
        ip: ip ?? null,
      },
    });
  } catch (e) {
    // Audit yozilmasa ham asosiy amal buzilmasligi kerak
    logger.warn({ err: e.message }, 'Audit log yozilmadi');
  }
}
