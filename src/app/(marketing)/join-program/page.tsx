import type { Metadata } from 'next';
import { Check, ChevronRight, LockKeyholeOpen } from 'lucide-react';
import { applyPageSeo } from '@/features/seo/server';
import ExHeader from '@/app/(marketing)/Home/ex/ExHeader';
import { ExFooter } from '@/app/(marketing)/Home/ex/ExSections';
import { EX_FONTS } from '@/app/(marketing)/Home/ex/fonts';
import CalendarCheck from './CalendarCheck';
import JoinForm from './JoinForm';
import { HERO, PRICE_WAS, PROGRAM, PROGRAM_INTRO, STATS } from './content';
import '@/app/(marketing)/Home/ex/ex.css';
import './join.css';

const PAGE_METADATA: Metadata = {
  title: 'Join the Aapka Tourism Program for ₹100 | Aapka Tourism',
  description:
    'Meet the Aapka Tourism team and learn how our website, holiday packages and bookings work, in a live program for a one-time fee of ₹100.',
};

export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(PAGE_METADATA);
}

export default function JoinProgramPage() {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <main className="jp">
        <section className="jp-hero">
          <div className="jp-wrap jp-hero__grid">
            <div className="jp-hero__copy">
              <h1 className="jp-h1">
                {HERO.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h1>
              <p className="jp-lede">{HERO.lede}</p>
              <ul className="jp-points">
                {HERO.points.map((p) => (
                  <li key={p.bold}>
                    <strong>{p.bold}</strong>
                    {p.rest}
                  </li>
                ))}
              </ul>
              <a href="#join" className="jp-play">
                <span aria-hidden="true">
                  <LockKeyholeOpen />
                </span>
                {HERO.play}
                <s>₹{PRICE_WAS}</s>
              </a>
              <dl className="jp-stats">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <dt>{s.value}</dt>
                    <dd>{s.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <JoinForm />
          </div>
        </section>

        <section className="jp-prog">
          <div className="jp-wrap">
            <div className="jp-prog__head">
              <h2 className="ex-pop__title jp-h2">
                <span className="ex-pop__dash" aria-hidden="true" />
                <span className="jp-h2__text">
                  <span>{PROGRAM_INTRO.title.first}</span>
                  <span>
                    {PROGRAM_INTRO.title.second}
                    <b>{PROGRAM_INTRO.title.bold}</b>
                  </span>
                </span>
                <span className="ex-pop__dash" aria-hidden="true" />
              </h2>
              <p className="jp-prog__intro">
                {PROGRAM_INTRO.lines.map((l) => (
                  <span key={l.text}>
                    {l.bold && <strong>{l.bold}</strong>}
                    {l.text}
                  </span>
                ))}
              </p>
            </div>

            <article className="jp-card">
              <div className="jp-card__main">
                <span className="jp-card__badge" aria-hidden="true">
                  <CalendarCheck />
                </span>
                <h3 className="jp-card__name">{PROGRAM.name}</h3>
                <p className="jp-card__body">{PROGRAM.body}</p>
                <ul className="jp-card__checks">
                  {PROGRAM.checks.map((c) => (
                    <li key={c}>
                      <span aria-hidden="true">
                        <Check />
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="jp-card__tiles">
                  {PROGRAM.tiles.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </div>
              </div>

              <div className="jp-card__side">
                <dl className="jp-card__facts">
                  {PROGRAM.facts.map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.label}>
                        <Icon aria-hidden="true" />
                        <span>
                          <dt>{f.label}</dt>
                          <dd>{f.value}</dd>
                        </span>
                      </div>
                    );
                  })}
                </dl>
                <a href={PROGRAM.more.href} className="jp-card__more">
                  {PROGRAM.more.label}
                  <ChevronRight aria-hidden="true" />
                </a>
                <a href={PROGRAM.join.href} className="jp-card__join">
                  {PROGRAM.join.label}
                  <ChevronRight aria-hidden="true" />
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>
      <ExFooter />
    </div>
  );
}
