'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTcSlider } from '@/components/site/useTcSlider';
import './traveller-stories.css';

/* "Stories of our travellers" — pickyourtrail.com's section, element for
   element (black band, display title + heart, a row of social proof, tall
   story cards (12px corners) with a name and a pill under each, round arrows
   on the edges) in Aapka's colours. The stories are real reels from
   @aapkatourism (collabs with @kamalpandeyvlogs); covers saved in
   public/images/insta-stories/<reel id>.jpg and the full reel (720p, as
   downloaded from Instagram — 4 to 23 MB each, fast-start MP4s that stream)
   in public/videos/stories/<reel id>.mp4. TODO: swap in short compressed
   preview loops (same file names). Each card opens its reel on Instagram.
   Both are served with a one-year immutable cache (next.config.mjs).
   Follower counts as shown on the two profiles on 11 Oct 2026. */

const IG = 'https://www.instagram.com/';

const PROFILES = [
  { handle: 'aapkatourism', count: '280K', label: 'followers' },
  { handle: 'kamalpandeyvlogs', count: '291K', label: 'followers' },
];

const STORIES: { id: string; kind: 'reel' | 'p'; title: string; tag: string }[] = [
  { id: 'DeQZv5Vo2Zk', kind: 'reel', title: 'Jaipur to Dubai Holiday', tag: 'Dubai' },
  { id: 'DeJyFAnoafL', kind: 'reel', title: 'Gurugram to Dubai Holiday', tag: 'Dubai' },
  { id: 'DeEDL7XI3xJ', kind: 'reel', title: 'Dubai Holiday Trip from Gujarat', tag: 'Dubai' },
  { id: 'DeUOSjsIJ8t', kind: 'p', title: 'Sunset in the Dubai Desert', tag: 'Desert Safari' },
  { id: 'DeUlGucoqku', kind: 'reel', title: 'Our Guests Enjoying Desert Safari', tag: 'Desert Safari' },
  { id: 'DeEyWXXI_hL', kind: 'reel', title: '4 Nights Best Dubai Holiday', tag: 'Dubai' },
  { id: 'DeLgfqcIGB0', kind: 'reel', title: 'Guest Feedback That Means A Lot', tag: 'Dubai' },
  { id: 'DeF8MPqIx77', kind: 'reel', title: 'Dubai Trip me Gold Kharida', tag: 'Gold Souk' },
  { id: 'DeV0YNnoGfO', kind: 'reel', title: 'Burj Khalifa At The Top', tag: 'Burj Khalifa' },
  { id: 'DeOFtjAoTWr', kind: 'reel', title: 'Gold Coin at Burj Khalifa', tag: 'Burj Khalifa' },
  { id: 'DeSUwSjI4CK', kind: 'reel', title: '1 KG Gold Bar in Dubai', tag: 'Gold Souk' },
  { id: 'DeS9wS8oql_', kind: 'reel', title: 'Dubai Mall Viral Video', tag: 'Dubai Mall' },
];

/* A card's preview: shows the cover, and only while the card is on screen
   loads + plays the muted loop (pausing again when it scrolls or slides
   away). No loop for photo posts, or when the visitor prefers reduced
   motion. */
function StoryMedia({ id, video }: { id: string; video: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!el.src) el.src = `/videos/stories/${id}.mp4`;
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, video]);

  const poster = `/images/insta-stories/${id}.jpg`;
  return video ? (
    <video ref={ref} poster={poster} muted loop playsInline preload="none" aria-hidden="true" />
  ) : (
    <img src={poster} alt="" loading="lazy" width="360" height="640" />
  );
}

function HeartMark() {
  return (
    <svg className="ts_heart" viewBox="0 0 48 44" width="48" height="44" aria-hidden="true">
      <defs>
        <linearGradient id="ts-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7aa2" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <path d="M24 42S2 29.2 2 14.6C2 7.1 7.8 2 14.2 2c4.4 0 7.8 2.3 9.8 5.6C26 4.3 29.4 2 33.8 2 40.2 2 46 7.1 46 14.6 46 29.2 24 42 24 42z" fill="url(#ts-heart)" />
      <path d="M12 9.5c-2.6.6-4.6 2.9-4.9 5.8" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** `title`: the package pages call the band "Love from the gram", as pickyourtrail does. */
export default function TravellerStories({ title = 'Stories of our travellers' }: { title?: string }) {
  const s = useTcSlider({ count: STORIES.length, perView: 5, gap: 10 });

  return (
    <section className="ts">
      <div className="container">
        <div className="ts_head">
          <h2 className="ts_title">
            {title}
            <HeartMark />
          </h2>
          <ul className="ts_proof">
            {PROFILES.map((p) => (
              <li key={p.handle}>
                <a href={IG + p.handle + '/'} target="_blank" rel="noopener noreferrer" className="ts_proof__item">
                  <img src="/images/icons/instagram.png" width="34" height="34" alt="" />
                  <span>
                    <b>
                      {p.count}
                      <small> {p.label}</small>
                    </b>
                    <span className="ts_proof__handle">@{p.handle}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="ts_slider">
          <div className="tc-slider" {...s.rootProps}>
            <div className="tc-slider-track" style={s.trackStyle} {...s.trackProps}>
              {STORIES.map((st, i) => (
                <div className="tc-slide" style={s.slideStyle(i)} key={st.id}>
                  <a href={`${IG}${st.kind}/${st.id}/`} target="_blank" rel="noopener noreferrer" className="ts_card" aria-label={`${st.title} — watch on Instagram`}>
                    <span className="ts_card__media">
                      <StoryMedia id={st.id} video={st.kind === 'reel'} />
                    </span>
                    <span className="ts_card__meta">
                      <span className="ts_card__title">{st.title}</span>
                      <span className="ts_card__tag">{st.tag}</span>
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>
          {!s.single && (
            <>
              <button type="button" className="ts_arrow ts_arrow--prev" onClick={s.prev} disabled={!s.canPrev} aria-label="Previous stories">
                <ChevronLeft aria-hidden="true" />
              </button>
              <button type="button" className="ts_arrow ts_arrow--next" onClick={s.next} disabled={!s.canNext} aria-label="Next stories">
                <ChevronRight aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
