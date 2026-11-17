'use client';

import { useCallback, useState } from 'react';
import SocialIcon from '@/components/site/SocialIcon';
import FrLightbox from '../../Home/foreigner/FrLightbox';
import { Play } from 'lucide-react';
import { INSTAGRAM_PROFILE, JOURNEY_CARDS, type QuoteCard, type ReelCard } from './content';

function InstagramButton({ href, dark }: { href: string; dark?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={'jr-ig' + (dark ? ' jr-ig--dark' : '')} aria-label="Watch on Instagram">
      <span className="fr-roll fr-roll--icon">
        <span className="fr-roll__top">
          <SocialIcon id="instagram" />
        </span>
        <span className="fr-roll__bottom fr-text-light" aria-hidden="true">
          <SocialIcon id="instagram" />
        </span>
      </span>
    </a>
  );
}

function Quote({ card }: { card: QuoteCard }) {
  const light = card.tone === 'green';
  return (
    <div className="jr-card" data-reveal>
      <div className="fr-rv__quote-wrap">
        <div className={'fr-rv__quote' + (light ? ' fr-text-light' : '')}>“{card.quote}”</div>
      </div>
      <div className="fr-rv__bottom">
        <div className="fr-rv__who">
          <div className={'fr-h5' + (light ? ' fr-text-light' : '')}>{card.name}</div>
          <p className={light ? 'fr-text-light' : undefined}>{card.place}</p>
        </div>
        {card.instagram && <InstagramButton href={INSTAGRAM_PROFILE} dark={!light} />}
      </div>
      <div className={'fr-rv__bg fr-rv__bg--' + card.tone} />
    </div>
  );
}

function Reel({ card, onPlay }: { card: ReelCard; onPlay: (src: string) => void }) {
  const quote = card.mode === 'quote';
  return (
    <div className="jr-reel" data-reveal>
      <div className="jr-reel__card">
        {quote && (
          <div className="fr-rv__quote-wrap">
            <div className="fr-rv__quote fr-text-light">{card.title}</div>
          </div>
        )}
        <div className="fr-rv__bottom">
          <div className="fr-rv__who">
            <div className="fr-h5 fr-text-light">{quote ? '@aapkatourism' : card.title}</div>
            <p className="fr-text-light">{card.tag}</p>
          </div>
          {quote ? (
            <InstagramButton href={card.href} />
          ) : (
            <button type="button" className="fr-rv__play" onClick={() => onPlay(card.video)} aria-label={'Play reel: ' + card.title}>
              <Play className="jr-play-icon" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className={'jr-reel__photo' + (quote ? ' jr-reel__photo--dim' : '')}>
          <img src={card.cover} alt="" className="jr-reel__img" loading="lazy" />
        </div>
      </div>
    </div>
  );
}

export default function JourneysGrid() {
  const [video, setVideo] = useState<string | null>(null);
  const close = useCallback(() => setVideo(null), []);

  return (
    <>
      <div className="jr-grid">
        {JOURNEY_CARDS.map((card, i) =>
          card.type === 'quote' ? <Quote key={i} card={card} /> : <Reel key={i} card={card} onPlay={setVideo} />,
        )}
      </div>
      {video && <FrLightbox src={video} onClose={close} />}
    </>
  );
}
