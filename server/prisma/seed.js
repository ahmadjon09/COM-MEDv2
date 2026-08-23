// Boshlang'ich ma'lumotlar. Matnlar 3 tilda alohida yozilgan (mashina tarjimasi emas).
// Xizmatlar narxsiz — ular "nimalar kiradi" ro'yxati bilan tavsiflanadi.
// Zapchastlar narx, ishlab chiqarilgan davlat va texnik xarakteristikalar bilan.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { categories, services, parts, siteSettings } from './seed-data.mjs';

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
async function main() {
  console.log('🌱 Seed boshlandi...');

  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'StrongPass123!', 12);
  const admin = await prisma.admin.upsert({
    where: { login: process.env.SEED_ADMIN_LOGIN || 'admin' },
    update: {},
    create: {
      login: process.env.SEED_ADMIN_LOGIN || 'admin',
      passwordHash,
      fullName: process.env.SEED_ADMIN_NAME || 'Administrator',
      role: 'SUPERADMIN',
    },
  });
  console.log(`   ✔ Admin: ${admin.login}`);

  const catMap = {};
  for (const c of categories) {
    const saved = await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
    catMap[c.slug] = saved.id;
  }
  console.log(`   ✔ ${categories.length} ta kategoriya`);

  for (const p of [...services, ...parts]) {
    const { categorySlug, ...rest } = p;
    const data = { ...rest, categoryId: catMap[categorySlug] };
    await prisma.product.upsert({ where: { slug: p.slug }, update: data, create: data });
  }
  console.log(`   ✔ ${services.length} ta xizmat, ${parts.length} ta zapchast`);

  await prisma.siteSetting.upsert({
    where: { id: 'main' },
    update: {},
    create: { ...siteSettings },
  });
  console.log('   ✔ Sayt sozlamalari');
  console.log('✅ Seed tugadi.');
}

main()
  .catch((e) => { console.error('❌ Seed xatosi:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
