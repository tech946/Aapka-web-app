'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Compass, X } from 'lucide-react';
import Sheet from '@/components/site/ui/Sheet';
import { categorySlug } from '@/components/site/site-config';
import { holidaysHref, typeForCategory } from '@/config/holiday-types';
import { useHomeCategories } from '../../home-data';

interface HolidaySearchSheetProps {
  open: boolean;
  onClose: () => void;
}

/* The search, opened from every search pill (TaSearch): one compact modal
   (Sheet variant "modal" — rises from the bottom on phones, centred on
   desktop) with a card per holiday type. Each card plays a short looping
   motion clip (made with Remotion in /motion, rendered to
   /videos/search/<slug>.mp4 + .jpg poster), with a checkbox + the type's
   name centred under it; picking one ticks the checkbox and lights up Continue, which opens that type's
   listing (/holidays?type=<slug>). Desert Ember tokens — the panel carries
   .desert-ember itself, because it renders in a portal outside the page's
   wrapper. Styles: mobile-search.css (.hs-*). */

// holiday types that have a clip (the rest show a compass)
const CLIPS = new Set(['flexible-date-packages', 'offer-packages', 'uae-tours']);

export default function HolidaySearchSheet({ open, onClose }: HolidaySearchSheetProps) {
  const router = useRouter();
  const { categories, isLoading } = useHomeCategories();
  const [picked, setPicked] = useState<string | null>(null);
  const gridRef = useRef<HTMLUListElement>(null);

  const types = useMemo(
    () =>
      categories
        .map((c, n) => typeForCategory(categorySlug(c.name), c.name, 50 + n))
        .sort((a, b) => a.order - b.order),
    [categories],
  );
  const pickedType = types.find((t) => t.key === picked) ?? null;

  // the clips play only while the modal is open (and not for reduced motion)
  useEffect(() => {
    const videos = Array.from(gridRef.current?.querySelectorAll('video') ?? []);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    videos.forEach((v) => {
      if (open && !still) v.play().catch(() => {});
      else v.pause();
    });
  }, [open, types.length]);

  function go() {
    if (!pickedType) return;
    onClose();
    router.push(holidaysHref(pickedType.key));
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      labelledBy="hs-title"
      variant="modal"
      className="hs-sheet desert-ember"
      head={
        <>
          <div className="ui-sheet__heading">
            <h2 id="hs-title">Find your holiday</h2>
            <p>Pick the kind of holiday you&rsquo;re after</p>
          </div>
          <button type="button" className="hs-close" aria-label="Close" onClick={onClose} data-autofocus>
            <X aria-hidden="true" />
          </button>
        </>
      }
      foot={
        <>
          <div className="hs-foot__summary" aria-live="polite">
            {pickedType ? (
              <>
                <b>{pickedType.label}</b>
                {pickedType.tagline ? <span>{pickedType.tagline}</span> : null}
              </>
            ) : (
              <span>Pick a holiday type to continue</span>
            )}
          </div>
          <button type="button" className="hs-go" onClick={go} disabled={!pickedType}>
            Continue
            <ArrowRight aria-hidden="true" />
          </button>
        </>
      }
    >
      {isLoading && !types.length ? (
        <p className="hs-note">Loading holiday types…</p>
      ) : (
        <ul ref={gridRef} className="hs-types" role="radiogroup" aria-label="Holiday type">
          {types.map((t) => {
            const on = t.key === picked;
            return (
              <li key={t.key}>
                <button type="button" role="radio" aria-checked={on} className={'hs-type' + (on ? ' is-on' : '')} onClick={() => setPicked(t.key)}>
                  <span className="hs-type__box">
                    <span className="hs-type__media">
                      {CLIPS.has(t.key) ? (
                        <video muted loop playsInline preload="none" poster={`/videos/search/${t.key}.jpg`} aria-hidden="true">
                          <source src={`/videos/search/${t.key}.mp4`} type="video/mp4" />
                        </video>
                      ) : (
                        <Compass className="hs-type__glyph" aria-hidden="true" />
                      )}
                    </span>
                  </span>
                  <span className="hs-type__name">
                    <span className="hs-type__check" aria-hidden="true">
                      <Check />
                    </span>
                    {t.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
