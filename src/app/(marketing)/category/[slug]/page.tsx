'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  MapPin,
  Grid3x3,
  List,
  Filter,
  ChevronDown,
} from 'lucide-react';
import {
  detectUserLocation,
  convertAEDToINR,
  formatCurrency,
  type UserLocation,
} from '@/lib/location-utils';
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
  overview?: string | null;
  holiday_description_html?: string | null;
  thumbnail_image?: string | null;
  created_at?: string | null;
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

  const [category, setCategory] = useState<Category | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Filter states
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  // Fetch category by slug (name)
  useEffect(() => {
    if (slug) {
      fetchCategory();
    }
  }, [slug]);

  // Fetch packages when category is found
  useEffect(() => {
    if (category?.id) {
      fetchPackages();
    }
  }, [category?.id, page, sortBy]);

  // Detect user location on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Detect location
        const location = await detectUserLocation();
        console.log('Category page - Detected location:', location);
        setUserLocation(location);
      } catch (error) {
        console.error('Error initializing:', error);
        // Default to non-India
        const defaultLocation = {
          country: 'Unknown',
          countryCode: 'US',
          isIndia: false,
          currency: 'AED',
          currencySymbol: 'AED',
        };
        console.log('Category page - Using default location:', defaultLocation);
        setUserLocation(defaultLocation);
      }
    };

    initialize();
  }, []);

  // Helper function to format price based on region
  const formatPrice = (price: number | null): string => {
    if (!price) return 'N/A';
    if (!userLocation) {
      return `AED ${price.toLocaleString()}`;
    }

    // Indian users always see INR, international users always see AED
    if (userLocation.isIndia) {
      const inrPrice = convertAEDToINR(price);
      return formatCurrency(inrPrice, userLocation);
    }

    return `AED ${price.toLocaleString()}`;
  };

  const fetchCategory = async () => {
    try {
      // Fetch all categories and find the one that matches the slug
      const response = await fetch(`/api/package-categories?limit=100`);
      const result = await response.json();

      if (result.data && result.data.length > 0) {
        // Find category by matching slug (convert category name to slug format)
        const foundCategory = result.data.find((cat: Category) => {
          const categorySlug = cat.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          return categorySlug === slug.toLowerCase();
        });

        if (foundCategory) {
          setCategory(foundCategory);
        } else {
          console.error('Category not found for slug:', slug);
          setLoading(false);
        }
      } else {
        console.error('No categories found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    if (!category?.id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        category_id: category.id,
        sort_by: sortBy,
      });

      const response = await fetch(`/api/packages?${params.toString()}`);
      const result = await response.json();

      if (result.data) {
        // Sorting is now handled by the API, but we keep client-side sorting as fallback
        // for backward compatibility with old sort values
        let sortedData = [...result.data];
        if (sortBy === 'price-low') {
          sortedData.sort(
            (a, b) => (a.package_price || 0) - (b.package_price || 0)
          );
        } else if (sortBy === 'price-high') {
          sortedData.sort(
            (a, b) => (b.package_price || 0) - (a.package_price || 0)
          );
        } else if (sortBy === 'name') {
          sortedData.sort((a, b) =>
            a.package_name.localeCompare(b.package_name)
          );
        }

        setPackages(sortedData);
        setTotal(result.total || 0);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
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
        {/* Main Content */}
        <div className='packages-layout'>
          {/* Cards */}
          <div className='packages-cards-container'>
            <div className='packages-header'>
              <h2>
                {category?.name ? `${category.name} - ` : ''}Over {total} places
              </h2>
              <div className='packages-header-controls'>
                <div className='packages-sort-dropdown'>
                  <button
                    className='packages-sort-button'
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  >
                    <Filter size={18} />
                    <span>Filters</span>
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
                      <div className='sort-dropdown-menu'>
                        <button
                          className={`sort-option ${
                            sortBy === 'created_at_asc' ? 'active' : ''
                          }`}
                          onClick={() => {
                            setSortBy('created_at_asc');
                            setPage(1);
                            setIsSortDropdownOpen(false);
                          }}
                        >
                          Ascending Order
                        </button>
                        <button
                          className={`sort-option ${
                            sortBy === 'created_at_desc' ? 'active' : ''
                          }`}
                          onClick={() => {
                            setSortBy('created_at_desc');
                            setPage(1);
                            setIsSortDropdownOpen(false);
                          }}
                        >
                          Descending Order
                        </button>
                        <button
                          className={`sort-option ${
                            sortBy === 'price_asc' ? 'active' : ''
                          }`}
                          onClick={() => {
                            setSortBy('price_asc');
                            setPage(1);
                            setIsSortDropdownOpen(false);
                          }}
                        >
                          Price Ascending
                        </button>
                        <button
                          className={`sort-option ${
                            sortBy === 'price_desc' ? 'active' : ''
                          }`}
                          onClick={() => {
                            setSortBy('price_desc');
                            setPage(1);
                            setIsSortDropdownOpen(false);
                          }}
                        >
                          Price Descending
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className='packages-view-toggle'>
                  <button
                    className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title='Grid View'
                  >
                    <Grid3x3 size={20} />
                  </button>
                  <button
                    className={`view-toggle-btn ${viewMode === 'row' ? 'active' : ''}`}
                    onClick={() => setViewMode('row')}
                    title='Row View'
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>
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
                  // Convert package name to slug
                  const packageSlug = pkg.package_name
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');

                  return (
                    <div
                      key={`${pkg.package_id}-${userLocation?.isIndia ? 'inr' : 'aed'}`}
                      className='package-card-wrapper'
                    >
                      <PackageCard
                        pkg={pkg}
                        slug={slug}
                        packageSlug={packageSlug}
                        isFavorite={favorites.has(pkg.package_id)}
                        onToggleFavorite={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(pkg.package_id);
                        }}
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
    </div>
  );
}

function PackageCard({
  pkg,
  slug,
  packageSlug,
  isFavorite,
  onToggleFavorite,
  userLocation,
}: {
  pkg: Package;
  slug: string;
  packageSlug: string;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  userLocation: UserLocation | null;
}) {
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

  // Helper function to format price based on region
  const formatPrice = (price: number | null): string => {
    if (!price) return 'N/A';

    // If location is not yet detected, show AED
    if (!userLocation) {
      console.log('PackageCard formatPrice: No userLocation, showing AED');
      return `AED ${price.toLocaleString()}`;
    }

    console.log(
      'PackageCard formatPrice: userLocation.isIndia =',
      userLocation.isIndia,
      'location:',
      userLocation
    );

    // Indian users always see INR, international users always see AED
    if (userLocation.isIndia) {
      const inrPrice = convertAEDToINR(price);
      return formatCurrency(inrPrice, userLocation);
    }

    return `AED ${price.toLocaleString()}`;
  };
  const rating = 99; // Mock rating - replace with actual data
  const reviewCount = 1004; // Mock review count - replace with actual data
  // Show "New" tag for recently created packages (within last 30 days)
  const isNew = pkg.created_at
    ? new Date().getTime() - new Date(pkg.created_at).getTime() <
      30 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className='package-card'>
      <div className='package-card-image'>
        {isNew && <div className='package-new-badge'>New</div>}
        {pkg.thumbnail_image && pkg.thumbnail_image.trim() ? (
          <img
            src={pkg.thumbnail_image}
            alt={pkg.package_name}
            className='package-card-thumbnail'
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
        <div className='package-image-dots'>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <button
          className={`package-favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={e => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
        >
          <Heart className={isFavorite ? 'filled' : ''} />
        </button>
      </div>
      <div className='package-card-content'>
        <h3 className='package-name'>{pkg.package_name}</h3>
        <div className='package-details'>
          {(() => {
            const locationText = getLocationText();
            return locationText ? (
              <span className='package-location'>{locationText}</span>
            ) : null;
          })()}
        </div>
        <div className='package-price'>
          from {formatPrice(pkg.package_price)}
        </div>
        <Link
          href={`/category/${slug}/${packageSlug}`}
          className='package-details-button'
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
