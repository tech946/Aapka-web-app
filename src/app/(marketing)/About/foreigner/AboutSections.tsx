import Link from 'next/link';
import FrEarth from '../../Home/foreigner/FrEarth';
import { Lottie } from '../../Home/foreigner/FrScrollImages';
import { Btn, FrLogoBoxes, FrMarquee } from '../../Home/foreigner/FrSections';
import { ABOUT_TPL, DESTINATIONS, FEATURES, INTRO, LOGO_GROUPS } from './content';

export function AboutIntro() {
  return (
    <section className="fr-section ab-intro">
      <div className="fr-container fr-container--relative">
        <div className="ab-intro__grid">
          <div className="ab-intro__cards">
            <img src={INTRO.images[0]} alt="" className="ab-intro__img ab-intro__img--first" data-reveal="flip" />
            <img src={INTRO.images[1]} alt="" className="ab-intro__img ab-intro__img--second" data-reveal="flip" />
          </div>
          <div>
            <h2 data-reveal>{INTRO.title}</h2>
            <div className="fr-mt-small">
              <div className="ab-intro__text">
                {INTRO.paragraphs.map((p) => (
                  <p key={p} className="fr-p-large" data-reveal>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
        <img src={ABOUT_TPL.balloon} alt="" className="ab-icon" data-reveal />
        <img src={ABOUT_TPL.plane} alt="" className="ab-icon ab-icon--third" data-reveal />
        <img src={ABOUT_TPL.clouds} alt="" className="ab-icon ab-icon--fourth" data-reveal />
        <img src={ABOUT_TPL.clouds} alt="" className="ab-icon ab-icon--second" data-reveal />
      </div>
      <FrMarquee text={INTRO.marquee} car={ABOUT_TPL.car} dark />
    </section>
  );
}

export function AboutDestinations() {
  return (
    <section className="fr-section ab-dest">
      <div className="ab-dest__wrap">
        <div className="ab-dest__center">
          <div className="ab-dest__header">
            <div className="fr-text-block ab-dest__text">
              <div className="fr-center fr-center--full">
                <h2 className="fr-text-light" data-reveal>
                  {DESTINATIONS.title}
                </h2>
              </div>
              <div className="fr-mt-small">
                <div className="fr-para-width">
                  <p className="fr-text-light fr-p-large" data-reveal>
                    {DESTINATIONS.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <FrEarth src={ABOUT_TPL.earth} className="ab-dest__earth" base={109.3} rate={0.00564} anchor={0} min={99.2} max={130.4} track="section" />
        </div>
        <div className="ab-dest__list-wrap">
          <div className="ab-dest__list">
            {DESTINATIONS.items.map((d) => (
              <div key={d.name} className="ab-dest__item">
                <Link href="/holidays" className="ab-dest__card">
                  <div className="ab-dest__image-wrap">
                    <img src={d.image} alt="" className="ab-dest__img" />
                  </div>
                  <div className="ab-dest__info">
                    <div className="fr-h5">{d.name}</div>
                    <p>{d.region}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutFeatures() {
  return (
    <section className="fr-section ab-features">
      <div className="fr-container">
        <div className="ab-features__wrap">
          <div className="ab-features__grid">
            <div>
              <h2 data-reveal>{FEATURES.title}</h2>
            </div>
            <div className="ab-features__right" data-reveal>
              <p className="fr-p-large">{FEATURES.text}</p>
              <div className="ab-features__btn-top">
                <Btn href={FEATURES.cta.href} label={FEATURES.cta.label} tone="dark" />
              </div>
            </div>
            <img src={ABOUT_TPL.balloon} alt="" className="ab-features__balloon" />
          </div>
          <div className="ab-features__cards">
            {FEATURES.cards.map((c) => (
              <div key={c.title} className="ab-card" data-reveal>
                <Lottie src={c.lottie} className={'ab-card__lottie' + (c.large ? ' ab-card__lottie--large' : '')} />
                <div className="ab-card__title">{c.title}</div>
                <p className="fr-p-large">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="ab-features__btn-bottom">
            <Btn href={FEATURES.cta.href} label={FEATURES.cta.label} tone="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutLogos() {
  return (
    <section className="fr-section ab-logos">
      <div className="fr-container" data-reveal>
        <FrLogoBoxes groups={LOGO_GROUPS} allOnPhone />
      </div>
    </section>
  );
}
