# COM MEDICAL SERVIS — tibbiy apparatlar servisi + zapchast katalogi

> Amaldagi `commedical.uz` saytining yangi versiyasi. Kompaniya nomi, kontaktlari, xizmatlar
> ro'yxati va uskuna yo'nalishlari eski saytdan olingan; struktura, dizayn, SEO va admin panel
> qaytadan yozilgan.

Ikkita mustaqil loyiha: **`/server`** (Node.js API) va **`/web`** (Next.js sayt + admin panel).
Docker yo'q — `/web` Vercel'ga, `/server` istalgan Node hostingga (Cloudflare proxy ostida) chiqadi.

```
medservice/
├── server/                         # Node 20 + Express + Prisma + PostgreSQL + Redis
│   ├── prisma/
│   │   ├── schema.prisma           # 3 tilli modellar (Product, Category, SiteSetting, Request, Admin, AuditLog)
│   │   ├── seed-data.mjs           # kontent (seed va mock API shundan o'qiydi)
│   │   └── seed.js                 # admin + 8 kategoriya + 8 xizmat + 15 zapchast
│   ├── dev-mock-api.mjs            # faqat lokal ko'rish uchun (DB'siz demo)
│   └── src/
│       ├── index.js                # bootstrap + graceful shutdown
│       ├── app.js                  # helmet, cors, compression, marshrutlar
│       ├── config/env.js           # .env zod validatsiyasi
│       ├── lib/                    # prisma, redis, jwt, imgbb, telegram, audit, logger, utils
│       ├── middleware/             # auth, cache, rateLimit, validate, error
│       └── modules/                # auth · categories · products · settings · requests · upload · audit · ai
│
├── web/                            # Next.js 15 (App Router, RSC), Tailwind, Framer Motion, SWR
│   └── src/
│       ├── app/
│       │   ├── [locale]/           # uz | ru | uz-cyrl
│       │   │   ├── services/       # XIZMATLAR — narxsiz, "nimalar kiradi" ro'yxati
│       │   │   ├── parts/          # ZAPCHASTLAR — rasm, artikul, davlat, spec, narx
│       │   ├── admin/              # login, dashboard, mahsulotlar, kategoriyalar, arizalar, sozlamalar, profil
│       │   ├── api/og/             # dinamik OG rasm (ImageResponse)
│       │   ├── sitemap.js · robots.js · manifest.js
│       ├── components/             # ui · layout · home · catalog · forms · admin
│       ├── public/equipment/       # uskuna suratlari (uzi, ekg, ivl, defib, sterilizator, lab, nasos)
│       ├── i18n/                   # uz.js · ru.js · uz-Cyrl.js (har biri alohida yozilgan)
│       ├── lib/                    # api (RSC) · client-api (SWR+IndexedDB) · admin-api · seo · legal · utils
│       └── styles/globals.css      # dizayn tokenlari, komponent qatlami
│
└── docs/
    ├── ADMIN-QOLLANMA-UZ.md
    ├── ADMIN-QOLLANMA-RU.md
    ├── ADMIN-QOLLANMA-UZ-CYRL.md
    └── DEPLOY.md
```

## Tez ishga tushirish (lokal)

**Backend:**
```bash
cd server
cp .env.example .env      # DATABASE_URL, REDIS_URL, IMGBB_API_KEY, TELEGRAM_* to'ldiring
npm install
npx prisma migrate dev
npm run seed
npm run dev               # http://localhost:4000
```

**Frontend:**
```bash
cd web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:3000
```

**DB'siz demo ko'rish:**
```bash
cd server && node dev-mock-api.mjs        # 4000-portda soxta API
cd web && NEXT_PUBLIC_API_URL= API_PROXY_TARGET=http://localhost:4000 npm run dev
```

## Asosiy yechimlar

### Ikkita alohida bo'lim

