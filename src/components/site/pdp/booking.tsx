'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Minus,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Select, { type SelectOption } from '../ui/Select';
import { money } from './pdp-data';

/* ==========================================================================
   Booking card pieces — the redesign's .bk card (ink outline + offset,
   price head / scrolling choices / pinned total + CTAs). Each detail page
   assembles its own card from these and keeps its own booking rules.
   ========================================================================== */

export interface QuoteLine {
  label: string;
  amount: number;
}

export type PaxId = 'adult' | 'child' | 'infant';

/* ------------------------------------------------------------ frame */

export function BkCard({ head, children, foot }: { head: ReactNode; children: ReactNode; foot: ReactNode }) {
  return (
    <section className="bk" id="book" aria-labelledby="bk-title">
      <div className="bk__head">{head}</div>
      <div className="bk__body">{children}</div>
      <div className="bk__foot">{foot}</div>
    </section>
  );
}

/** Price head: eyebrow, struck-through price + off badge, headline price. */
export function BkPrice({
  now,
  strike,
  off,
  basis,
  placeholder,
}: {
  now: number | null;
  strike?: number | null;
  off?: string | null;
  basis: string;
  /** shown instead of a price, e.g. "Revealing soon" */
  placeholder?: string;
}) {
  const showStrike = now != null && strike != null && strike > now;
  return (
    <>
      <p className="bk__eyebrow" id="bk-title">
        Booking details
      </p>
      {showStrike ? (
        <div className="bk__strike">
          <s>{money(strike)}</s>
          {off ? <span className="bk__off">{off}</span> : null}
        </div>
      ) : null}
      <p className="bk__now">
        {now != null ? <b>{money(now)}</b> : <b className="bk__soon">{placeholder ?? 'Price on request'}</b>}
        <span>{basis}</span>
      </p>
    </>
  );
}

export function BkStep({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="bk-step bk-fields">
      {label ? <p className="bk-step__label">{label}</p> : null}
      {children}
    </div>
  );
}

/** Checkbox row with its price (solo traveller, visa, add-ons). `locked`
    shows it as already chosen with no checkbox (solo-only packages). The
    children open under the row while it is ticked. */
