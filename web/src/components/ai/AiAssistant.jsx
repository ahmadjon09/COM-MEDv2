'use client';
// AI yordamchi vidjeti.
//
// - Javob SSE orqali oqim bilan keladi (token-token yoziladi)
// - Kontekst kam: klientda oxirgi 8 xabar saqlanadi va serverga shu yuboriladi
// - Model ariza rasmiylashtirsa — alohida tasdiq kartasi ko'rsatiladi
// - Xato bo'lsa foydalanuvchi "band" xabarini ko'radi, texnik xatoni emas
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../ui/Icons';
import { Spinner } from '../ui/Button';
import ChatMarkdown from './ChatMarkdown';
import PartCards from './PartCards';
import { toDbLocale } from '@/i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const HISTORY_KEY = 'ms-ai-chat';
const MAX_KEEP = 8;

export default function AiAssistant({ locale, dict }) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [streaming, setStreaming] = useState(''); // hozir yozilayotgan matn
  const [liveSteps, setLiveSteps] = useState([]);
  const [liveCards, setLiveCards] = useState([]);
  const [unread, setUnread] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const t = dict.ai;

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/ai/status`)
      .then((r) => r.json())
      .then((j) => alive && setEnabled(Boolean(j?.data?.enabled)))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY);
      if (raw) setMessages(JSON.parse(raw).slice(-20));
    } catch { /* private rejim */ }
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-20))); } catch { /* */ }
  }, [messages]);

  // Yangi matn kelganda pastga surish
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, phase, open]);

  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Komponent yopilsa oqimni to'xtatamiz
  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text) {
    const clean = (text ?? input).trim();
    if (!clean || busy) return;

    setInput('');
    setMessages((m) => [...m, { role: 'user', content: clean }]);
    setBusy(true);
    setPhase(t.thinking);
    setStreaming('');
    setLiveSteps([]);
    setLiveCards([]);

    const controller = new AbortController();
    abortRef.current = controller;

    // Bosqich matnini almashtirib turamiz (tool ishlamayotgan paytda)
    let tickerOn = true;
    const phases = [t.thinking, t.searching];
    let pi = 0;
    const ticker = setInterval(() => {
      if (tickerOn) { pi = (pi + 1) % phases.length; setPhase(phases[pi]); }
    }, 2400);

    let acc = '';
    const steps = [];
    let cards = [];
    let doneData = null;

    try {
      const res = await fetch(`${API_URL}/api/ai/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        signal: controller.signal,
        body: JSON.stringify({
          message: clean,
          locale: toDbLocale(locale),
          history: messages.slice(-MAX_KEEP).map((m) => ({ role: m.role, content: m.content.slice(0, 700) })),
        }),
      });

      if (res.status === 429) {
        const j = await res.json().catch(() => null);
        throw Object.assign(new Error('rate'), { userMessage: j?.error?.message });
      }
      if (!res.ok || !res.body) throw new Error('stream yoʻq');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      // SSE ni qo'lda o'qiymiz: "event: x\ndata: {...}\n\n"
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let sep;
        while ((sep = buf.indexOf('\n\n')) >= 0) {
          const chunk = buf.slice(0, sep);
          buf = buf.slice(sep + 2);

          let event = 'message';
          let dataLine = '';
          for (const line of chunk.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;

          let data;
          try { data = JSON.parse(dataLine); } catch { continue; }

          if (event === 'token') {
            tickerOn = false;
            setPhase('');
            acc += data.text || '';
            setStreaming(acc);
          } else if (event === 'step') {
            tickerOn = false;
            steps.push(data);
            setLiveSteps([...steps]);
            setPhase(data.label || '');
          } else if (event === 'cards') {
            cards = data.items || [];
            setLiveCards(cards);
          } else if (event === 'done') {
            doneData = data;
            if (data.cards?.length) cards = data.cards;
          }
        }
      }

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: acc.trim() || t.busy,
          steps,
          cards,
          tone: doneData?.busy ? 'warn' : undefined,
          requestCreated: Boolean(doneData?.requestCreated),
          cached: Boolean(doneData?.cached),
        },
      ]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: err.userMessage || t.busy, tone: 'warn' },
        ]);
      }
    } finally {
      clearInterval(ticker);
      abortRef.current = null;
      setBusy(false);
      setPhase('');
      setStreaming('');
      setLiveSteps([]);
      setLiveCards([]);
      if (!open) setUnread(true);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  if (!enabled) return null;

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        aria-label={t.title}
        className="fixed bottom-5 right-5 z-[80] flex h-12 items-center gap-2.5 rounded-full bg-ink-900 pl-4 pr-5
                   text-sm font-medium text-white shadow-pop transition-colors duration-200 hover:bg-blue-600
                   md:bottom-6 md:right-6"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
        </span>
        {open ? t.close : t.button}
        {unread && !open && <span className="h-2 w-2 rounded-full bg-blue-400" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 right-4 z-[81] flex h-[min(78vh,620px)] w-[min(94vw,410px)] flex-col
                       border border-ink-200 bg-white shadow-pop md:bottom-24 md:right-6"
          >
            {/* Sarlavha */}
            <div className="flex items-center gap-3 border-b border-ink-150 px-4 py-3">
              <span className="grid h-8 w-8 place-items-center bg-blue-500 text-white">
                <Icon name="spark" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{t.title}</p>
                <p className="truncate text-xs text-ink-400">{busy && phase ? phase : t.subtitle}</p>
              </div>
              {messages.length > 0 && !busy && (
                <button
                  onClick={() => setMessages([])}
                  title={t.clear}
                  className="grid h-8 w-8 place-items-center text-ink-400 transition-colors hover:text-ink-900"
                >
                  <Icon name="close" size={15} />
                </button>
              )}
            </div>

            {/* Xabarlar */}
            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !busy && (
                <div>
                  <p className="text-sm leading-relaxed text-ink-600">{t.greeting}</p>
                  <div className="mt-4 space-y-2">
                    {t.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="block w-full border border-ink-150 px-3 py-2.5 text-left text-sm text-ink-700
                                   transition-colors duration-200 hover:border-blue-400 hover:text-blue-700"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap bg-blue-500 px-3.5 py-2.5 text-sm leading-relaxed text-white">
                      {m.content}
                    </p>
                  </div>
                ) : (
                  <div key={i}>
                    {m.steps?.length > 0 && <StepList steps={m.steps} />}
                    <div className={`border-l-2 pl-3.5 ${m.tone === 'warn' ? 'border-warn' : 'border-ink-200'}`}>
                      <ChatMarkdown content={m.content} />
                      {m.cards?.length > 0 && <PartCards items={m.cards} dict={dict} />}
                    </div>
                    {m.requestCreated && <RequestSent t={t} />}
                  </div>
                )
              )}

              {/* Oqim: yozilayotgan javob */}
              {busy && (streaming || liveSteps.length > 0) && (
                <div>
                  {liveSteps.length > 0 && <StepList steps={liveSteps} />}
                  {streaming ? (
                    <div className="border-l-2 border-blue-400 pl-3.5">
                      <ChatMarkdown content={streaming} />
                      <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-blink bg-blue-500 align-middle" />
                      {liveCards.length > 0 && <PartCards items={liveCards} dict={dict} />}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Hali birinchi token kelmagan */}
              {busy && !streaming && liveSteps.length === 0 && (
                <div className="flex items-center gap-2.5 border-l-2 border-blue-400 pl-3.5 text-sm text-ink-500">
                  <Spinner size={14} className="text-blue-500" />
                  <span>{phase || t.thinking}</span>
                </div>
              )}
            </div>

            {/* Kiritish */}
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-ink-150 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  placeholder={t.placeholder}
                  maxLength={700}
                  className="max-h-28 min-h-[42px] flex-1 resize-none rounded border border-ink-200 px-3 py-2.5 text-sm
                             outline-none transition-colors placeholder:text-ink-400 focus:border-blue-500"
                />
                {busy ? (
                  <button
                    type="button"
                    onClick={stop}
                    aria-label={t.stop}
                    title={t.stop}
                    className="grid h-[42px] w-[42px] shrink-0 place-items-center border border-ink-200 text-ink-600
                               transition-colors hover:border-ink-900 hover:text-ink-900"
                  >
                    <span className="h-3 w-3 bg-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label={t.send}
                    className="grid h-[42px] w-[42px] shrink-0 place-items-center bg-ink-900 text-white transition-colors
                               hover:bg-blue-600 disabled:opacity-40"
                  >
                    <Icon name="arrow" size={16} />
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[0.6875rem] leading-snug text-ink-400">{t.disclaimer}</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Model qaysi tool'ni ishlatgani */
function StepList({ steps }) {
  return (
    <p className="mb-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-400">
      {steps.map((s, k) => (
        <span key={k} className="inline-flex items-center gap-1">
          <Icon name="check" size={11} className={s.cached ? 'text-ink-300' : 'text-ok'} />
          {s.label}
        </span>
      ))}
    </p>
  );
}

/** Ariza yuborilganda ko'rinadigan tasdiq */
function RequestSent({ t }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 flex items-start gap-2.5 border-l-2 border-ok bg-ink-25 px-3.5 py-3"
    >
      <Icon name="check" size={15} className="mt-0.5 shrink-0 text-ok" />
      <div>
        <p className="text-sm font-semibold text-ink-900">{t.requestSentTitle}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{t.requestSentText}</p>
      </div>
    </motion.div>
  );
}
