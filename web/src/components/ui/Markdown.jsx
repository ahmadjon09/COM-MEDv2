// Yengil markdown renderi (## sarlavha, - ro'yxat, **qalin**).
function inline(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ink-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export default function Markdown({ content = '' }) {
  const blocks = [];
  let list = null;

  for (const raw of String(content).split('\n')) {
    const line = raw.trim();
    if (line.startsWith('- ')) { list = list || []; list.push(line.slice(2)); continue; }
    if (list) { blocks.push({ type: 'ul', items: list }); list = null; }
    if (!line) continue;
    if (line.startsWith('### ')) blocks.push({ type: 'h3', text: line.slice(4) });
    else if (line.startsWith('## ')) blocks.push({ type: 'h2', text: line.slice(3) });
    else if (line.startsWith('# ')) blocks.push({ type: 'h2', text: line.slice(2) });
    else blocks.push({ type: 'p', text: line });
  }
  if (list) blocks.push({ type: 'ul', items: list });

  let n = 0;
  return (
    <div className="max-w-text">
      {blocks.map((b, i) => {
        if (b.type === 'h2') {
          n += 1;
          return (
            <h2 key={i} className="mt-10 flex items-baseline gap-3 border-b border-ink-150 pb-2 text-lg font-semibold text-ink-900 first:mt-0">
              <span className="kicker text-blue-500">{String(n).padStart(2, '0')}</span>
              {b.text.replace(/^\d+\.\s*/, '')}
            </h2>
          );
        }
        if (b.type === 'h3') return <h3 key={i} className="mt-7 text-base font-semibold text-ink-900">{b.text}</h3>;
        if (b.type === 'ul')
          return (
            <ul key={i} className="mt-4 space-y-2">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-3 text-sm leading-relaxed text-ink-600">
                  <span className="dot mt-2 bg-blue-400" />
                  <span dangerouslySetInnerHTML={{ __html: inline(it) }} />
                </li>
              ))}
            </ul>
          );
        return <p key={i} className="mt-4 text-sm leading-[1.75] text-ink-600" dangerouslySetInnerHTML={{ __html: inline(b.text) }} />;
      })}
    </div>
  );
}
