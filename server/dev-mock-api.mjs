// DEV-MOCK API — faqat lokal ko'rib chiqish uchun (PostgreSQL/Redis o'rnatilmagan holatda).
// Ma'lumotni prisma/seed-data.mjs dan oladi — ya'ni haqiqiy seed bilan bir xil kontent.
// Production'da ishlatilmaydi: haqiqiy server src/index.js orqali ishga tushadi.
import http from 'node:http';
import { categories as rawCats, services, parts, siteSettings } from './prisma/seed-data.mjs';

const PORT = process.env.MOCK_PORT || 4000;
const now = new Date();

const categories = rawCats.map((c, i) => ({
  ...c,
  id: `c${i + 1}`,
  isActive: true,
  updatedAt: now,
  productCount: [...services, ...parts].filter((p) => p.categorySlug === c.slug).length,
}));

const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

const products = [...services, ...parts].map((p, i) => {
  const c = catBySlug[p.categorySlug];
  return {
    ...p,
    id: `p${i + 1}`,
    isActive: true,
    categoryId: c.id,
    price: p.price ?? null,
    currency: p.currency ?? 'UZS',
    images: p.images ?? [],
    specs: p.specs ?? [],
    compatibility: p.compatibility ?? [],
    includesUz: p.includesUz ?? [],
    includesRu: p.includesRu ?? [],
    includesUzCyrl: p.includesUzCyrl ?? [],
    condition: p.condition ?? 'NEW',
    partType: p.partType ?? 'OTHER',
    inStock: p.inStock ?? true,
    views: 0,
    createdAt: now,
    updatedAt: now,
    category: { id: c.id, slug: c.slug, nameUz: c.nameUz, nameRu: c.nameRu, nameUzCyrl: c.nameUzCyrl, iconKey: c.iconKey },
  };
});

const send = (res, code, body) => {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Cache-Control': 'public, max-age=30',
  });
  res.end(JSON.stringify(body));
};

/** Demo javob generatori (kalitsiz ko'rsatish uchun) */
/** Chat kartasi uchun ixcham ko'rinish */
function toCard(x, loc, ru, cy) {
  const nm = ru ? x.nameRu : cy ? x.nameUzCyrl : x.nameUz;
  return {
    slug: x.slug, name: nm, sku: x.sku, brand: x.brand,
    price: x.price ? new Intl.NumberFormat('ru-RU').format(x.price).replace(/,/g, ' ') + (ru ? ' сум' : " so'm") : null,
    country: x.originCountry, warranty: x.warranty && x.warranty !== '—' ? x.warranty : null,
    image: x.images?.[0] || null, url: `/${loc}/parts/${x.slug}`,
  };
}

/** Nosozlik belgisi -> zapchast guruhi */
const SYMPTOMS = [
  { keys: ['ekran', 'экран', 'chiziq', 'полос', 'monitor', 'монитор', 'yorug', 'подсветк'], type: 'SCREEN',
    u: 'Ekranda chiziq yoki yorugʻlik yoʻqolishi — koʻpincha **matritsa yoki shleyf** muammosi.',
    r: 'Полосы или пропавшая подсветка — чаще всего **матрица или шлейф**.',
    c: 'Экранда чизиқ ёки ёруғлик йўқолиши — кўпинча **матрица ёки шлейф** муаммоси.' },
  { keys: ['yonmayapti', 'не включ', 'quvvat', 'питани', 'akkumulyator', 'аккумулятор', 'zaryad', 'зарядк', 'ochmayapti'], type: 'POWER',
    u: 'Apparat yonmasa yoki oʻzidan oʻchsa — avval **quvvat bloki va akkumulyator** tekshiriladi.',
    r: 'Если аппарат не включается — первым делом **блок питания и аккумулятор**.',
    c: 'Аппарат ёнмаса — аввал **қувват блоки ва аккумулятор** текширилади.' },
  { keys: ['shovqin', 'наводк', 'помех', 'kabel', 'кабель', 'elektrod', 'электрод', 'uzil', 'обрыв'], type: 'CABLE',
    u: 'Chiziqdagi shovqin yoki uzilish — odatda **bemor kabeli va elektrod kontaktlari**.',
    r: 'Наводки или обрыв — обычно **пациентский кабель и контакты электродов**.',
    c: 'Чизиқдаги шовқин — одатда **бемор кабели ва электрод контактлари**.' },
  { keys: ['tasvir', 'изображени', 'datchik', 'датчик', 'sensor', 'сенсор', 'notoʻgʻri', 'неверн', 'oqim', 'поток'], type: 'SENSOR',
    u: 'Tasvir yomon yoki oʻlchov notoʻgʻri boʻlsa — **datchik/sensor** aybdor boʻlishi mumkin.',
    r: 'Плохое изображение или неверные измерения — вероятно **датчик/сенсор**.',
    c: 'Тасвир ёмон ёки ўлчов нотўғри бўлса — **датчик/сенсор** айбдор бўлиши мумкин.' },
  { keys: ['bosim', 'давлен', 'oqmoqda', 'течёт', 'zichlagich', 'уплотнитель', 'klapan', 'клапан', 'turbina', 'турбин'], type: 'MECHANICAL',
    u: 'Bosim ushlamaslik yoki oqish — **mexanik qismlar**: zichlagich, klapan, turbina.',
    r: 'Не держит давление или течёт — **механика**: уплотнитель, клапан, турбина.',
    c: 'Босим ушламаслик ёки оқиш — **механик қисмлар**.' },
];

