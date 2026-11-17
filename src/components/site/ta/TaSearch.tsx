'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import HolidaySearchSheet from '@/app/(marketing)/Home/sections/search/HolidaySearchSheet';
// the sheet's own styles
import '@/app/(marketing)/Home/sections/search/mobile-search.css';

/* Search pill (Tripadvisor's): the homepage's big "Where to?" field with an
   outline "Ask an expert" pill and the orange Search pill inside it, or the
   small field in the header bar. Every part of it opens the existing
   HolidaySearchSheet (pick a holiday type → its listing). */

export default function TaSearch({ variant = 'hero' }: { variant?: 'hero' | 'bar' }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const openSheet = () => setOpen(true);

  return (
    <>
      <div className={'ta-search ta-search--' + variant}>
        <button type="button" className="ta-search__field" aria-haspopup="dialog" aria-expanded={open} onClick={openSheet}>
          <Search className="ta-search__icon" aria-hidden="true" />
          <span className="ta-search__ph">{variant === 'hero' ? 'Dubai packages, desert safari, Marina cruise…' : 'Search'}</span>
        </button>
        {variant === 'hero' && (
          <>
            <Link href="/travel-enquiry" className="ta-search__ask">
              Ask an expert
            </Link>
            <button type="button" className="ta-search__go" onClick={openSheet}>
              Search
            </button>
          </>
        )}
      </div>
      <HolidaySearchSheet open={open} onClose={close} />
    </>
  );
}
