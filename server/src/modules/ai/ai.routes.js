// AI yordamchisi: streaming (SSE) + tool-calling + keshlash.
//
// Oqim (stream) qanday ishlaydi:
//   1. Klient POST /api/ai/stream yuboradi
//   2. Server SSE ochadi va bosqichlarni jo'natadi:
//        event: step   — model qaysi tool'ni chaqirgani (UI'da "bazadan qidiryapman")
//        event: token  — javob matnining bo'lagi (jonli chiqadi)
//        event: done   — yakun (ariza yaratildimi, keshdanmi va h.k.)
//        event: error  — texnik xato (UI "band" xabarini ko'rsatadi)
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { ah } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { logger } from '../../lib/logger.js';
import { clientIp } from '../../lib/utils.js';
import { toolSchemas, toolLabels, runTool } from './ai.tools.js';
import { getAiConfig, buildPayload, classifyError } from './ai.provider.js';
import {
  getToolCache, setToolCache, getAnswerCache, setAnswerCache,
} from './ai.cache.js';

export const aiRouter = Router();

const MAX_STEPS = 4;
const MAX_HISTORY = 8;
const MAX_MSG_LEN = 700;

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => clientIp(req) || 'unknown',
  message: {
    ok: false,
    error: { code: 'AI_RATE_LIMITED', message: 'Siz koʻp savol berdingiz. Biroz kuting yoki telefon orqali bogʻlaning.' },
  },
});

const BUSY = {
  uz: 'Hozir yordamchi band — biroz kuting yoki telefon orqali bogʻlaning. Ariza qoldirsangiz, oʻzimiz qoʻngʻiroq qilamiz.',
  ru: 'Ассистент сейчас занят — подождите немного или позвоните нам. Оставите заявку — перезвоним сами.',
  'uz-Cyrl': 'Ҳозир ёрдамчи банд — бироз кутинг ёки телефон орқали боғланинг. Ариза қолдирсангиз, ўзимиз қўнғироқ қиламиз.',
};

const OFF = {
  uz: 'AI yordamchi hozircha yoqilmagan. Savolingizni telefon orqali bering — tez javob beramiz.',
  ru: 'AI-ассистент пока не подключён. Задайте вопрос по телефону — быстро ответим.',
  'uz-Cyrl': 'AI ёрдамчи ҳозирча ёқилмаган. Саволингизни телефон орқали беринг.',
};

