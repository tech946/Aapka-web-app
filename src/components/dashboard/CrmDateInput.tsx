'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import CrmSelect from './CrmSelect';
import { layoutStyle } from './layout-style';
import './crm-date-input.css';

/* ==========================================================================
   CrmDateInput — drop-in for <input type="date" | "datetime-local"> in the
   dashboard. The browser's own picker can't be styled, so this draws the
   CRM date picker (the website's .mcal look: ink outline + offset, ink
   selected day, brand "today").

   Same contract as the native input, so existing handlers keep working:
     value     'yyyy-MM-dd'  or  'yyyy-MM-ddTHH:mm'  ('' for none)
     onChange  receives an event whose target.value is that same string
     min / max same formats; only the date part limits the calendar
   ========================================================================== */

type Kind = 'date' | 'datetime-local';

interface Props {
  type?: Kind;
  value?: string | null;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
  name?: string;
}

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const GAP = 6;

/** yyyy-mm-dd from local date parts (toISOString() is UTC and can slip a day). */
function isoOf(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function split(value: string | null | undefined): { day: string; time: string } {
  const v = (value || '').trim();
  const day = /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : '';
  const t = v.slice(11, 16);
  return { day, time: /^\d{2}:\d{2}$/.test(t) ? t : '' };
}

function label(day: string, time: string, kind: Kind): string {
  if (!day) return '';
  const d = new Date(day + 'T00:00:00');
  const text = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return kind === 'datetime-local' ? `${text}, ${time || '00:00'}` : text;
}

/** A minimal ChangeEvent so `e => set(e.target.value)` handlers work as before. */
function fakeEvent(value: string, name?: string): ChangeEvent<HTMLInputElement> {
  const target = { value, name: name ?? '' } as HTMLInputElement;
  return { target, currentTarget: target } as unknown as ChangeEvent<HTMLInputElement>;
}

export default function CrmDateInput({
  type = 'date',
  value,
  onChange,
  min,
  max,
  disabled,
  required,
  placeholder,
  className = '',
  style,
  id,
  name,
}: Props) {
  const { day, time } = split(value);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const isDateTime = type === 'datetime-local';

  const emit = useCallback(
    (nextDay: string, nextTime: string) => {
      const v = !nextDay ? '' : isDateTime ? `${nextDay}T${nextTime || '00:00'}` : nextDay;
      onChange?.(fakeEvent(v, name));
    },
    [isDateTime, name, onChange]
  );

  return (
    <div className={'crm-date' + (disabled ? ' is-disabled' : '')} style={layoutStyle(style)}>
      <button
        ref={trigger}
        id={id}
        type='button'
        className={'crm-date__field' + (open ? ' is-open' : '') + (className ? ' ' + className : '')}
        disabled={disabled}
        aria-haspopup='dialog'
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span className={'crm-date__value' + (day ? '' : ' is-ph')}>
          {day ? label(day, time, type) : placeholder || (isDateTime ? 'Select date & time' : 'Select date')}
        </span>
        <CalendarDays size={15} strokeWidth={2} aria-hidden='true' className='crm-date__ico' />
      </button>
      {/* keeps native "required" validation working for the form */}
      {required ? (
        <input
          className='crm-date__native'
          tabIndex={-1}
          aria-hidden='true'
          required
          value={day}
          onChange={() => {}}
          onFocus={() => trigger.current?.focus()}
        />
      ) : null}
      {open ? (
        <Popover anchor={trigger} onClose={() => setOpen(false)}>
          <Month
            day={day}
            time={time}
            isDateTime={isDateTime}
            min={split(min).day}
            max={split(max).day}
            onPick={(d) => {
              emit(d, time);
              if (!isDateTime) setOpen(false);
            }}
            onTime={(t) => emit(day || isoOf(new Date()), t)}
            onClear={() => {
              emit('', '');
              setOpen(false);
            }}
            onToday={() => {
              emit(isoOf(new Date()), time);
              if (!isDateTime) setOpen(false);
            }}
            onDone={() => setOpen(false)}
          />
        </Popover>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ calendar */

function Month({
  day,
  time,
  isDateTime,
  min,
  max,
  onPick,
  onTime,
  onClear,
  onToday,
  onDone,
}: {
  day: string;
  time: string;
  isDateTime: boolean;
  min: string;
  max: string;
  onPick: (iso: string) => void;
  onTime: (hhmm: string) => void;
  onClear: () => void;
  onToday: () => void;
  onDone: () => void;
}) {
  const today = isoOf(new Date());
  const start = new Date((day || (min && min > today ? min : today)) + 'T00:00:00');
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });

  const first = new Date(view.y, view.m, 1).getDay();
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= count; d++) cells.push(isoOf(new Date(view.y, view.m, d)));

  const title = new Date(view.y, view.m, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
  const monthKey = (y: number, m: number) => y * 12 + m;
  const atMin = !!min && monthKey(view.y, view.m) <= monthKey(+min.slice(0, 4), +min.slice(5, 7) - 1);
  const atMax = !!max && monthKey(view.y, view.m) >= monthKey(+max.slice(0, 4), +max.slice(5, 7) - 1);
  const todayOff = (!!min && today < min) || (!!max && today > max);

  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const [hh, mm] = (time || '00:00').split(':');

  return (
    <div className='crm-cal'>
      <div className='crm-cal__head'>
        <button type='button' className='crm-cal__nav' aria-label='Previous month' disabled={atMin} onClick={() => shift(-1)}>
          <ChevronLeft size={14} strokeWidth={2.4} aria-hidden='true' />
        </button>
        <p className='crm-cal__title' aria-live='polite'>
          {title}
        </p>
        <button type='button' className='crm-cal__nav' aria-label='Next month' disabled={atMax} onClick={() => shift(1)}>
          <ChevronRight size={14} strokeWidth={2.4} aria-hidden='true' />
        </button>
      </div>

      <div className='crm-cal__grid' role='grid' aria-label={title}>
        {WEEK.map(w => (
          <span key={w} className='crm-cal__wd' role='columnheader'>
            {w}
          </span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <span key={'e' + i} />;
          const off = (!!min && iso < min) || (!!max && iso > max);
          const on = iso === day;
          return (
            <button
              key={iso}
              type='button'
              role='gridcell'
              aria-selected={on}
              disabled={off}
              className={'crm-cal__day' + (on ? ' is-on' : '') + (iso === today ? ' is-today' : '')}
              onClick={() => onPick(iso)}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>

      {isDateTime ? (
        <div className='crm-cal__time'>
          <span className='crm-cal__time-label'>Time</span>
          <CrmSelect style={{ width: 70 }} aria-label='Hour' value={hh} onChange={e => onTime(`${e.target.value}:${mm}`)}>
            {HOURS.map(h => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </CrmSelect>
          <span className='crm-cal__colon'>:</span>
          <CrmSelect style={{ width: 70 }} aria-label='Minute' value={mm} onChange={e => onTime(`${hh}:${e.target.value}`)}>
            {MINUTES.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </CrmSelect>
        </div>
      ) : null}

      <div className='crm-cal__foot'>
        <button type='button' className='crm-cal__link' onClick={onClear}>
          Clear
        </button>
        <div className='crm-cal__foot-right'>
          <button type='button' className='crm-cal__link' disabled={todayOff} onClick={onToday}>
            Today
          </button>
          {isDateTime ? (
            <button type='button' className='crm-cal__done' onClick={onDone}>
              Done
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ popover */

/** Panel under (or above) the field, portaled to <body> so modals with
    overflow don't clip it. Closes on Escape and on a press outside. */
function Popover({
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
      const width = Math.min(284, vw - 16);
      const left = Math.min(Math.max(8, a.left), vw - width - 8);
      const height = panel.current?.offsetHeight ?? 340;
      const below = vh - a.bottom - GAP - 8;
      const up = below < height && a.top - GAP - 8 > below;
      setPos(up ? { left, width, bottom: vh - a.top + GAP } : { left, width, top: a.bottom + GAP });
    };
    place();
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
      // the hour / minute dropdowns open their own portaled menu
      if ((t as Element).closest?.('.crm-select-pop')) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [anchor, onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={panel}
      className='crm-date-pop'
      role='dialog'
      aria-label='Choose a date'
      // a click in the panel must not reach a modal overlay's close handler
      onClick={e => e.stopPropagation()}
      style={{ position: 'fixed', ...(pos ?? { visibility: 'hidden' }) }}
    >
      {children}
    </div>,
    document.body
  );
}
