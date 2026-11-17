'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/controls.css';

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** yyyy-mm-dd from local date parts (toISOString() is UTC and can slip a day). */
export function isoOf(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export function isoToday(): string {
  return isoOf(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return isoOf(d);
}

interface Props {
  /** selected day, yyyy-mm-dd ('' for none) */
  value: string;
  onChange: (iso: string) => void;
  /** first pickable day; defaults to today */
  min?: string;
  /** ISO days that can't be booked */
  unavailable?: string[];
  /** extra per-day rule, e.g. a package's own blackout logic */
  isDisabled?: (iso: string) => boolean;
}

/** Single-date picker, CRM date-picker look (ported from the redesign's
    MiniCalendar). Blocked days are shown struck through and can't be picked. */
export default function Calendar({ value, onChange, min, unavailable = [], isDisabled }: Props) {
  const floor = min || isoToday();
  const start = new Date((value || floor) + 'T00:00:00');
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const blocked = new Set(unavailable);

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= days; d++) cells.push(isoOf(new Date(view.y, view.m, d)));

  const floorDate = new Date(floor + 'T00:00:00');
  const atStart = view.y < floorDate.getFullYear() || (view.y === floorDate.getFullYear() && view.m <= floorDate.getMonth());
  const title = new Date(view.y, view.m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const today = isoToday();

  function shift(delta: number) {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }

  return (
    <div className="mcal">
      <div className="mcal__head">
        <button type="button" className="mcal__nav" aria-label="Previous month" disabled={atStart} onClick={() => shift(-1)}>
          <ChevronLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <p className="mcal__title" aria-live="polite">{title}</p>
        <button type="button" className="mcal__nav" aria-label="Next month" onClick={() => shift(1)}>
          <ChevronRight size={14} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
      <div className="mcal__grid" role="grid" aria-label={title}>
        {WEEK.map((w) => (
          <span key={w} className="mcal__wd" role="columnheader">{w}</span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <span key={'e' + i} />;
          const off = iso < floor || blocked.has(iso) || !!isDisabled?.(iso);
          const on = iso === value;
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              aria-selected={on}
              aria-label={iso + (off ? ' unavailable' : '')}
              disabled={off}
              className={'mcal__day' + (on ? ' is-on' : '') + (iso === today ? ' is-today' : '')}
              onClick={() => onChange(iso)}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
