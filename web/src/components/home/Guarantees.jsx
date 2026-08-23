// Kafolatlar — hero ostidagi ixcham qator.
import Icon from '../ui/Icons';

const ICONS = ['search', 'shield', 'box', 'doc'];

export default function Guarantees({ dict }) {
  return (
    <div className="border-b border-ink-150 bg-ink-25">
      <div className="wrap grid gap-x-8 gap-y-5 py-7 sm:grid-cols-2 lg:grid-cols-4">
        {dict.why.map((w, i) => (
          <div key={w.title} className="flex gap-3">
            <Icon name={ICONS[i]} size={18} className="mt-0.5 shrink-0 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-ink-900">{w.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{w.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
