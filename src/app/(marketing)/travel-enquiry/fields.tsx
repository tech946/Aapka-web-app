'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, Check, ChevronDown, Minus, Plus } from 'lucide-react';
import Calendar from '@/components/site/ui/Calendar';
import { dayLabel, type Choice } from './enquiry-config';

/* Form building blocks for the enquiry page, drawn with the theme's
   ui-* controls. Each takes plain values + onChange; no form state here. */

/** A collapsible step. Closed: number (→ tick when done), title and the
    answers so far (or the hint). Open: ink outline + offset, the fields,
    then the step's actions (Continue / Skip / Send). */
export function Step({
  id,
  index,
  title,
  hint,
  summary,
  done,
  required,
  open,
  onToggle,
  actions,
  children,
}: {
  id: string;
  index: number;
  title: string;
  hint: string;
  /** answers so far, shown under the title ('' = show the hint) */
  summary: string;
  done: boolean;
  required?: boolean;
  open: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const panelId = `${id}-panel`;
  return (
    <section id={id} className={'te-step' + (open ? ' is-open' : '') + (done ? ' is-done' : '')}>
      <h2 className="te-step__heading">
        <button type="button" className="te-step__head" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          <span className="te-step__num" aria-hidden="true">
            {done && !open ? <Check /> : index}
          </span>
          <span className="te-step__text">
            <span className="te-step__title">{title}</span>
            <span className={'te-step__sub' + (summary ? ' has-answer' : '')}>{summary || hint}</span>
          </span>
          {required && !done ? <span className="te-step__req">Required</span> : null}
          <ChevronDown className="te-step__chev" aria-hidden="true" />
        </button>
      </h2>
      <div id={panelId} className="te-step__panel" hidden={!open}>
        <div className="te-step__body">{children}</div>
        {actions ? <div className="te-step__actions">{actions}</div> : null}
      </div>
    </section>
  );
}

/** Label-above field (ui-field). `wide` spans the full row. */
export function Field({
  label,
  htmlFor,
  required,
  optional,
  wide,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  wide?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={'ui-field' + (wide ? ' ui-field--wide' : '') + (error ? ' has-error' : '')}>
      <label className="ui-label" htmlFor={htmlFor}>
        {label}
        {required ? <i className="ui-req">*</i> : null}
        {optional ? <span className="ui-optional">Optional</span> : null}
      </label>
      {children}
      {error ? <p className="ui-error">{error}</p> : null}
    </div>
  );
}

/** One-of chips; tapping the picked one clears it. */
export function ChoiceChips({ options, value, onChange, label }: { options: Choice[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="te-chips" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} className={'te-chip' + (on ? ' is-on' : '')} onClick={() => onChange(on ? '' : o.value)}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Any-of chips over a set of yes/no flags. */
export function FlagChips({ items, label }: { items: { key: string; label: string; on: boolean; toggle: () => void }[]; label: string }) {
  return (
    <div className="te-chips" role="group" aria-label={label}>
      {items.map((i) => (
        <button key={i.key} type="button" aria-pressed={i.on} className={'te-chip' + (i.on ? ' is-on' : '')} onClick={i.toggle}>
          {i.on ? <Check aria-hidden="true" /> : null}
          {i.label}
        </button>
      ))}
    </div>
  );
}

/** Yes/no as a switch row: label + hint left, switch right. */
export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="te-toggle">
      <span className="te-toggle__text">
        <b>{label}</b>
        {hint ? <small>{hint}</small> : null}
      </span>
      <input type="checkbox" role="switch" className="te-switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** − n + counter row (the booking card's .bk-pax look). */
export function Stepper({ label, hint, value, onChange, min = 0 }: { label: string; hint?: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="bk-pax__row te-stepper">
      <span className="bk-pax__text">
        <b>{label}</b>
        {hint ? <small>{hint}</small> : null}
      </span>
      <span className="bk-pax__stepper">
        <button type="button" aria-label={`Remove ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Minus size={13} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`Add ${label}`} onClick={() => onChange(value + 1)}>
          <Plus size={13} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

/** Date button that opens the site calendar under it. */
export function DateField({ id, value, onChange, min, placeholder }: { id: string; value: string; onChange: (iso: string) => void; min?: string; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = dayLabel(value);

  return (
    <div className={'dd te-date' + (open ? ' is-open' : '')} ref={ref}>
      <button id={id} type="button" className="dd-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <CalendarDays className="te-date__icon" aria-hidden="true" />
        <span className={'dd-value' + (label ? '' : ' is-ph')}>{label || placeholder}</span>
      </button>
      {open && (
        <div className="te-date__pop" role="dialog" aria-label={placeholder}>
          <Calendar
            value={value}
            min={min}
            onChange={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