/* ------------------------------------------------------------------ */
/*  Tizim ko'rsatmasi                                                  */
/*  DIQQAT: matn o'zgarmas bo'lishi kerak — provayderlar bir xil       */
/*  prefiksni o'z tomonida keshlaydi (prompt caching), bu tokenni      */
/*  arzonlashtiradi. Shuning uchun bu yerga sana/tasodifiy narsa       */
/*  qo'shilmaydi.                                                      */
/* ------------------------------------------------------------------ */
function systemPrompt(locale) {
  const lang = locale === 'ru' ? 'русском' : locale === 'uz-Cyrl' ? 'ўзбек (кирилл)' : 'oʻzbek (lotin)';

  return [
    'Sen COM MEDICAL SERVIS kompaniyasining sayt yordamchisisan.',
    'Kompaniya tibbiy apparatlarni (UZI, EKG, IVL, defibrillator, sterilizator, laboratoriya, infuzion nasos)',
    "ta'mirlaydi, diagnostika va kalibrovka qiladi hamda original zapchast sotadi. Manzil: Namangan.",
    '',
    `Javobni faqat ${lang} tilida yoz.`,
    '',
    'QOIDALAR:',
    "1. Ma'lumotni o'zingdan to'qima. Xizmat yoki zapchast haqida savol bo'lsa — avval mos tool'ni chaqir.",
    '2. Xizmat narxini HECH QACHON aytma. Narx diagnostikadan keyin belgilanadi — shuni tushuntir.',
    '3. Zapchast narxini faqat bazadan kelgan qiymat bilan ayt.',
    '4. Ombor holati haqida gapirma. "Omborda bor/yo\'q" dema, son aytma.',
    '   Har doim: zapchast buyurtma bo\'yicha, mijoz nechta xohlasa shuncha olib kelinadi.',
    "5. Muddat va vaqt haqida VA'DA BERMA: necha kunda tayyor bo'lishi, necha soatda yetib borish,",
    '   ish soatlari — bularning hech birini aytma. "Muddatni operator aytadi" deb yoz.',
    '6. Qisqa yoz: 2–5 jumla yoki 3–5 punktli ro\'yxat. Hammasini birdan to\'kib tashlama.',
    '7. Markdown: **qalin**, "- " ro\'yxat, [matn](/uz/parts/slug) havola. Sarlavha (#) va jadval ishlatma.',
    '',
    'NARX VA TAVSIYA (zapchastlar):',
    '7a. Zapchast narxini har doim bazadan olingan qiymat bilan yoz. Taxmin qilma, yaxlitlama.',
    '7b. Mijoz muammoni tasvirlasa (ekranda chiziq, yonmayapti, shovqin...) — recommend_parts chaqir',
    '    va nima uchun aynan shu qism kerakligini bir jumlada tushuntir.',
    '7c. Bir nechta variant bo\'lsa — arzon va qimmatini solishtir (compare_parts), farqini ayt:',
    '    davlat, kafolat, original yoki tiklangan. Tanlovni mijozga qoldir, o\'zing majburlama.',
    '7d. Mijoz byudjet aytsa ("10 mln gacha") — search_parts ga maxPrice berib qidir.',
    '7e. Har bir tavsiyada zapchast havolasini ber. Narxni "taxminan" deb yozma — u aniq narx.',
    '7f. Zapchast almashtirishdan oldin bepul diagnostikani tavsiya qil — noto\'g\'ri qism sotib',
    '    olinmasligi uchun. Bu majburiy emas, lekin foydali maslahat.',
    '',
    'ARIZA RASMIYLASHTIRISH (muhim):',
    '8. Mijoz narx, muddat yoki chaqiruv haqida so\'rasa — unga ariza qoldirishni taklif qil.',
    '9. Ariza uchun ikkita narsa kerak: ISM va TELEFON RAQAM.',
    "   Ikkalasi ham bo'lmaguncha create_request'ni CHAQIRMA. Yetishmaganini muloyim so'ra:",
    '   masalan "Ismingiz va telefon raqamingizni yozing — operatorga uzataman."',
    '10. Ikkalasi ham bo\'lgach create_request chaqir. Mavzuni (qaysi uskuna/zapchast haqida',
    '    gaplashilgan bo\'lsa) topic sifatida uzat.',
    '11. Tool "ok" qaytarsa — mijozga tasdiq ber: arizasi qabul qilingani va operator',
    '    bog\'lanishini ayt. Yana bir marta yubormoqchi bo\'lma.',
    '',
    '12. Tibbiy maslahat berma. Bilmasang — "aniq aytolmayman, operator bilan bog\'laylikmi?" deb yoz.',
  ].join('\n');
}

const bodySchema = z.object({
  message: z.string().trim().min(1).max(MAX_MSG_LEN),
  locale: z.enum(['uz', 'ru', 'uz-Cyrl']).default('uz'),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(MAX_MSG_LEN) }))
    .max(20)
    .default([]),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/*  Provayder bilan ishlash                                            */
/* ------------------------------------------------------------------ */

