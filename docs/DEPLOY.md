# Deploy qo'llanmasi — Vercel (frontend) + Node hosting + Cloudflare (backend)

Docker ishlatilmaydi. Ikkala loyiha mustaqil deploy qilinadi.

---

## 0. Nima kerak bo'ladi

| Xizmat | Nima uchun | Bepul varianti |
|---|---|---|
| PostgreSQL | Ma'lumotlar bazasi | Neon.tech, Supabase |
| Redis | Kesh + refresh tokenlar | Upstash |
| imgbb.com | Rasmlar | Bepul API kalit |
| Telegram bot | Arizalar xabari | @BotFather |
| Node hosting | Backend | Railway, Render, Fly.io, VPS |
| Vercel | Frontend | Hobby plan |
| Cloudflare | DNS, proxy, CDN | Free plan |

---

## 1. Tayyorgarlik

### 1.1 PostgreSQL
Neon.tech'da loyiha yarating → **Connection string** ni nusxalang:
```
postgresql://user:pass@ep-xxx.neon.tech/medservice?sslmode=require
```

### 1.2 Redis
Upstash'da database yarating → **Redis URL** ni oling:
```
rediss://default:xxxx@eu1-xxx.upstash.io:6379
```

### 1.3 imgbb
https://api.imgbb.com/ → **Get API key**.

### 1.4 Telegram bot
1. Telegram'da **@BotFather** ga yozing → `/newbot` → nom bering → **token** oling.
2. Guruh yarating, botni **admin** qilib qo'shing.
3. Guruhga biror xabar yozing va oching:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   Javobdagi `chat.id` (manfiy son, masalan `-1001234567890`) — bu sizning `TELEGRAM_CHAT_ID`.

### 1.5 JWT sirlari
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Ikki marta ishga tushiring — access va refresh uchun alohida sir.

---

## 2. Backend deploy (`/server`)

### 2.1 Repo tayyorlash
```bash
cd server
git init && git add . && git commit -m "backend"
git remote add origin git@github.com:USER/medservice-api.git
git push -u origin main
```

### 2.2 Hosting sozlamalari (Railway / Render misolida)

| Sozlama | Qiymat |
|---|---|
| Build command | `npm install && npx prisma generate` |
| Start command | `npx prisma migrate deploy && npm start` |
| Node versiyasi | 20 yoki 22 (LTS) |
| Health check path | `/health` |

### 2.3 Environment variables

```env
NODE_ENV=production
PORT=4000
CORS_ORIGINS=https://commedical.uz,https://www.commedical.uz

DATABASE_URL=postgresql://...
REDIS_URL=rediss://...

JWT_ACCESS_SECRET=<64 belgili tasodifiy satr>
JWT_REFRESH_SECRET=<boshqa 64 belgili satr>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=30

IMGBB_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=-100...

CACHE_TTL=600

SEED_ADMIN_LOGIN=admin
SEED_ADMIN_PASSWORD=<kuchli parol>
SEED_ADMIN_NAME=Bosh administrator
```

### 2.4 Birinchi ishga tushirish
```bash
npx prisma migrate deploy   # jadvallar yaratiladi
npm run seed                # admin + demo kontent
```

> ❗ Seed'dan keyin **admin parolini albatta o'zgartiring** (admin panel → Mening profilim).

### 2.5 Tekshirish
```bash
curl https://api.commedical.uz/health
# {"ok":true,"data":{"status":"up",...}}
```

---

## 3. Cloudflare sozlamalari (backend uchun)

### 3.1 DNS
| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `api` | hosting bergan manzil | 🟠 **Proxied** |

### 3.2 SSL/TLS
**SSL/TLS → Overview → Full (strict)**

### 3.3 Kesh qoidalari (Rules → Cache Rules)

**Qoida 1 — API'ni keshlamaslik (yozish so'rovlari):**
- If: `URI Path starts with /api/` **and** `Request Method` is not `GET`
- Then: **Bypass cache**

