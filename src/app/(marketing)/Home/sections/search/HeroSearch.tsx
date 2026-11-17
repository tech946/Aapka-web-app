'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import HolidaySearchSheet from './HolidaySearchSheet';
import './mobile-search.css';

/* The one search field (pickyourtrail.com's): a white box with a lime glow
   ring, a search glyph and a prompt that rolls up through a few ideas. The
   whole box opens the HolidaySearchSheet (pick a holiday type → its
   listing) — a compact modal on every screen size.
   Used on both heroes and, compact, in the scrolled homepage header. */

const PROMPTS = [
  'Search Dubai holiday packages',
  'Search desert safari tours',
  'Search Abu Dhabi day trips',
  'Search Dubai Marina cruises',
  'Search Oman tourist visa',
];

export default function HeroSearch({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const close = useCallback(() => setOpen(false), []);

  // roll the prompt every few seconds (not while the sheet is open)
  useEffect(() => {
    if (open) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % PROMPTS.length), 2800);
    return () => window.clearInterval(t);
  }, [open]);

  const prev = (i + PROMPTS.length - 1) % PROMPTS.length;

  return (
    <>
      <button
        type="button"
        className={'hsf' + (compact ? ' hsf--compact' : '')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Search holidays"
        onClick={() => setOpen(true)}
      >
        <span className="hsf__ring" aria-hidden="true" />
        <Search className="hsf__icon" aria-hidden="true" />
        <span className="hsf__prompts" aria-hidden="true">
          {PROMPTS.map((p, n) => (
            <span key={p} className={'hsf__prompt' + (n === i ? ' is-on' : n === prev ? ' is-out' : '')}>
              {p}
            </span>
          ))}
        </span>
      </button>
      <HolidaySearchSheet open={open} onClose={close} />
    </>
  );
}
