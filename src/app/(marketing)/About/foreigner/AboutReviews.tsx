'use client';

import { useCallback, useState } from 'react';
import FrLightbox from '../../Home/foreigner/FrLightbox';
import { ArrowButton, ReviewCard, useLoop } from '../../Home/foreigner/FrReviews';
import { REVIEWS } from './content';

export default function AboutReviews() {
  const { slides } = REVIEWS;
  const { slots, jumped, step } = useLoop(slides.length);
  const [video, setVideo] = useState<string | null>(null);
  const close = useCallback(() => setVideo(null), []);

  return (
    <section className="fr-section ab-reviews">
      <div className="fr-container ab-reviews__container">
        <div className="ab-reviews__title" data-reveal>
          <h2>{REVIEWS.title}</h2>
        </div>
        <div className="ab-reviews__slider" data-reveal>
          <div className="ab-reviews__mask">
            {slides.map((s, k) => (
              <div
                key={k}
                className="ab-reviews__slide"
                style={{ transform: `translateX(calc(${slots[k] * 100}% + ${slots[k] * 16}px))`, transition: jumped[k] ? 'none' : undefined }}
                aria-hidden={slots[k] < 0 || slots[k] > 2 || undefined}
              >
                <ReviewCard slide={s} onPlay={setVideo} />
              </div>
            ))}
          </div>
          <ArrowButton dir={-1} className="ab-reviews__arrow ab-reviews__arrow--left" onClick={() => step(-1)} />
          <ArrowButton dir={1} className="ab-reviews__arrow ab-reviews__arrow--right" onClick={() => step(1)} />
        </div>
      </div>
      {video && <FrLightbox src={video} onClose={close} />}
    </section>
  );
}
