'use client';

import type { CSSProperties } from 'react';
import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Zap,
  Minus,
  Plus,
  X,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import PackageGallery from '@/app/(marketing)/category/[slug]/[packageId]/PackageGallery';
import PackageDetailsTabs from '@/app/(marketing)/category/[slug]/[packageId]/PackageDetailsTabs';
import LimitedTimeDealCalendar from '@/components/marketing/LimitedTimeDealCalendar';
import { useCart, type CartItemStorage } from '@/context/CartContext';
import {
  getOfferPackageTravelDates,
  getOfferPackageTravelDatesStatus,
} from '@/lib/offer-package-dates';
import { getSurchargeAmountForDate } from '@/lib/surcharge-master';
import { useSurchargeMaster } from '@/hooks/use-marketing-queries';
import '../../category/packages.css';
import '../../category/[slug]/[packageId]/package-details.css';

function formatAedAmount(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Package hero pricing: same layout as package details (main total + Adult / Child / Infant grid). */
function LtdPackagePricingDisplay({ pkg }: { pkg: Package }) {
  const adultP = Number(pkg.adult_price) || 0;
  const childP = Number(pkg.child_price) || 0;
  const infantP = Number(pkg.infant_price) || 0;
  const packagePrice = Number(pkg.package_price) || 0;
  const soloP =
    pkg.solo_traveller_price != null ? Number(pkg.solo_traveller_price) : 0;

  const hasBreakdown = adultP > 0 || childP > 0 || infantP > 0;
  const hasSolo = Boolean(pkg.solo_traveller_enabled && soloP > 0);

  if (!hasBreakdown && !packagePrice && !hasSolo) return null;

  /* Package-only SKU: single headline price, no duplicate row in the grid */
  if (!hasBreakdown && !hasSolo && packagePrice > 0) {
    return (
      <div className='package-hero-pricing'>
        <span className='package-hero-price-current'>
          {formatAedAmount(packagePrice)}
        </span>
      </div>
    );
  }

  const minAdults = Math.max(1, pkg.min_adults ?? 2);
  const mainFromAdults = adultP > 0 ? adultP * minAdults : 0;
  const mainAmount =
    packagePrice > 0
      ? packagePrice
      : mainFromAdults > 0
        ? mainFromAdults
        : hasSolo
          ? soloP
          : 0;

  return (
    <>
      {mainAmount > 0 && (
        <div className='package-hero-pricing'>
          <span className='package-hero-price-current'>
            {formatAedAmount(mainAmount)}
          </span>
        </div>
      )}
      <div className='package-hero-price-breakdown'>
        {adultP > 0 && (
          <div className='package-hero-price-item'>
            <span className='package-hero-price-item-label'>Adult</span>
            <span className='package-hero-price-item-age'>12+ Years</span>
            <span className='package-hero-price-item-amount'>
              {formatAedAmount(adultP)}
            </span>
          </div>
        )}
        {childP > 0 && (
          <div className='package-hero-price-item'>
            <span className='package-hero-price-item-label'>Child</span>
            <span className='package-hero-price-item-age'>2-8 Years</span>
            <span className='package-hero-price-item-amount'>
              {formatAedAmount(childP)}
            </span>
          </div>
        )}
        {infantP > 0 && (
          <div className='package-hero-price-item'>
            <span className='package-hero-price-item-label'>Infant</span>
            <span className='package-hero-price-item-age'>&lt; 2 Years</span>
            <span className='package-hero-price-item-amount'>
              {formatAedAmount(infantP)}
            </span>
          </div>
        )}
        {hasSolo && (
          <div className='package-hero-price-item'>
            <span className='package-hero-price-item-label'>
              Solo Traveller
            </span>
            <span className='package-hero-price-item-age'>
              Double/Triple occupancy
            </span>
            <span className='package-hero-price-item-amount'>
              {formatAedAmount(soloP)}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

interface Package {
  package_id: string;
  package_name: string;
  package_description: string | null;
  package_price?: number | null;
  adult_price: number | null;
  child_price: number | null;
  infant_price: number | null;
  solo_traveller_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  min_adults?: number | null;
  with_visa?: boolean | null;
  adult_visa_price?: number | null;
  child_visa_price?: number | null;
  infant_visa_price?: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  travel_dates?: Array<{ id: string; value: string }> | string[] | null;
  thumbnail_image?: string | null;
  gallery?: string[] | null;
  terms_html?: string | null;
  inclusion_html?: string | null;
  exclusion_html?: string | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  itinerary?: Array<{ heading: string; desc: string }> | null;
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

export default function LimitedTimeDealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const packageSlug = params?.packageSlug as string;

  const [deal, setDeal] = useState<LimitedTimeDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());
  const [persons, setPersons] = useState({ adult: 2, child: 0, infant: 0 });
  const [isSoloTraveller, setIsSoloTraveller] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDateRequiredError, setShowDateRequiredError] = useState(false);
  const dateTriggerRef = useRef<HTMLDivElement>(null);
  const calendarPopoverRef = useRef<HTMLDivElement>(null);
  const [calendarPopoverStyle, setCalendarPopoverStyle] =
    useState<CSSProperties>({});

  const pkg = deal?.package;
  const availableTravelDates = useMemo(
    () => getOfferPackageTravelDates(pkg?.travel_dates),
    [pkg?.travel_dates]
  );
  const travelDatesStatus = useMemo(
    () => getOfferPackageTravelDatesStatus(pkg?.travel_dates),
    [pkg?.travel_dates]
  );
  const { data: surchargeMaster = [] } = useSurchargeMaster();
  const selectedTravelDateStr = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : null;
  const selectedDateSurcharge = useMemo(
    () => getSurchargeAmountForDate(selectedTravelDateStr, surchargeMaster),
    [selectedTravelDateStr, surchargeMaster]
  );

  const calculatedPrice = useMemo(() => {
    if (!pkg) return 0;
    if (isSoloTraveller && pkg.solo_traveller_enabled) {
      const solo =
        Number(pkg.solo_traveller_price) ||
        Number(pkg.adult_price) ||
        Number(pkg.package_price) ||
        0;
      return solo + selectedDateSurcharge;
    }
    const adultP = Number(pkg.adult_price) || 0;
    const childP = Number(pkg.child_price) || 0;
    const infantP = Number(pkg.infant_price) || 0;
    let total =
      persons.adult * adultP +
      persons.child * childP +
      persons.infant * infantP;
    if (
      total === 0 &&
      !adultP &&
      !childP &&
      !infantP &&
      pkg.package_price
    ) {
      total = Number(pkg.package_price) || 0;
    }
    return total + selectedDateSurcharge;
  }, [pkg, persons, isSoloTraveller, selectedDateSurcharge]);

  const formatPrice = (price: number) => formatAedAmount(price);

  const updateCalendarPopoverPosition = useCallback(() => {
    const el = dateTriggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, 300);
    const maxH = Math.min(
      420,
      typeof window !== 'undefined' ? window.innerHeight - r.bottom - 24 : 420
    );
    let left = r.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    setCalendarPopoverStyle({
      position: 'fixed',
      top: r.bottom + 6,
      left,
      width,
      maxHeight: maxH,
      zIndex: 10050,
    });
  }, []);

  useLayoutEffect(() => {
    if (!showCalendar) return;
    updateCalendarPopoverPosition();
    const onReposition = () => updateCalendarPopoverPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [showCalendar, updateCalendarPopoverPosition]);

  useEffect(() => {
    if (!showCalendar) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dateTriggerRef.current?.contains(t)) return;
      if (calendarPopoverRef.current?.contains(t)) return;
      setShowCalendar(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);

  useEffect(() => {
    if (showModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showModal]);

  useEffect(() => {
    const fetchData = async () => {
      if (!packageSlug) return;
      try {
        const [dealsRes, pkgRes] = await Promise.all([
          fetch('/api/limited-time-deals'),
          fetch(`/api/packages/${packageSlug}`),
        ]);
        const dealsJson = await dealsRes.json();
        const pkgJson = await pkgRes.json();

        const deals: LimitedTimeDeal[] = dealsJson.data || [];
        const foundPkg = pkgJson.data;

        if (foundPkg) {
          const matchingDeal = deals.find(
            d => d.offer_package_id === foundPkg.package_id
          );
          if (matchingDeal) {
            setDeal({ ...matchingDeal, package: foundPkg });
            const travelDates = getOfferPackageTravelDates(foundPkg.travel_dates);
            if (travelDates.length > 0) {
              setMonth(startOfMonth(parseISO(travelDates[0])));
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [packageSlug]);

  const handleAddToCart = () => {
    if (!deal || !pkg) return;
    if (!selectedDate) {
      setShowDateRequiredError(true);
      toast.error('Please select a travel date before continuing.');
      return;
    }
    setShowDateRequiredError(false);
    const minAdults = pkg.min_adults ?? 2;
    if (!isSoloTraveller && persons.adult < minAdults) {
      toast.error(`Minimum ${minAdults} adults required`);
      return;
    }
    const totalPassengers = isSoloTraveller
      ? 1
      : persons.adult + persons.child + persons.infant;
    if (totalPassengers === 0) {
      toast.error('Select at least one passenger');
      return;
    }

    const cartItem: CartItemStorage = {
      packageId: pkg.package_id,
      packageSlug,
      categorySlug: 'offer-packages',
      adults: isSoloTraveller ? 1 : persons.adult,
      children: isSoloTraveller ? 0 : persons.child,
      infants: isSoloTraveller ? 0 : persons.infant,
      selectedDate: format(selectedDate, 'yyyy-MM-dd'),
      isSoloTraveller,
      withVisa: false,
    };

    addToCart(cartItem);
    toast.success('Package added to cart!');
    setShowModal(false);
    router.push('/checkout');
  };

  const handleOpenModal = () => {
    setShowDateRequiredError(false);
    setShowModal(true);
    setShowCalendar(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowCalendar(false);
    setShowDateRequiredError(false);
  };

  const updatePersonCount = (
    type: 'adult' | 'child' | 'infant',
    delta: number
  ) => {
    const minAdults = pkg?.min_adults ?? 2;
    setPersons(prev => {
      let v = prev[type] + delta;
      if (type === 'adult' && v < minAdults) v = minAdults;
      if (v < 0) v = 0;
      return { ...prev, [type]: v };
    });
  };

  if (loading) {
    return (
      <div className='package-details-page'>
        <div className='package-details-loading'>Loading...</div>
      </div>
    );
  }

  if (!deal || !pkg) {
    return (
      <div className='package-details-page'>
        <div className='package-details-error'>
          <h2>Deal or package not found</h2>
          <Link href='/limited-time-deals' className='back-button'>
            <ArrowLeft /> Back to Limited Time Deals
          </Link>
        </div>
      </div>
    );
  }

  const images = (
    pkg.gallery?.length
      ? pkg.gallery
      : pkg.thumbnail_image
        ? [pkg.thumbnail_image]
        : []
  ) as string[];

  return (
    <div className='package-details-page'>
      <div className='package-hero-section'>
        <PackageGallery images={images} packageName={pkg.package_name} />
        <div className='package-hero-details'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Zap size={20} style={{ color: '#fd6b06' }} />
            <span style={{ fontSize: 12, color: '#fd6b06', fontWeight: 600 }}>
              Limited Time Deal
            </span>
          </div>
          <h1 className='package-hero-title'>{pkg.package_name}</h1>
          <LtdPackagePricingDisplay pkg={pkg} />
          {pkg.package_description && (
            <p className='package-hero-description'>
              {pkg.package_description}
            </p>
          )}
          <div className='package-hero-buttons'>
            <button
              type='button'
              className='package-hero-add-to-cart-button'
              onClick={handleOpenModal}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
      <PackageDetailsTabs pkg={pkg} sanitizeOccupancyCopy />

      {showModal &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className='desktop-booking-modal-overlay'
            onClick={handleCloseModal}
          >
            <div
              className='desktop-booking-modal'
              onClick={e => e.stopPropagation()}
              style={{ width: 520, maxWidth: 'calc(100vw - 40px)' }}
            >
              <div className='desktop-booking-modal-header'>
                <h3 className='desktop-booking-modal-title'>
                  Select Date & Travellers
                </h3>
                <button
                  type='button'
                  className='desktop-booking-modal-close'
                  onClick={handleCloseModal}
                  aria-label='Close'
                >
                  <X className='desktop-booking-modal-close-icon' size={20} />
                </button>
              </div>
              <div
                className='desktop-booking-modal-content'
                style={{
                  overflow: 'visible',
                  maxHeight: 'calc(100vh - 120px)',
                }}
              >
                    {/* Date field — calendar opens in a fixed portal (true dropdown), not inline */}
                    <div className='ltd-date-dropdown-wrapper'>
                      <div ref={dateTriggerRef}>
                        <button
                          type='button'
                          className={`ltd-date-dropdown-trigger${showDateRequiredError ? ' ltd-date-dropdown-trigger--error' : ''}`}
                          onClick={() => setShowCalendar(prev => !prev)}
                        >
                          <Calendar size={18} className='ltd-date-icon' />
                          <span
                            className={
                              selectedDate
                                ? 'ltd-date-value'
                                : 'ltd-date-placeholder'
                            }
                          >
                            {selectedDate
                              ? format(selectedDate, 'dd MMM yyyy')
                              : 'Select travel date'}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`ltd-date-chevron ${showCalendar ? 'ltd-date-chevron-open' : ''}`}
                          />
                        </button>
                        {selectedDateSurcharge > 0 && (
                          <span className='date-surcharge-badge date-surcharge-badge-inline'>
                            Surcharge +AED {selectedDateSurcharge.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    {showCalendar &&
                      typeof window !== 'undefined' &&
                      createPortal(
                        <div
                          ref={calendarPopoverRef}
                          className='ltd-date-calendar-popover'
                          style={calendarPopoverStyle}
                          role='dialog'
                          aria-label='Choose travel date'
                        >
                          <LimitedTimeDealCalendar
                            dealId={deal.id}
                            availableDates={availableTravelDates}
                            travelDatesStatus={travelDatesStatus}
                            selectedDate={selectedDate}
                            onDateSelect={d => {
                              setSelectedDate(d);
                              setShowDateRequiredError(false);
                              setShowCalendar(false);
                            }}
                            month={month}
                            onMonthChange={setMonth}
                          />
                        </div>,
                        document.body
                      )}

                    {showDateRequiredError && (
                      <p className='ltd-date-required-msg' role='alert'>
                        Please select a travel date to continue.
                      </p>
                    )}

                    {pkg.solo_traveller_enabled && (
                      <div className='solo-traveller-block'>
                        <label className='solo-checkbox'>
                          <input
                            type='checkbox'
                            checked={isSoloTraveller}
                            onChange={e => {
                              const v = e.target.checked;
                              setIsSoloTraveller(v);
                              if (v) {
                                setPersons({ adult: 1, child: 0, infant: 0 });
                              } else {
                                setPersons(prev => ({
                                  ...prev,
                                  adult: pkg.min_adults ?? 2,
                                }));
                              }
                            }}
                          />
                          Solo Traveller{' '}
                          {pkg.solo_traveller_price != null
                            ? `(AED ${pkg.solo_traveller_price.toLocaleString()})`
                            : ''}
                        </label>
                      </div>
                    )}

                    <div className='ltd-person-counters'>
                      <div className='person-counter-row'>
                        <span className='person-label'>
                          Adult{' '}
                          <span className='person-age-info'>(12+ years)</span>
                        </span>
                        <div className='person-counter'>
                          <button
                            type='button'
                            className='counter-button'
                            onClick={() => updatePersonCount('adult', -1)}
                            disabled={
                              isSoloTraveller ||
                              persons.adult <= (pkg.min_adults ?? 2)
                            }
                          >
                            <Minus className='counter-icon' size={18} />
                          </button>
                          <span className='counter-value'>{persons.adult}</span>
                          <button
                            type='button'
                            className='counter-button'
                            onClick={() => updatePersonCount('adult', 1)}
                            disabled={isSoloTraveller}
                          >
                            <Plus className='counter-icon' size={18} />
                          </button>
                        </div>
                      </div>
                      <div className='person-counter-row'>
                        <span className='person-label'>
                          Child{' '}
                          <span className='person-age-info'>(2-8 years)</span>
                        </span>
                        <div className='person-counter'>
                          <button
                            type='button'
                            className='counter-button'
                            onClick={() => updatePersonCount('child', -1)}
                            disabled={isSoloTraveller || persons.child === 0}
                          >
                            <Minus className='counter-icon' size={18} />
                          </button>
                          <span className='counter-value'>{persons.child}</span>
                          <button
                            type='button'
                            className='counter-button'
                            onClick={() => updatePersonCount('child', 1)}
                            disabled={isSoloTraveller}
                          >
                            <Plus className='counter-icon' size={18} />
                          </button>
                        </div>
                      </div>
                      <div className='person-counter-row'>
                        <span className='person-label'>
                          Infant{' '}
                          <span className='person-age-info'>
                            (&lt; 2 years)
                          </span>
                        </span>
                        <div className='person-counter'>
                          <button
                            type='button'
                            className='counter-button'
                            onClick={() => updatePersonCount('infant', -1)}
                            disabled={persons.infant === 0}
                          >
                            <Minus className='counter-icon' size={18} />
                          </button>
                          <span className='counter-value'>
                            {persons.infant}
                          </span>
                          <button
                            type='button'
                            className='counter-button'
                            onClick={() => updatePersonCount('infant', 1)}
                          >
                            <Plus className='counter-icon' size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className='booking-price-section'>
                      <div className='booking-price-row'>
                        <span className='booking-price-label'>TOTAL</span>
                        <span className='booking-price-amount'>
                          {formatPrice(calculatedPrice)}
                        </span>
                      </div>
                    </div>
              </div>
              <div className='ltd-modal-footer'>
                <button
                  type='button'
                  onClick={handleCloseModal}
                  className='pdf-modal-cancel-button'
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleAddToCart}
                  className='booking-add-to-cart-button'
                  style={{ flex: 1 }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
