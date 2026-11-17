'use client';

import { useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Star } from 'lucide-react';
import { isoOf } from './data';

export function QuestionHead({ title, sub, required }: { title: string; sub?: string; required?: boolean }) {
  return (
    <header className="pt-q__head">
      <h2>
        {title}
        {required ? <span className="pt-req">Required</span> : null}
      </h2>
      {sub ? <p>{sub}</p> : null}
    </header>
  );
}

export function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="pt-group">
      <div className="pt-group__label">
        <span>{label}</span>
        {hint ? <small>{hint}</small> : null}
      </div>
      {children}
    </div>
  );
}

export function OptionCard({
  title,
  note,
  image,
  icon,
  meta,
  on,
  multi,
  onClick,
}: {
  title: string;
  note?: string;
  image?: string;
  icon?: ReactNode;
  meta?: ReactNode;
  on: boolean;
  multi?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={'pt-card' + (on ? ' is-on' : '') + (image ? ' pt-card--photo' : '')}
      role={multi ? undefined : 'radio'}
      aria-checked={multi ? undefined : on}
      aria-pressed={multi ? on : undefined}
      onClick={onClick}
    >
      {image ? (
        <span className="pt-card__img">
          <img src={image} alt="" loading="lazy" decoding="async" />
        </span>
      ) : null}
      {icon ? <span className="pt-card__icon">{icon}</span> : null}
      <span className="pt-card__body">
        {meta}
        <b>{title}</b>
        {note ? <small>{note}</small> : null}
      </span>
      <span className="pt-card__tick" aria-hidden="true">
        <Check />
      </span>
    </button>
  );
}

export function Chip({ label, on, onClick, multi }: { label: string; on: boolean; onClick: () => void; multi?: boolean }) {
  return (
    <button
      type="button"
      className={'pt-chip' + (on ? ' is-on' : '')}
      role={multi ? undefined : 'radio'}
      aria-checked={multi ? undefined : on}
      aria-pressed={multi ? on : undefined}
      onClick={onClick}
    >
      {multi && on ? <Check aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

export function Segmented({ options, value, onChange, label }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="pt-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} className={o.value === value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Counter({ label, hint, value, min = 0, max = 20, onChange }: { label: string; hint: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="pt-counter">
      <span className="pt-counter__text">
        <b>{label}</b>
        <small>{hint}</small>
      </span>
      <span className="pt-counter__ctrl">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Minus aria-hidden="true" />
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Plus aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

export function SwitchRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={'pt-switch' + (checked ? ' is-on' : '')}>
      <span className="pt-switch__text">
        <b>{label}</b>
        {hint ? <small>{hint}</small> : null}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Stars({ count }: { count: number }) {
  if (!count) return <span className="pt-stars pt-stars--none">Any class</span>;
  return (
    <span className="pt-stars" role="img" aria-label={`${count} star`}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} aria-hidden="true" />
      ))}
    </span>
  );
}

const WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function monthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) cells.push(isoOf(new Date(year, month, d)));
  return cells;
}

export function RangeCalendar({ checkIn, checkOut, onChange }: { checkIn: string; checkOut: string; onChange: (checkIn: string, checkOut: string) => void }) {
  const today = isoOf(new Date());
  const startBase = checkIn ? new Date(checkIn + 'T00:00:00') : new Date();
  const [view, setView] = useState({ y: startBase.getFullYear(), m: startBase.getMonth() });
  const now = new Date();
  const atStart = view.y === now.getFullYear() && view.m === now.getMonth();

  function pick(iso: string) {
    if (!checkIn || checkOut || iso <= checkIn) onChange(iso, '');
    else onChange(checkIn, iso);
  }

  function shift(by: number) {
    const d = new Date(view.y, view.m + by, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }

  const months = [0, 1].map((i) => {
    const d = new Date(view.y, view.m + i, 1);
    return { y: d.getFullYear(), m: d.getMonth(), title: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
  });

  return (
    <div className="pt-cal">
      <div className="pt-cal__nav">
        <button type="button" aria-label="Previous month" disabled={atStart} onClick={() => shift(-1)}>
          <ChevronLeft aria-hidden="true" />
        </button>
        <button type="button" aria-label="Next month" onClick={() => shift(1)}>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <div className="pt-cal__months">
        {months.map((mo, i) => (
          <div key={mo.title} className={'pt-cal__month' + (i === 1 ? ' pt-cal__month--second' : '')}>
            <p className="pt-cal__title">{mo.title}</p>
            <div className="pt-cal__grid" role="grid" aria-label={mo.title}>
              {WEEK.map((w) => (
                <span key={w} className="pt-cal__wd">
                  {w}
                </span>
              ))}
              {monthDays(mo.y, mo.m).map((iso, k) => {
                if (!iso) return <span key={'e' + k} />;
                const past = iso < today;
                const isStart = iso === checkIn;
                const isEnd = iso === checkOut;
                const inRange = !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;
                const cls = ['pt-cal__day', isStart ? 'is-start' : '', isEnd ? 'is-end' : '', inRange ? 'is-range' : '', isStart && checkOut ? 'has-end' : ''].filter(Boolean).join(' ');
                return (
                  <button key={iso} type="button" className={cls} disabled={past} aria-pressed={isStart || isEnd} onClick={() => pick(iso)}>
                    {Number(iso.slice(8))}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
