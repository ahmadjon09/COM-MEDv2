// Yuklanish holatlari — haqiqiy element bilan bir xil o'lchamda (CLS bo'lmasin).
export function TileSkeleton() {
  return (
    <div className="border border-ink-150 bg-white">
      <div className="sk aspect-[5/4] w-full" />
      <div className="space-y-2.5 p-4">
        <div className="sk h-2.5 w-20" />
        <div className="sk h-4 w-4/5" />
        <div className="sk h-2.5 w-2/5" />
        <div className="sk mt-4 h-5 w-28" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-5 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => <TileSkeleton key={i} />)}
    </div>
  );
}

export function RowsSkeleton({ count = 6 }) {
  return (
    <div className="divide-y divide-ink-150 border border-ink-150">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3.5">
          <div className="sk h-14 w-16 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="sk h-3.5 w-1/3" />
            <div className="sk h-2.5 w-1/5" />
          </div>
          <div className="sk h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function LineSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="sk h-3" style={{ width: `${100 - i * 14}%` }} />
      ))}
    </div>
  );
}