export function BkCheck({
  label,
  price,
  checked,
  onChange,
  locked,
  children,
}: {
  label: ReactNode;
  price?: ReactNode;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  locked?: boolean;
  children?: ReactNode;
}) {
  const open = checked && children;
  return (
    <div className={'bk-opt' + (open ? ' has-sub' : '')}>
      <label className={'bk-solo' + (checked ? ' is-on' : '') + (locked ? ' is-locked' : '')}>
        {locked ? (
          <span className="bk-solo__tick" aria-hidden="true">
            <Check size={12} strokeWidth={3} />
          </span>
        ) : (
          <input type="checkbox" className="ui-check" checked={checked} onChange={(e) => onChange?.(e.target.checked)} />
        )}
        <span className="bk-solo__text">{label}</span>
        {price ? <span className="bk-solo__price">{price}</span> : null}
      </label>
      {open ? <div className="bk-sub">{children}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------ persons */

export interface PaxRow {
  id: PaxId;
  label: string;
  /** "8+ years · AED 1,700" */
  hint: string;
  value: number;
  /** the minus button stops here */
  min: number;
  max?: number;
}

function Stepper({ row, onStep, disabled }: { row: PaxRow; onStep: (id: PaxId, delta: number) => void; disabled?: boolean }) {
  return (
    <div className="bk-pax__row">
      <div className="bk-pax__text">
        <b>{row.label}</b>
        <small>{row.hint}</small>
      </div>
      <div className="bk-pax__stepper" role="group" aria-label={row.label}>
        <button type="button" aria-label={'Remove ' + row.label} disabled={disabled || row.value <= row.min} onClick={() => onStep(row.id, -1)}>
          <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <output aria-live="polite">{row.value}</output>
        <button
          type="button"
          aria-label={'Add ' + row.label}
          disabled={disabled || (row.max != null && row.value >= row.max)}
          onClick={() => onStep(row.id, 1)}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** The "2 Persons" field; opens the adult / child / infant steppers. */
export function BkPersons({
  rows,
  disabled,
  onStep,
}: {
  rows: PaxRow[];
  disabled?: boolean;
  onStep: (id: PaxId, delta: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = rows.reduce((n, r) => n + r.value, 0);
  const detail = rows
    .filter((r) => r.value > 0)
    .map((r) => `${r.value} ${r.label.toLowerCase()}${r.value === 1 ? '' : r.id === 'child' ? 'ren' : 's'}`)
    .join(' · ');
  const isOpen = open && !disabled;
  return (
    <div className={'bk-field' + (isOpen ? ' is-open' : '') + (disabled ? ' is-disabled' : '')}>
      <button type="button" className="bk-field__btn" aria-expanded={isOpen} disabled={disabled} onClick={() => setOpen((v) => !v)}>
        <Users size={16} strokeWidth={2} aria-hidden="true" />
        <span className="bk-field__value">
          {disabled ? '1 Person · solo' : `${total} ${total === 1 ? 'Person' : 'Persons'}`}
          {disabled || !detail ? null : <small>{detail}</small>}
        </span>
        <ChevronDown size={15} strokeWidth={2} aria-hidden="true" className="bk-field__chev" />
      </button>
      {isOpen ? (
        <div className="bk-pax">
          {rows.map((r) => (
            <Stepper key={r.id} row={r} onStep={onStep} />
          ))}
          <button type="button" className="bk-pax__done" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Plain steppers (no field), e.g. how many travellers need a visa. */
export function BkCounters({ rows, onStep }: { rows: PaxRow[]; onStep: (id: PaxId, delta: number) => void }) {
  return (
    <div className="bk-pax bk-pax--flat">
      {rows.map((r) => (
        <Stepper key={r.id} row={r} onStep={onStep} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ dates */

/** Fixed departures: a Select with a leading calendar icon. */
export function BkDateSelect({
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="bk-date-select">
      <CalendarDays size={16} strokeWidth={2} aria-hidden="true" className="bk-date-select__ico" />
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        searchable={false}
        disabled={disabled}
        aria-label="Travel date"
      />
    </div>
  );
}

const POP_GAP = 6;
const POP_MIN_W = 300;

/** Floating panel under (or above) a trigger, portaled to <body> so it
    overlays the page instead of pushing the booking card's content down.
    Closes on Escape and on a press outside both the trigger and itself. */
function BkPopover({
  anchor,
  onClose,
  children,
}: {
  anchor: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      if (!a) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(Math.max(a.width, POP_MIN_W), vw - 16);
      const left = Math.min(Math.max(8, a.left), vw - width - 8);
      const height = panel.current?.offsetHeight ?? 360;
      const below = vh - a.bottom - POP_GAP - 8;
      const up = below < height && a.top - POP_GAP - 8 > below;
      setPos(up ? { left, width, bottom: vh - a.top + POP_GAP } : { left, width, top: a.bottom + POP_GAP });
    };
    place();
    // a second pass once the panel has its real height (flip up if needed)
    const raf = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchor]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchor, onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    // outside the page, so it carries its own .at-site scope
    <div className="at-site">
      <div ref={panel} className="bk-pop" role="dialog" aria-label="Choose a date" style={{ position: 'fixed', ...(pos ?? { visibility: 'hidden' }) }}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Any-day packages: the field opens a floating calendar. */
export function BkDateField({
  value,
  placeholder = 'Add dates',
  open,
  onOpenChange,
  children,
}: {
  value: string;
  placeholder?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  return (
    <div className={'bk-field' + (open ? ' is-open' : '')}>
      <button ref={trigger} type="button" className="bk-field__btn" aria-expanded={open} aria-haspopup="dialog" onClick={() => onOpenChange(!open)}>
        <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
        <span className={'bk-field__value' + (value ? '' : ' is-ph')}>{value || placeholder}</span>
        <ChevronDown size={15} strokeWidth={2} aria-hidden="true" className="bk-field__chev" />
      </button>
      {open ? (
        <BkPopover anchor={trigger} onClose={close}>
          {children}
        </BkPopover>
      ) : null}
    </div>
  );
}

export function BkFlexLink() {
  return (
    <Link className="bk-flex" href="/travel-enquiry">
      Looking for a flexible date package?
      <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
    </Link>
  );
}

/* ------------------------------------------------------------ trust + foot */

export function BkTrust({ items, secure = 'Secure online payment at checkout' }: { items: string[]; secure?: string }) {
  return (
    <div className="bk-trust">
      {items.length ? (
        <ul className="bk-assure">
          {items.map((a) => (
            <li key={a}>
              <Check size={12} strokeWidth={3} aria-hidden="true" />
              {a}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="bk-secure">
        <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" />
        {secure}
      </p>
    </div>
  );
}

/** Total (tap for the breakdown), payment line and the Book now CTA,
    which hands this one booking to /checkout. */
export function BkFoot({
  total,
  travellers,
  lines,
  note = 'Prices in AED',
  meta,
  savings = 0,
  issue,
  bookLabel = 'Book now',
  onBook,
  closed,
}: {
  total: number;
  travellers: number;
  lines: QuoteLine[];
  note?: string;
  meta?: ReactNode;
  savings?: number;
  /** what is still missing, e.g. "Select your travel date" */
  issue?: string | null;
  bookLabel?: string;
  onBook: () => void;
  /** not bookable online (price revealing soon): no total, no CTAs */
  closed?: ReactNode;
}) {
  const [showLines, setShowLines] = useState(false);

  if (closed) return <>{closed}</>;

  return (
    <>
      <button type="button" className="bk-total" aria-expanded={showLines} onClick={() => setShowLines((v) => !v)}>
        <span className="bk-total__label">
          Total · {travellers} traveller{travellers === 1 ? '' : 's'}
          <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true" className={showLines ? 'is-open' : ''} />
        </span>
        <b>{money(total)}</b>
      </button>
      {showLines ? (
        <ul className="bk-lines">
          {lines.map((l, i) => (
            <li key={l.label + i} className={l.amount < 0 ? 'is-minus' : ''}>
              <span>{l.label}</span>
              <span>{l.amount < 0 ? '−' + money(-l.amount) : money(l.amount)}</span>
            </li>
          ))}
          <li className="bk-lines__note">
            <span>{note}</span>
          </li>
        </ul>
      ) : null}

      {meta || savings > 0 ? (
        <div className="bk-meta">
          <span>{meta}</span>
          {savings > 0 ? <span className="bk-save">Save {money(savings)}</span> : null}
        </div>
      ) : null}

      {issue ? <p className="bk-issue">{issue} to continue</p> : null}
      <div className="bk-ctas">
        <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" disabled={!!issue} onClick={onBook}>
          {bookLabel}
          <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ quote */

export interface QuoteInput {
  /** booking as one solo traveller (solo price, no persons) */
  solo: boolean;
  persons: Record<PaxId, number>;
  /** unit prices as the page prices them (deal of the day already applied) */
  prices: { adultPrice: number; childPrice: number; infantPrice: number; soloTravellerPrice?: number | null };
  /** limited-time discount amounts per person, when that discount is live */
  limited?: { adult?: number | null; child?: number | null; infant?: number | null } | null;
  /** package-only pricing (no per-person prices): this is the whole price */
  packagePrice?: number | null;
  /** visa travellers and their per-person visa fee */
  visa?: Array<{ who: string; count: number; price: number }>;
  /** add-ons and anything else priced on top */
  extras?: QuoteLine[];
  /** agent / referral percentage taken off the whole booking */
  pct?: number;
  pctLabel?: string | null;
  /** false: the percentage is applied but not advertised (referral links
      with "show discount" off) — no discount line, no strike-through */
  showPct?: boolean;
  /** the page's own total — always what is shown; null while it's computing */
  total: number | null;
  /** "Registration " for Marina registration-only cruises */
  prefix?: string;
}

export interface Quote {
  lines: QuoteLine[];
  total: number;
  savings: number;
  travellers: number;
  /** headline per-person price after every discount, and before them */
  now: number;
  strike: number;
  basis: string;
}

/** Breakdown lines for the page's own total. The discount line is whatever
    separates the lines from that total, so the card can never disagree with
    the price the booking is built from. */
export function buildQuote(q: QuoteInput): Quote {
  const p = q.prefix ?? '';
  const pct = q.pct ?? 0;
  // an unadvertised percentage is folded into every price instead of shown
  const k = q.showPct === false ? 1 - pct / 100 : 1;
  const cut = (base: number, amt?: number | null) => (amt ? Math.max(0, base - amt) : base);
  const unit = {
    adult: cut(q.prices.adultPrice, q.limited?.adult) * k,
    child: cut(q.prices.childPrice, q.limited?.child) * k,
    infant: cut(q.prices.infantPrice, q.limited?.infant) * k,
  };
  const solo = (q.prices.soloTravellerPrice ?? q.prices.adultPrice ?? 0) * k;
  const pkgPrice = (q.packagePrice ?? 0) * k;

  const lines: QuoteLine[] = [];
  let raw = 0;
  if (q.solo) {
    lines.push({ label: `${p}Solo traveller`, amount: solo });
    raw += solo;
  } else {
    const rows: Array<[PaxId, string]> = [
      ['adult', 'Adult'],
      ['child', 'Child'],
      ['infant', 'Infant'],
    ];
    rows.forEach(([id, label]) => {
      const n = q.persons[id];
      if (n > 0 && unit[id] > 0) {
        lines.push({ label: `${n} × ${p}${label} @ ${money(unit[id])}`, amount: n * unit[id] });
        raw += n * q.prices[`${id}Price` as 'adultPrice'] * k;
      }
    });
    if (!lines.length && pkgPrice) {
      lines.push({ label: 'Package price', amount: pkgPrice });
      raw += pkgPrice;
    }
  }
  (q.visa ?? []).forEach((v) => {
    if (v.count > 0 && v.price > 0) {
      lines.push({ label: `${v.count} × Visa (${v.who}) @ ${money(v.price * k)}`, amount: v.count * v.price * k });
      raw += v.count * v.price * k;
    }
  });
  (q.extras ?? []).forEach((x) => {
    if (x.amount) {
      lines.push({ label: x.label, amount: x.amount * k });
      raw += x.amount * k;
    }
  });

  const sum = lines.reduce((s, l) => s + l.amount, 0);
  const total = q.total ?? sum;
  const gap = Math.round((sum - total) * 100) / 100;
  if (gap > 0.01) lines.push({ label: q.pctLabel || 'Discount', amount: -gap });

  const headRaw = q.solo ? solo : q.prices.adultPrice * k || pkgPrice;
  const headUnit = q.solo ? solo : unit.adult || pkgPrice;
  return {
    lines,
    total,
    savings: Math.max(0, Math.round((raw - total) * 100) / 100),
    travellers: q.solo ? 1 : q.persons.adult + q.persons.child + q.persons.infant,
    now: k === 1 ? headUnit * (1 - pct / 100) : headUnit,
    strike: headRaw,
    basis: q.solo ? 'per solo traveller' : q.prices.adultPrice ? (p ? 'per adult · registration' : 'per adult') : 'package price',
  };
}

/** "7% OFF" between a price and its struck-through original. */
export function offLabel(now: number, strike: number): string | null {
  if (!(strike > now) || strike <= 0) return null;
  const pct = Math.round(((strike - now) / strike) * 100);
  return pct >= 1 ? `${pct}% OFF` : `Save ${money(strike - now)}`;
}
