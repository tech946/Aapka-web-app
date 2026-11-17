'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../styles/select.css';

export type SelectOption = string | number | { value: string | number; label: ReactNode; hint?: ReactNode };

interface NormalizedOption {
  value: string;
  label: ReactNode;
  hint?: ReactNode;
}

export interface SelectProps {
  value?: string | number | null;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: 'md' | 'sm';
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  invalid?: boolean;
  name?: string;
  id?: string;
  className?: string;
  menuWidth?: number;
  'aria-label'?: string;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  up: boolean;
  font: string;
}

function plain(node: ReactNode): string {
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}

function searchText(item: NormalizedOption): string {
  return [plain(item.label), item.value, plain(item.hint)].join(' ').toLowerCase();
}

function toOptions(options: SelectOption[]): NormalizedOption[] {
  return (options || []).map((item) =>
    typeof item === 'string' || typeof item === 'number'
      ? { value: String(item), label: String(item) }
      : { value: String(item.value), label: item.label, hint: item.hint }
  );
}

/**
 * The site's dropdown, in the new cream / dark-green design (styles/select.css).
 * 44px dashed trigger; the menu is portaled to <body> and takes the trigger's
 * font, so it matches whichever page it opens on. Selected row in lime with
 * the tick after the label. Arrow keys, Enter, Escape and type-to-search.
 *
 * searchable — adds the search row; defaults on for lists longer than 8.
 * size       — 'md' (44px) | 'sm' (38px, toolbar / inline use).
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select',
  size = 'md',
  disabled = false,
  searchable,
  searchPlaceholder = 'Search…',
  invalid = false,
  name,
  id,
  className = '',
  menuWidth,
  'aria-label': ariaLabel,
}: SelectProps) {
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [pos, setPos] = useState<MenuPosition | null>(null);
  const [q, setQ] = useState('');
  const all = toOptions(options);
  const withSearch = searchable ?? all.length > 8;
  const query = q.trim().toLowerCase();
  const list = query ? all.filter((item) => searchText(item).includes(query)) : all;
  const picked = all.find((item) => item.value === String(value ?? ''));
  const listId = uid + '-list';

  function place() {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxH = 290 + (withSearch ? 48 : 0);
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const up = below < Math.min(maxH, all.length * 42 + 16) && above > below;
    const width = Math.max(r.width, menuWidth || (size === 'sm' ? 160 : 200));
    const left = Math.min(r.left, window.innerWidth - width - 8);
    setPos({
      top: up ? undefined : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : undefined,
      left: Math.max(8, left),
      width,
      up,
      font: getComputedStyle(btnRef.current ?? el).fontFamily,
    });
  }

  useLayoutEffect(() => {
    if (open) place();
  }, [open, all.length, size]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onAway = (e: Event) => {
      if (e.type === 'scroll' && menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', onAway);
    document.addEventListener('scroll', onAway, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', onAway);
      document.removeEventListener('scroll', onAway, true);
    };
  }, [open]);

  // On open: highlight the current value and focus the search row
  useEffect(() => {
    if (!open) {
      setQ('');
      return;
    }
    const idx = all.findIndex((item) => item.value === String(value ?? ''));
    setHi(idx >= 0 ? idx : 0);
    if (withSearch) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (open && query) setHi(list.length ? 0 : -1);
  }, [q]);

  // keep the highlighted row in view while arrowing through a long list
  useEffect(() => {
    if (!open || hi < 0) return;
    listRef.current?.querySelector('[data-i="' + hi + '"]')?.scrollIntoView({ block: 'nearest' });
  }, [hi, open]);

  function close(refocus: boolean) {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }

  function pick(next: string) {
    onChange?.(next);
    close(true);
  }

  function onKey(e: KeyboardEvent<HTMLElement>) {
    if (disabled) return;
    if (e.key === 'Escape') {
      if (open) {
        e.stopPropagation();
        close(true);
      }
      return;
    }
    if (e.key === 'Tab') {
      if (open) setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (!list.length) return;
      setHi((cur) => {
        const start = cur < 0 ? 0 : cur;
        const next = e.key === 'ArrowDown' ? start + 1 : start - 1;
        if (next < 0) return list.length - 1;
        if (next >= list.length) return 0;
        return next;
      });
      return;
    }
    if (e.key === 'Enter' || (e.key === ' ' && e.target === btnRef.current)) {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (hi >= 0 && list[hi]) pick(list[hi].value);
    }
  }

  return (
    <div
      ref={rootRef}
      className={
        'dd' +
        (size === 'sm' ? ' is-sm' : '') +
        (open ? ' is-open' : '') +
        (invalid ? ' is-invalid' : '') +
        (className ? ' ' + className : '')
      }
    >
      {name ? <input type="hidden" name={name} value={value ?? ''} /> : null}
      <button
        ref={btnRef}
        id={id}
        type="button"
        className="dd-btn"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKey}
      >
        <span className={'dd-value' + (picked ? '' : ' is-ph')}>{picked ? picked.label : placeholder}</span>
        <svg className="dd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              className={'dd-menu' + (pos.up ? ' is-up' : '') + (size === 'sm' ? ' is-sm' : '')}
              style={{
                position: 'fixed',
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
                width: pos.width,
                fontFamily: pos.font,
                ['--app-font' as string]: pos.font,
              }}
            >
              {withSearch ? (
                <div className="dd-search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    ref={searchRef}
                    type="text"
                    value={q}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    aria-controls={listId}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={onKey}
                  />
                </div>
              ) : null}
              <ul
                ref={listRef}
                id={listId}
                className="dd-list"
                role="listbox"
                aria-activedescendant={hi >= 0 && list[hi] ? uid + '-' + hi : undefined}
              >
                {list.length ? (
                  list.map((item, i) => {
                    const on = item.value === String(value ?? '');
                    return (
                      <li key={item.value}>
                        <button
                          id={uid + '-' + i}
                          data-i={i}
                          type="button"
                          role="option"
                          tabIndex={-1}
                          aria-selected={on}
                          className={'dd-opt' + (on ? ' is-on' : '') + (i === hi ? ' is-hi' : '')}
                          onMouseEnter={() => setHi(i)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pick(item.value);
                          }}
                        >
                          <span className="dd-opt-label">{item.label}</span>
                          {item.hint ? <span className="dd-opt-hint">{item.hint}</span> : null}
                          <span className="dd-check" aria-hidden="true">
                            {on ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="dd-empty">No matches</li>
                )}
              </ul>
            </div>,
            rootRef.current?.closest<HTMLElement>('.ex') ?? document.body
          )
        : null}
    </div>
  );
}
