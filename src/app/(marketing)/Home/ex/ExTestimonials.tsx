'use client';

import { useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { REVIEWS } from '@/components/site/reviews';
import { usePager } from './ExRows';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ExTestimonials() {
  const { ref, pages, page, start, end, go, step, update } = usePager();
  useEffect(update, [update]);

  return (
    <section className="ex-pop ex-tm" aria-label="What our travellers say">
      <div className="ex-wrap">
        <div className="ex-pop__head">
          <h2 className="ex-pop__title">
            <span className="ex-pop__dash" aria-hidden="true" />
            <span>
              What our <b>Travellers Say</b>
            </span>
            <span className="ex-pop__dash" aria-hidden="true" />
          </h2>
          <p className="ex-pop__sub">Real reviews from people who travelled with Aapka Tourism</p>
        </div>
        <div className="ex-tm__stage">
          <button type="button" className="ex-pop__arrow ex-tm__arrow ex-tm__arrow--prev" disabled={start} onClick={() => step(-1)} aria-label="Previous reviews">
            <ArrowLeft aria-hidden="true" />
          </button>
          <ul className="ex-tm__rail" ref={ref}>
            {REVIEWS.map((r) => (
              <li className="ex-tm__card" key={r.name + r.date}>
                <figure className="ex-tm__fig">
                  <blockquote className="ex-tm__bubble">
                    <p>&ldquo;{r.text}&rdquo;</p>
                  </blockquote>
                  <figcaption className="ex-tm__who">
                    <span className="ex-tm__avatar" aria-hidden="true">
                      {initials(r.name)}
                    </span>
                    <span className="ex-tm__name">{r.name}</span>
                    <span className="ex-tm__role">{r.date}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <button type="button" className="ex-pop__arrow ex-tm__arrow ex-tm__arrow--next" disabled={end} onClick={() => step(1)} aria-label="More reviews">
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
        {pages > 1 ? (
          <div className="ex-pop__dots">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={'ex-pop__dot' + (i === page ? ' is-active' : '')}
                onClick={() => go(i)}
                aria-label={`Page ${i + 1}`}
                aria-current={i === page}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
