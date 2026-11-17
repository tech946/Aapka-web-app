'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarRange, ChevronDown, Compass, LayoutGrid, Ship, Tag, X, Zap, type LucideIcon } from 'lucide-react';
import type { FacetKey, FacetPicks, LiveFacet } from '@/components/site/listing/listing-facets';
import type { ListingPreview, PriceRange } from './useListing';

type Chip = { key: string; label: string; count: number };

type Props = {
  open: boolean;
  onClose: () => void;
  chips: Chip[];
  active: string;
  picks: FacetPicks;
  range: PriceRange | null;
  preview: (typeKey: string, picks: FacetPicks, range: PriceRange | null) => ListingPreview;
  onApply: (typeKey: string, picks: FacetPicks, range: PriceRange | null) => void;
};

const ALL_KEY = 'all';

const TYPE_ICONS: Record<string, LucideIcon> = {
  'offer-packages': Tag,
  'flexible-date-packages': CalendarRange,
  'uae-tours': Compass,
  'marina-cruise': Ship,
  'limited-time-deals': Zap,
};

export function compactAed(n: number): string {
  if (n >= 100000) return `AED ${(n / 1000).toFixed(0)}K`;
  if (n >= 1000) return `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `AED ${n}`;
}

function togglePick(picks: FacetPicks, key: FacetKey, value: string): FacetPicks {
  const now = picks[key] ?? [];
  return { ...picks, [key]: now.includes(value) ? now.filter((v) => v !== value) : [...now, value] };
}

function PriceSlider({ bounds, value, onChange }: { bounds: PriceRange; value: PriceRange; onChange: (v: PriceRange) => void }) {
  const [min, max] = bounds;
  const span = Math.max(1, max - min);
  const step = span > 2000 ? 50 : span > 200 ? 10 : 1;
  const left = ((value[0] - min) / span) * 100;
  const right = ((value[1] - min) / span) * 100;

  return (
    <div className="exl-range">
      <div className="exl-range__track">
        <span className="exl-range__fill" style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          aria-label="Minimum price"
          onChange={(e) => onChange([Math.min(Number(e.target.value), value[1]), value[1]])}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          aria-label="Maximum price"
          onChange={(e) => onChange([value[0], Math.max(Number(e.target.value), value[0])])}
        />
      </div>
      <div className="exl-range__labels">
        <span style={{ left: `${left}%` }}>{compactAed(value[0])}</span>
        <span style={{ left: `${right}%` }}>{compactAed(value[1])}</span>
      </div>
    </div>
  );
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={'exl-fsec exl-fsec--fold' + (open ? ' is-open' : '')}>
      <button type="button" className="exl-fsec__head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="exl-fsec__title">{title}</span>
        <span className="exl-fsec__chev" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>
      {open ? <div className="exl-fsec__body">{children}</div> : null}
    </section>
  );
}

export default function ExFilters({ open, onClose, chips, active, picks, range, preview, onApply }: Props) {
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState(active);
  const [draft, setDraft] = useState<FacetPicks>(picks);
  const [price, setPrice] = useState<PriceRange | null>(range);
  const result = useMemo(() => preview(type, draft, price), [preview, type, draft, price]);
  const bounds = result.bounds;
  const sliderValue: PriceRange | null = bounds ? [Math.max(bounds[0], price?.[0] ?? bounds[0]), Math.min(bounds[1], price?.[1] ?? bounds[1])] : null;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setType(active);
    setDraft(picks);
    setPrice(range);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !mounted) return null;

  const setPriceFromSlider = (v: PriceRange) => {
    if (!bounds) return;
    setPrice(v[0] <= bounds[0] && v[1] >= bounds[1] ? null : v);
  };

  const pickType = (key: string) => {
    setType((cur) => (cur === key ? ALL_KEY : key));
    setPrice(null);
  };

  const dirty = type !== ALL_KEY || price != null || Object.values(draft).some((v) => v?.length);
  const host = document.querySelector('.ex') ?? document.body;

  return createPortal(
    <div className="exl-modal" role="presentation">
      <div className="exl-modal__box" role="dialog" aria-modal="true" aria-labelledby="exl-filters-title">
        <header className="exl-modal__head">
          <h2 id="exl-filters-title">Filters</h2>
          <button type="button" className="exl-modal__close" onClick={onClose} aria-label="Close filters">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="exl-modal__body">
          <section className="exl-fsec">
            <p className="exl-fsec__title">Package Type</p>
            <ul className="exl-ftypes">
              {chips
                .filter((c) => c.key !== ALL_KEY)
                .map((c) => {
                  const Icon = TYPE_ICONS[c.key] ?? LayoutGrid;
                  const on = type === c.key;
                  return (
                    <li key={c.key}>
                      <button type="button" className={'exl-ftype' + (on ? ' is-on' : '')} aria-pressed={on} onClick={() => pickType(c.key)}>
                        <Icon aria-hidden="true" />
                        {c.label}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </section>

          {bounds && sliderValue && bounds[1] > bounds[0] ? (
            <section className="exl-fsec">
              <p className="exl-fsec__title">Price Range</p>
              <PriceSlider bounds={bounds} value={sliderValue} onChange={setPriceFromSlider} />
            </section>
          ) : null}

          {result.facets.map((f: LiveFacet, i) => (
            <Section key={f.key} title={f.title} defaultOpen={i < 2}>
              <ul className="exl-fchecks">
                {f.options.map((o) => {
                  const checked = !!draft[f.key]?.includes(o.value);
                  return (
                    <li key={o.value}>
                      <label className="exl-fcheck">
                        <input type="checkbox" checked={checked} onChange={() => setDraft((cur) => togglePick(cur, f.key, o.value))} />
                        <span>
                          {o.label} ({f.counts[o.value]})
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ))}
        </div>

        <footer className="exl-modal__foot">
          <button
            type="button"
            className="exl-modal__clear"
            disabled={!dirty}
            onClick={() => {
              setType(ALL_KEY);
              setDraft({});
              setPrice(null);
            }}
          >
            Clear all
          </button>
          <button
            type="button"
            className="exl-btn exl-btn--brand exl-modal__apply"
            onClick={() => {
              onApply(type, draft, price);
              onClose();
            }}
          >
            {result.count} Holiday {result.count === 1 ? 'Package' : 'Packages'}
          </button>
        </footer>
      </div>
    </div>,
    host,
  );
}
