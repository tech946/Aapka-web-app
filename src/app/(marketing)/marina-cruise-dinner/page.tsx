'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Grid3x3, List, ChevronDown, MapPin } from 'lucide-react';
import { gsap } from 'gsap';
import { generateShortSlug } from '@/lib/utils';
import { isPackagePriceRevealingSoon } from '@/lib/package-pricing';
import {
  isMarinaRegistrationMode,
  getMarinaRegistrationPrices,
} from '@/lib/marina-cruise-config';
import { PackagePriceRevealingSoonLabel } from '@/components/marketing/PackagePriceRevealingSoonLabel/PackagePriceRevealingSoonLabel';
import PackageSliderArrowRight from '@/components/icons/PackageSliderArrowRight';
import {
  detectUserLocation,
  initializeExchangeRate,
  type UserLocation,
} from '@/lib/location-utils';
import './marina-cruise-dinner.css';

interface MarinaPackage {
  package_id: string;
  package_name: string;
  package_description: string | null;
  package_price: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  registration_only?: boolean | null;
  registration_adult_price?: number | null;
  registration_child_price?: number | null;
  category?: string | null;
  timing?: string | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  thumbnail_image?: string | null;
  created_at?: string | null;
}

function getSortLabel(sortBy: string): string {
  switch (sortBy) {
    case 'created_at_asc':
      return 'Ascending Order';
    case 'created_at_desc':
      return 'Descending Order';
    case 'price_asc':
      return 'Price Ascending';
    case 'price_desc':
      return 'Price Descending';
    default:
      return 'Newest';
  }
}

