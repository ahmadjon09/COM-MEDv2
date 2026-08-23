// AI yordamchisi uchun "tool"lar — model faqat kerak bo'lgan ma'lumotni so'rab oladi.
// Maqsad: kontekstni minimal ushlash. Hech qachon butun bazani modelga bermaymiz.
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

/** Tilga mos maydonni olish */
const L = (obj, field, locale) => {
  const suffix = locale === 'ru' ? 'Ru' : locale === 'uz-Cyrl' ? 'UzCyrl' : 'Uz';
  return obj?.[field + suffix] || obj?.[field + 'Uz'] || null;
};

/** Matnni qisqartirish — token tejash uchun */
const cut = (s, n = 160) => {
  if (!s) return null;
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

const money = (p, cur) =>
  p == null ? null : `${new Intl.NumberFormat('ru-RU').format(Number(p)).replace(/,/g, ' ')} ${cur === 'USD' ? 'USD' : "so'm"}`;

/**
 * Model chaqira oladigan funksiyalar ta'rifi (OpenAI-uslubidagi JSON schema).
 * Ta'riflar qisqa — ular ham har so'rovda kontekstga kiradi.
 */
export const toolSchemas = [
  {
    type: 'function',
    function: {
      name: 'list_services',
      description: 'Kompaniya ko\'rsatadigan xizmatlar ro\'yxati (nomi va bir qatorli tavsifi). Narx yo\'q.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_service',
      description: 'Bitta xizmat tafsiloti: ish tarkibi ("nimalar kiradi") va kafolat.',
      parameters: {
        type: 'object',
        properties: { slug: { type: 'string', description: 'list_services bergan slug' } },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_parts',
      description:
        'Zapchastlarni qidirish: nom, brend, model, artikul, narx oraligʻi boʻyicha. Maks 6 ta natija. ' +
        'Mijoz "arzonrogʻi bormi", "10 mln gacha" desa — shu tool narx filtri bilan chaqiriladi.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'qidiruv soʻzi, masalan "datchik" yoki "akkumulyator"' },
          category: { type: 'string', description: 'uskuna: uzi, ekg, ivl, defibrillator, sterilizatsiya, laboratoriya, nasos' },
          partType: {
            type: 'string',
            enum: ['SENSOR', 'SCREEN', 'POWER', 'CABLE', 'MECHANICAL', 'CONSUMABLE'],
            description: 'zapchast guruhi',
          },
          brand: { type: 'string', description: 'brend nomi, masalan Mindray' },
          maxPrice: { type: 'number', description: 'eng koʻp narx (soʻmda)' },
          minPrice: { type: 'number', description: 'eng kam narx (soʻmda)' },
          sort: {
            type: 'string',
            enum: ['cheap', 'expensive', 'popular'],
            description: 'cheap — arzondan qimmatga, expensive — teskari',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_part',
      description: 'Bitta zapchast tafsiloti: narx, ishlab chiqarilgan davlat, xarakteristikalar, moslik.',
      parameters: {
        type: 'object',
        properties: { slug: { type: 'string', description: 'search_parts bergan slug' } },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_parts',
      description:
        'Ikki yoki uchta zapchastni yonma-yon solishtirish: narx, davlat, kafolat, asosiy xarakteristikalar. ' +
        'Mijoz "qaysi biri yaxshiroq", "farqi nima" desa shu chaqiriladi.',
      parameters: {
        type: 'object',
        properties: {
          slugs: {
            type: 'array',
            items: { type: 'string' },
            description: 'search_parts bergan 2–3 ta slug',
          },
        },
        required: ['slugs'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommend_parts',
      description:
        'Nosozlik belgisi boʻyicha qaysi zapchast kerakligini aniqlash va tavsiya berish. ' +
        'Mijoz muammoni tasvirlasa ("ekranda chiziq bor", "apparat yonmayapti") shu chaqiriladi.',
      parameters: {
        type: 'object',
        properties: {
          symptom: { type: 'string', description: 'mijoz aytgan nosozlik belgisi' },
          category: { type: 'string', description: 'uskuna turi (bilinsa): uzi, ekg, ivl, defibrillator, sterilizatsiya, laboratoriya, nasos' },
        },
        required: ['symptom'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_contacts',
      description: 'Kompaniya telefoni, pochtasi va manzili.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_request',
      description:
        'Mijoz arizasini rasmiylashtirish va operatorga yuborish. ' +
        'Faqat foydalanuvchi ismini VA telefon raqamini aytgan boʻlsa chaqiriladi. ' +
        'Ikkalasidan biri yoʻq boʻlsa — avval soʻra, tool chaqirma.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string', description: 'foydalanuvchi aytgan raqam, istalgan koʻrinishda' },
          message: { type: 'string', description: 'muammo yoki so\'rov mazmuni, qisqa' },
          topic: { type: 'string', description: 'mahsulot yoki xizmat nomi (agar bo\'lsa)' },
        },
        required: ['name', 'phone'],
      },
    },
  },
];

/** Tool nomlari — UI'da "nima qilyapti"ni ko'rsatish uchun */
export const toolLabels = {
  list_services: { uz: 'Xizmatlar ro\'yxatini olyapman', ru: 'Смотрю список услуг', 'uz-Cyrl': 'Хизматлар рўйхатини оляпман' },
  get_service: { uz: 'Xizmat tafsilotini o\'qiyapman', ru: 'Читаю детали услуги', 'uz-Cyrl': 'Хизмат тафсилотини ўқияпман' },
  search_parts: { uz: 'Bazadan zapchast qidiryapman', ru: 'Ищу запчасти в базе', 'uz-Cyrl': 'Базадан запчаст қидиряпман' },
  get_part: { uz: 'Zapchast kartasini ochyapman', ru: 'Открываю карточку запчасти', 'uz-Cyrl': 'Запчаст картасини очяпман' },
  compare_parts: { uz: 'Variantlarni solishtiryapman', ru: 'Сравниваю варианты', 'uz-Cyrl': 'Вариантларни солиштиряпман' },
  recommend_parts: { uz: 'Nosozlikka mos qismni tanlayapman', ru: 'Подбираю деталь под неисправность', 'uz-Cyrl': 'Носозликка мос қисмни танлаяпман' },
  get_contacts: { uz: 'Kontaktlarni olyapman', ru: 'Беру контакты', 'uz-Cyrl': 'Контактларни оляпман' },
  create_request: { uz: 'Arizani yuboryapman', ru: 'Отправляю заявку', 'uz-Cyrl': 'Аризани юборяпман' },
};

/* ------------------------------------------------------------------ */
/*  Tool bajaruvchilar — natija ATAYLAB qisqa                          */
/* ------------------------------------------------------------------ */

async function listServices(_args, ctx) {
  const items = await prisma.product.findMany({
    where: { kind: 'SERVICE', isActive: true },
    orderBy: [{ sortOrder: 'asc' }],
    take: 10,
    select: {
      slug: true, nameUz: true, nameRu: true, nameUzCyrl: true,
      shortUz: true, shortRu: true, shortUzCyrl: true,
    },
  });
  return items.map((s) => ({
    slug: s.slug,
    name: L(s, 'name', ctx.locale),
    about: cut(L(s, 'short', ctx.locale), 110),
  }));
}

async function getService({ slug }, ctx) {
  const s = await prisma.product.findFirst({
    where: { slug, kind: 'SERVICE', isActive: true },
    select: {
      slug: true, nameUz: true, nameRu: true, nameUzCyrl: true,
      shortUz: true, shortRu: true, shortUzCyrl: true,
      includesUz: true, includesRu: true, includesUzCyrl: true,
      warranty: true,
    },
  });
  if (!s) return { error: 'topilmadi' };

  const includes =
    ctx.locale === 'ru' ? s.includesRu : ctx.locale === 'uz-Cyrl' ? s.includesUzCyrl : s.includesUz;

  return {
    slug: s.slug,
    name: L(s, 'name', ctx.locale),
    about: cut(L(s, 'short', ctx.locale), 140),
    includes: (includes || []).slice(0, 8).map((x) => cut(x, 90)),
    warranty: s.warranty || null,
    price: 'e\'lon qilinmaydi — diagnostikadan keyin aytiladi',
    url: `/${ctx.urlLocale}/services/${s.slug}`,
  };
}

async function searchParts({ query, category, partType, brand, maxPrice, minPrice, sort }, ctx) {
  const where = { kind: 'PART', isActive: true };
  if (category) where.category = { slug: category };
  if (partType) where.partType = partType;
  if (brand) where.brand = { contains: brand, mode: 'insensitive' };

  // Narx oralig'i — mijoz "byudjetim shuncha" desa ishlatiladi
  if (maxPrice || minPrice) {
    where.price = {};
    if (maxPrice) where.price.lte = maxPrice;
    if (minPrice) where.price.gte = minPrice;
  }

  if (query) {
    where.OR = [
      { nameUz: { contains: query, mode: 'insensitive' } },
      { nameRu: { contains: query, mode: 'insensitive' } },
      { nameUzCyrl: { contains: query, mode: 'insensitive' } },
      { brand: { contains: query, mode: 'insensitive' } },
      { model: { contains: query, mode: 'insensitive' } },
      { sku: { contains: query, mode: 'insensitive' } },
    ];
  }

  const orderBy =
    sort === 'cheap' ? [{ price: 'asc' }]
    : sort === 'expensive' ? [{ price: 'desc' }]
    : sort === 'popular' ? [{ views: 'desc' }]
    : [{ isFeatured: 'desc' }, { sortOrder: 'asc' }];

  const items = await prisma.product.findMany({
    where,
    orderBy,
    take: 6,
    select: {
      slug: true, sku: true, brand: true, model: true, price: true, currency: true,
      originCountry: true, warranty: true, condition: true, images: true,
      nameUz: true, nameRu: true, nameUzCyrl: true,
    },
  });

  return {
    count: items.length,
    supply: 'har qanday miqdorda buyurtma boʻyicha yetkaziladi',
    items: items.map((p) => card(p, ctx)),
  };
}

/** Chatda karta sifatida ko'rsatish uchun ixcham ko'rinish */
function card(p, ctx) {
  return {
    slug: p.slug,
    name: L(p, 'name', ctx.locale),
    sku: p.sku,
    brand: p.brand,
    model: p.model,
    price: money(p.price, p.currency),
    priceValue: p.price ? Number(p.price) : null,
    country: p.originCountry,
    warranty: p.warranty && p.warranty !== '—' ? p.warranty : null,
    condition: p.condition,
    image: p.images?.[0] || null,
    url: `/${ctx.urlLocale}/parts/${p.slug}`,
  };
}

/** Ikki-uch zapchastni yonma-yon solishtirish */
async function compareParts({ slugs }, ctx) {
  const list = (Array.isArray(slugs) ? slugs : []).slice(0, 3).filter(Boolean);
  if (list.length < 2) return { error: 'kamida 2 ta slug kerak' };

  const items = await prisma.product.findMany({
    where: { slug: { in: list }, kind: 'PART', isActive: true },
    select: {
      slug: true, sku: true, brand: true, model: true, price: true, currency: true,
      originCountry: true, manufacturer: true, warranty: true, condition: true,
      specs: true, images: true, nameUz: true, nameRu: true, nameUzCyrl: true,
    },
  });
  if (!items.length) return { error: 'topilmadi' };

  const specKey = ctx.locale === 'ru' ? 'labelRu' : ctx.locale === 'uz-Cyrl' ? 'labelUzCyrl' : 'labelUz';
  const priced = items.filter((x) => x.price != null).map((x) => Number(x.price));

  return {
    items: items.map((p) => ({
      ...card(p, ctx),
      manufacturer: p.manufacturer,
      specs: (Array.isArray(p.specs) ? p.specs : []).slice(0, 4).map((sp) => `${sp[specKey]}: ${sp.value}`),
    })),
    cheapest: priced.length ? money(Math.min(...priced), 'UZS') : null,
    difference: priced.length > 1 ? money(Math.max(...priced) - Math.min(...priced), 'UZS') : null,
  };
}

/**
 * Nosozlik belgisi -> qaysi guruhdagi zapchast kerak.
 * Bu jadval muhandislarimiz tajribasiga asoslangan; model o'zidan taxmin qilmasligi uchun kerak.
 */
const SYMPTOM_MAP = [
  { keys: ['ekran', 'monitor', 'экран', 'монитор', 'chiziq', 'полос', 'dog', 'пятн', 'yorug', 'подсветк', 'displey', 'дисплей'],
    partType: 'SCREEN',
    hintUz: 'Ekranda chiziq, dogʻ yoki yorugʻlik yoʻqolishi — koʻpincha matritsa yoki shleyf muammosi.',
    hintRu: 'Полосы, пятна или пропавшая подсветка — чаще всего матрица или шлейф.',
    hintCy: 'Экранда чизиқ ёки ёруғлик йўқолиши — кўпинча матрица ёки шлейф муаммоси.' },
  { keys: ['yonmayapti', 'yoqilmayapti', 'не включается', 'не вклю', 'ochmayapti', 'quvvat', 'питани', 'batareya', 'akkumulyator', 'аккумулятор', 'зарядк', 'zaryad', 'ўчиб'],
    partType: 'POWER',
    hintUz: 'Apparat yonmasa yoki oʻzidan oʻchsa — birinchi navbatda quvvat bloki va akkumulyator tekshiriladi.',
    hintRu: 'Если аппарат не включается или гаснет — первым делом проверяют блок питания и аккумулятор.',
    hintCy: 'Аппарат ёнмаса ёки ўзидан ўчса — аввал қувват блоки ва аккумулятор текширилади.' },
  { keys: ['shovqin', 'наводк', 'помех', 'chiziq raqs', 'kabel', 'кабель', 'elektrod', 'электрод', 'razyom', 'разъём', 'uzil', 'обрыв'],
    partType: 'CABLE',
    hintUz: 'Chiziqdagi shovqin yoki uzilish — odatda bemor kabeli va elektrod kontaktlarida.',
    hintRu: 'Наводки или обрыв сигнала — обычно в пациентском кабеле и контактах электродов.',
    hintCy: 'Чизиқдаги шовқин ёки узилиш — одатда бемор кабели ва электрод контактларида.' },
  { keys: ['tasvir', 'изображени', 'datchik', 'датчик', 'sensor', 'сенсор', 'oʻlchov', 'измерен', 'notoʻgʻri koʻrsat', 'неверн', 'hajm', 'объём', 'spo2', 'oqim', 'поток'],
    partType: 'SENSOR',
    hintUz: 'Tasvir sifati yomon yoki oʻlchov notoʻgʻri boʻlsa — datchik/sensor aybdor boʻlishi mumkin.',
    hintRu: 'Плохое изображение или неверные измерения — вероятная причина в датчике/сенсоре.',
    hintCy: 'Тасвир сифати ёмон ёки ўлчов нотўғри бўлса — датчик/сенсор айбдор бўлиши мумкин.' },
  { keys: ['bosim ushlamayapti', 'не держит давлен', 'oqmoqda', 'течёт', 'zichlagich', 'уплотнитель', 'klapan', 'клапан', 'turbina', 'турбин', 'rotor', 'ротор', 'sikl', 'цикл'],
    partType: 'MECHANICAL',
    hintUz: 'Bosim ushlamaslik, oqish yoki sikl tugamasligi — mexanik qismlar (zichlagich, klapan, turbina).',
    hintRu: 'Не держит давление, течёт или не завершает цикл — механика: уплотнитель, клапан, турбина.',
    hintCy: 'Босим ушламаслик ёки оқиш — механик қисмлар (зичлагич, клапан, турбина).' },
  { keys: ['qogʻoz', 'бумаг', 'kontur', 'контур', 'filtr', 'фильтр', 'sarf', 'расходник', 'tugadi', 'закончил'],
    partType: 'CONSUMABLE',
    hintUz: 'Bu sarf materiali — uni muntazam almashtirib turish kerak.',
    hintRu: 'Это расходный материал — его нужно менять регулярно.',
    hintCy: 'Бу сарф материали — уни мунтазам алмаштириб туриш керак.' },
];

async function recommendParts({ symptom, category }, ctx) {
  const text = String(symptom || '').toLowerCase();
  const hit = SYMPTOM_MAP.find((m) => m.keys.some((k) => text.includes(k)));

  const where = { kind: 'PART', isActive: true };
  if (category) where.category = { slug: category };
  if (hit) where.partType = hit.partType;

  const items = await prisma.product.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { price: 'asc' }],
    take: 4,
    select: {
      slug: true, sku: true, brand: true, model: true, price: true, currency: true,
      originCountry: true, warranty: true, condition: true, images: true,
      nameUz: true, nameRu: true, nameUzCyrl: true,
    },
  });

  const hint = hit
    ? (ctx.locale === 'ru' ? hit.hintRu : ctx.locale === 'uz-Cyrl' ? hit.hintCy : hit.hintUz)
    : null;

  return {
    matched: Boolean(hit),
    diagnosis_hint: hint,
    advice: hit
      ? 'zapchastni almashtirishdan oldin bepul diagnostika tavsiya etiladi'
      : 'belgi aniq emas — mijozdan uskuna modeli va nosozlik tafsilotini soʻra',
    items: items.map((p) => card(p, ctx)),
  };
}

async function getPart({ slug }, ctx) {
  const p = await prisma.product.findFirst({
    where: { slug, kind: 'PART', isActive: true },
    select: {
      slug: true, sku: true, brand: true, model: true, price: true, currency: true, priceNote: true,
      warranty: true, originCountry: true, manufacturer: true, condition: true,
      specs: true, compatibility: true, images: true,
      nameUz: true, nameRu: true, nameUzCyrl: true, shortUz: true, shortRu: true, shortUzCyrl: true,
    },
  });
  if (!p) return { error: 'topilmadi' };

  const specKey = ctx.locale === 'ru' ? 'labelRu' : ctx.locale === 'uz-Cyrl' ? 'labelUzCyrl' : 'labelUz';
  const specs = Array.isArray(p.specs) ? p.specs.slice(0, 6) : [];

  return {
    name: L(p, 'name', ctx.locale),
    about: cut(L(p, 'short', ctx.locale), 120),
    sku: p.sku,
    brand: p.brand,
    model: p.model,
    price: money(p.price, p.currency),
    price_note: p.priceNote,
    country: p.originCountry,
    manufacturer: p.manufacturer,
    condition: p.condition,
    warranty: p.warranty,
    supply: 'istalgan miqdorda buyurtma boʻyicha yetkazib beriladi',
    specs: specs.map((s) => `${s[specKey]}: ${s.value}`),
    fits: (p.compatibility || []).slice(0, 5),
    url: `/${ctx.urlLocale}/parts/${p.slug}`,
    // Chatda karta ko'rinishida chiqishi uchun
    _card: { slug: p.slug, name: L(p, 'name', ctx.locale), sku: p.sku, brand: p.brand,
             price: money(p.price, p.currency), country: p.originCountry,
             warranty: p.warranty && p.warranty !== '—' ? p.warranty : null,
             image: p.images?.[0] || null, url: `/${ctx.urlLocale}/parts/${p.slug}` },
  };
}

async function getContacts(_args, ctx) {
  const s = await prisma.siteSetting.findUnique({
    where: { id: 'main' },
    select: {
      phones: true, emails: true,
      addressUz: true, addressRu: true, addressUzCyrl: true,
    },
  });
  return {
    phones: (Array.isArray(s?.phones) ? s.phones : []).map((p) => p.value),
    email: s?.emails?.[0] ?? null,
    address: L(s, 'address', ctx.locale),
  };
}

/**
 * O'zbekiston raqamlarini bir ko'rinishga keltirish.
 *   "90 275 88 83"     -> +998902758883
 *   "998 90 275 88 83" -> +998902758883
 *   "+998902758883"    -> +998902758883
 */
export function normalizePhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.length === 9) return `+998${d}`;                       // 901234567
  if (d.length === 12 && d.startsWith('998')) return `+${d}`;   // 998901234567
  if (d.length === 13 && d.startsWith('8998')) return `+${d.slice(1)}`;
  if (d.length >= 10 && d.length <= 15) return `+${d}`;         // xorijiy raqam
  return null;
}

