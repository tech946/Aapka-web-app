'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Pause, Play } from 'lucide-react';
import { usePager } from './ExRows';
import { STORIES } from './content';

const REELS: { id: string; title: string; tag: string }[] = [
  { id: 'DeQZv5Vo2Zk', title: 'Jaipur to Dubai Holiday', tag: 'Dubai' },
  { id: 'DeJyFAnoafL', title: 'Gurugram to Dubai Holiday', tag: 'Dubai' },
  { id: 'DeEDL7XI3xJ', title: 'Dubai Holiday Trip from Gujarat', tag: 'Dubai' },
  { id: 'DeUlGucoqku', title: 'Our Guests Enjoying Desert Safari', tag: 'Desert Safari' },
  { id: 'DeEyWXXI_hL', title: '4 Nights Best Dubai Holiday', tag: 'Dubai' },
  { id: 'DeLgfqcIGB0', title: 'Guest Feedback That Means A Lot', tag: 'Dubai' },
  { id: 'DeF8MPqIx77', title: 'Dubai Trip me Gold Kharida', tag: 'Gold Souk' },
  { id: 'DeV0YNnoGfO', title: 'Burj Khalifa At The Top', tag: 'Burj Khalifa' },
  { id: 'DeOFtjAoTWr', title: 'Gold Coin at Burj Khalifa', tag: 'Burj Khalifa' },
  { id: 'DeSUwSjI4CK', title: '1 KG Gold Bar in Dubai', tag: 'Gold Souk' },
  { id: 'DeS9wS8oql_', title: 'Dubai Mall Viral Video', tag: 'Dubai Mall' },
];

function Reel({
  id,
  title,
  tag,
  active,
  onToggle,
  onHide,
}: {
  id: string;
  title: string;
  tag: string;
  active: boolean;
  onToggle: () => void;
  onHide: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNear(true);
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    const el = video.current;
    if (!el || !active) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) onHide();
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [active, onHide]);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (active) {
      if (!el.src) el.src = `/videos/stories/${id}.mp4`;
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [active, id]);

  return (
    <li className="ex-st__card">
      <video
        ref={video}
        className="ex-st__video"
        poster={near || active ? `/images/insta-stories/${id}.jpg` : undefined}
        playsInline
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={onToggle}
      />
      <span className="ex-st__shade" aria-hidden="true" />
      <button type="button" className="ex-st__toggle" onClick={onToggle} aria-label={playing ? `Pause ${title}` : `Play ${title}`}>
        {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </button>
      <span className="ex-st__body">
        <span className="ex-st__tag">
          <MapPin aria-hidden="true" />
          {tag}
        </span>
        <span className="ex-st__title">{title}</span>
      </span>
    </li>
  );
}

const STATS = ['12+ years in Dubai', '10,000+ travellers', '280K+ Instagram followers'];

const INSTAGRAM = 'https://www.instagram.com/aapkatourism/';

export default function ExStories() {
  const { ref, start, end, step, update } = usePager();
  const [current, setCurrent] = useState<string | null>(null);
  const hide = useCallback(() => setCurrent(null), []);
  useEffect(update, [update]);

  return (
    <section className="ex-st" id="stories" aria-label={STORIES.title}>
      <div className="ex-st__banner">
        <img
          className="ex-st__bg"
          src="/images/stock/stories-banner.webp"
          srcSet="/images/stock/stories-banner-800.webp 800w, /images/stock/stories-banner.webp 1600w"
          sizes="100vw"
          alt=""
          loading="lazy"
        />
        <div className="ex-st__head">
          <h2 className="ex-pop__title ex-st__heading">
            <span className="ex-pop__dash" aria-hidden="true" />
            <span>
              Travel Memories Shared by <b>10,000+ Travellers</b>
            </span>
            <span className="ex-pop__dash" aria-hidden="true" />
          </h2>
          <ul className="ex-st__stats">
            {STATS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="ex-wrap ex-st__main">
        <div className="ex-st__stage">
          <button type="button" className="ex-pop__arrow ex-st__arrow ex-st__arrow--prev" disabled={start} onClick={() => step(-1)} aria-label="Previous stories">
            <ArrowLeft aria-hidden="true" />
          </button>
          <ul className="ex-st__rail" ref={ref}>
            {REELS.map((r) => (
              <Reel key={r.id} {...r} active={current === r.id} onToggle={() => setCurrent((c) => (c === r.id ? null : r.id))} onHide={hide} />
            ))}
          </ul>
          <button type="button" className="ex-pop__arrow ex-st__arrow ex-st__arrow--next" disabled={end} onClick={() => step(1)} aria-label="More stories">
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="ex-st__cta">
          Watch all Stories
        </a>
      </div>
    </section>
  );
}
