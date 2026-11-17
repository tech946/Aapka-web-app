'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin, Share2 } from 'lucide-react';
import type { Inclusion } from '../listing/listing-data';
import { hasText, itineraryDays, titleCase } from './pdp-data';
import { usePdpPlace, useRelated } from './PdpRelated';
import { openBookingWizard } from './BookingWizard';
import ShareDialog from './ShareDialog';
import { TripSummaryContext, type TripSummary } from './ex/trip-summary';
import { htmlItems } from './ex/ExPdpParts';
import {
  VwGallery,
  VwItinerary,
  VwLightbox,
  VwList,
  VwDock,
  VwPriceBar,
  VwOverview,
  VwPriceCard,
  VwRelated,
  VwRoute,
  VwReviews,
  VwSection,
  VwTabs,
  scrollToSection,
  type NavItem,
} from './vw/VwParts';
import ExHeader from '@/app/(marketing)/Home/ex/ExHeader';
import { ExFooter } from '@/app/(marketing)/Home/ex/ExSections';
import { EX_FONTS } from '@/app/(marketing)/Home/ex/fonts';
import '@/app/(marketing)/Home/ex/ex.css';
import './pdp.css';
import './ex/exp.css';
import '@/app/(marketing)/holidays/ex/listing.css';
import './vw/vw.css';

export interface PdpCopy {
  overview?: string | null;
  description?: string | null;
  holidayHtml?: string | null;
  itinerary?: Array<{ heading?: string | null; desc?: string | null }> | null;
  inclusionHtml?: string | null;
  exclusionHtml?: string | null;
  termsHtml?: string | null;
}

export interface PdpNote {
  id: string;
  title: string;
  body: ReactNode;
}

interface Props {
  images: string[];
  name: string;
  duration?: string;
  kind?: string;
  badge?: string | null;
  inclusions?: Inclusion[];
  notice?: ReactNode;
  copy: PdpCopy;
  rewrite?: (text: string) => string;
  notes?: PdpNote[];
  from?: { now: number | null; strike?: number | null; basis: string } | null;
  sticky?: { price: string; sub: string } | null;
  whatsappText?: string;
  booking: ReactNode;
}

const asIs = (text: string) => text;

function splitDuration(duration?: string): { days: number; nights: number } | null {
  if (!duration) return null;
  const m = duration.match(/(\d+)\s*N\s*\/\s*(\d+)\s*D/i);
  if (m) return { nights: Number(m[1]), days: Number(m[2]) };
  const d = duration.match(/(\d+)\s*Day/i);
  if (d) return { days: Number(d[1]), nights: Math.max(0, Number(d[1]) - 1) };
  const n = duration.match(/(\d+)\s*Night/i);
  if (n) return { nights: Number(n[1]), days: Number(n[1]) + 1 };
  return null;
}

function usePriceInView() {
  const aside = useRef<HTMLDivElement>(null);
  const inline = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    const els = [aside.current, inline.current].filter((el): el is HTMLDivElement => !!el);
    if (!els.length) return;
    const state = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => state.set(e.target, e.isIntersecting));
      setSeen([...state.values()].some(Boolean));
    });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return { aside, inline, seen };
}

