'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ExHeader from '@/app/(marketing)/Home/ex/ExHeader';
import { ExFooter } from '@/app/(marketing)/Home/ex/ExSections';
import { EX_FONTS } from '@/app/(marketing)/Home/ex/fonts';
import '@/app/(marketing)/Home/ex/ex.css';
import './ex/exp.css';
import '@/app/(marketing)/holidays/ex/listing.css';
import './vw/vw.css';

function Bone({ className = '' }: { className?: string }) {
  return <span className={'exl-skel ' + className} />;
}

function Lines({ count }: { count: number }) {
  return (
    <div className="vw-skel__lines">
      {Array.from({ length: count }, (_, i) => (
        <Bone key={i} className={'vw-skel--line' + (i === count - 1 ? ' exl-skel--short' : '')} />
      ))}
    </div>
  );
}

function PriceBones() {
  return (
    <div className="vw-price">
      <div className="vw-price__row">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="vw-skel__col">
            <Bone className="vw-skel--label" />
            <Bone className="vw-skel--hint" />
            <Bone className="vw-skel--amount" />
          </div>
        ))}
      </div>
      <Bone className="vw-skel--cta" />
      <Bone className="vw-skel--links" />
      <div className="vw-price__actions">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className="vw-skel__action">
            <Bone className="vw-skel--icon" />
            <Bone className="vw-skel--action" />
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadingBody() {
  return (
    <main className="vw" aria-busy="true" aria-label="Loading package details">
      <div className="ex-wrap">
        <div className="vw-crumbs">
          <Bone className="vw-skel--crumbs" />
        </div>
        <header className="vw-top">
          <div className="vw-top__text vw-skel__text">
            <Bone className="vw-skel--title" />
            <div className="vw-meta">
              <Bone className="vw-skel--flag" />
              <Bone className="vw-skel--meta" />
              <Bone className="vw-skel--meta" />
              <Bone className="vw-skel--meta vw-skel--wide" />
            </div>
          </div>
          <div className="vw-top__actions">
            <Bone className="vw-skel--share" />
            <Bone className="vw-skel--pill" />
          </div>
        </header>

        <div className="vw-gallery has-side vw-skel__gallery">
          <Bone className="vw-gallery__main" />
          <div className="vw-gallery__side">
            <Bone className="vw-gallery__item" />
            <Bone className="vw-gallery__item" />
          </div>
        </div>

        <hr className="vw-split" />

        <div className="vw-layout">
          <div className="vw-main">
            <div className="vw-inline-price">
              <PriceBones />
            </div>
            <div className="vw-details">
              <section className="vw-sec">
                <div className="vw-sec__head">
                  <Bone className="vw-skel--h2" />
                </div>
                <Lines count={5} />
              </section>

              <section className="vw-reviews">
                <div className="vw-reviews__head">
                  <Bone className="vw-skel--h2" />
                  <Bone className="vw-skel--loved" />
                </div>
                <div className="vw-rail">
                  <div className="vw-rail__track">
                    {Array.from({ length: 2 }, (_, i) => (
                      <div key={i} className="vw-rv">
                        <Bone className="vw-skel--by" />
                        <Lines count={4} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="vw-sec">
                <div className="vw-sec__head">
                  <Bone className="vw-skel--h2" />
                  <Bone className="vw-skel--link" />
                </div>
                <div className="vw-days">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="vw-day">
                      <div className="vw-day__pin">
                        <Bone className="vw-skel--pin" />
                      </div>
                      <div className="vw-day__main vw-skel__day">
                        <Bone className="vw-skel--daylabel" />
                        <Bone className="vw-skel--daytitle" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <aside className="vw-aside">
            <PriceBones />
            <div className="vw-aside__sticky">
              <div className="vw-route">
                <Bone className="vw-skel--routetitle" />
                <div className="vw-skel__route">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="vw-skel__stop">
                      <Bone className="vw-skel--dot" />
                      <span className="vw-skel__stoptext">
                        <Bone className="vw-skel--daylabel" />
                        <Bone className="vw-skel--stop" />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="vw-skel__routeactions">
                  <Bone className="vw-skel--routebtn" />
                  <Bone className="vw-skel--routebtn" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function NotFoundBody({ title, backHref, backLabel }: { title?: string; backHref: string; backLabel: string }) {
  return (
    <main className="exp">
      <section className="exp-empty">
        <div className="ex-wrap">
          <h1 className="ex-h2">{title}</h1>
          <p>It may have sold out or been taken down. Have a look at what&apos;s available now.</p>
          <Link href={backHref} className="ex-btn ex-btn--dark">
            <ArrowLeft aria-hidden="true" />
            {backLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function PdpState({
  loading,
  title,
  backHref = '/holidays',
  backLabel = 'Back to holidays',
}: {
  loading?: boolean;
  title?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      {loading ? <LoadingBody /> : <NotFoundBody title={title} backHref={backHref} backLabel={backLabel} />}
      <ExFooter />
    </div>
  );
}