async function createRequest({ name, phone, message, topic }, ctx) {
  const clean = normalizePhone(phone);
  if (!clean) {
    return { ok: false, error: 'telefon raqam toʻliq emas — mijozdan qayta soʻrang' };
  }
  const cleanName = String(name || '').trim();
  if (cleanName.length < 2) {
    return { ok: false, error: 'ism juda qisqa — mijozdan ismini soʻrang' };
  }

  const created = await prisma.request.create({
    data: {
      name: cleanName.slice(0, 80),
      phone: clean,
      message: message ? String(message).slice(0, 1000) : null,
      productName: topic ? String(topic).slice(0, 200) : null,
      locale: ctx.locale,
      source: 'site',
      ip: ctx.ip ?? null,
      userAgent: 'ai-assistant',
    },
  });

  // Telegramga yuborish — javobni kutmaymiz
  import('../../lib/telegram.js')
    .then(({ sendTelegramMessage, buildRequestMessage }) =>
      sendTelegramMessage('🤖 <b>AI yordamchi orqali</b>\n\n' + buildRequestMessage(created))
    )
    .catch((e) => logger.warn({ err: e.message }, 'AI ariza Telegramga ketmadi'));

  return {
    ok: true,
    id: created.id,
    saved: { name: cleanName, phone: clean, topic: topic || null },
    note: 'ariza qabul qilindi — mijozga tasdiq bering va operator bogʻlanishini ayting',
  };
}

const REGISTRY = {
  list_services: listServices,
  get_service: getService,
  search_parts: searchParts,
  compare_parts: compareParts,
  recommend_parts: recommendParts,
  get_part: getPart,
  get_contacts: getContacts,
  create_request: createRequest,
};

/**
 * Tool'ni xavfsiz bajarish. Xato bo'lsa modelga qisqa xato matni qaytadi —
 * shunda u foydalanuvchiga to'g'ri javob bera oladi.
 */
export async function runTool(name, args, ctx) {
  const fn = REGISTRY[name];
  if (!fn) return { error: 'nomaʼlum tool' };
  try {
    return await fn(args || {}, ctx);
  } catch (e) {
    logger.error({ tool: name, err: e.message }, 'AI tool xatosi');
    return { error: 'maʼlumotni olishda xatolik' };
  }
}
