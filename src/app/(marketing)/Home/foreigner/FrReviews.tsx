'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { REVIEWS_SLIDER, TPL, type ReviewSlide } from './content';
import FrLightbox from './FrLightbox';

export function useLoop(n: number) {
  const [index, setIndex] = useState(0);
  const prev = useRef<number[]>([]);
  const slots = Array.from({ length: n }, (_, k) => ((((k - index + 1) % n) + n) % n) - 1);
  const jumped = slots.map((s, k) => prev.current.length > 0 && Math.abs(s - prev.current[k]) > 1);
  useEffect(() => {
    prev.current = slots;
  });
  const step = useCallback((dir: -1 | 1) => setIndex((i) => (i + dir + n) % n), [n]);
  return { slots, jumped, step };
}

const ARROW_PATHS = {
  next: 'M2.82812 3.5164e-07V12.3973H15.4872L10.8167 7.8476L12.1227 6.5887L19 13.2877L12.1094 20L10.8167 18.7408L15.4872 14.1781H0.999999V3.5164e-07H2.82812Z',
  prev: 'M19 3.5164e-07V14.1781H4.51281L9.18332 18.7408L7.89062 20L0.999999 13.2877L7.87726 6.5887L9.18332 7.8476L4.51281 12.3973H17.1719V3.5164e-07H19Z',
};

function ArrowGlyph({ dir, className }: { dir: -1 | 1; className: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d={dir === 1 ? ARROW_PATHS.next : ARROW_PATHS.prev} />
    </svg>
  );
}

export function ArrowButton({ dir, className, onClick }: { dir: -1 | 1; className: string; onClick: () => void }) {
  return (
    <button type="button" className={className} onClick={onClick} aria-label={dir === 1 ? 'Next review' : 'Previous review'}>
      <span className="fr-rv__arrow-wrap">
        <ArrowGlyph dir={dir} className="fr-rv__arrow-img" />
        <ArrowGlyph dir={dir} className="fr-rv__arrow-img fr-rv__arrow-img--hover" />
      </span>
    </button>
  );
}

export function ReviewCard({ slide, onPlay }: { slide: ReviewSlide; onPlay: (src: string) => void }) {
  const light = slide.kind === 'photo' || slide.kind === 'green';
  return (
    <div className="fr-rv__card">
      {slide.quote && (
        <div className="fr-rv__quote-wrap">
          <div className={'fr-rv__quote' + (light ? ' fr-text-light' : '')}>“{slide.quote}”</div>
        </div>
      )}
      <div className="fr-rv__bottom">
        <div className="fr-rv__who">
          <div className={'fr-h5' + (light ? ' fr-text-light' : '')}>{slide.name}</div>
          <p className={light ? 'fr-text-light' : undefined}>{slide.place}</p>
        </div>
        {slide.video && (
          <button type="button" className="fr-rv__play" onClick={() => onPlay(slide.video!)} aria-label={'Play video: ' + slide.name}>
            <img src={TPL.play} alt="" className="fr-rv__play-icon" />
          </button>
        )}
      </div>
      <div
        className={'fr-rv__bg fr-rv__bg--' + slide.kind}
        style={slide.image ? { backgroundImage: `linear-gradient(0deg, #000c, #0000 44%), url("${slide.image}")` } : undefined}
      />
    </div>
  );
}

export default function FrReviews() {
  const { slides } = REVIEWS_SLIDER;
  const { slots, jumped, step } = useLoop(slides.length);
  const [video, setVideo] = useState<string | null>(null);
  const close = useCallback(() => setVideo(null), []);

  return (
    <section className="fr-section fr-rv-section">
      <div className="fr-rv__wrap">
        <div className="fr-rv__panel" />
        <div className="fr-rv">
          <div className="fr-rv__title-wrap">
            <div className="fr-rv__title">
              <h2>{REVIEWS_SLIDER.title}</h2>
              <p>{REVIEWS_SLIDER.text}</p>
            </div>
          </div>
          <div className="fr-rv__mask">
            {slides.map((s, k) => (
              <div
                key={k}
                className="fr-rv__slide"
                style={{ transform: `translateX(calc(${slots[k] * 100}% + ${slots[k] * 20}px))`, transition: jumped[k] ? 'none' : undefined }}
                aria-hidden={slots[k] < 0 || undefined}
              >
                <ReviewCard slide={s} onPlay={setVideo} />
              </div>
            ))}
          </div>
          <ArrowButton dir={-1} className="fr-rv__arrow" onClick={() => step(-1)} />
          <ArrowButton dir={1} className="fr-rv__arrow fr-rv__arrow--right" onClick={() => step(1)} />
        </div>
      </div>
      {video && <FrLightbox src={video} onClose={close} />}
    </section>
  );
}