**Qoida 2 — Ommaviy GET'larni chekka serverlarda keshlash:**
- If: `URI Path starts with /api/products` or `/api/categories` or `/api/settings`
- Then: **Eligible for cache**, Edge TTL: **Respect origin** (server `Cache-Control` yuboradi)

> Backend allaqachon `Cache-Control: public, s-maxage=..., stale-while-revalidate=86400` sarlavhasini yuboradi.

### 3.4 Xavfsizlik
- **Security → WAF → Rate limiting rules**: `/api/requests` uchun 10 req/min/IP.
- **Bot Fight Mode**: yoqing.
- **Speed → Optimization → Brotli**: yoqing.

---

## 4. Frontend deploy (`/web` → Vercel)

### 4.1 Repo
```bash
cd web
git init && git add . && git commit -m "web"
git remote add origin git@github.com:USER/medservice-web.git
git push -u origin main
```

### 4.2 Vercel'da import
**Add New → Project → Import Git Repository** → `medservice-web`.

Framework avtomatik **Next.js** deb aniqlanadi. Boshqa hech narsani o'zgartirish shart emas.

### 4.3 Environment variables (Production + Preview)

```env
NEXT_PUBLIC_API_URL=https://api.commedical.uz
NEXT_PUBLIC_SITE_URL=https://commedical.uz

# Zaxira kanal (backend yiqilganda brauzerdan to'g'ridan-to'g'ri Telegram'ga)
NEXT_PUBLIC_TG_FALLBACK_TOKEN=<alohida bot tokeni>
NEXT_PUBLIC_TG_FALLBACK_CHAT_ID=-100...

NEXT_PUBLIC_GOOGLE_VERIFICATION=<Search Console kodi>
NEXT_PUBLIC_YANDEX_VERIFICATION=<Yandex Webmaster kodi>
```

> ⚠️ **Zaxira token haqida:** `NEXT_PUBLIC_` prefiksli o'zgaruvchi brauzerda ko'rinadi. Shuning uchun bu yerga **asosiy bot tokenini qo'ymang** — faqat shu maqsad uchun yaratilgan, yagona guruhga yozadigan alohida bot ishlating. Eng yomon holatda kimdir shu guruhga xabar yubora oladi, boshqa hech narsa qila olmaydi. Bu xavf o'rniga "server yiqilganda ariza yo'qolmasligi" foydasi olinadi. Agar bu xavf sizga qabul qilib bo'lmas tuyulsa — bu ikkita o'zgaruvchini bo'sh qoldiring, fallback shunchaki o'chadi.

### 4.4 Domen
Vercel → **Settings → Domains** → `commedical.uz` va `www.commedical.uz` qo'shing.

Cloudflare DNS:
| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `@` | `cname.vercel-dns.com` | 🔘 **DNS only** |
| CNAME | `www` | `cname.vercel-dns.com` | 🔘 **DNS only** |

> Vercel o'zi CDN bo'lgani uchun asosiy domen **proxy'siz** (kulrang bulut) bo'lishi tavsiya etiladi — ikki qavat proxy keraksiz kechikish beradi. Faqat `api` subdomeni proxy ostida turadi.

---

## 5. Deploy'dan keyingi 10 ta tekshiruv

```bash
# 1. Backend tirikmi
curl https://api.commedical.uz/health

# 2. Ommaviy API
curl https://api.commedical.uz/api/categories | head -c 200

# 3. Kesh ishlayaptimi (ikkinchi so'rovda X-Cache: HIT)
curl -sI https://api.commedical.uz/api/products | grep -i x-cache

# 4. Sitemap
curl https://commedical.uz/sitemap.xml | head -20

# 5. robots.txt
curl https://commedical.uz/robots.txt

# 6. OG rasm generatsiyasi
curl -sI "https://commedical.uz/api/og?title=Test" | grep -i content-type
```

7. `https://commedical.uz/uz` — sayt ochiladimi, tillar almashadimi?
8. Ariza formasini to'ldiring — Telegram guruhiga xabar keldimi?
9. `https://commedical.uz/admin` — kirish ishlaydimi?
10. PageSpeed Insights'da bosh sahifani tekshiring (maqsad: mobil 90+).

