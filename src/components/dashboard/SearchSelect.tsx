'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchSelectOption {
  value: string;
  label: string;
  /** Muted second line (email, role …). Also searched. */
  hint?: string | null;
}

/**
 * Searchable dropdown for dashboard forms — a styled replacement for a native
 * <select> when the list is long. Type to filter, ↑/↓ to move, Enter to pick,
 * Esc to close; click outside closes. Styles live in dashboard.css (.ss-*).
 */
export function SearchSelect({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No match',
  loading = false,
  loadingText = 'Loading…',
  disabled = false,
  icon,
  ariaLabel,
  clearable = false,
}: {
  value: string;
  options: SearchSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  icon?: ReactNode;
  ariaLabel?: string;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = useMemo(() => options.find(o => o.value === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  // Opening: clear the filter, highlight the current value, focus the search box.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(Math.max(0, options.findIndex(o => o.value === value)));
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, options, value]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const pick = (opt: SearchSelectOption) => {
    setOpen(false);
    if (opt.value !== value) onChange(opt.value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled) setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActive(i => Math.min(filtered.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(i => Math.max(0, i - 1));
        break;
      case 'Enter': {
        e.preventDefault();
        const opt = filtered[active];
        if (opt) pick(opt);
        break;
      }
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div className={`ss ${open ? 'ss--open' : ''} ${disabled ? 'ss--disabled' : ''}`} ref={rootRef} onKeyDown={onKeyDown}>
      <button
        type='button'
        className='ss__trigger'
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
      >
        {icon ? <span className='ss__icon'>{icon}</span> : null}
        <span className={`ss__value ${selected ? '' : 'ss__value--placeholder'}`}>
          {loading ? loadingText : selected ? selected.label : placeholder}
        </span>
        {selected?.hint ? <span className='ss__value-hint'>{selected.hint}</span> : null}
        {clearable && selected && !disabled ? (
          <span
            role='button'
            aria-label='Clear'
            className='ss__clear'
            onClick={e => {
              e.stopPropagation();
              onChange('');
            }}
          >
            <X size={13} aria-hidden />
          </span>
        ) : null}
        <ChevronDown size={15} aria-hidden className='ss__chevron' />
      </button>

      {open ? (
        <div className='ss__menu'>
          <div className='ss__search'>
            <Search size={14} aria-hidden />
            <input
              ref={searchRef}
              type='text'
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </div>
          <div className='ss__list' role='listbox' id={listId} ref={listRef}>
            {loading ? (
              <div className='ss__empty'>{loadingText}</div>
            ) : filtered.length === 0 ? (
              <div className='ss__empty'>{emptyText}</div>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role='option'
                    aria-selected={isSelected}
                    data-index={i}
                    className={[
                      'ss__option',
                      isSelected ? 'ss__option--selected' : '',
                      i === active ? 'ss__option--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(opt)}
                  >
                    <span className='ss__option-text'>
                      <span className='ss__option-label'>{opt.label}</span>
                      {opt.hint ? <span className='ss__option-hint'>{opt.hint}</span> : null}
                    </span>
                    {isSelected ? <Check size={14} aria-hidden className='ss__check' /> : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
