import Link from 'next/link';
import { CONTACT, SOCIALS } from '@/components/site/site-config';
import { ABOUT, DESTINATIONS, EXPERIENCES, FAQ, FOOTER, STORIES, TPL } from './content';
import { Roll } from './Art';
import FrEarth from './FrEarth';

export function Btn({ href, label, tone }: { href: string; label: string; tone: 'light' | 'dark' }) {
  return (
    <Link href={href} className={'fr-btn fr-btn--' + tone}>
      <Roll>{label}</Roll>
    </Link>
  );
}

export function FrMarquee({ text, car, dark = false }: { text: string; car: string; dark?: boolean }) {
  const loop = (
    <div className="fr-loop__wrap" aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} className="fr-loop__item">
          <span className="fr-loop__heading">{text}</span>
          <img src={car} alt="" className="fr-loop__van" />
        </div>
      ))}
    </div>
  );
  return (
    <Link href="/holidays" className={'fr-loop' + (dark ? ' fr-loop--dark' : '')} aria-label={text}>
      {loop}
      {loop}
      <span className="fr-loop__road" />
    </Link>
  );
}

export function FrLogoBoxes({ groups, allOnPhone = false }: { groups: typeof EXPERIENCES.groups; allOnPhone?: boolean }) {
  return (
    <div className="fr-logos">
      {groups.map((g, gi) => (
        <div key={g.title} className={'fr-logos__box' + (gi && !allOnPhone ? ' fr-mobile-hidden' : '')}>
          <div className="fr-h6 fr-text-light">{g.title}</div>
          <div className="fr-logos__rail">
            <div className="fr-logos__track">
              {[...g.sets, ...g.sets].map((set, si) => (
                <div key={si} className="fr-logos__set">
                  {set.map((src, li) => (
                    <div key={li} className="fr-logos__logo">
                      <img src={src} alt="" className="fr-logos__img" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="fr-logos__fade" />
          <div className="fr-logos__fade fr-logos__fade--right" />
        </div>
      ))}
    </div>
  );
}

export function FrAbout() {
  return (
    <section className="fr-section fr-dark fr-dark--flush">
      <div className="fr-container fr-container--relative">
        <div className="fr-about">
          <div className="fr-center">
            <h2 className="fr-text-light">{ABOUT.title}</h2>
          </div>
          <div className="fr-about__cards">
            <img src={ABOUT.images[0]} alt="Aapka Tourism travellers" className="fr-about__img fr-about__img--left" />
            <img src={ABOUT.images[1]} alt="" className="fr-about__img fr-about__img--right" />
          </div>
          <div className="fr-mt-large">
            <div className="fr-para-width">
              <p className="fr-text-light fr-p-large">{ABOUT.text}</p>
            </div>
          </div>
          <div className="fr-mt-medium">
            <Btn href={ABOUT.cta.href} label={ABOUT.cta.label} tone="light" />
          </div>
        </div>
        <img src={TPL.balloon} alt="" className="fr-illo" />
        <img src={TPL.plane} alt="" className="fr-illo fr-illo--second" />
        <img src={TPL.clouds} alt="" className="fr-illo fr-illo--third" />
        <img src={TPL.clouds} alt="" className="fr-illo fr-illo--fourth" />
      </div>
      <FrMarquee text={ABOUT.marquee} car={TPL.car} />
    </section>
  );
}

export function FrDestinations() {
  const [first, second, third] = DESTINATIONS.rows;
  const chip = (d: (typeof first)[number]) => (
    <div key={d.name} className="fr-dest__item">
      <Link href="/holidays" className="fr-dest__chip">
        <img src={d.image} alt="" className="fr-dest__img" />
        <div className="fr-dest__info">
          <span className="fr-h6">{d.name}</span>
          <p>{d.region}</p>
        </div>
      </Link>
    </div>
  );
  return (
    <section className="fr-section fr-dark fr-dark--flush">
      <div className="fr-container">
        <div className="fr-text-block">
          <div className="fr-center fr-center--full">
            <h2 className="fr-text-light">{DESTINATIONS.title}</h2>
          </div>
          <div className="fr-mt-small">
            <div className="fr-para-width">
              <p className="fr-text-light fr-p-large">{DESTINATIONS.text}</p>
            </div>
          </div>
          <div className="fr-mt-medium">
            <Btn href={DESTINATIONS.cta.href} label={DESTINATIONS.cta.label} tone="light" />
          </div>
        </div>
      </div>
      <div className="fr-dest">
        <FrEarth src={TPL.earth} className="fr-dest__earth" base={-84} rate={0.0203} anchor={992} />
        <div className="fr-dest__grid">
          <div className="fr-dest__row fr-dest__row--first">{first.map(chip)}</div>
          <div className="fr-dest__row fr-dest__row--second">{second.map(chip)}</div>
          <div className="fr-dest__row">{third.map(chip)}</div>
        </div>
      </div>
    </section>
  );
}

export type FaqItem = { topic: string; q: string; a: string };

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="fr-faq__list">
      {items.map((f, i) => (
        <div key={f.q} className="fr-faq__item" data-reveal>
          <div className="fr-faq__num">
            <p className="fr-subtitle">{i + 1}.</p>
          </div>
          <div className="fr-faq__line" />
          <div className="fr-faq__topic">
            <h3>{f.topic}</h3>
          </div>
          <div className="fr-faq__content">
            <div className="fr-h5">{f.q}</div>
            <p className="fr-p-large">{f.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FrFaq() {
  return (
    <section className="fr-section">
      <div className="fr-container">
        <div className="fr-faq__head">
          <h2>{FAQ.title}</h2>
          <img src={FAQ.image} alt="" className="fr-faq__img" />
        </div>
        <div className="fr-faq">
          <FaqList items={FAQ.items} />
        </div>
        <div className="fr-btn-wrap">
          <Btn href={FAQ.cta.href} label={FAQ.cta.label} tone="dark" />
        </div>
      </div>
    </section>
  );
}

export function FrExperiences() {
  return (
    <section className="fr-section fr-dark">
      <div className="fr-container">
        <div className="fr-text-block">
          <div className="fr-center fr-center--full">
            <h2 className="fr-text-light">{EXPERIENCES.title}</h2>
          </div>
          <div className="fr-mt-small">
            <div className="fr-para-width">
              <p className="fr-text-light fr-p-large">{EXPERIENCES.text}</p>
            </div>
          </div>
          <div className="fr-mt-medium">
            <Btn href={EXPERIENCES.cta.href} label={EXPERIENCES.cta.label} tone="light" />
          </div>
        </div>
        <FrLogoBoxes groups={EXPERIENCES.groups} />
      </div>
    </section>
  );
}

export function FrStories() {
  return (
    <div className="fr-stories">
      {STORIES.map((s) => (
        <div key={s.title} className="fr-story">
          <Link href={s.href} className="fr-story__wrap">
            <div className="fr-story__sticky">
              <div className="fr-story__item">
                <div className="fr-story__image">
                  <img src={s.image} alt="" className="fr-story__img" loading="lazy" />
                  <div className="fr-story__shade" />
                </div>
                <div className="fr-story__info">
                  <div className="fr-story__center">
                    <div className="fr-story__heading">
                      <h2 className="fr-text-light">{s.title}</h2>
                    </div>
                    <div className="fr-story__tags">
                      <span className="fr-btn fr-btn--light">
                        <Roll>{s.tag}</Roll>
                      </span>
                      <span className="fr-btn fr-btn--light">
                        <Roll>{s.label}</Roll>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

const FOOTER_SOCIAL_ICONS: Partial<Record<(typeof SOCIALS)[number]['id'], { box: string; d: string }>> = {
  instagram: {
    box: '0 0 448 512',
    d: 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z',
  },
  youtube: {
    box: '0 0 576 512',
    d: 'M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z',
  },
};

function FooterSocialIcon({ box, d }: { box: string; d: string }) {
  return (
    <svg viewBox={box} fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function FrFooter() {
  return (
    <section className="fr-section fr-footer">
      <div className="fr-container">
        <div className="fr-footer__wrap">
          <div className="fr-footer__top">
            <h2 className="fr-text-yellow">{FOOTER.title}</h2>
            <p className="fr-text-light fr-p-large">{FOOTER.text}</p>
            <div className="fr-footer__social">
              {SOCIALS.map((s) => {
                const icon = FOOTER_SOCIAL_ICONS[s.id];
                if (!icon) return null;
                return (
                  <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" className="fr-footer__icon" aria-label={s.label}>
                    <span className="fr-roll fr-roll--icon">
                      <span className="fr-roll__top">
                        <FooterSocialIcon {...icon} />
                      </span>
                      <span className="fr-roll__bottom fr-text-yellow" aria-hidden="true">
                        <FooterSocialIcon {...icon} />
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
          <div className="fr-footer__center">
            <div className="fr-footer__links">
              <div className="fr-footer__col">
                <h5 className="fr-text-light">Company</h5>
                {FOOTER.company.map((l) => (
                  <Link key={l.href} href={l.href} className="fr-link-light">
                    <Roll bottomClass="fr-text-yellow">{l.label}</Roll>
                  </Link>
                ))}
              </div>
            </div>
            <div className="fr-footer__links">
              <div className="fr-footer__col">
                <h5 className="fr-text-light">Contacts</h5>
                {FOOTER.contacts.map((l) => (
                  <a key={l.href} href={l.href} className="fr-link-light">
                    <Roll bottomClass="fr-text-yellow">{l.label}</Roll>
                  </a>
                ))}
              </div>
            </div>
            <div className="fr-footer__card">
              <div className="fr-footer__card-in">
                <h5 className="fr-text-light">{FOOTER.plan}</h5>
                <div className="fr-footer__actions">
                  <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="fr-footer__field">
                    WhatsApp {CONTACT.uaePhone}
                  </a>
                  <Link href="/travel-enquiry" className="fr-btn-primary">
                    Enquire
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="fr-footer__bottom">
            <div className="fr-footer__copy">
              © Aapka Tourism. All Rights Reserved.
              {FOOTER.legal.map((l) => (
                <Link key={l.href} href={l.href} className="fr-footer__legal">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