/** Oddiy (stream'siz) so'rov — /chat endpointi va zaxira uchun */
async function callModel(cfg, messages, { tools = true, attempt = 0 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(`${cfg.url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify(buildPayload(cfg, messages, tools ? toolSchemas : null)),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const info = classifyError(res.status, text, res.headers.get('retry-after'));
      logger.warn({ status: res.status, provider: cfg.provider, info: info.message }, 'AI provayder xatosi');
      if (info.retryable && attempt < 1) {
        clearTimeout(timer);
        await sleep(info.waitMs);
        return callModel(cfg, messages, { tools, attempt: attempt + 1 });
      }
      throw Object.assign(new Error(info.message), { status: res.status });
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Streaming so'rov. Generator sifatida hodisa qaytaradi:
 *   { type: 'content', text }      — matn bo'lagi
 *   { type: 'tool_calls', calls }  — model tool chaqirmoqchi
 */
async function* streamModel(cfg, messages, { tools = true, attempt = 0 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40_000);

  let res;
  try {
    res = await fetch(`${cfg.url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({ ...buildPayload(cfg, messages, tools ? toolSchemas : null), stream: true }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }

  if (!res.ok) {
    clearTimeout(timer);
    const text = await res.text().catch(() => '');
    const info = classifyError(res.status, text, res.headers.get('retry-after'));
    logger.warn({ status: res.status, provider: cfg.provider, info: info.message }, 'AI stream xatosi');
    if (info.retryable && attempt < 1) {
      await sleep(info.waitMs);
      yield* streamModel(cfg, messages, { tools, attempt: attempt + 1 });
      return;
    }
    throw Object.assign(new Error(info.message), { status: res.status });
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const acc = []; // tool_call'lar bo'laklab keladi — indeks bo'yicha yig'amiz

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;

        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;

        let j;
        try { j = JSON.parse(payload); } catch { continue; }

        const delta = j.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.content) yield { type: 'content', text: delta.content };

        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const i = tc.index ?? 0;
            acc[i] = acc[i] || { id: '', name: '', args: '' };
            if (tc.id) acc[i].id = tc.id;
            if (tc.function?.name) acc[i].name += tc.function.name;
            if (tc.function?.arguments) acc[i].args += tc.function.arguments;
          }
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }

  const calls = acc.filter((c) => c && c.name);
  if (calls.length) yield { type: 'tool_calls', calls };
}

/**
 * Tool natijasidan chatda ko'rsatiladigan mahsulot kartalarini ajratib olish.
 * Model matnda havola bersa ham, foydalanuvchi rasm va narxni darhol ko'radi.
 */
function extractCards(name, out) {
  if (!out || out.error) return [];
  if (['search_parts', 'recommend_parts', 'compare_parts'].includes(name)) {
    return (out.items || []).filter((x) => x?.slug).slice(0, 4);
  }
  if (name === 'get_part' && out._card) return [out._card];
  return [];
}

/** Tool'ni kesh bilan bajarish */
async function runToolCached(name, args, ctx, steps, locale) {
  const label = toolLabels[name]?.[locale] || name;

  const cached = await getToolCache(name, args, locale);
  if (cached) {
    steps.push({ tool: name, label, cached: true });
    return cached;
  }

  steps.push({ tool: name, label });
  const out = await runTool(name, args, ctx);
  if (!out?.error) await setToolCache(name, args, locale, out);
  return out;
}

/* ------------------------------------------------------------------ */
/*  POST /api/ai/stream — asosiy endpoint (SSE)                        */
/* ------------------------------------------------------------------ */
aiRouter.post(
  '/stream',
  aiLimiter,
  validate({ body: bodySchema }),
  ah(async (req, res) => {
    const { message, locale, history } = req.body;

    // --- SSE sarlavhalari ---
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx bufferlamasin
    });
    res.flushHeaders?.();

    const send = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      res.flush?.(); // compression middleware bo'lsa ham darhol ketsin
    };

    const cfg = getAiConfig();
    if (!cfg.enabled) {
      send('token', { text: OFF[locale] });
      send('done', { disabled: true, steps: [] });
      return res.end();
    }

    const ctx = {
      locale,
      urlLocale: locale === 'uz-Cyrl' ? 'uz-cyrl' : locale,
      ip: clientIp(req),
    };

    // --- 1) Javob keshi: model umuman chaqirilmaydi ---
    const cachedAnswer = await getAnswerCache(locale, message, history.length);
    if (cachedAnswer) {
      for (const step of cachedAnswer.steps || []) send('step', { ...step, cached: true });
      if (cachedAnswer.cards?.length) send('cards', { items: cachedAnswer.cards });
      // Keshdan ham "yozilayotgandek" chiqaramiz — sakrab paydo bo'lmasin
      const chunks = cachedAnswer.reply.match(/[\s\S]{1,24}/g) || [];
      for (const c of chunks) {
        send('token', { text: c });
        await sleep(12);
      }
      send('done', { steps: cachedAnswer.steps || [], cards: cachedAnswer.cards || [], cached: true, requestCreated: false });
      return res.end();
    }

    const messages = [
      { role: 'system', content: systemPrompt(locale) },
      ...history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const steps = [];
    let requestCreated = false;
    let fullText = '';
    let allCards = [];

    // Ulanish uzilsa — ortiqcha ish qilmaymiz
    let aborted = false;
    req.on('close', () => { aborted = true; });

    try {
      for (let round = 0; round < MAX_STEPS; round += 1) {
        if (aborted) return;

        let calls = null;
        let roundText = '';

        for await (const ev of streamModel(cfg, messages, { tools: round < MAX_STEPS - 1 })) {
          if (aborted) return;
          if (ev.type === 'content') {
            roundText += ev.text;
            fullText += ev.text;
            send('token', { text: ev.text });
          } else if (ev.type === 'tool_calls') {
            calls = ev.calls;
          }
        }

        // Tool chaqiruvi yo'q — javob tugadi
        if (!calls?.length) break;

        messages.push({
          role: 'assistant',
          content: roundText,
          tool_calls: calls.map((c) => ({
            id: c.id || `call_${round}_${c.name}`,
            type: 'function',
            function: { name: c.name, arguments: c.args || '{}' },
          })),
        });

        // Tool'larni ketma-ket bajaramiz (kesh bilan)
        for (const c of calls) {
          if (aborted) return;
          let args = {};
          try { args = JSON.parse(c.args || '{}'); } catch { /* noto'g'ri JSON */ }

          const out = await runToolCached(c.name, args, ctx, steps, locale);
          if (c.name === 'create_request' && out?.ok) requestCreated = true;

          send('step', steps[steps.length - 1]);

          // Zapchast kartalari — matn bilan birga vizual ko'rinish
          const cards = extractCards(c.name, out);
          if (cards.length) {
            allCards = cards;
            send('cards', { items: cards });
          }

          messages.push({
            role: 'tool',
            tool_call_id: c.id || `call_${round}_${c.name}`,
            content: JSON.stringify(out).slice(0, 3000),
          });
        }
      }

      const reply = fullText.trim();
      if (!reply) {
        send('token', { text: BUSY[locale] });
      } else {
        await setAnswerCache(locale, message, history.length, { reply, steps, requestCreated, cards: allCards });
      }

      send('done', { steps, requestCreated, cards: allCards, cached: false });
      res.end();
    } catch (e) {
      logger.error({ err: e.message, status: e.status, provider: cfg.provider }, 'AI stream xatosi');
      // Foydalanuvchi texnik xatoni ko'rmaydi
      if (!fullText) send('token', { text: BUSY[locale] });
      send('done', { steps, busy: true, requestCreated });
      res.end();
    }
  })
);

