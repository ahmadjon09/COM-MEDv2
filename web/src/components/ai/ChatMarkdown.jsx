// Chat javoblari uchun yengil markdown: **qalin**, `kod`, "- " ro'yxat, [havola](/uz/...).
// Tashqi kutubxona yuklamaymiz — bundle kichik qoladi.
import Link from 'next/link';

/** Qatordagi belgilarni xavfsiz HTML'ga aylantirish o'rniga React elementlarga bo'lamiz */
function inline(text, keyPrefix) {
  const out = [];
  // **qalin**, `kod`, [matn](url)
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m;
  let i = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];

    if (tok.startsWith('**')) {
      out.push(<strong key={`${keyPrefix}-b${i}`} className="font-semibold text-ink-900">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('`')) {
      out.push(
        <code key={`${keyPrefix}-c${i}`} className="bg-ink-100 px-1 py-0.5 font-mono text-[0.8em] text-ink-800">
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      const label = tok.slice(1, tok.indexOf(']'));
      const href = tok.slice(tok.indexOf('(') + 1, -1);
      const internal = href.startsWith('/');
      out.push(
        internal ? (
          <Link key={`${keyPrefix}-l${i}`} href={href} prefetch={false} className="text-blue-600 underline underline-offset-2 hover:text-blue-700">
            {label}
          </Link>
        ) : (
          <a key={`${keyPrefix}-l${i}`} href={href} target="_blank" rel="noopener noreferrer"
             className="text-blue-600 underline underline-offset-2 hover:text-blue-700">
            {label}
          </a>
        )
      );
    }
    last = m.index + tok.length;
    i += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function ChatMarkdown({ content = '' }) {
  const blocks = [];
  let list = null;

  for (const raw of String(content).split('\n')) {
    const line = raw.trim();

    if (/^[-*]\s+/.test(line)) {
      list = list || [];
      list.push(line.replace(/^[-*]\s+/, ''));
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      list = list || [];
      list.push(line.replace(/^\d+[.)]\s+/, ''));
      continue;
    }
    if (list) { blocks.push({ type: 'ul', items: list }); list = null; }
    if (!line) continue;
    // Sarlavhalarni oddiy qalin matnga aylantiramiz — chatda # kerak emas
    blocks.push({ type: 'p', text: line.replace(/^#{1,6}\s+/, '') });
  }
  if (list) blocks.push({ type: 'ul', items: list });

  return (
    <div className="space-y-2.5 text-sm leading-[1.65] text-ink-700">
      {blocks.map((b, i) =>
        b.type === 'ul' ? (
          <ul key={i} className="space-y-1.5">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                <span>{inline(it, `${i}-${j}`)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>{inline(b.text, String(i))}</p>
        )
      )}
    </div>
  );
}