| | Xizmatlar (`/services`) | Zapchastlar (`/parts`) |
|---|---|---|
| Narx | **ko'rsatilmaydi** — diagnostikadan keyin aytiladi | ko'rsatiladi (UZS/USD, izoh bilan) |
| Asosiy kontent | "Nimalar kiradi" raqamlangan ro'yxati (3 tilda), muddat, kafolat | rasm, artikul, brend, model, **ishlab chiqarilgan davlat**, zavod, holati (yangi/tiklangan), xarakteristikalar jadvali, moslik ro'yxati |
| Ko'rinish | chiziqli ro'yxat, ish tarkibi ochiq | jadval / kartalar (almashtiriladi) + brend, davlat va guruh bo'yicha filtr |
| Ombor | — | **ko'rsatilmaydi** — "istalgan miqdorda olib kelib beramiz" deb yoziladi |
| Muddat | **ko'rsatilmaydi** — telefonda aytiladi | — |

> Sayt bo'ylab **bajarilish muddati** (necha kun/soat) va **ish soatlari** ko'rsatilmaydi.
> Bu maydonlar admin paneldan ham olib tashlangan. Kafolat muddati (6–12 oy) saqlanadi.
> DB'dagi `leadTime*` va `workHours*` ustunlari qoldi, lekin ishlatilmaydi.
| DB maydonlari | `includesUz/Ru/UzCyrl`, `leadTime*` | `originCountry`, `manufacturer`, `condition`, `partType`, `packQty`, `specs` (JSON), `compatibility` |

