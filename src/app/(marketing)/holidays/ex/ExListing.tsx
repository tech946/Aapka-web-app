'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { HolidayType } from '@/config/holiday-types';
import type { ListingItem } from '@/components/site/listing/listing-data';
import ExBanner from './ExBanner';
import ExCard, { ExCardSkeleton } from './ExCard';
import ExDock from './ExDock';
import ExFilters, { compactAed } from './ExFilters';
import ExToolbar from './ExToolbar';
import { INTROS, LISTING, SUBS } from './content';
import { useListing } from './useListing';

type Props = {
  types: HolidayType[];
  items: ListingItem[];
  loading: boolean;
  active: string;
  onActiveChange: (key: string) => void;
};

type Chip = { key: string; label: string; count: number };

function Intro({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [text]);
  return (
    <div className="exl-intro">
      <p className={open ? 'is-open' : undefined}>{text}</p>
      <button type="button" onClick={() => setOpen((v) => !v)}>
        {open ? 'Read less' : 'Read more'}
      </button>
    </div>
  );
}

function Tabs({ chips, active, onType }: { chips: Chip[]; active: string; onType: (key: string) => void }) {
  const rail = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [chips.length]);

  const go = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  return (
    <div className="exl-tabs">
      <button type="button" className="exl-tabs__arrow" onClick={() => go(-1)} disabled={edge.start} aria-label="Scroll left">
        <ChevronLeft aria-hidden="true" />
      </button>
      <ul className="exl-tabs__rail" ref={rail} role="tablist">
        {chips.map((c) => (
          <li key={c.key}>
            <button type="button" role="tab" aria-selected={c.key === active} className={'exl-tab' + (c.key === active ? ' is-active' : '')} onClick={() => onType(c.key)}>
              {c.label}
              <span>({c.count})</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="exl-tabs__arrow" onClick={() => go(1)} disabled={edge.end} aria-label="Scroll right">
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ExListing({ types, items, loading, active, onActiveChange }: Props) {
  const view = useListing(types, items, active);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const head = useRef<HTMLDivElement>(null);

  const title = active === 'all' ? LISTING.allTitle : view.label;
  const filterCount = view.livePicks + (active !== 'all' ? 1 : 0);
  const emptyText = view.base.length
    ? 'No holidays match these filters. Try clearing a few.'
    : view.isDeals
      ? 'No limited time deals are running right now. Check back soon.'
      : 'No holidays available right now.';

  const changeType = (key: string) => {
    view.clearRange();
    onActiveChange(key);
  };

  const picked = view.facetDefs.flatMap((f) => f.options.filter((o) => view.facets[f.key]?.includes(o.value)).map((o) => ({ key: f.key, value: o.value, label: o.label })));

  return (
    <>
      <ExBanner
        active={active}
        title={title}
        sub={SUBS[active] ?? SUBS.all}
      />

      <section className="exl-main" aria-label="Holiday packages">
        <div className="ex-wrap">
          <Intro text={INTROS[active] ?? INTROS.all} />
          {loading ? (
            <div className="exl-tabs exl-tabs--skel" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className="exl-skel exl-skel--tab" />
              ))}
            </div>
          ) : (
            <Tabs chips={view.chips} active={active} onType={changeType} />
          )}
          <ExToolbar
            filterCount={filterCount}
            onOpenFilters={() => setFiltersOpen(true)}
            facets={view.facetDefs}
            picks={view.facets}
            onToggle={view.toggleFacet}
            sort={view.sort}
            onSort={view.changeSort}
          />
        </div>

        <div className="exl-listbg">
          <div className="ex-wrap">
            <div className="exl-head" ref={head}>
              <h2 aria-live="polite">{loading ? 'Loading holidays…' : LISTING.heading(view.list.length, view.label)}</h2>
            </div>

            {!loading && (picked.length > 0 || view.range) ? (
              <div className="exl-pills" aria-label="Selected filters">
                {view.range ? (
                  <button type="button" className="exl-pill" onClick={view.clearRange} aria-label="Remove price range">
                    {compactAed(view.range[0])} – {compactAed(view.range[1])}
                    <X aria-hidden="true" />
                  </button>
                ) : null}
                {picked.map((p) => (
                  <button key={p.key + p.value} type="button" className="exl-pill" onClick={() => view.toggleFacet(p.key, p.value)} aria-label={`Remove ${p.label}`}>
                    {p.label}
                    <X aria-hidden="true" />
                  </button>
                ))}
                <button type="button" className="exl-pills__clear" onClick={view.clearFacets}>
                  Clear all
                </button>
              </div>
            ) : null}

            {loading ? (
              <div className="exl-grid" aria-busy="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <ExCardSkeleton key={i} />
                ))}
              </div>
            ) : view.slice.length ? (
              <div className="exl-grid">
                {view.slice.map((p) => (
                  <ExCard key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <p className="exl-empty">{emptyText}</p>
            )}

            {!loading && view.hasMore && (
              <div className="exl-more">
                <button type="button" className="exl-btn exl-btn--line" onClick={view.showMore}>
                  Show more holidays
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <ExDock anchor={head} filterCount={filterCount} onOpenFilters={() => setFiltersOpen(true)} sort={view.sort} onSort={view.changeSort} />

      <ExFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        chips={view.chips}
        active={active}
        picks={view.facets}
        range={view.range}
        preview={view.preview}
        onApply={(typeKey, picks, range) => {
          view.applyFacets(picks, range);
          if (typeKey !== active) onActiveChange(typeKey);
        }}
      />
    </>
  );
}
