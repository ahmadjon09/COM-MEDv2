'use client';
// Zapchastlar katalogi — chap tomonda filtr paneli, o'ngda jadval yoki kartalar.
// Ma'lumot SWR orqali; server yiqilsa IndexedDB keshidan ko'rsatiladi.
import { useMemo, useState, useEffect, useDeferredValue } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PartCard from './PartCard';
import PartRow from './PartRow';
import Button from '../ui/Button';
import Icon from '../ui/Icons';
import { GridSkeleton, RowsSkeleton } from '../ui/Skeleton';
import { useApi } from '@/lib/client-api';
import { pick } from '@/i18n';

const PAGE = 24;

export default function PartsCatalog({
  locale, dict, categories = [], filters = { brands: [], countries: [] },
  initialData, fixedCategory = null,
}) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState(fixedCategory || '');
  const [brand, setBrand] = useState('');
  const [country, setCountry] = useState('');
  const [partType, setPartType] = useState('');
  const [sort, setSort] = useState('manual');
  const [limit, setLimit] = useState(PAGE);
  const [view, setView] = useState('table');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const deferredQ = useDeferredValue(q);
  const [dq, setDq] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDq(deferredQ.trim()), 320);
    return () => clearTimeout(t);
  }, [deferredQ]);

  // Ekran kichik bo'lsa avtomatik kartalar ko'rinishi
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1080px)');
    const apply = () => setView(mq.matches ? 'grid' : 'table');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const path = useMemo(() => {
    const p = new URLSearchParams({ kind: 'PART', limit: String(limit) });
    if (dq) p.set('q', dq);
    if (category) p.set('category', category);
    if (brand) p.set('brand', brand);
    if (country) p.set('country', country);
    if (partType) p.set('partType', partType);
    if (sort !== 'manual') p.set('sort', sort);
    return `/api/products?${p.toString()}`;
  }, [dq, category, brand, country, partType, sort, limit]);

  const pristine =
    !dq && category === (fixedCategory || '') && !brand && !country && !partType && sort === 'manual' && limit === PAGE;

  const { data, meta, isLoading, isStale, error } = useApi(path, {
    fallbackData: pristine && initialData ? initialData : undefined,
  });

  const items = data ?? [];
  const total = meta?.total ?? items.length;
  const hasMore = items.length < total;
  const dirty = q || (!fixedCategory && category) || brand || country || partType || sort !== 'manual';

  const reset = () => {
    setQ(''); setCategory(fixedCategory || ''); setBrand(''); setCountry(''); setPartType('');
    setSort('manual'); setLimit(PAGE);
  };

  const FilterPanel = (
    <div className="divide-y divide-ink-150 border border-ink-150 bg-white">
      {!fixedCategory && (
        <FilterBlock label={dict.nav.catalog}>
          <FilterOption active={!category} onClick={() => { setCategory(''); setLimit(PAGE); }}>
            {dict.catalog.all}
          </FilterOption>
          {categories.map((c) => (
            <FilterOption
              key={c.id} active={category === c.slug}
              onClick={() => { setCategory(c.slug); setLimit(PAGE); }}
              count={c.productCount}
            >
              {pick(c, 'name', locale)}
            </FilterOption>
          ))}
        </FilterBlock>
      )}

      {filters.types?.length > 0 && (
        <FilterBlock label={dict.partTypes.label}>
          <FilterOption active={!partType} onClick={() => { setPartType(''); setLimit(PAGE); }}>
            {dict.partTypes.all}
          </FilterOption>
          {filters.types.map((t) => (
            <FilterOption
              key={t.value} active={partType === t.value}
              onClick={() => { setPartType(t.value); setLimit(PAGE); }} count={t.count}
            >
              {dict.partTypes[t.value] || t.value}
            </FilterOption>
          ))}
        </FilterBlock>
      )}

      {filters.brands?.length > 0 && (
        <FilterBlock label={dict.parts.brand}>
          <FilterOption active={!brand} onClick={() => { setBrand(''); setLimit(PAGE); }}>
            {dict.parts.allBrands}
          </FilterOption>
          {filters.brands.map((b) => (
            <FilterOption key={b.value} active={brand === b.value}
                          onClick={() => { setBrand(b.value); setLimit(PAGE); }} count={b.count}>
              {b.value}
            </FilterOption>
          ))}
        </FilterBlock>
      )}

      {filters.countries?.length > 0 && (
        <FilterBlock label={dict.parts.country}>
          <FilterOption active={!country} onClick={() => { setCountry(''); setLimit(PAGE); }}>
            {dict.parts.allCountries}
          </FilterOption>
          {filters.countries.map((c) => (
            <FilterOption key={c.value} active={country === c.value}
                          onClick={() => { setCountry(c.value); setLimit(PAGE); }} count={c.count}>
              <span className="font-mono text-label uppercase text-ink-400">{c.value}</span>{' '}
              {dict.countries[c.value] || c.value}
            </FilterOption>
          ))}
        </FilterBlock>
      )}

      <div className="flex items-start gap-2.5 border-l-2 border-ok bg-ink-25 p-4">
        <span className="dot mt-1.5 bg-ok" />
        <p className="text-xs leading-relaxed text-ink-600">{dict.parts.supplyNote}</p>
      </div>

      {dirty && (
        <div className="p-4">
          <Button variant="outline" size="sm" full onClick={reset} icon={<Icon name="close" size={14} />}>
            {dict.catalog.reset}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-10">
      {/* Chap: filtrlar */}
      <aside className="lg:sticky lg:top-[76px] lg:self-start">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="mb-3 flex w-full items-center justify-between border border-ink-200 px-4 py-3 text-sm font-medium lg:hidden"
        >
          <span className="flex items-center gap-2">
            <Icon name="search" size={15} className="text-blue-500" />
            {dict.catalog.filters}
          </span>
          <Icon name="chevronDown" size={15} className={filtersOpen ? 'rotate-180' : ''} />
        </button>
        <div className={filtersOpen ? 'block' : 'hidden lg:block'}>{FilterPanel}</div>
      </aside>

      {/* O'ng: qidiruv + ro'yxat */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
              placeholder={dict.parts.search}
              aria-label={dict.parts.search}
              className="h-11 w-full rounded border border-ink-200 bg-white pl-10 pr-10 text-sm outline-none
                         transition-colors duration-200 placeholder:text-ink-400 focus:border-blue-500 focus:shadow-focus"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label={dict.catalog.reset}
                      className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-ink-400 hover:text-ink-900">
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          <select
            value={sort} onChange={(e) => setSort(e.target.value)} aria-label={dict.catalog.sort}
            className="h-11 rounded border border-ink-200 bg-white px-3 text-sm text-ink-700 outline-none focus:border-blue-500"
          >
            <option value="manual">{dict.catalog.sort}</option>
            <option value="new">{dict.catalog.sortNew}</option>
            <option value="price_asc">{dict.catalog.sortPriceAsc}</option>
            <option value="price_desc">{dict.catalog.sortPriceDesc}</option>
          </select>

          <div className="hidden border border-ink-200 lg:flex">
            {[
              { k: 'table', icon: 'menu', label: dict.parts.viewTable },
              { k: 'grid', icon: 'box', label: dict.parts.viewGrid },
            ].map((v, i) => (
              <button
                key={v.k} onClick={() => setView(v.k)} title={v.label} aria-label={v.label}
                className={`grid h-11 w-11 place-items-center transition-colors duration-200 ${i > 0 ? 'border-l border-ink-150' : ''} ${
                  view === v.k ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50'
                }`}
              >
                <Icon name={v.icon} size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between border-b border-ink-150 pb-2">
          <span className="kicker">
            <strong className="text-ink-900 tnum">{total}</strong> {dict.parts.found}
          </span>
          {isStale && (
            <span className="kicker flex items-center gap-1.5 text-warn">
              <span className="dot bg-warn" />{dict.common.offlineNotice}
            </span>
          )}
        </div>

        {isLoading && items.length === 0 ? (
          view === 'table' ? <RowsSkeleton count={8} /> : <GridSkeleton count={8} />
        ) : items.length === 0 ? (
          <Empty dict={dict} error={!!error} />
        ) : view === 'table' ? (
          <div className="border-t border-ink-150">
            {/* Jadval sarlavhasi */}
            <div className="hidden grid-cols-[64px_minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1fr)_36px]
                            gap-4 border-b border-ink-150 bg-ink-25 px-4 py-2.5 lg:grid">
              <span className="kicker">{dict.parts.colPhoto}</span>
              <span className="kicker">{dict.parts.colName}</span>
              <span className="kicker">{dict.parts.colBrand}</span>
              <span className="kicker">{dict.parts.colCountry}</span>
              <span className="kicker">{dict.parts.colSupply}</span>
              <span className="kicker text-right">{dict.parts.colPrice}</span>
              <span />
            </div>
            {items.map((it) => <PartRow key={it.id} item={it} locale={locale} dict={dict} />)}
          </div>
        ) : (
          <motion.div layout className="grid gap-5 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {items.map((it, i) => (
                <motion.div
                  key={it.id} layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.02 }}
                  className="h-full"
                >
                  <PartCard item={it} locale={locale} dict={dict} priority={i < 4} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" size="md" loading={isLoading} onClick={() => setLimit((l) => l + PAGE)}
                    iconRight={<Icon name="chevronDown" size={15} />}>
              {dict.catalog.loadMore}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterBlock({ label, children }) {
  return (
    <div>
      <p className="kicker border-b border-ink-150 bg-ink-25 px-4 py-2.5">{label}</p>
      <div className="max-h-[260px] overflow-y-auto py-1">{children}</div>
    </div>
  );
}

function FilterOption({ active, onClick, count, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors duration-150 ${
        active ? 'bg-blue-50 font-medium text-blue-700' : 'text-ink-600 hover:bg-ink-25 hover:text-ink-900'
      }`}
    >
      <span className="truncate">{children}</span>
      {count != null && <span className="kicker shrink-0 tnum">{count}</span>}
    </button>
  );
}

function Empty({ dict, error }) {
  return (
    <div className="border border-dashed border-ink-200 px-6 py-20 text-center">
      <Icon name={error ? 'close' : 'search'} size={28} className="mx-auto text-ink-300" />
      <h3 className="mt-4 text-base font-semibold text-ink-800">{error ? dict.common.error : dict.parts.empty}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">{error ? dict.form.errorText : dict.parts.emptyHint}</p>
    </div>
  );
}