---

## 5.1 Eski saytdan ko'chirish (migratsiya)

Amaldagi `commedical.uz` allaqachon ishlab turibdi, shuning uchun almashtirishni bosqichma-bosqich qiling:

1. Yangi saytni avval **vaqtinchalik domenda** (Vercel bergan `*.vercel.app`) to'liq tekshiring.
2. Eski saytning Google'dagi manzillarini ro'yxatga oling (Search Console → Sahifalar).
3. Eski URL'lar va yangi URL'lar mosligini yozing. Masalan:

| Eski | Yangi |
|---|---|
| `/` | `/uz` |
| `/uz`, `/ru` | `/uz`, `/ru` (o'zgarmaydi) |
| `/products` | `/uz/parts` |
| `/services` | `/uz/services` |
| `/faq` | `/uz` (FAQ bo'limi, `#faq` langari) |
| `/contact` | `/uz/contact` |

4. Mosliklarni `web/next.config.mjs` dagi `redirects()` ichiga **301** (`permanent: true`) sifatida qo'shing.
5. DNS'ni yangi saytga qaratganingizdan keyin Search Console'da yangi `sitemap.xml` ni yuboring.
6. 2–4 hafta davomida Search Console'da 404 xatolarini kuzatib boring va yetishmagan yo'naltirishlarni qo'shing.

> Domen o'zgarmayotgani (`commedical.uz` qoladi) uchun pozitsiyalar deyarli yo'qolmaydi —
> asosiysi eski manzillarni 301 bilan yangisiga ulash.

## 5.2 AI yordamchini yoqish — Groq (ixtiyoriy)

Groq tavsiya etiladi: tezligi juda yuqori va bepul limiti bor.

### 1-qadam: kalit olish

1. https://console.groq.com/keys ga kiring (Google akkaunt bilan ro'yxatdan o'tsa bo'ladi).
2. **Create API Key** → nom bering → kalitni nusxalang (`gsk_...` bilan boshlanadi).
   Kalit faqat bir marta ko'rsatiladi — saqlab qo'ying.

### 2-qadam: backend `.env`

```env
AI_PROVIDER=groq
AI_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```

Bo'ldi. Manzil va model avtomatik qo'yiladi:
`https://api.groq.com/openai/v1` va `llama-3.3-70b-versatile`.

### 3-qadam: serverni qayta ishga tushirish

```bash
npm start
curl https://api.commedical.uz/api/ai/status
# {"ok":true,"data":{"enabled":true,"provider":"groq"}}
```

Vidjet saytda avtomatik paydo bo'ladi.

### Model tanlash

| Model | Qachon |
|---|---|
| `llama-3.3-70b-versatile` | **Standart.** Sifatli javob, tool-calling ishonchli |
| `llama-3.1-8b-instant` | Juda tez va arzon — sodda savollar ko'p bo'lsa |
| `openai/gpt-oss-20b` | Muqobil variant |

O'zgartirish: `.env` ga `AI_MODEL=llama-3.1-8b-instant`.

> Model tool-calling'ni qo'llab-quvvatlashi shart — aks holda yordamchi bazadan
> ma'lumot ololmaydi va "band" javobini beraveradi.

### Groq'ning o'ziga xosliklari (kodda hisobga olingan)

| Xususiyat | Yechim |
|---|---|
| `max_tokens` o'rniga `max_completion_tokens` | `ai.provider.js` avtomatik to'g'ri maydonni yuboradi |
| Parallel tool-call hamma modelda ishlamaydi | `parallel_tool_calls: false` yuboriladi |
| Bepul limitda 429 tez-tez chiqadi | 429 va 5xx da bir marta avtomatik qayta uriniladi (`retry-after` hisobga olinadi) |
| Javobda `reasoning` kabi qo'shimcha maydonlar | Modelga qaytariladigan xabar faqat `role/content/tool_calls` bilan tozalanadi |

Har qanday xatolikda foydalanuvchi texnik xabarni ko'rmaydi — unga
"**yordamchi band**" deb yoziladi, log'da esa aniq sabab qoladi.

### Boshqa provayderlar

```env
# OpenAI
AI_PROVIDER=openai
AI_API_KEY=sk-...

# OpenRouter
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-...

# O'zining serveri (Ollama, vLLM va h.k.)
AI_PROVIDER=custom
AI_API_URL=http://127.0.0.1:11434/v1
AI_API_KEY=ollama
AI_MODEL=qwen2.5:14b
```

**Xarajatni nazorat qilish:**

| Chora | Qiymat |
|---|---|
| Limit | 30 xabar / soat / IP |
| Tarix | oxirgi 8 xabar |
| Javob uzunligi | `AI_MAX_TOKENS=500` |
| Tool sikli | maksimal 4 qadam |
| Tool natijasi | 3000 belgigacha kesiladi |
| Tool keshi (Redis) | 10 daqiqa |
| Javob keshi (Redis) | 1 soat — takroriy savolga 0 token |

### Streaming va Cloudflare

Javob SSE (`text/event-stream`) bilan keladi. Ishlashi uchun:

- backendda `compression` SSE yo'lida o'chirilgan (`app.js`), `X-Accel-Buffering: no` yuboriladi;
- Cloudflare'da `/api/ai/*` uchun **Cache Rules → Bypass cache** qo'ying;
- nginx orqasida bo'lsa: `proxy_buffering off;` va `proxy_read_timeout 120s;`.

Agar oqim bo'lak-bo'lak emas, birdan kelsa — oradagi proxy bufferlab turgan bo'ladi.

**O'chirish:** `AI_API_KEY` ni bo'sh qoldiring — vidjet yo'qoladi, sayt normal ishlayveradi.

## 6. SEO ishga tushirish

1. **Google Search Console**: domenni qo'shing → `sitemap.xml` yuboring.
2. **Yandex Webmaster** (O'zbekistonda muhim): domenni qo'shing → sitemap yuboring → **Регионы** bo'limida O'zbekistonni belgilang.
3. **Google Business Profile**: kompaniya kartochkasini yarating (LocalBusiness JSON-LD allaqachon saytda bor).
4. Bir haftadan keyin Search Console'da indekslanish holatini tekshiring.

---

## 7. Kundalik xizmat ko'rsatish

| Vazifa | Davriylik |
|---|---|
| Bazani zaxiralash (backup) | Har kuni (hosting avtomatik) |
| Arizalarni ko'rib chiqish | Har kuni |
| `npm outdated` va yangilanishlar | Oyiga bir marta |
| Core Web Vitals tekshiruvi | Oyiga bir marta |
| Admin parolini yangilash | Yiliga bir marta |

---

## 8. Muammolarni bartaraf etish

**Sayt ochiladi, lekin mahsulotlar yo'q.**
Backend yiqilgan. `https://api.commedical.uz/health` ni tekshiring. Frontend eski keshni ko'rsatib turadi — mijoz "sayt ishlamayapti" demaydi.

**Admin panelga kira olmayapman ("CORS" xatosi).**
`CORS_ORIGINS` ichida frontend domeni bormi? Vergul bilan, probelsiz yozilgan bo'lishi kerak.

**Rasm yuklanmayapti.**
`IMGBB_API_KEY` to'g'rimi? Backend loglarini ko'ring.

**Telegram'ga xabar bormayapti.**
1) Bot guruhda **admin**mi? 2) `TELEGRAM_CHAT_ID` manfiy sonmi? 3) Admin panel → Arizalar bo'limida xato matni ko'rinadi.

**Sahifa yangi mahsulotni ko'rsatmayapti.**
Redis keshi admin o'zgartirganda darhol tozalanadi, lekin Next.js ISR 5 daqiqagacha eski sahifani ko'rsatishi mumkin. Kutib turing yoki Vercel'da **Redeploy** qiling.
