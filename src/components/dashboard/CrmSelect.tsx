'use client';

import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { layoutStyle } from './layout-style';
import './crm-select.css';

/* ==========================================================================
   CrmSelect — drop-in for <select> in the dashboard. The browser's own
   option list can't be styled, so this draws the CRM dropdown (the
   website's Select look: ink-outlined menu with offset, brand check on the
   chosen row, search box on long lists).

   Same contract as the native element, so call sites only change the tag:
     children  the same <option> (and <optgroup>) elements
     value     the selected option's value
     onChange  receives an event whose target.value is the picked value
   ========================================================================== */

interface Opt {
  value: string;
  label: string;
  disabled: boolean;
}

interface Props {
  value?: string | number | null;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  children?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

const SEARCH_FROM = 9; // show the search box once a list is this long
const GAP = 6;

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/** <option> children → options (arrays, fragments and optgroups flattened). */
function readOptions(children: ReactNode, out: Opt[] = []): Opt[] {
  Children.forEach(children, child => {
    if (!isValidElement<{ value?: unknown; children?: ReactNode; disabled?: boolean }>(child)) return;
    if (child.type === 'option') {
      const label = textOf(child.props.children);
      out.push({
        value: child.props.value !== undefined ? String(child.props.value) : label,
        label,
        disabled: !!child.props.disabled,
      });
    } else if (child.type === 'optgroup' || child.type === Fragment) {
      readOptions(child.props.children, out);
    }
  });
  return out;
}

/** A minimal ChangeEvent so `e => set(e.target.value)` handlers work as before. */
function fakeEvent(value: string, name?: string): ChangeEvent<HTMLSelectElement> {
  const target = { value, name: name ?? '' } as HTMLSelectElement;
  return { target, currentTarget: target } as unknown as ChangeEvent<HTMLSelectElement>;
}

export default function CrmSelect({
  value,
  onChange,
  children,
  disabled,
  required,
  style,
  id,
  name,
  'aria-label': ariaLabel,
}: Props) {
  const options = useMemo(() => readOptions(children), [children]);
  const current = value == null ? '' : String(value);
  // like a native select: an unknown value shows the first option
  const selected = options.find(o => o.value === current) ?? options[0];
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const uid = useId();

  const pick = (v: string) => {
    setOpen(false);
    trigger.current?.focus();
    if (v !== current) onChange?.(fakeEvent(v, name));
  };

  return (
    <div className={'crm-select' + (disabled ? ' is-disabled' : '')} style={layoutStyle(style)}>
      <button
        ref={trigger}
        id={id}
        type='button'
        className={'crm-select__btn' + (open ? ' is-open' : '')}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={open ? uid : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className={'crm-select__value' + (!selected || selected.value === '' ? ' is-ph' : '')}>
          {selected?.label ?? ''}
        </span>
        <ChevronDown size={14} strokeWidth={2.2} aria-hidden='true' className='crm-select__chev' />
      </button>
      {/* keeps native "required" validation working for the form */}
      {required ? (
        <input
          className='crm-select__native'
          tabIndex={-1}
          aria-hidden='true'
          required
          value={current}
          onChange={() => {}}
          onFocus={() => trigger.current?.focus()}
        />
      ) : null}
      {open ? (
        <Menu
          id={uid}
          anchor={trigger}
          options={options}
          current={selected?.value ?? ''}
          onPick={pick}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ menu */

function Menu({
  id,
  anchor,
  options,
  current,
  onPick,
  onClose,
}: {
  id: string;
  anchor: RefObject<HTMLElement | null>;
  options: Opt[];
  current: string;
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<CSSProperties | null>(null);
  const [query, setQuery] = useState('');
  const searchable = options.length >= SEARCH_FROM;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const [hi, setHi] = useState(() => Math.max(0, options.findIndex(o => o.value === current)));
  useEffect(() => setHi(h => Math.min(Math.max(0, h), Math.max(0, shown.length - 1))), [shown.length]);

  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      if (!a) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(Math.max(a.width, 180), vw - 16);
      const left = Math.min(Math.max(8, a.left), vw - width - 8);
      const below = vh - a.bottom - GAP - 8;
      const above = a.top - GAP - 8;
      const want = Math.min(panel.current?.scrollHeight ?? 320, 320);
      const up = below < want && above > below;
      const maxHeight = Math.max(140, Math.min(320, up ? above : below));
      setPos(
        up
          ? { left, width, bottom: vh - a.top + GAP, maxHeight }
          : { left, width, top: a.bottom + GAP, maxHeight }
      );
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

  // focus the search box (or the list) and bring the chosen row into view
  useEffect(() => {
    if (searchable) searchRef.current?.focus();
    else list.current?.focus();
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [searchable]);

  useEffect(() => {
    list.current?.querySelector(`[data-i="${hi}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [hi]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [anchor, onClose]);

  const move = (delta: number) => {
    if (!shown.length) return;
    let i = hi;
    for (let n = 0; n < shown.length; n++) {
      i = (i + delta + shown.length) % shown.length;
      if (!shown[i].disabled) break;
    }
    setHi(i);
  };

  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHi(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setHi(shown.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = shown[hi];
      if (o && !o.disabled) onPick(o.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === 'Tab') {
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={panel}
      className='crm-select-pop'
      // a click in the menu must not reach a modal overlay's close handler
      onClick={e => e.stopPropagation()}
      onKeyDown={onKey}
      style={{ position: 'fixed', ...(pos ?? { visibility: 'hidden' }) }}
    >
      {searchable ? (
        <div className='crm-select__search'>
          <Search size={13} strokeWidth={2.2} aria-hidden='true' />
          <input
            ref={searchRef}
            type='text'
            placeholder='Search…'
            aria-label='Search options'
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setHi(0);
            }}
          />
        </div>
      ) : null}
      <ul ref={list} id={id} role='listbox' tabIndex={-1} className='crm-select__list'>
        {shown.length ? (
          shown.map((o, i) => {
            const on = o.value === current;
            return (
              <li
                key={o.value + i}
                role='option'
                data-i={i}
                aria-selected={on}
                aria-disabled={o.disabled || undefined}
                className={
                  'crm-select__opt' +
                  (on ? ' is-on' : '') +
                  (i === hi ? ' is-hi' : '') +
                  (o.disabled ? ' is-disabled' : '') +
                  (o.value === '' ? ' is-ph' : '')
                }
                onMouseEnter={() => setHi(i)}
                onMouseDown={e => {
                  e.preventDefault();
                  if (!o.disabled) onPick(o.value);
                }}
              >
                <span className='crm-select__opt-label'>{o.label}</span>
                {on ? <Check size={13} strokeWidth={2.6} aria-hidden='true' className='crm-select__check' /> : null}
              </li>
            );
          })
        ) : (
          <li className='crm-select__empty'>No match</li>
        )}
      </ul>
    </div>,
    document.body
  );
}