function MarinaPackageCard({ pkg }: { pkg: MarinaPackage }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const registrationMode = isMarinaRegistrationMode(pkg);
  const isRevealingSoon =
    !registrationMode && isPackagePriceRevealingSoon(pkg);

  const packageSlug = generateShortSlug(pkg.package_name, pkg.package_id);

  const formatPrice = (price: number | null): string => {
    if (!price) return 'N/A';
    return `AED ${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPackageDescription = (): string | null => {
    const source =
      pkg.overview?.trim() ||
      pkg.package_description?.trim() ||
      pkg.holiday_description_html?.trim();
    if (!source) return null;
    return source
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const regPrices = getMarinaRegistrationPrices(pkg);
  const pricePerPerson = registrationMode
    ? regPrices.adultPrice > 0
      ? formatPrice(regPrices.adultPrice)
      : 'Register'
    : formatPrice(pkg.adult_price ?? pkg.package_price ?? null);
  const packageDescription = getPackageDescription();
  const isNew = pkg.created_at
    ? Date.now() - new Date(pkg.created_at).getTime() < 30 * 24 * 60 * 60 * 1000
    : false;

  useEffect(() => {
    const card = cardRef.current;
    const image = imageRef.current;
    if (!card || !image) return;

    const handleMouseEnter = () => {
      gsap.to(image, { scale: 1.03, duration: 0.22, ease: 'power2.out' });
    };
    const handleMouseLeave = () => {
      gsap.to(image, { scale: 1, duration: 0.18, ease: 'power2.out' });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className='suites-card' ref={cardRef}>
      <div className='suites-card-image' ref={imageRef}>
        {isNew && <div className='package-new-badge'>New</div>}
        {pkg.thumbnail_image?.trim() ? (
          <img
            src={pkg.thumbnail_image}
            alt={pkg.package_name}
            className='suites-img'
          />
        ) : (
          <div className='package-image-placeholder' style={{ display: 'flex' }}>
            <MapPin className='package-image-icon' />
          </div>
        )}
      </div>
      <div className='suites-card-content'>
        <h3 className='suites-card-title'>{pkg.package_name}</h3>
        {/* category / timing hidden for now */}
        {packageDescription && (
          <p className='suites-card-destinations'>{packageDescription}</p>
        )}
        <div className='suites-card-price'>
          {registrationMode && regPrices.adultPrice <= 0 && regPrices.childPrice <= 0 ? (
            <span
              role='status'
              className='package-price-revealing-soon package-price-revealing-soon--card'
            >
              Register
            </span>
          ) : isRevealingSoon ? (
            <PackagePriceRevealingSoonLabel variant='card' />
          ) : (
            <>
              <span className='suites-price-amount'>{pricePerPerson}</span>
              <span className='suites-price-label'> / per person</span>
            </>
          )}
        </div>
        <Link
          href={`/marina-cruise-dinner/${packageSlug}`}
          className='suites-read-more'
        >
          <span>View Details</span>
          <PackageSliderArrowRight size={20} className='suites-btn-arrow' />
        </Link>
      </div>
    </div>
  );
}

export default function MarinaCruiseDinnerPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [packages, setPackages] = useState<MarinaPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  useEffect(() => {
    initializeExchangeRate().catch(() => {});
    detectUserLocation().catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          status: 'active',
          sort_by: sortBy,
          listing_page_only: 'true',
        });
        const res = await fetch(`/api/marina-cruise-dinners?${params}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!active) return;
        setPackages(json.data ?? []);
        setTotal(json.total ?? 0);
      } catch (e: any) {
        if (active && e.name !== 'AbortError') {
          setPackages([]);
          setTotal(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, limit, sortBy]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const sortOptions = [
    { value: 'created_at_asc', label: 'Ascending Order' },
    { value: 'created_at_desc', label: 'Descending Order' },
    { value: 'price_asc', label: 'Price Ascending' },
    { value: 'price_desc', label: 'Price Descending' },
  ];

  return (
    <div className='packages-page marina-cruise-dinner-page'>
      <div className='container'>
        <div className='marina-hero'>
          <h1>Marina Cruise</h1>
          <p>Exclusive dhow cruise experiences on Dubai Marina</p>
        </div>

        <div className='packages-filters-bar'>
          <div className='packages-found'>
            <span className='packages-found-label'>Packages Found</span>
            <span className='packages-found-value'>{total}</span>
          </div>

          <div className='packages-header-controls'>
            <div className='packages-sort-dropdown'>
              <button
                type='button'
                className='packages-sort-button'
                onClick={() => setIsSortDropdownOpen(v => !v)}
                aria-expanded={isSortDropdownOpen}
                aria-haspopup='menu'
              >
                <span>Sort</span>
                <span className='packages-sort-current'>
                  {getSortLabel(sortBy)}
                </span>
                <ChevronDown
                  size={16}
                  className={`sort-chevron ${isSortDropdownOpen ? 'open' : ''}`}
                />
              </button>

              {isSortDropdownOpen && (
                <>
                  <div
                    className='sort-dropdown-overlay'
                    onClick={() => setIsSortDropdownOpen(false)}
                  />
                  <div className='sort-dropdown-menu' role='menu'>
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        type='button'
                        className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                        onClick={() => {
                          setSortBy(option.value);
                          setPage(1);
                          setIsSortDropdownOpen(false);
                        }}
                        role='menuitem'
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className='packages-view-section'>
              <div className='packages-view-toggle'>
                <button
                  type='button'
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title='Grid View'
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  type='button'
                  className={`view-toggle-btn ${viewMode === 'row' ? 'active' : ''}`}
                  onClick={() => setViewMode('row')}
                  title='Row View'
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className='packages-cards-container'>
          <div
            className={`packages-cards-grid ${
              viewMode === 'row' ? 'packages-cards-row' : ''
            }`}
          >
            {loading ? (
              <div className='packages-loading'>
                Loading marina cruise packages...
              </div>
            ) : packages.length === 0 ? (
              <div className='packages-empty'>
                No marina cruise packages available.
              </div>
            ) : (
              packages.map(pkg => (
                <div key={pkg.package_id} className='package-card-wrapper'>
                  <MarinaPackageCard pkg={pkg} />
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className='packages-pagination'>
              <button
                type='button'
                className='pagination-button'
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className='pagination-info'>
                Page {page} of {totalPages}
              </span>
              <button
                type='button'
                className='pagination-button'
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
