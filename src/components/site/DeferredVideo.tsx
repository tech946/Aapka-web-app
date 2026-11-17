'use client';

import { useEffect, useRef, type VideoHTMLAttributes } from 'react';
import { afterLoad } from '@/lib/after-load';

const START_DELAY_MS = 1000;

type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'poster' | 'preload'> & {
  src: string;
  poster: string;
  priority?: boolean;
  lazy?: boolean;
};

function savesData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !!connection?.saveData;
}

export default function DeferredVideo({ src, poster, priority = false, lazy = false, className, ...rest }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    let io: IntersectionObserver | null = null;

    const start = () => {
      if (el.getAttribute('src') || savesData()) return;
      el.src = src;
      if (el.autoplay) el.play().catch(() => {});
    };

    const whenNear = () => {
      if (!lazy) return start();
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io?.disconnect();
          start();
        },
        { rootMargin: '300px' },
      );
      io.observe(el);
    };

    const stopWaiting = afterLoad(() => {
      timer = window.setTimeout(whenNear, START_DELAY_MS);
    });

    return () => {
      stopWaiting();
      window.clearTimeout(timer);
      io?.disconnect();
    };
  }, [src, lazy]);

  return (
    <>
      <img
        className={className}
        src={poster}
        alt=''
        aria-hidden='true'
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding='async'
      />
      <video ref={ref} className={className} poster={poster} preload='none' {...rest} />
    </>
  );
}
