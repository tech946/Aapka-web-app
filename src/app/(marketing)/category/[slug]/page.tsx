'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePackageCategories, usePackagesByCategory, useAgentStatus } from '@/hooks/use-marketing-queries';
import {
  MapPin,
  Grid3x3,
  List,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { gsap } from 'gsap';
import PackageSliderArrowRight from '@/components/icons/PackageSliderArrowRight';
import {
  detectUserLocation,
  initializeExchangeRate,
  type UserLocation,
} from '@/lib/location-utils';
import { generateShortSlug } from '@/lib/utils';
import { isPackagePriceRevealingSoon } from '@/lib/package-pricing';
import { PackagePriceRevealingSoonLabel } from '@/components/marketing/PackagePriceRevealingSoonLabel/PackagePriceRevealingSoonLabel';
import '../packages.css';

interface Package {
  package_id: string;
  package_name: string;
  package_description: string | null;
  package_price: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  package_category_id?: string;
  adult_price?: number | null;
  child_price?: number | null;
  with_visa?: boolean | null;
  adult_visa_price?: number | null;
  child_visa_price?: number | null;
  infant_visa_price?: number | null;
  agent_discount?: number | null;
  adult_discount_amount?: number | null;
  child_discount_amount?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  active_deal?: {
    deal_adult_price: number | null;
    deal_child_price: number | null;
    deal_infant_price: number | null;
    deal_solo_traveller_price: number | null;
    start_date: string;
    end_date: string;
    is_active: boolean;
  } | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  itinerary?: Array<{ heading: string; desc: string }> | null;
  thumbnail_image?: string | null;
  created_at?: string | null;
  end_date?: string | null;
}

interface Category {
  id: string;
  name: string;
  packagetypeid?: number | null;
  packagetypename?: string | null;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Filter states
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Cached category lookup from slug
  const { data: categoriesData = [], isLoading: categoriesLoading } = usePackageCategories(100);
  const category = useMemo(() => {
    if (!slug || !categoriesData.length) return null;
    const found = (categoriesData as Category[]).find(cat => {
      const categorySlug = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return categorySlug === slug.toLowerCase();
    });
    return found ?? null;
  }, [slug, categoriesData]);

  const { data: packagesResult, isLoading: packagesLoading } = usePackagesByCategory({
    categoryId: category?.id,
    limit,
    status: 'active',
    page,
    sort_by: sortBy,
    listing_page_only: true,
  });
  const packagesData = packagesResult?.data ?? [];
  const total = packagesResult?.total ?? 0;

  const packages = useMemo(() => {
    let sorted = [...(packagesData as Package[])];
    if (sortBy === 'price-low') sorted.sort((a, b) => (a.package_price || 0) - (b.package_price || 0));
    else if (sortBy === 'price-high') sorted.sort((a, b) => (b.package_price || 0) - (a.package_price || 0));
    else if (sortBy === 'name') sorted.sort((a, b) => (a.package_name || '').localeCompare(b.package_name || ''));
    return sorted;
  }, [packagesData, sortBy]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const loading = categoriesLoading || (!!category?.id && packagesLoading);

  const { data: agentData } = useAgentStatus(true);
  const hasActiveAgentSubscription = !!agentData?.hasActiveSubscription;

  // Detect user location and initialize exchange rate on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize exchange rate first (fetch from database)
        await initializeExchangeRate();
        // Detect location
        const location = await detectUserLocation();
        setUserLocation(location);
      } catch (error) {
        // Default to non-India
        const defaultLocation = {
          country: 'Unknown',
          countryCode: 'US',
          isIndia: false,
          currency: 'AED',
          currencySymbol: 'AED',
        };
        setUserLocation(defaultLocation);
      }
    };

    initialize();
  }, []);

  // Helper function to format price - always shows AED
  const formatPrice = (price: number | null): string => {
    if (!price) return 'N/A';
    return `AED ${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const toggleFavorite = (packageId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(packageId)) {
        newFavorites.delete(packageId);
      } else {
        newFavorites.add(packageId);
      }
      return newFavorites;
    });
  };

  if (!category && !loading) {
    return (
      <div className='packages-page'>
        <div className='packages-loading'>Category not found</div>
      </div>
    );
  }

  return (
    <div className='packages-page'>
      <div className='container'>

        {/* Filters Bar */}
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
                onClick={() => setIsSortDropdownOpen((v) => !v)}
                aria-expanded={isSortDropdownOpen}
                aria-haspopup='menu'
              >
                <span>Sort</span>
                <span className='packages-sort-current'>
                  {sortBy === 'created_at_desc'
                    ? 'Descending Order'
                    : sortBy === 'created_at_asc'
                      ? 'Ascending Order'
                      : sortBy === 'price_asc'
                        ? 'Price Ascending'
                        : sortBy === 'price_desc'
                          ? 'Price Descending'
                          : 'Newest'}
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
                    <button
                      type='button'
                      className={`sort-option ${
                        sortBy === 'created_at_asc' ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSortBy('created_at_asc');
                        setPage(1);
                        setIsSortDropdownOpen(false);
                      }}
                      role='menuitem'
                    >
                      Ascending Order
                    </button>
                    <button
                      type='button'
                      className={`sort-option ${
                        sortBy === 'created_at_desc' ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSortBy('created_at_desc');
                        setPage(1);
                        setIsSortDropdownOpen(false);
                      }}
                      role='menuitem'
                    >
                      Descending Order
                    </button>
                    <button
                      type='button'
                      className={`sort-option ${
                        sortBy === 'price_asc' ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSortBy('price_asc');
                        setPage(1);
                        setIsSortDropdownOpen(false);
                      }}
                      role='menuitem'
                    >
                      Price Ascending
                    </button>
                    <button
                      type='button'
                      className={`sort-option ${
                        sortBy === 'price_desc' ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSortBy('price_desc');
                        setPage(1);
                        setIsSortDropdownOpen(false);
                      }}
                      role='menuitem'
                    >
                      Price Descending
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className='packages-view-section'>
              <div className='packages-view-toggle'>
                <button
                  className={`view-toggle-btn ${
                    viewMode === 'grid' ? 'active' : ''
                  }`}
                  onClick={() => setViewMode('grid')}
                  title='Grid View'
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  className={`view-toggle-btn ${
                    viewMode === 'row' ? 'active' : ''
                  }`}
                  onClick={() => setViewMode('row')}
                  title='Row View'
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div className='packages-cards-container'>
          <div
            className={`packages-cards-grid ${
              viewMode === 'row' ? 'packages-cards-row' : ''
            }`}
          >
              {loading ? (
                <div className='packages-loading'>Loading packages...</div>
              ) : packages.length === 0 ? (
                <div className='packages-empty'>No packages found</div>
              ) : (
                packages.map(pkg => {
                  // Generate short slug for URL (under 70 chars total)
                  const packageSlug = generateShortSlug(
                    pkg.package_name,
                    pkg.package_id,
                    pkg.package_days,
                    pkg.package_nights
                  );

                  return (
                    <div
                      key={`${pkg.package_id}-aed`}
                      className='package-card-wrapper'
                    >
                      <PackageCard
                        pkg={pkg}
                        slug={slug}
                        packageSlug={packageSlug}
                        hasActiveAgentSubscription={hasActiveAgentSubscription}
                        userLocation={userLocation}
                      />
                    </div>
                  );
                })
              )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='packages-pagination'>
              <button
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

function PackageCard({
  pkg,
  slug,
  packageSlug,
  userLocation,
  hasActiveAgentSubscription,
}: {
  pkg: Package;
  slug: string;
  packageSlug: string;
  userLocation: UserLocation | null;
  hasActiveAgentSubscription: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isRevealingSoon = isPackagePriceRevealingSoon(pkg);

  // Helper function to get location/description text
  const getLocationText = (): string | null => {
    if (pkg.overview) {
      return pkg.overview;
    }
    if (pkg.holiday_description_html) {
      // Strip HTML tags and get plain text
      const plainText = pkg.holiday_description_html
        .replace(/<[^>]*>/g, '')
        .trim();
      // Limit to 100 characters
      return plainText.length > 100
        ? plainText.substring(0, 100) + '...'
        : plainText;
    }
    return null;
  };

  // Helper function to format price - always shows AED
  const formatPrice = (price: number | null): string => {
    if (!price) return 'N/A';
    return `AED ${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate discount percentage
  const getDiscountPercentage = (): number | null => {
    if (hasActiveAgentSubscription && pkg.agent_discount) {
      return pkg.agent_discount;
    }
    
    // Check if regular discount is active
    if (pkg.discount_start_date && pkg.discount_end_date) {
      const now = new Date();
      const startDate = new Date(pkg.discount_start_date);
      const endDate = new Date(pkg.discount_end_date);
      
      if (now >= startDate && now <= endDate) {
        const basePrice = pkg.adult_price || pkg.package_price || 0;
        if (basePrice > 0 && pkg.adult_discount_amount) {
          return Math.round((pkg.adult_discount_amount / basePrice) * 100);
        }
      }
    }
    
    return null;
  };

  // Get full package description/details (not truncated, HTML stripped)
  const getPackageDescription = (): string | null => {
    // Priority: overview > package_description > holiday_description_html
    if (pkg.overview && pkg.overview.trim()) {
      // Strip all HTML tags and decode HTML entities
      return pkg.overview
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (pkg.package_description && pkg.package_description.trim()) {
      // Strip all HTML tags and decode HTML entities
      return pkg.package_description
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (pkg.holiday_description_html && pkg.holiday_description_html.trim()) {
      // Strip all HTML tags and decode HTML entities
      return pkg.holiday_description_html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }
    return null;
  };



  // Format duration with dates
  const getDuration = (): string => {
    const nights = pkg.package_nights || 0;
    
    // For now, just show nights. In the future, if we have travel_dates or booking_slots,
    // we can extract actual dates from there
    if (nights > 0) {
      return `${nights} ${nights === 1 ? 'Night' : 'Nights'}`;
    }
    
    return 'Duration not specified';
  };

  // Get price per person
  const getPricePerPerson = (): string => {
    const price = pkg.adult_price || pkg.package_price;
    if (!price) return 'N/A';
    
    const discount = getDiscountPercentage();
    if (discount) {
      const discountedPrice = price * (1 - discount / 100);
      return formatPrice(discountedPrice);
    }
    
    return formatPrice(price);
  };

  const discountPercentage = getDiscountPercentage();
  const packageDescription = getPackageDescription();
  const duration = getDuration();
  const pricePerPerson = getPricePerPerson();
  
  // Show "New" tag for recently created packages (within last 30 days)
  const isNew = pkg.created_at
    ? new Date().getTime() - new Date(pkg.created_at).getTime() <
      30 * 24 * 60 * 60 * 1000
    : false;

  // Keep subtle image hover (matches homepage suites feel)
  useEffect(() => {
    const card = cardRef.current;
    const image = imageRef.current;

    if (!card || !image) return;

    const handleMouseEnter = () => {
      gsap.to(image, {
        scale: 1.03,
        duration: 0.22,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(image, {
        scale: 1,
        duration: 0.18,
        ease: 'power2.out',
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Check if package has active deal
  const hasActiveDeal = (): boolean => {
    if (!pkg.active_deal) return false;
    const deal = pkg.active_deal;
    const now = new Date();
    const startDate = new Date(deal.start_date);
    const endDate = new Date(deal.end_date);
    return deal.is_active && now >= startDate && now <= endDate;
  };

  return (
    <div className='suites-card' ref={cardRef}>
      <div className='suites-card-image' ref={imageRef}>
        {hasActiveDeal() && (
          <div className='package-deal-badge'>Deal of the Day</div>
        )}
        {isNew && <div className='package-new-badge'>New</div>}
        {duration && duration !== 'Duration not specified' && (
          <div className='package-duration-badge'>{duration}</div>
        )}
        {pkg.thumbnail_image && pkg.thumbnail_image.trim() ? (
          <img
            src={pkg.thumbnail_image}
            alt={pkg.package_name}
            className='suites-img'
            onError={e => {
              // Hide image and show placeholder if it fails to load
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget
                .nextElementSibling as HTMLElement;
              if (placeholder) {
                placeholder.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className='package-image-placeholder'
          style={{
            display:
              pkg.thumbnail_image && pkg.thumbnail_image.trim()
                ? 'none'
                : 'flex',
          }}
        >
          <MapPin className='package-image-icon' />
        </div>
      </div>
      <div className='suites-card-content'>
        <h3 className='suites-card-title'>{pkg.package_name}</h3>

        {packageDescription && (
          <p className='suites-card-destinations'>{packageDescription}</p>
        )}

        {discountPercentage && !isRevealingSoon && (
          <div className='suites-discount-badge'>{discountPercentage}% Off</div>
        )}

        {(() => {
          const hasVisaIncludedAtZero =
            pkg.with_visa &&
            (pkg.adult_visa_price ?? 0) === 0 &&
            (pkg.child_visa_price ?? 0) === 0 &&
            (pkg.infant_visa_price ?? 0) === 0;
          return hasVisaIncludedAtZero ? (
            <span className='package-visa-badge package-visa-badge-with'>With visa</span>
          ) : (
            <span className='package-visa-badge'>Without visa</span>
          );
        })()}

        <div className='suites-card-price'>
          {isRevealingSoon ? (
            <PackagePriceRevealingSoonLabel variant='card' />
          ) : (
            <>
              <span className='suites-price-amount'>{pricePerPerson}</span>
              <span className='suites-price-label'> / per person</span>
            </>
          )}
        </div>

        <Link href={`/category/${slug}/${packageSlug}`} className='suites-read-more'>
          <span>View Details</span>
          <PackageSliderArrowRight size={20} className='suites-btn-arrow' />
        </Link>
      </div>
    </div>
  );
}
