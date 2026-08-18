'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { generateShortSlug } from '@/lib/utils';
import PackageSliderArrowRight from '@/components/icons/PackageSliderArrowRight';
import { useAgentStatus } from '@/hooks/use-marketing-queries';
import { getAgentDiscountPercentage } from '@/lib/agent-discount';
import { AgentDiscountPrice } from '@/components/marketing/AgentDiscountPrice/AgentDiscountPrice';
import '../category/packages.css';

interface Package {
  package_id: string;
  package_name: string;
  package_description: string | null;
  adult_price: number | null;
  child_price: number | null;
  infant_price: number | null;
  solo_traveller_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  solo_traveller_only?: boolean | null;
  with_visa?: boolean | null;
  adult_visa_price?: number | null;
  child_visa_price?: number | null;
  infant_visa_price?: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  thumbnail_image: string | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  agent_discount?: number | null;
}

interface LimitedTimeDeal {
  id: string;
  offer_package_id: string;
  start_date: string;
  end_date: string;
  booking_fee_aed: number;
  max_bookings_per_day: number;
  package?: Package;
}

function getDurationLabel(pkg: Package): string {
  const d = pkg.package_days ?? 0;
  const n = pkg.package_nights ?? (d > 0 ? d - 1 : 0);
  if (d === 0 && n === 0) return '';
  if (d > 0 && n > 0) return `${d} Days · ${n} Nights`;
  if (d > 0) return `${d} Days`;
  return `${n} Nights`;
}

function getPackageDescription(pkg: Package): string | null {
  const stripHtml = (s: string) =>
    s
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  if (pkg.overview?.trim()) return stripHtml(pkg.overview);
  if (pkg.package_description?.trim())
    return stripHtml(pkg.package_description);
  if (pkg.holiday_description_html?.trim())
    return stripHtml(pkg.holiday_description_html);
  return null;
}

/** Solo-only packages are sold to a single traveller, so the card advertises
    the solo rate instead of the per-person adult rate. */
function isSoloOnlyPackage(pkg: Package): boolean {
  return Boolean(pkg.solo_traveller_only && pkg.solo_traveller_enabled);
}

function formatPrice(price: number): string {
  return `AED ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LimitedTimeDealsPage() {
  const [deals, setDeals] = useState<LimitedTimeDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: agentData } = useAgentStatus();
  const isSubscribedAgent = !!agentData?.hasActiveSubscription;

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await fetch('/api/limited-time-deals');
        const json = await res.json();
        if (json.success && json.data) {
          setDeals(json.data);
        } else {
          setDeals([]);
        }
      } catch {
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  if (loading) {
    return (
      <div className='packages-page'>
        <div className='container'>
          <div className='packages-loading'>Loading limited time deals...</div>
        </div>
      </div>
    );
  }

  const visibleDeals = deals.filter(deal => deal.package);

  if (visibleDeals.length === 0) {
    return (
      <div className='packages-page'>
        <div className='container'>
          <div className='packages-filters-bar'>
            <div className='packages-found'>
              <span className='packages-found-label'>Limited Time Deals</span>
              <span className='packages-found-value'>0 deals</span>
            </div>
          </div>
          <div className='packages-empty'>
            No limited time deals available at the moment.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='packages-page'>
      <div className='container'>
        {/* Filters Bar - same as offer packages */}
        <div className='packages-filters-bar'>
          <div className='packages-found'>
            <span className='packages-found-label'>Limited Time Deals</span>
            <span className='packages-found-value'>
              {visibleDeals.length} deal{visibleDeals.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Packages Grid - same structure as category/offer-packages */}
        <div className='packages-cards-container'>
          <div className='packages-cards-grid'>
            {visibleDeals.map(deal => {
              const pkg = deal.package;
              if (!pkg) return null;

              const packageSlug = generateShortSlug(
                pkg.package_name,
                pkg.package_id,
                pkg.package_days ?? null,
                pkg.package_nights ?? null
              );
              const url = `/limited-time-deals/${packageSlug}`;
              const duration = getDurationLabel(pkg);
              const packageDescription = getPackageDescription(pkg);
              const agentDiscount = getAgentDiscountPercentage(
                pkg,
                isSubscribedAgent
              );
              const soloOnly = isSoloOnlyPackage(pkg);
              const cardPrice = soloOnly
                ? (pkg.solo_traveller_price ?? pkg.adult_price ?? 0)
                : (pkg.adult_price ?? 0);
              const hasVisaIncludedAtZero =
                pkg.with_visa &&
                (pkg.adult_visa_price ?? 0) === 0 &&
                (pkg.child_visa_price ?? 0) === 0 &&
                (pkg.infant_visa_price ?? 0) === 0;

              return (
                <div key={deal.id} className='package-card-wrapper'>
                  <div className='suites-card'>
                    <div className='suites-card-image'>
                      <div className='package-deal-badge'>Limited Time</div>
                      {duration && duration !== 'Duration not specified' && (
                        <div className='package-duration-badge'>{duration}</div>
                      )}
                      {pkg.thumbnail_image && pkg.thumbnail_image.trim() ? (
                        <img
                          src={pkg.thumbnail_image}
                          alt={pkg.package_name}
                          className='suites-img'
                        />
                      ) : (
                        <div
                          className='package-image-placeholder'
                          style={{ display: 'flex' }}
                        >
                          <MapPin className='package-image-icon' />
                        </div>
                      )}
                    </div>
                    <div className='suites-card-content'>
                      <h3 className='suites-card-title'>{pkg.package_name}</h3>
                      {packageDescription && (
                        <p className='suites-card-destinations'>
                          {packageDescription}
                        </p>
                      )}
                      {/* Discount + visa badges share one wrapping row */}
                      <div className='suites-card-badges'>
                        {agentDiscount > 0 && (
                          <span className='suites-discount-badge'>
                            {agentDiscount}% Agent Discount
                          </span>
                        )}
                        <span
                          className={`package-visa-badge ${hasVisaIncludedAtZero ? 'package-visa-badge-with' : ''}`}
                        >
                          {hasVisaIncludedAtZero ? 'With visa' : 'Without visa'}
                        </span>
                      </div>
                      <div className='suites-card-price'>
                        <span className='suites-price-amount'>
                          <AgentDiscountPrice
                            price={cardPrice || 0}
                            percentage={agentDiscount}
                            format={formatPrice}
                          />
                        </span>
                        <span className='suites-price-label'>
                          {soloOnly ? ' / solo traveller' : ' / per person'}
                        </span>
                      </div>
                      <Link href={url} className='suites-read-more'>
                        <span>View Details</span>
                        <PackageSliderArrowRight
                          size={20}
                          className='suites-btn-arrow'
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
