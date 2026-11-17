'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { isoOf, isoToday } from './Calendar';
import '../styles/date-field.css';

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  maxYears?: number;
  placeholder?: string;
  invalid?: boolean;
  dataField?: string;
}

function parse(iso: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T00:00:00') : null;
}

export default function DateField({ id, value, onChange, min, maxYears = 20, placeholder = 'Select a date', invalid, dataField }: Props) {
  const floor = min || isoToday();
  const floorDate = parse(floor) ?? new Date();
  const picked = parse(value);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'days' | 'years'>('days');
  const [view, setView] = useState(() => {
    const d = picked ?? floorDate;
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const root = useRef<HTMLDivElement>(null);
  const lastYear = floorDate.getFullYear() + maxYears;

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

  const toggle = () => {
    if (!open) {
      const d = picked ?? floorDate;
      setView({ y: d.getFullYear(), m: d.getMonth() });
      setMode('days');
    }
    setOpen(!open);
  };

  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const atStart = view.y < floorDate.getFullYear() || (view.y === floorDate.getFullYear() && view.m <= floorDate.getMonth());
  const atEnd = view.y >= lastYear && view.m >= 11;
  const first = new Date(view.y, view.m, 1).getDay();
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= count; d++) cells.push(isoOf(new Date(view.y, view.m, d)));
  const years = Array.from({ length: lastYear - floorDate.getFullYear() + 1 }, (_, i) => floorDate.getFullYear() + i);
  const today = isoToday();
  const label = picked ? picked.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className={'df' + (open ? ' is-open' : '') + (invalid ? ' is-invalid' : '')} ref={root} data-field={dataField}>
      <button type="button" id={id} className="df-btn" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
        <span className={'df-value' + (label ? '' : ' is-ph')}>{label || placeholder}</span>
        <CalendarDays aria-hidden="true" />
      </button>
      {open && (
        <div className="df-pop" role="dialog" aria-label="Choose a date">
          <div className="df-head">
            <button type="button" className="df-nav" onClick={() => (mode === 'days' ? shift(-1) : null)} disabled={mode === 'years' || atStart} aria-label="Previous month">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="df-title" onClick={() => setMode(mode === 'days' ? 'years' : 'days')} aria-label="Choose year">
              {mode === 'days' ? `${MONTHS[view.m]} ${view.y}` : 'Choose year'}
            </button>
            <button type="button" className="df-nav" onClick={() => (mode === 'days' ? shift(1) : null)} disabled={mode === 'years' || atEnd} aria-label="Next month">
              <ChevronRight aria-hidden="true" />
            </button>
          </div>

          {mode === 'years' ? (
            <div className="df-years">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={'df-year' + (y === view.y ? ' is-on' : '')}
                  onClick={() => {
                    const m = y === floorDate.getFullYear() ? Math.max(view.m, floorDate.getMonth()) : view.m;
                    setView({ y, m });
                    setMode('days');
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : (
            <div className="df-grid" role="grid">
              {WEEK.map((w) => (
                <span key={w} className="df-wd" role="columnheader">
                  {w}
                </span>
              ))}
              {cells.map((iso, i) => {
                if (!iso) return <span key={'x' + i} aria-hidden="true" />;
                const off = iso < floor;
                const on = iso === value;
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    className={'df-day' + (on ? ' is-on' : '') + (iso === today ? ' is-today' : '')}
                    disabled={off}
                    aria-selected={on}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                  >
                    {Number(iso.slice(8))}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