**Zapchast guruhlari** (eski saytdagi "Sensorlar / Ekranlar / Quvvat bloklari" bo'linishi):
`SENSOR`, `SCREEN`, `POWER`, `CABLE`, `MECHANICAL`, `CONSUMABLE`, `OTHER` — katalogda filtr sifatida ishlaydi.

### Eski saytdan ko'chirilgan kontent

| Nima | Manba |
|---|---|
| Kompaniya nomi, telefon (+998 90 275-88-83), pochta, manzil, ish vaqti (8:30–18:00) | commedical.uz kontakt bo'limi |
| 6 ta xizmat: Ta'mirlash, Diagnostika, Kalibrovka, Profilaktika, O'rnatish va o'qitish, Zapchast yetkazib berish | commedical.uz "Xizmatlar" |
| 7 ta uskuna yo'nalishi (UZI, EKG, Defibrillator, Sterilizator, IVL, Laboratoriya, Nasos) | commedical.uz "Qaysi apparatlar?" |
| 5 ta FAQ savoli (javoblar kengaytirilgan) | commedical.uz FAQ |
| 3 ta mijoz sharhi | commedical.uz "Mijozlar fikri" |
| "Avval smeta — keyin ta'mir" tamoyili, 6–12 oy kafolat | commedical.uz "Nega biz?" |

> FAQ va sharhlar hozircha `src/i18n/*.js` fayllarida statik saqlanadi (3 tilda).
> Ular admin panel orqali tahrirlanmaydi — kerak bo'lsa alohida model qo'shiladi.

### AI yordamchi

Saytning pastki o'ng burchagida chat vidjeti. Modelga **butun baza berilmaydi** — u kerakli
ma'lumotni tool orqali so'rab oladi:

| Tool | Nima qiladi | Nima qaytaradi |
|---|---|---|
| `list_services` | xizmatlar ro'yxati | slug + nom + 110 belgigacha tavsif |
| `get_service` | bitta xizmat | "nimalar kiradi" (maks 8 punkt), muddat, kafolat |
| `search_parts` | zapchast qidirish — **narx oralig'i, brend, guruh, saralash** bilan | maks 6 ta: nom, artikul, brend, **narx**, davlat |
| `compare_parts` | 2–3 zapchastni yonma-yon solishtirish | narx farqi, eng arzoni, xarakteristikalar |
| `recommend_parts` | **nosozlik belgisi bo'yicha tavsiya** | ehtimoliy sabab + mos qismlar |
| `get_part` | bitta zapchast | narx, davlat, 6 ta xarakteristika, moslik |
| `get_contacts` | telefon/manzil/ish vaqti | qisqa obyekt |
| `create_request` | ariza yaratish | DB + Telegram (ism va telefon bo'lsa) |

**Streaming:** javob `POST /api/ai/stream` orqali SSE bilan token-token keladi
(`event: step` — qaysi tool ishlayapti, `event: token` — matn bo'lagi, `event: done` — yakun).
`/api/ai/chat` stream'siz zaxira sifatida qoladi.

**Token keshi (2 qavat):**

| Kesh | Nima saqlanadi | TTL | Foyda |
|---|---|---|---|
| Tool keshi | bazadan olingan natija (xizmatlar, zapchastlar, kontakt) | 10 daq | baza va model qayta chaqirilmaydi |
| Javob keshi | tez-tez beriladigan savolning tayyor javobi (faqat suhbat boshida) | 1 soat | **0 token** — model umuman chaqirilmaydi |
| Provayder keshi | o'zgarmas system prompt prefiksi | provayder | kirish tokenlari arzonlashadi |

`create_request` hech qachon keshlanmaydi.

**Narx va tavsiya:** model zapchast narxlarini bazadan ko'radi va shu asosda maslahat beradi —
byudjetga moslash (`maxPrice`), arzon/qimmat variantni solishtirish, nosozlik belgisidan
(«ekranda chiziq», «yonmayapti», «shovqin bor») kerakli qism guruhini aniqlash. Nosozlik→qism
jadvali kodda saqlanadi (`SYMPTOM_MAP`), shuning uchun model o'zidan taxmin qilmaydi.
Javob bilan birga chatda **mahsulot kartalari** chiqadi (rasm, artikul, narx, davlat, havola) —
`event: cards` orqali.

**Ariza rasmiylashtirish:** model mijozdan ismi va telefon raqamini so'raydi, ikkalasi kelgach
`create_request` tool'ini chaqiradi — ariza bazaga yoziladi va Telegramga ketadi. Raqam istalgan
ko'rinishda bo'lishi mumkin (`90 275 88 83` → `+998902758883`). UI'da yashil tasdiq kartasi chiqadi.

Kontekstni cheklash: tizim ko'rsatmasi qisqa va o'zgarmas, tarixdan faqat **oxirgi 8 xabar**, har bir xabar
700 belgigacha, tool natijasi 3000 belgigacha kesiladi, `AI_MAX_TOKENS=500`, sikl **4 qadam** bilan cheklangan.

Xatolik holati: model javob bermasa yoki xato qaytarsa — foydalanuvchi texnik xatoni ko'rmaydi,
"**yordamchi band**" xabari chiqadi. Limit: 30 xabar / soat / IP.

Sozlash — ikki qator yetadi (Groq misolida):

```env
AI_PROVIDER=groq          # groq | openai | openrouter | custom
AI_API_KEY=gsk_...        # https://console.groq.com/keys
```

Manzil va model presetdan olinadi (`src/modules/ai/ai.provider.js`): Groq uchun
`llama-3.3-70b-versatile`. Groq'ning o'ziga xosliklari hisobga olingan —
`max_completion_tokens`, `parallel_tool_calls: false`, 429/5xx da avtomatik qayta urinish.
`AI_API_KEY` bo'sh bo'lsa vidjet umuman ko'rinmaydi.

| Talab | Qanday bajarilgan |

### Ikonkalar

- **lucide-react** — interfeys va uskuna ikonkalari (tree-shaking bilan, faqat ishlatilgani bundle'ga tushadi)
- **react-icons/si** — brend ikonkalari (Telegram, Instagram, YouTube, WhatsApp) — lucide v1 da ular yo'q

Barchasi `components/ui/Icons.jsx` dagi yupqa qatlam orqali: `<Icon name="phone" size={16} />`.
Bazadagi `iconKey` (uzi, ekg, ivl, defib, sterilizator, lab, nasos) shu yerda lucide komponentiga bog'lanadi.

### Dizayn yo'nalishi

"Texnik katalog / datasheet": ingichka hairline chiziqlar, o'tkir burchaklar (2–6px), mono mikro-yorliqlar
(`kicker`), raqamlangan bo'limlar, blueprint to'r fon, zich jadval ritmi. Gradient blob, glassmorphism,
pill-tugmalar va emoji — yo'q. Akcent rang faqat dodgerblue tekis blok sifatida.

### AI yordamchi

Saytning pastki o'ng burchagida chat vidjeti. Modelga **butun baza berilmaydi** — u kerakli
ma'lumotni tool orqali so'rab oladi:

| Tool | Nima qiladi | Nima qaytaradi |
|---|---|---|
| `list_services` | xizmatlar ro'yxati | slug + nom + 110 belgigacha tavsif |
| `get_service` | bitta xizmat | "nimalar kiradi" (maks 8 punkt), muddat, kafolat |
| `search_parts` | zapchast qidirish — **narx oralig'i, brend, guruh, saralash** bilan | maks 6 ta: nom, artikul, brend, **narx**, davlat |
| `compare_parts` | 2–3 zapchastni yonma-yon solishtirish | narx farqi, eng arzoni, xarakteristikalar |
| `recommend_parts` | **nosozlik belgisi bo'yicha tavsiya** | ehtimoliy sabab + mos qismlar |
| `get_part` | bitta zapchast | narx, davlat, 6 ta xarakteristika, moslik |
| `get_contacts` | telefon/manzil/ish vaqti | qisqa obyekt |
| `create_request` | ariza yaratish | DB + Telegram (ism va telefon bo'lsa) |

**Streaming:** javob `POST /api/ai/stream` orqali SSE bilan token-token keladi
(`event: step` — qaysi tool ishlayapti, `event: token` — matn bo'lagi, `event: done` — yakun).
`/api/ai/chat` stream'siz zaxira sifatida qoladi.

**Token keshi (2 qavat):**

| Kesh | Nima saqlanadi | TTL | Foyda |
|---|---|---|---|
| Tool keshi | bazadan olingan natija (xizmatlar, zapchastlar, kontakt) | 10 daq | baza va model qayta chaqirilmaydi |
| Javob keshi | tez-tez beriladigan savolning tayyor javobi (faqat suhbat boshida) | 1 soat | **0 token** — model umuman chaqirilmaydi |
| Provayder keshi | o'zgarmas system prompt prefiksi | provayder | kirish tokenlari arzonlashadi |

`create_request` hech qachon keshlanmaydi.

**Narx va tavsiya:** model zapchast narxlarini bazadan ko'radi va shu asosda maslahat beradi —
byudjetga moslash (`maxPrice`), arzon/qimmat variantni solishtirish, nosozlik belgisidan
(«ekranda chiziq», «yonmayapti», «shovqin bor») kerakli qism guruhini aniqlash. Nosozlik→qism
jadvali kodda saqlanadi (`SYMPTOM_MAP`), shuning uchun model o'zidan taxmin qilmaydi.
Javob bilan birga chatda **mahsulot kartalari** chiqadi (rasm, artikul, narx, davlat, havola) —
`event: cards` orqali.

**Ariza rasmiylashtirish:** model mijozdan ismi va telefon raqamini so'raydi, ikkalasi kelgach
`create_request` tool'ini chaqiradi — ariza bazaga yoziladi va Telegramga ketadi. Raqam istalgan
ko'rinishda bo'lishi mumkin (`90 275 88 83` → `+998902758883`). UI'da yashil tasdiq kartasi chiqadi.

Kontekstni cheklash: tizim ko'rsatmasi qisqa va o'zgarmas, tarixdan faqat **oxirgi 8 xabar**, har bir xabar
700 belgigacha, tool natijasi 3000 belgigacha kesiladi, `AI_MAX_TOKENS=500`, sikl **4 qadam** bilan cheklangan.

Xatolik holati: model javob bermasa yoki xato qaytarsa — foydalanuvchi texnik xatoni ko'rmaydi,
"**yordamchi band**" xabari chiqadi. Limit: 30 xabar / soat / IP.

Sozlash — ikki qator yetadi (Groq misolida):

```env
AI_PROVIDER=groq          # groq | openai | openrouter | custom
AI_API_KEY=gsk_...        # https://console.groq.com/keys
```

Manzil va model presetdan olinadi (`src/modules/ai/ai.provider.js`): Groq uchun
`llama-3.3-70b-versatile`. Groq'ning o'ziga xosliklari hisobga olingan —
`max_completion_tokens`, `parallel_tool_calls: false`, 429/5xx da avtomatik qayta urinish.
`AI_API_KEY` bo'sh bo'lsa vidjet umuman ko'rinmaydi.

| Talab | Qanday bajarilgan |
|---|---|
| 3 til | DB'da `*Uz / *Ru / *UzCyrl` ustunlar; UI matnlari `src/i18n/`; URL `/uz`, `/ru`, `/uz-cyrl`; `hreflang` + `x-default` |
| Server keshi | Redis, `cached()` middleware; admin CRUD'dan keyin `invalidate(scope)` — bog'liq kalitlar SCAN bilan darhol tozalanadi |
| Klient keshi | SWR + IndexedDB (`idb-keyval`); server yiqilsa eski kesh ko'rsatiladi (`isStale` belgisi bilan) |
| Ariza fallback | API → xato/timeout → brauzerdan to'g'ridan-to'g'ri Telegram `sendMessage` |
| Rate limit | 300/15daq (ommaviy GET), 100/15daq (umumiy), **3/soat** (ariza), 10/15daq (login) + honeypot |
| Rasmlar | imgbb API; serverda fayl saqlanmaydi; `next.config` da `i.ibb.co` ruxsat etilgan |
| SEO | Har sahifada dinamik metadata, canonical, OG/Twitter, dinamik OG rasm, `sitemap.xml`, `robots.txt`, JSON-LD (Organization, LocalBusiness, WebSite, Service/Product, BreadcrumbList) |
| Xavfsizlik | JWT access(15m)+refresh(Redis, rotatsiya), bcrypt(12), zod validatsiya, helmet, CORS allowlist, global error handler, audit log |
| Tezlik | RSC + ISR, `next/image` (AVIF/WebP), code splitting, prefetch, faqat transform/opacity animatsiyalar, `prefers-reduced-motion` |

## API xulosasi

| Metod | Yo'nalish | Kim |
|---|---|---|
| GET | `/api/settings`, `/api/categories`, `/api/categories/:slug` | hamma (keshlangan) |
| GET | `/api/products?kind=PART&brand=&country=&inStock=` | hamma (keshlangan) |
| GET | `/api/products/:slug`, `/api/products/meta/slugs` | hamma (keshlangan) |
| GET | `/api/products/meta/filters` — brend, davlat va zapchast guruhlari | hamma (keshlangan) |
| POST | `/api/requests` | hamma (3/soat/IP) |
| POST | `/api/auth/login` · `/refresh` · `/logout` | — |
| GET/PATCH | `/api/auth/me` | admin |
| CRUD | `/api/products`, `/api/categories` | admin |
| PATCH | `/api/settings` | admin |
| GET/PATCH/DELETE | `/api/requests`, `/api/requests/stats/summary` | admin |
| POST | `/api/upload`, `/api/upload/multiple` | admin |
| GET | `/api/audit` | admin |
| GET | `/api/ai/status` | hamma |
| POST | `/api/ai/stream` — SSE oqim | hamma (30/soat/IP) |
| POST | `/api/ai/chat` — stream'siz zaxira | hamma (30/soat/IP) |

Batafsil: [`docs/DEPLOY.md`](docs/DEPLOY.md) va admin qo'llanmalari.
#   C O M - M E D v 2  
 