// Loyiha sozlamalarini tekshiradi. "Module not found" kabi xatolar sababini topadi.
// Ishga tushirish: npm run doctor
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

let problems = 0;
const ok = (m) => console.log(`  ✔ ${m}`);
const bad = (m, fix) => { problems += 1; console.log(`  ✘ ${m}`); if (fix) console.log(`     → ${fix}`); };

console.log('\n== COM MEDICAL SERVIS — loyiha tekshiruvi ==\n');

/* 1. Node versiyasi */
const major = Number(process.versions.node.split('.')[0]);
console.log('1) Node.js');
if (major >= 18) ok(`versiya ${process.versions.node}`);
else bad(`versiya ${process.versions.node} — juda eski`, 'Node 20 LTS o\'rnating: nodejs.org');

/* 2. Bog'liqliklar */
console.log('\n2) Paketlar');
if (!existsSync('node_modules')) {
  bad('node_modules yo\'q', 'npm install');
} else {
  ok('node_modules mavjud');
  for (const dep of ['next', 'react', 'lucide-react', 'react-icons', 'framer-motion', 'swr']) {
    existsSync(path.join('node_modules', dep))
      ? ok(`${dep} o'rnatilgan`)
      : bad(`${dep} yo'q`, 'npm install');
  }
}

/* 3. Alias sozlamasi */
console.log('\n3) "@/..." alias');
if (existsSync('tsconfig.json')) {
  const ts = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
  ts?.compilerOptions?.paths?.['@/*']
    ? ok('tsconfig.json ichida paths bor')
    : bad('tsconfig.json bor, lekin paths yo\'q — Next uni jsconfig\'dan ustun qo\'yadi',
          'tsconfig.json ni o\'chiring yoki paths qo\'shing: "@/*": ["./src/*"]');
} else if (existsSync('jsconfig.json')) {
  try {
    const js = JSON.parse(readFileSync('jsconfig.json', 'utf8'));
    js?.compilerOptions?.paths?.['@/*'] ? ok('jsconfig.json to\'g\'ri') : bad('jsconfig.json da paths yo\'q');
  } catch {
    bad('jsconfig.json buzilgan (JSON xato)', 'faylni qayta yuklab oling');
  }
} else {
  console.log('  ! jsconfig.json yo\'q — lekin next.config.mjs dagi alias qutqaradi');
}
const cfg = existsSync('next.config.mjs') ? readFileSync('next.config.mjs', 'utf8') : '';
cfg.includes("resolve.alias") ? ok('next.config.mjs zaxira alias bor') : bad('next.config.mjs da alias yo\'q');

/* 4. Muhim fayllar */
console.log('\n4) Fayllar');
const need = [
  'src/i18n/index.js', 'src/i18n/uz.js', 'src/i18n/ru.js', 'src/i18n/uz-Cyrl.js',
  'src/components/ui/Icons.jsx', 'src/components/ui/Button.jsx',
  'src/lib/utils.js', 'src/lib/api.js', 'src/lib/fonts.js',
  'src/app/layout.jsx', 'src/app/[locale]/layout.jsx', 'src/app/[locale]/page.jsx',
  'public/logo.png', 'public/og-default.jpg',
];
const missing = need.filter((f) => !existsSync(f));
missing.length === 0 ? ok(`${need.length} ta muhim fayl joyida`)
  : bad(`yetishmaydi: ${missing.join(', ')}`, 'loyihani to\'liq qayta yuklab oling');

const eq = existsSync('public/equipment') ? readdirSync('public/equipment').length : 0;
eq >= 7 ? ok(`uskuna suratlari: ${eq} ta`) : bad(`public/equipment da ${eq} ta rasm (7 kerak)`);

/* 5. Muhit o'zgaruvchilari */
console.log('\n5) .env.local');
if (!existsSync('.env.local')) {
  console.log('  ! .env.local yo\'q — muammo emas: API avtomatik http://localhost:4000 ga proxy qilinadi');
} else {
  const env = readFileSync('.env.local', 'utf8');
  const api = env.match(/^NEXT_PUBLIC_API_URL=(.*)$/m)?.[1]?.trim();
  if (!api) ok('NEXT_PUBLIC_API_URL bo\'sh — proxy ishlatiladi (to\'g\'ri)');
  else if (api.startsWith('http')) ok(`API: ${api}`);
  else bad(`NEXT_PUBLIC_API_URL noto'g'ri: "${api}"`, 'bo\'sh qoldiring yoki http:// bilan boshlang');
}

/* 6. Kesh */
console.log('\n6) Kesh');
existsSync('.next')
  ? console.log('  ! .next mavjud — komponent o\'chirilgan/qayta nomlangan bo\'lsa: npm run clean')
  : ok('.next toza');

console.log(problems === 0 ? '\n✅ Muammo topilmadi.\n' : `\n⚠ ${problems} ta muammo topildi (yuqoriga qarang).\n`);
process.exit(problems === 0 ? 0 : 1);
