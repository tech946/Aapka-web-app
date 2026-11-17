'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ListFilter, SlidersHorizontal } from 'lucide-react';
import { DEFAULT_SORT, SORTS, sortLabel, type FacetKey, type FacetPicks, type LiveFacet } from '@/components/site/listing/listing-facets';

type Props = {
  filterCount: number;
  onOpenFilters: () => void;
  facets: LiveFacet[];
  picks: FacetPicks;
  onToggle: (key: FacetKey, value: string) => void;
  sort: string | null;
  onSort: (value: string | null) => void;
};

const QUICK: { key: FacetKey; value: string }[] = [
  { key: 'visa', value: 'Y' },
  { key: 'highlight', value: 'deals' },
];

function usePopover() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return { open, setOpen, root };
}

function FacetMenu({ facet, picks, onToggle }: { facet: LiveFacet; picks: FacetPicks; onToggle: Props['onToggle'] }) {
  const { open, setOpen, root } = usePopover();
  const picked = facet.options.filter((o) => picks[facet.key]?.includes(o.value)).length;

  return (
    <div className="exl-pop" ref={root}>
      <button type="button" className={'exl-tool' + (picked ? ' is-on' : '')} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
        {facet.title}
        {picked ? <span className="exl-tool__count">{picked}</span> : null}
        <ChevronDown className="exl-tool__chev" aria-hidden="true" />
      </button>
      {open && (
        <ul className="exl-menu" aria-label={facet.title}>
          {facet.options.map((o) => {
            const checked = !!picks[facet.key]?.includes(o.value);
            return (
              <li key={o.value}>
                <label className="exl-fcheck">
                  <input type="checkbox" checked={checked} onChange={() => onToggle(facet.key, o.value)} />
                  <span>
                    {o.label} ({facet.counts[o.value]})
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function sortOptions(sort: string | null) {
  const options = [{ value: '', label: DEFAULT_SORT.title }, ...SORTS.map((s) => ({ value: s.value, label: sortLabel(s) }))];
  const current = options.find((o) => o.value === (sort ?? '')) ?? options[0];
  return { options, current };
}

function SortMenu({ sort, onSort }: Pick<Props, 'sort' | 'onSort'>) {
  const { open, setOpen, root } = usePopover();
  const { options, current } = sortOptions(sort);

  return (
    <div className="exl-pop exl-pop--end" ref={root}>
      <button type="button" className="exl-tool exl-tool--sort" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((v) => !v)}>
        <ListFilter aria-hidden="true" />
        Sort: {current.label}
      </button>
      {open && (
        <ul className="exl-menu exl-menu--sort" role="listbox" aria-label="Sort by">
          {options.map((o) => {
            const on = o.value === current.value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={'exl-menu__option' + (on ? ' is-active' : '')}
                  onClick={() => {
                    onSort(o.value || null);
                    setOpen(false);
                  }}
                >
                  {o.label}
                  {on ? <Check aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ExToolbar({ filterCount, onOpenFilters, facets, picks, onToggle, sort, onSort }: Props) {
  const duration = facets.find((f) => f.key === 'dur');
  const quick = QUICK.flatMap((q) => {
    const facet = facets.find((f) => f.key === q.key);
    const option = facet?.options.find((o) => o.value === q.value);
    return facet && option ? [{ ...q, label: option.label, count: facet.counts[q.value] }] : [];
  });

  return (
    <div className="exl-toolbar">
      <div className="exl-toolbar__left">
        <button type="button" className={'exl-tool' + (filterCount ? ' is-on' : '')} onClick={onOpenFilters}>
          <SlidersHorizontal aria-hidden="true" />
          Filters
          {filterCount ? <span className="exl-tool__count">{filterCount}</span> : null}
        </button>
        {duration ? <FacetMenu facet={duration} picks={picks} onToggle={onToggle} /> : null}
        {quick.map((q) => {
          const on = !!picks[q.key]?.includes(q.value);
          return (
            <button key={q.key + q.value} type="button" className={'exl-tool' + (on ? ' is-on' : '')} aria-pressed={on} onClick={() => onToggle(q.key, q.value)}>
              {q.label} ({q.count})
            </button>
          );
        })}
      </div>
      <div className="exl-toolbar__right">
        <SortMenu sort={sort} onSort={onSort} />
      </div>
    </div>
  );
}
