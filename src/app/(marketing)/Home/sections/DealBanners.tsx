'use client';

import Link from 'next/link';
import { useTcSlider } from '@/components/site/useTcSlider';
import { dealHref, shortDate, useLimitedTimeDeals } from '../home-data';

/* Design: "Tourism Board Recommends" — a strip of wide partner banners.
   Production: the live Limited Time Deals, each deal's own artwork as the
   banner. Renders nothing when no deal is running. */
export default function DealBanners() {
  const { deals } = useLimitedTimeDeals();
  const s = useTcSlider({ count: deals.length, perView: 3, gap: 16 });
  if (!deals.length) return null;

  return (
    <>
      <div className="container tourism_heading_wrap">
        <div className="row">
          <div className="col-inner">
            <div className="main_heading">
              <div>
                <h2>Limited time deals</h2>
              </div>
              <Link href="/holidays?type=limited-time-deals" className="btn btn_secondary">
                View all deals
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="tourism_board tourism_board--deals">
        <div className="carousel-section">
          <div className="carousel-wrapper owl-nav-wrap">
            <div className="tc-slider" {...s.rootProps}>
              <div className="tc-slider-track" style={s.trackStyle} {...s.trackProps}>
                {deals.map((d, i) =>
                  d.package ? (
                    <div className="tc-slide" style={s.slideStyle(i)} key={d.id}>
                      <Link href={dealHref(d.package)} className="tb_card">
                        <img src={d.package.thumbnail_image || '/images/package-1.png'} alt={d.package.package_name} loading="lazy" />
                        <span className="tb_ends">Ends {shortDate(d.end_date)}</span>
                      </Link>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
            {!s.single && (
              <>
                <button type="button" className="custom-owl-prev" onClick={s.prev} disabled={!s.canPrev} aria-label="Previous deals">
                  <img src="/assets/images/tcHolidays/chevron-left.svg" alt="" />
                </button>
                <button type="button" className="custom-owl-next" onClick={s.next} disabled={!s.canNext} aria-label="Next deals">
                  <img src="/assets/images/tcHolidays/chevron-right.svg" alt="" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
