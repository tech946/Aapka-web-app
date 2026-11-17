'use client';

import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Check, ListFilter, SlidersHorizontal, X } from 'lucide-react';
import { sortOptions } from './ExToolbar';

type Props = {
  anchor: RefObject<HTMLElement | null>;
  filterCount: number;
  onOpenFilters: () => void;
  sort: string | null;
  onSort: (value: string | null) => void;
};

export default function ExDock({ anchor, filterCount, onOpenFilters, sort, onSort }: Props) {
  const [shown, setShown] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const { options, current } = sortOptions(sort);

  useEffect(() => {
    const update = () => {
      const el = anchor.current;
      setShown(!!el && el.getBoundingClientRect().bottom < 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [anchor]);

  useEffect(() => {
    if (!sortOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onResize = () => window.innerWidth > 767 && setSortOpen(false);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('resize', onResize);
    };
  }, [sortOpen]);

  const host = typeof document === 'undefined' ? null : (document.querySelector('.ex') ?? document.body);

  return (
    <>
      <div className={'exl-dock' + (shown ? ' is-visible' : '')} inert={!shown}>
        <button type="button" className={'exl-dock__pill' + (sort ? ' is-on' : '')} aria-haspopup="dialog" onClick={() => setSortOpen(true)}>
          <ListFilter aria-hidden="true" />
          Sort by
        </button>
        <button type="button" className={'exl-dock__pill' + (filterCount ? ' is-on' : '')} aria-haspopup="dialog" onClick={onOpenFilters}>
          <SlidersHorizontal aria-hidden="true" />
          Filters
          {filterCount ? <span className="exl-tool__count">{filterCount}</span> : null}
        </button>
      </div>

      {sortOpen && host
        ? createPortal(
            <div className="exl-sheet" role="presentation">
              <div className="exl-sheet__box" role="dialog" aria-modal="true" aria-labelledby="exl-sort-title">
                <header className="exl-sheet__head">
                  <h2 id="exl-sort-title">
                    <ListFilter aria-hidden="true" />
                    Sort By
                  </h2>
                  <button type="button" className="exl-sheet__close" onClick={() => setSortOpen(false)} aria-label="Close sort">
                    <X aria-hidden="true" />
                  </button>
                </header>
                <ul role="listbox" aria-label="Sort by">
                  {options.map((o) => {
                    const on = o.value === current.value;
                    return (
                      <li key={o.value}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={on}
                          className={'exl-menu__option' + (on ? ' is-active' : '')}
                          onClick={() => {
                            onSort(o.value || null);
                            setSortOpen(false);
                          }}
                        >
                          {o.label}
                          {on ? <Check aria-hidden="true" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>,
            host,
          )
        : null}
    </>
  );
}
