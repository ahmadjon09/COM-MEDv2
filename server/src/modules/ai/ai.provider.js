// AI provayder konfiguratsiyasi.
// Groq, OpenAI, OpenRouter va boshqa OpenAI-mos API'lar bir xil formatda ishlaydi —
// farqi faqat manzil, model nomi va ba'zi cheklovlarda.
import { env } from '../../config/env.js';

/** Tayyor presetlar — foydalanuvchi faqat AI_PROVIDER va AI_API_KEY yozsa yetadi */
const PRESETS = {
  groq: {
    url: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    // Groq hozircha bir vaqtda bir nechta tool chaqiruvini hamma modelda
    // qo'llab-quvvatlamaydi — xatoga yo'l qo'ymaslik uchun o'chiramiz
    parallelToolCalls: false,
    // Groq `max_tokens` o'rniga `max_completion_tokens` ni afzal ko'radi
    maxTokensField: 'max_completion_tokens',
  },
  openai: {
    url: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    parallelToolCalls: true,
    maxTokensField: 'max_tokens',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct',
    parallelToolCalls: true,
    maxTokensField: 'max_tokens',
  },
  custom: {
    url: null,
    model: null,
    parallelToolCalls: true,
    maxTokensField: 'max_tokens',
  },
};

/**
 * Amaldagi sozlama.
 * AI_API_URL / AI_MODEL berilsa — ular presetdan ustun turadi.
 */
export function getAiConfig() {
  const provider = (env.AI_PROVIDER || 'custom').toLowerCase();
  const preset = PRESETS[provider] ?? PRESETS.custom;

  const url = (env.AI_API_URL || preset.url || '').replace(/\/$/, '');
  const model = env.AI_MODEL || preset.model || '';
  const key = env.AI_API_KEY || '';

  return {
    provider,
    url,
    model,
    key,
    maxTokens: env.AI_MAX_TOKENS,
    parallelToolCalls: preset.parallelToolCalls,
    maxTokensField: preset.maxTokensField,
    enabled: Boolean(url && model && key),
  };
}

/** So'rov tanasini provayderga moslab yig'ish */
export function buildPayload(cfg, messages, tools) {
  const body = {
    model: cfg.model,
    messages,
    temperature: 0.3,
    [cfg.maxTokensField]: cfg.maxTokens,
  };

  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
    // Groq: parallel tool call'lar o'chiriladi
    if (cfg.parallelToolCalls === false) body.parallel_tool_calls = false;
  }

  return body;
}

/**
 * Provayder xatosini bir xil ko'rinishga keltirish.
 * @returns {{retryable:boolean, waitMs:number, message:string}}
 */
export function classifyError(status, bodyText, retryAfterHeader) {
  const retryAfter = Number(retryAfterHeader);
  const waitFromHeader = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 0;

  // 429 — limit; 5xx — provayder tomonidagi vaqtinchalik nosozlik
  if (status === 429) {
    return { retryable: true, waitMs: waitFromHeader || 1500, message: 'Provayder limiti (429)' };
  }
  if (status === 503 || status === 502 || status === 500) {
    return { retryable: true, waitMs: 1200, message: `Provayder javob bermadi (${status})` };
  }
  if (status === 401 || status === 403) {
    return { retryable: false, waitMs: 0, message: 'AI kaliti notoʻgʻri yoki muddati tugagan' };
  }
  if (status === 400) {
    // Groq ko'pincha model nomi yoki tool sxemasi xato bo'lsa 400 qaytaradi
    return { retryable: false, waitMs: 0, message: `Soʻrov rad etildi: ${String(bodyText).slice(0, 200)}` };
  }
  return { retryable: false, waitMs: 0, message: `AI HTTP ${status}` };
}