/* ------------------------------------------------------------------ */
/*  POST /api/ai/chat — stream'siz zaxira variant                      */
/* ------------------------------------------------------------------ */
aiRouter.post(
  '/chat',
  aiLimiter,
  validate({ body: bodySchema }),
  ah(async (req, res) => {
    const { message, locale, history } = req.body;

    const cfg = getAiConfig();
    if (!cfg.enabled) {
      return res.json({ ok: true, data: { reply: OFF[locale], steps: [], disabled: true } });
    }

    const cachedAnswer = await getAnswerCache(locale, message, history.length);
    if (cachedAnswer) {
      return res.json({ ok: true, data: { ...cachedAnswer, cached: true } });
    }

    const ctx = { locale, urlLocale: locale === 'uz-Cyrl' ? 'uz-cyrl' : locale, ip: clientIp(req) };
    const messages = [
      { role: 'system', content: systemPrompt(locale) },
      ...history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const steps = [];
    let requestCreated = false;
    let chatCards = [];

    try {
      for (let i = 0; i < MAX_STEPS; i += 1) {
        const json = await callModel(cfg, messages);
        const msg = json?.choices?.[0]?.message;
        if (!msg) throw new Error('AI javobi boʻsh');

        const calls = msg.tool_calls || [];
        if (!calls.length) {
          const reply = (msg.content || '').trim() || BUSY[locale];
          await setAnswerCache(locale, message, history.length, { reply, steps, requestCreated, cards: chatCards });
          return res.json({ ok: true, data: { reply, steps, requestCreated, cards: chatCards } });
        }

        messages.push({
          role: 'assistant',
          content: msg.content ?? '',
          tool_calls: calls.map((c) => ({
            id: c.id,
            type: 'function',
            function: { name: c.function.name, arguments: c.function.arguments ?? '{}' },
          })),
        });

        for (const c of calls) {
          let args = {};
          try { args = JSON.parse(c.function.arguments || '{}'); } catch { /* */ }
          const out = await runToolCached(c.function.name, args, ctx, steps, locale);
          if (c.function.name === 'create_request' && out?.ok) requestCreated = true;
          const cc = extractCards(c.function.name, out);
          if (cc.length) chatCards = cc;
          messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(out).slice(0, 3000) });
        }
      }

      const finalJson = await callModel(cfg, messages, { tools: false });
      const reply = (finalJson?.choices?.[0]?.message?.content || '').trim() || BUSY[locale];
      return res.json({ ok: true, data: { reply, steps, requestCreated } });
    } catch (e) {
      logger.error({ err: e.message, status: e.status }, 'AI xatosi');
      return res.json({ ok: true, data: { reply: BUSY[locale], steps, busy: true } });
    }
  })
);

/** GET /api/ai/status */
aiRouter.get('/status', (_req, res) => {
  const cfg = getAiConfig();
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ ok: true, data: { enabled: cfg.enabled, provider: cfg.enabled ? cfg.provider : null, stream: true } });
});