function demoAnswer(rawMsg, locale, history = []) {
  const msg = String(rawMsg).toLowerCase();
  const ru = locale === 'ru';
  const cy = locale === 'uz-Cyrl';
  const L = (u, r, c) => (ru ? r : cy ? c : u);
  const loc = ru ? 'ru' : cy ? 'uz-cyrl' : 'uz';
  const nm = (o) => (ru ? o.nameRu : cy ? o.nameUzCyrl : o.nameUz);
  const has = (...w) => w.some((x) => msg.includes(x));

  // --- Ariza oqimi: matnda telefon bormi? ---
  const digits = String(rawMsg).replace(/[^\d+]/g, '');
  const phoneMatch = digits.replace(/\D/g, '');
  const hasPhone = phoneMatch.length === 9 || (phoneMatch.length === 12 && phoneMatch.startsWith('998'));
  // ismni sodda usulda ajratamiz: raqamlarsiz so'zlar
  const nameGuess = String(rawMsg).replace(/[+\d()\-\s]{7,}/g, ' ').replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/).filter((w) => w.length > 1 && !['ismim','мен','меня','зовут','my','name','ariza','заявка'].includes(w.toLowerCase()))[0];

  if (hasPhone && nameGuess) {
    const phone = phoneMatch.length === 9 ? '+998' + phoneMatch : '+' + phoneMatch;
    return {
      requestCreated: true,
      cards: [],
      steps: [{ tool: 'create_request', label: L('Arizani yuboryapman', 'Отправляю заявку', 'Аризани юборяпман') }],
      reply: L(
        `Rahmat, **${nameGuess}**! Arizangizni operatorga uzatdim.\n\n- **Telefon:** ${phone}\n\nMutaxassisimiz siz bilan bog'lanadi va muammoni aniqlashtiradi.`,
        `Спасибо, **${nameGuess}**! Заявку передал оператору.\n\n- **Телефон:** ${phone}\n\nНаш специалист свяжется с вами и уточнит детали.`,
        `Раҳмат, **${nameGuess}**! Аризангизни операторга уздатим.\n\n- **Телефон:** ${phone}\n\nМутахассисимиз сиз билан боғланади.`
      ),
    };
  }

  if (has('ariza', 'заявк', 'ариза', 'qoldirmoq', 'оставить', 'chaqir', 'вызв')) {
    return {
      requestCreated: false,
      steps: [],
      reply: L(
        `Albatta, arizangizni o'zim rasmiylashtiraman.\n\nBuning uchun ikkita narsa kerak:\n\n- **Ismingiz**\n- **Telefon raqamingiz**\n\nIkkalasini bitta xabarda yozib yuboring — masalan: *Aziz, 90 123 45 67*`,
        `Конечно, оформлю заявку сам.\n\nДля этого нужны две вещи:\n\n- **Ваше имя**\n- **Номер телефона**\n\nНапишите их одним сообщением — например: *Азиз, 90 123 45 67*`,
        `Албатта, аризангизни ўзим расмийлаштираман.\n\n- **Исмингиз**\n- **Телефон рақамингиз**\n\nИккаласини битта хабарда ёзиб юборинг.`
      ),
    };
  }

  // --- Nosozlik bo'yicha tavsiya ---
  const sym = SYMPTOMS.find((x) => x.keys.some((k) => msg.includes(k)));
  if (sym) {
    const list = products.filter((x) => x.kind === 'PART' && x.partType === sym.type).slice(0, 3);
    const hint = ru ? sym.r : cy ? sym.c : sym.u;
    const cheapest = list.filter((x) => x.price).sort((a, b) => a.price - b.price)[0];
    const money = (v) => new Intl.NumberFormat('ru-RU').format(v).replace(/,/g, ' ') + (ru ? ' сум' : " so'm");
    return {
      requestCreated: false,
      cards: list.map((x) => toCard(x, loc, ru, cy)),
      steps: [{ tool: 'recommend_parts', label: L('Nosozlikka mos qismni tanlayapman', 'Подбираю деталь под неисправность', 'Носозликка мос қисмни танлаяпман') }],
      reply: L(
        `${hint}\n\nShu guruhdan **${list.length} ta** mos variant bor` +
          (cheapest ? `, eng arzoni — **${money(cheapest.price)}**` : '') +
          `.\n\nAlmashtirishdan oldin **bepul diagnostika**ni tavsiya qilaman: noto'g'ri qism sotib olinmasligi uchun.\n\nApparat modelini yozing — mosini aniq tanlab beraman.`,
        `${hint}\n\nВ этой группе есть **${list.length}** подходящих варианта` +
          (cheapest ? `, самый доступный — **${money(cheapest.price)}**` : '') +
          `.\n\nПеред заменой советую **бесплатную диагностику** — чтобы не купить не ту деталь.\n\nНапишите модель аппарата, подберу точно.`,
        `${hint}\n\nШу гуруҳдан **${list.length} та** мос вариант бор.\n\nАлмаштиришдан олдин **бепул диагностика**ни тавсия қиламан.`
      ),
    };
  }

  if (has('xizmat', 'услуг', 'хизмат', 'remont', 'ремонт', 'таъмир', 'tamir')) {
    const list = products.filter((x) => x.kind === 'SERVICE').slice(0, 5);
    return {
      requestCreated: false,
      steps: [{ tool: 'list_services', label: L("Xizmatlar ro'yxatini olyapman", 'Смотрю список услуг', 'Хизматлар рўйхатини оляпман') }],
      reply: L(
        `Bizda **${list.length} ta asosiy xizmat** bor:\n\n` + list.map((x) => `- [${nm(x)}](/${loc}/services/${x.slug})`).join('\n') +
          `\n\nXizmat narxi **e'lon qilinmaydi** — u uskuna holatiga bog'liq va diagnostikadan keyin aytiladi. Diagnostika bepul.\n\nQaysi uskunangiz haqida gaplashamiz?`,
        `У нас **${list.length} основных услуги**:\n\n` + list.map((x) => `- [${nm(x)}](/${loc}/services/${x.slug})`).join('\n') +
          `\n\nЦена услуги **не публикуется** — она зависит от состояния аппарата и называется после диагностики. Диагностика бесплатна.\n\nО каком аппарате идёт речь?`,
        `Бизда **${list.length} та асосий хизмат** бор:\n\n` + list.map((x) => `- [${nm(x)}](/${loc}/services/${x.slug})`).join('\n') +
          `\n\nХизмат нархи **эълон қилинмайди**.\n\nҚайси ускунангиз ҳақида гаплашамиз?`
      ),
    };
  }

  if (has('datchik', 'датчик', 'zapchast', 'запчаст', 'sensor', 'сенсор', 'akkumulyator', 'аккумулятор', 'kabel', 'кабель', 'ekran', 'экран')) {
    const q = msg.includes('datchik') || msg.includes('датчик') || msg.includes('sensor') ? 'SENSOR'
      : msg.includes('akkumulyator') || msg.includes('аккумулятор') ? 'POWER'
      : msg.includes('kabel') || msg.includes('кабель') ? 'CABLE'
      : msg.includes('ekran') || msg.includes('экран') ? 'SCREEN' : null;
    const list = products.filter((x) => x.kind === 'PART' && (!q || x.partType === q)).slice(0, 4);
    const fmt = (x) => `- [${nm(x)}](/${loc}/parts/${x.slug}) — ${x.price ? new Intl.NumberFormat('ru-RU').format(x.price).replace(/,/g, ' ') + (ru ? ' сум' : " so'm") : '—'}${x.originCountry ? `, ${x.originCountry}` : ''}`;
    const withPrice = list.filter((x) => x.price).sort((a, b) => a.price - b.price);
    const money2 = (v) => new Intl.NumberFormat('ru-RU').format(v).replace(/,/g, ' ') + (ru ? ' сум' : " so'm");
    const range = withPrice.length > 1
      ? L(`\n\nNarx oraligʻi: **${money2(withPrice[0].price)}** dan **${money2(withPrice[withPrice.length - 1].price)}** gacha. Arzonrogʻi ham, kafolati uzunrogʻi ham bor — qaysi biri qiziq?`,
          `\n\nДиапазон цен: от **${money2(withPrice[0].price)}** до **${money2(withPrice[withPrice.length - 1].price)}**. Есть и подешевле, и с большей гарантией — что интереснее?`,
          `\n\nНарх оралиғи: **${money2(withPrice[0].price)}** дан **${money2(withPrice[withPrice.length - 1].price)}** гача.`)
      : '';
    return {
      requestCreated: false,
      cards: list.map((x) => toCard(x, loc, ru, cy)),
      steps: [{ tool: 'search_parts', label: L('Bazadan zapchast qidiryapman', 'Ищу запчасти в базе', 'Базадан запчаст қидиряпман') }],
      reply: L(
        `Bazada mos **${list.length} ta pozitsiya** bor:\n\n${list.map(fmt).join('\n')}\n\nHammasini **istalgan miqdorda olib kelib beramiz**.\n\nApparatingizning **modelini** yozing — mosligini tekshiraman.`,
        `В базе есть **${list.length} позиции**:\n\n${list.map(fmt).join('\n')}\n\nПривезём **любое количество**.\n\nНапишите **модель** аппарата — проверю совместимость.`,
        `Базада мос **${list.length} та позиция** бор:\n\n${list.map(fmt).join('\n')}\n\n**Исталган миқдорда олиб келиб берамиз**.`
      ),
    };
  }

  if (has('kafolat', 'гарант', 'кафолат')) {
    return {
      requestCreated: false,
      steps: [{ tool: 'get_service', label: L("Xizmat tafsilotini o'qiyapman", 'Читаю детали услуги', 'Хизмат тафсилотини ўқияпман') }],
      reply: L(
        `Kafolat ish turiga qarab **6 oydan 12 oygacha** beriladi.\n\n- Ta'mirga — 6–12 oy\n- Zapchastga — 6–12 oy\n- Kalibrovkaga — 6 oy\n\nAniq muddat kafolat varaqasida yoziladi.`,
        `Гарантия составляет **от 6 до 12 месяцев** в зависимости от вида работ.\n\n- На ремонт — 6–12 месяцев\n- На запчасти — 6–12 месяцев\n- На калибровку — 6 месяцев\n\nТочный срок указывается в гарантийном талоне.`,
        `Кафолат иш турига қараб **6 ойдан 12 ойгача** берилади.`
      ),
    };
  }

  if (has('telefon', 'телефон', 'manzil', 'адрес', 'kontakt', 'контакт', 'qayerda', 'где')) {
    return {
      requestCreated: false,
      steps: [{ tool: 'get_contacts', label: L('Kontaktlarni olyapman', 'Беру контакты', 'Контактларни оляпман') }],
      reply: L(
        `Bog'lanish uchun:\n\n- **Telefon:** +998 90 275 88 83\n- **Pochta:** mirzayev@mail.ru\n\nManzil: Namangan sh., Go'zal massivi, 2-d uy.\n\nQo'ng'iroq qilishimizni xohlasangiz — ismingiz va raqamingizni yozing, arizani o'zim rasmiylashtiraman.`,
        `Связаться можно так:\n\n- **Телефон:** +998 90 275 88 83\n- **Почта:** mirzayev@mail.ru\n\nАдрес: г. Наманган, массив Гўзал, дом 2-д.\n\nХотите, перезвоним — напишите имя и номер, оформлю заявку сам.`,
        `Боғланиш учун:\n\n- **Телефон:** +998 90 275 88 83\n- **Почта:** mirzayev@mail.ru`
      ),
    };
  }

  if (has('narx', 'цена', 'нарх', 'qancha', 'қанча', 'сколько')) {
    return {
      requestCreated: false,
      steps: [],
      reply: L(
        `**Xizmat narxi oldindan aytilmaydi** — u uskuna holatiga va kerakli qismlarga bog'liq.\n\n- Diagnostika qilamiz (bepul)\n- Yozma smeta beramiz\n- Siz rozi bo'lsangiz — ish boshlanadi\n\n**Zapchast narxlari** katalogda ochiq. Ismingiz va raqamingizni yozsangiz, operator aniq narxni aytadi.`,
        `**Цену услуги заранее не называем** — она зависит от состояния аппарата и нужных деталей.\n\n- Делаем диагностику (бесплатно)\n- Выдаём письменную смету\n- Согласились — начинаем работу\n\n**Цены на запчасти** открыты в каталоге. Напишите имя и номер — оператор назовёт точную цену.`,
        `**Хизмат нархи олдиндан айтилмайди**.\n\n- Диагностика қиламиз (бепул)\n- Ёзма смета берамиз`
      ),
    };
  }

  return {
    requestCreated: false,
    steps: [],
    reply: L(
      `Savolingizni aniqlashtirib bering — qaysi uskuna haqida gapiryapmiz?\n\n- **UZI** apparati yoki datchigi\n- **EKG** yoki bemor monitori\n- **IVL**, defibrillator, sterilizator\n- Laboratoriya asboblari yoki infuzion nasos\n\nYoki to'g'ridan-to'g'ri ariza qoldiring — ismingiz va raqamingizni yozing.`,
      `Уточните вопрос — о каком аппарате речь?\n\n- **УЗИ** аппарат или датчик\n- **ЭКГ** или монитор пациента\n- **ИВЛ**, дефибриллятор, стерилизатор\n- Лабораторные приборы или инфузионный насос\n\nИли сразу оставьте заявку — напишите имя и номер.`,
      `Саволингизни аниқлаштириб беринг — қайси ускуна ҳақида гапиряпмиз?`
    ),
  };
}

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const q = url.searchParams;

  if (p === '/health') return send(res, 200, { ok: true, data: { status: 'up (mock)' } });
  if (p === '/api/settings') return send(res, 200, { ok: true, data: { ...siteSettings, updatedAt: now } });
  if (p === '/api/categories') return send(res, 200, { ok: true, data: categories });

  if (p === '/api/products/meta/filters') {
    const partItems = products.filter((x) => x.kind === 'PART');
    const group = (key) => {
      const m = {};
      for (const it of partItems) if (it[key]) m[it[key]] = (m[it[key]] || 0) + 1;
      return Object.entries(m).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    };
    return send(res, 200, {
      ok: true,
      data: { brands: group('brand'), countries: group('originCountry'), types: group('partType') },
    });
  }

  if (p === '/api/products/meta/slugs') {
    return send(res, 200, { ok: true, data: {
      products: products.map((x) => ({ slug: x.slug, kind: x.kind, updatedAt: x.updatedAt })),
      categories: categories.map((x) => ({ slug: x.slug, updatedAt: x.updatedAt })),
    } });
  }

  if (p === '/api/products') {
    let items = [...products];
    if (q.get('category')) items = items.filter((x) => x.category.slug === q.get('category'));
    if (q.get('kind')) items = items.filter((x) => x.kind === q.get('kind'));
    if (q.get('featured') === 'true') items = items.filter((x) => x.isFeatured);
    if (q.get('brand')) items = items.filter((x) => (x.brand || '').toLowerCase() === q.get('brand').toLowerCase());
    if (q.get('country')) items = items.filter((x) => x.originCountry === q.get('country').toUpperCase());
    if (q.get('partType')) items = items.filter((x) => x.partType === q.get('partType'));
    if (q.get('inStock') === 'true') items = items.filter((x) => x.inStock);

    const s = (q.get('q') || '').toLowerCase();
    if (s) {
      items = items.filter((x) =>
        [x.nameUz, x.nameRu, x.nameUzCyrl, x.brand, x.model, x.sku, ...(x.keywords || [])]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(s))
      );
    }

    const sort = q.get('sort');
    if (sort === 'price_asc') items.sort((a, b) => (a.price ?? 1e12) - (b.price ?? 1e12));
    if (sort === 'price_desc') items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (sort === 'new') items.sort((a, b) => b.createdAt - a.createdAt);
    if (!sort || sort === 'manual') items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const limit = Number(q.get('limit') || 24);
    return send(res, 200, {
      ok: true,
      data: items.slice(0, limit),
      meta: { page: 1, limit, total: items.length, pages: 1 },
    });
  }

  if (p.startsWith('/api/categories/')) {
    const c = catBySlug[p.split('/')[3]];
    return c ? send(res, 200, { ok: true, data: c }) : send(res, 404, { ok: false, error: { message: 'not found' } });
  }

  if (p.startsWith('/api/products/')) {
    const item = products.find((x) => x.slug === p.split('/')[3]);
    if (!item) return send(res, 404, { ok: false, error: { message: 'not found' } });
    const related = products.filter((x) => x.categoryId === item.categoryId && x.kind === item.kind && x.id !== item.id).slice(0, 4);
    return send(res, 200, { ok: true, data: { ...item, category: catBySlug[item.categorySlug], related } });
  }


  /* ---------------- AI yordamchi (DEMO) ----------------
     Haqiqiy server modelga ulanadi. Bu yerda kalit yo'q, shuning uchun
     javoblar oddiy qoidalar bilan yasaladi — vidjetni ko'rish uchun. */
  if (p === '/api/ai/status') {
    return send(res, 200, { ok: true, data: { enabled: true, demo: true } });
  }

  /* ---- AI stream (SSE demo) ---- */
  if (p === '/api/ai/stream' && req.method === 'POST') {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', async () => {
      let msg = '', locale = 'uz', history = [];
      try { const j = JSON.parse(body); msg = (j.message || ''); locale = j.locale || 'uz'; history = j.history || []; } catch {}

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no',
      });
      const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));

      const { reply, steps, requestCreated, cards = [] } = demoAnswer(msg, locale, history);

      await wait(500);
      for (const st of steps) { send('step', st); await wait(450); }
      if (cards.length) { send('cards', { items: cards }); await wait(150); }

      // So'zma-so'z oqim
      const parts = reply.match(/\S+\s*/g) || [reply];
      for (const part of parts) {
        send('token', { text: part });
        await wait(28);
      }
      send('done', { steps, requestCreated, cards, cached: false });
      res.end();
    });
    return;
  }

  if (p === '/api/ai/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      let msg = '', locale = 'uz', history = [];
      try { const j = JSON.parse(body); msg = j.message || ''; locale = j.locale || 'uz'; history = j.history || []; } catch {}
      const { reply, steps, requestCreated, cards = [] } = demoAnswer(msg, locale, history);
      setTimeout(() => send(res, 200, { ok: true, data: { reply, steps, requestCreated, cards, demo: true } }), 900);
    });
    return;
  }

  if (p === '/api/requests' && req.method === 'POST') {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      console.log('📨 MOCK ariza:', body);
      send(res, 201, { ok: true, data: { id: 'mock', telegramSent: false } });
    });
    return;
  }

  send(res, 404, { ok: false, error: { message: 'Mock API: yoʻnalish yoʻq' } });
}).listen(PORT, '0.0.0.0', () =>
  console.log(`🧪 Mock API: http://0.0.0.0:${PORT} — ${categories.length} kategoriya, ${products.length} pozitsiya`)
);
