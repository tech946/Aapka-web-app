'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useTcSlider } from '@/components/site/useTcSlider';
import { categorySlug } from '@/components/site/site-config';
import { categoryHref, packageHref, useCategoryPackages, useHomeCategories, useIsAgent, type HomeCategory } from '../home-data';
import PackageCard from './PackageCard';
import SkeletonSlides from './SkeletonSlides';

/* "Trending itineraries" — laid out like pickyourtrail.com's "Recently
   booked itineraries": a big display title on the left; on the right the
   holiday-type tabs with the slider arrows beside them (top right), then
   the package cards. Each pane draws its own arrows — only the active
   pane is shown, so only its arrows are. */

function Pane({ category, active }: { category: HomeCategory; active: boolean }) {
  const isAgent = useIsAgent();
  const { packages, isLoading } = useCategoryPackages(categorySlug(category.name));
  const s = useTcSlider({ count: packages.length, perView: 3, gap: 20 });

  return (
    <div className={'tab-pane' + (active ? ' active' : '')} role="tabpanel">
      <div className="carousel-wrapper owl-nav-wrap">
        <div className="tc-slider" {...s.rootProps}>
          <div className="tc-slider-track" style={s.trackStyle} {...s.trackProps}>
            {isLoading && !packages.length ? (
              <SkeletonSlides count={3} perView={3} className="pkg_skel" />
            ) : (
              packages.map((pkg, i) => (
                <div className="tc-slide" style={s.slideStyle(i)} key={pkg.package_id}>
                  <PackageCard pkg={pkg} href={packageHref(pkg, category.name)} isAgent={isAgent} tag={category.name} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {!s.single && (
        <div className="trend_nav">
          <button type="button" onClick={s.prev} disabled={!s.canPrev} aria-label="Previous packages">
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" onClick={s.next} disabled={!s.canNext} aria-label="Next packages">
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
      <Link href={categoryHref(category.name)} className="trend_all">
        View all {category.name}
        <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function Trending() {
  const { categories } = useHomeCategories();
  const [tab, setTab] = useState<string | null>(null);
  if (!categories.length) return null;
  const active = tab ?? categories[0].id;

  return (
    <div className="trending_section rn__section__gapTop">
      <div className="container trend_layout">
        <div className="trend_intro">
          <h2 className="mk-display">
            Trending
            <br />
            itineraries
          </h2>
          <p className="trend_badge">
            <Heart size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            Loved by 10,000+ travellers
          </p>
        </div>

        <div className="trend_main">
          <ul className="trend_chips" role="tablist" aria-label="Holiday type">
            {categories.map((c) => (
              <li key={c.id}>
                <button type="button" role="tab" aria-selected={c.id === active} className={'trend_chip' + (c.id === active ? ' is-on' : '')} onClick={() => setTab(c.id)}>
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="tab-content">
            {categories.map((c) => (
              <Pane key={c.id} category={c} active={c.id === active} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