export default function PdpShell({
  images,
  name,
  duration,
  kind,
  badge,
  inclusions = [],
  notice,
  copy,
  rewrite = asIs,
  notes = [],
  from,
  whatsappText,
  booking,
}: Props) {
  const place = usePdpPlace();
  const { items: related, ownCount, loading: relatedLoading } = useRelated(place.source);
  const title = titleCase(name);
  const days = useMemo(() => itineraryDays(copy.itinerary, rewrite), [copy.itinerary, rewrite]);
  const [sharing, setSharing] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const goBook = openBookingWizard;
  const price = usePriceInView();
  const seePrice = () => {
    setPhoto(null);
    const card = [price.aside.current, price.inline.current].find((el) => el && el.offsetParent !== null);
    requestAnimationFrame(() => card?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const typeName = kind || place.typeLabel;
  const span = splitDuration(duration);
  const durationLine = span ? `${span.days} Days / ${span.nights} Nights` : duration || '';

  const paragraphs = [copy.overview, copy.description].filter((t): t is string => hasText(t)).map((t) => rewrite(t));
  const overviewHtml = [...paragraphs.map((p) => (/<p[\s>]/i.test(p) ? p : `<p>${p}</p>`)), hasText(copy.holidayHtml) ? rewrite(copy.holidayHtml ?? '') : ''].join('');

  const included = hasText(copy.inclusionHtml) ? htmlItems(rewrite(copy.inclusionHtml ?? '')) : inclusions.map((i) => ({ text: i, head: false }));
  const excluded = hasText(copy.exclusionHtml) ? htmlItems(rewrite(copy.exclusionHtml ?? '')) : [];

  const summary = useMemo<TripSummary>(
    () => ({ name: title, image: images[0], sub: ['UAE', durationLine].filter(Boolean).join(' • '), badge: badge || typeName, from }),
    [title, images, durationLine, badge, typeName, from],
  );

  const infoTabs = [
    ...(included.length ? [{ id: 'incl', label: 'Holiday Inclusions', body: <VwList items={included} /> }] : []),
    ...(excluded.length ? [{ id: 'excl', label: 'Holiday Exclusions', body: <VwList items={excluded} /> }] : []),
  ];

  const knowItems = [
    ...(hasText(copy.termsHtml)
      ? [{ id: 'terms', title: 'Important Notes', body: <div className="exp-rich" dangerouslySetInnerHTML={{ __html: rewrite(copy.termsHtml ?? '') }} /> }]
      : []),
    ...notes,
  ];

  const nav: NavItem[] = [
    ...(overviewHtml ? [{ id: 'overview', label: 'Overview' }] : []),
    { id: 'reviews', label: 'Reviews' },
    ...(days.length ? [{ id: 'itinerary', label: 'Itinerary' }] : []),
    ...(infoTabs.length ? [{ id: 'info', label: 'Holiday Information' }] : []),
    ...(knowItems.length ? [{ id: 'know', label: 'Need to Know' }] : []),
  ];

  const priceCard = (
    <VwPriceCard from={from} duration={duration || ''} onBook={goBook} whatsappText={whatsappText} />
  );

  return (
    <TripSummaryContext.Provider value={summary}>
      <div className={'desert-ember ex ' + EX_FONTS}>
        <ExHeader />
        <main className="vw">
          <div className="ex-wrap">
            <nav className="vw-crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <ChevronRight aria-hidden="true" />
              <Link href="/holidays">Holidays</Link>
              <ChevronRight aria-hidden="true" />
              <Link href={place.typeHref}>{place.typeLabel}</Link>
            </nav>

            <header className="vw-top">
              <div className="vw-top__text">
                <h1 className="vw-title">{title}</h1>
                <p className="vw-meta">
                  <span className="vw-flag">
                    <span className="vw-flag__type">{typeName}</span>
                    {duration ? <span className="vw-flag__code">{duration}</span> : null}
                  </span>
                  {span ? (
                    <span className="vw-meta__item">
                      {span.days} Days · {span.nights} Nights
                    </span>
                  ) : null}
                  <span className="vw-meta__item">
                    <MapPin aria-hidden="true" />
                    Dubai, UAE
                  </span>
                  {badge ? <span className="vw-chips__badge">{badge}</span> : null}
                  {days.length ? (
                    <button type="button" className="vw-meta__link" onClick={() => scrollToSection('itinerary')}>
                      View day-wise itinerary
                    </button>
                  ) : null}
                </p>
              </div>
              <div className="vw-top__actions">
                <button type="button" className="vw-top__pill" onClick={() => setSharing(true)}>
                  <Share2 aria-hidden="true" />
                  Share
                </button>
              </div>
            </header>

            <VwGallery images={images} name={title} onOpen={setPhoto} />

            <hr className="vw-split" />

            <div className="vw-layout">
              <div className="vw-main">
                <div className="vw-inline-price" ref={price.inline}>
                  {priceCard}
                </div>

                {notice ? (
                  <div className="vw-notice">
                    <div className="at-site desert-ember">{notice}</div>
                  </div>
                ) : null}

                <div className="vw-details">
                  {overviewHtml ? <VwOverview html={overviewHtml} /> : null}
                  <VwReviews />
                  {days.length ? <VwItinerary days={days} /> : null}
                  {infoTabs.length ? (
                    <VwSection id="info" title="Holiday Information" sub="Read this to prepare for your holiday in the best way!">
                      <VwTabs tabs={infoTabs} />
                    </VwSection>
                  ) : null}
                  {knowItems.length ? (
                    <VwSection id="know" title="Need to Know" sub="Things to consider before the trip!">
                      <div className="vw-know">
                        {knowItems.map((k) => (
                          <div key={k.id} className="vw-know__item">
                            <h3>{k.title}</h3>
                            <div className="exp-rich">{k.body}</div>
                          </div>
                        ))}
                      </div>
                    </VwSection>
                  ) : null}
                </div>
              </div>

              <aside className="vw-aside" aria-label="Price and booking">
                <div ref={price.aside}>{priceCard}</div>
                {days.length ? (
                  <div className="vw-aside__sticky">
                    <VwRoute days={days} onView={() => scrollToSection('itinerary')} />
                  </div>
                ) : null}
              </aside>
            </div>
          </div>

          <VwRelated
            items={related}
            loading={relatedLoading}
            title={related.length && ownCount === related.length ? `More ${place.typeLabel}` : 'More holidays you may like'}
            href={place.typeHref}
          />
        </main>
        <ExFooter />

        {nav.length ? <VwDock items={nav} onBook={goBook} cta={!price.seen} /> : null}
        <VwPriceBar from={from} onBook={goBook} hide={price.seen} />

        <div className="at-site desert-ember" hidden>
          <div className="pdp">{booking}</div>
        </div>

        {photo !== null && images.length ? (
          <VwLightbox images={images} name={title} start={photo} onSeePrice={seePrice} onClose={() => setPhoto(null)} />
        ) : null}

        {sharing ? (
          <div className="at-site desert-ember">
            <ShareDialog title={name} onClose={() => setSharing(false)} />
          </div>
        ) : null}
      </div>
    </TripSummaryContext.Provider>
  );
}
