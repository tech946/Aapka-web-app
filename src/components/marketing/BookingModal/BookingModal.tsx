'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { X, Users, Calendar, ChevronDown, Plus, Minus } from 'lucide-react';
import { AddonsSection } from '@/components/marketing/AddonsModal/AddonsSection';
import { DayPicker } from 'react-day-picker';
import { format, startOfDay } from 'date-fns';
import { FlexibleDateCalendar } from '@/components/marketing/FlexibleDateCalendar';
import { parseDateStringToLocal } from '@/lib/utils';
import { shouldShowOptionalVisaInBookingModal } from '@/lib/package-visa';
import {
  getTourFixedBookingDates,
  getTourWeekendRangeCalendarBounds,
  hasTourFixedBookingDates,
} from '@/lib/package-config';
import { getSurchargeAmountForDate } from '@/lib/surcharge-master';
import { MarinaAddonsSection } from '@/components/marketing/MarinaAddonsSection/MarinaAddonsSection';
import type { MarinaAddon } from '@/lib/marina-cruise-config';
import { getMarinaCruiseCalendarBounds } from '@/lib/marina-cruise-config';
import './booking-modal.css';

function calendarMonthKey(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

function BookingInlineMonthCaption({
  calendarMonth,
  setMonth,
  weekendRangeCalendarBounds,
  navButtonClass,
}: {
  calendarMonth: { date: Date };
  setMonth: (value: Date) => void;
  weekendRangeCalendarBounds: ReturnType<
    typeof getTourWeekendRangeCalendarBounds
  >;
  navButtonClass: string;
}) {
  const displayMonth = calendarMonth.date;
  const prevMonth = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth() - 1,
    1
  );
  const nextMonth = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth() + 1,
    1
  );

  const canGoPrev = weekendRangeCalendarBounds
    ? calendarMonthKey(prevMonth) >=
      calendarMonthKey(weekendRangeCalendarBounds.fromMonth)
    : true;

  const canGoNext = weekendRangeCalendarBounds
    ? calendarMonthKey(nextMonth) <=
      calendarMonthKey(weekendRangeCalendarBounds.toMonth)
    : true;

  return (
    <div
      className='booking-inline-month-caption'
      onClick={e => e.stopPropagation()}
    >
      <button
        type='button'
        className={navButtonClass}
        aria-label='Previous month'
        disabled={!canGoPrev}
        style={{
          opacity: canGoPrev ? 1 : 0.35,
          cursor: canGoPrev ? 'pointer' : 'not-allowed',
        }}
        onClick={e => {
          e.stopPropagation();
          if (canGoPrev) setMonth(prevMonth);
        }}
      >
        ‹
      </button>
      <span className='booking-inline-month-caption-label'>
        {format(displayMonth, 'MMMM yyyy')}
      </span>
      <button
        type='button'
        className={navButtonClass}
        aria-label='Next month'
        disabled={!canGoNext}
        style={{
          opacity: canGoNext ? 1 : 0.35,
          cursor: canGoNext ? 'pointer' : 'not-allowed',
        }}
        onClick={e => {
          e.stopPropagation();
          if (canGoNext) setMonth(nextMonth);
        }}
      >
        ›
      </button>
    </div>
  );
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  // Package data
  pkg: any;
  slug: string;
  // Solo traveller
  soloTravellerEnabled: boolean;
  isSoloTraveller: boolean;
  setIsSoloTraveller: (value: boolean) => void;
  soloTravellerGender: 'male' | 'female' | null;
  setSoloTravellerGender: (value: 'male' | 'female' | null) => void;
  soloTravellerShareConsent: boolean;
  setSoloTravellerShareConsent: (value: boolean) => void;
  // Visa
  withVisa: boolean;
  setWithVisa: (value: boolean) => void;
  visaForAdults: number;
  setVisaForAdults: (value: number) => void;
  visaForChildren: number;
  setVisaForChildren: (value: number) => void;
  visaForInfants: number;
  setVisaForInfants: (value: number) => void;
  // Persons
  persons: { adult: number; child: number; infant: number };
  setPersons: (value: { adult: number; child: number; infant: number }) => void;
  updatePersonCount: (type: 'adult' | 'child' | 'infant', delta: number) => void;
  getPersonsDisplayText: () => string;
  // Date selection
  selectedDate: Date | undefined;
  setSelectedDate: (value: Date | undefined) => void;
  selectedDateString: string;
  handleDateStringSelect: (dateStr: string) => void;
  handleDateSelect: (date: Date | undefined) => void;
  month: Date;
  setMonth: (value: Date) => void;
  // Dropdowns
  showPersonsDropdown: boolean;
  setShowPersonsDropdown: (value: boolean) => void;
  showDateDropdown: boolean;
  setShowDateDropdown: (value: boolean) => void;
  showDatePicker: boolean;
  setShowDatePicker: (value: boolean) => void;
  // Refs
  personsDropdownRef: React.RefObject<HTMLDivElement | null>;
  dateDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  // Helpers
  isPackageType: () => boolean;
  getAvailableDates: () => string[];
  getDisabledDates: (date: Date) => boolean;
  getPricesForDate: () => { adultPrice: number; childPrice: number; infantPrice: number; soloTravellerPrice?: number | null };
  formatPrice: (price: number | null) => string;
  getOriginalPrice: () => number | null;
  // State
  calculatedPrice: number | null;
  isDiscountActive: boolean;
  hasActiveAgentSubscription: boolean;
  agentDiscountAmount: number | null;
  priceBeforeAgentDiscount: number | null;
  loading: boolean;
  dateRangesReady: boolean;
  // Actions
  handleAddToCart: () => void;
  // Add-ons (offer packages only)
  showAddons?: boolean;
  addonDeals?: string[];
  addonHotelServices?: string[];
  addonPrivateTransfers?: string[];
  onAddonDealsChange?: (ids: string[]) => void;
  onAddonHotelServicesChange?: (ids: string[]) => void;
  onAddonPrivateTransfersChange?: (ids: string[]) => void;
  /** Toggle handlers use functional updates to avoid stale state when rapidly clicking */
  onToggleAddonDeal?: (id: string) => void;
  onToggleAddonHotelService?: (id: string) => void;
  onToggleAddonPrivateTransfer?: (id: string) => void;
  addonNights?: number;
  /** Date-range surcharges (offer packages) */
  surcharges?: Array<{ id: string; price: number; from_date: string; to_date: string }>;
  selectedDateSurcharge?: number;
  /** Override primary CTA label (e.g. Register for marina registration-only) */
  primaryActionLabel?: string;
  /** Show per-person unit prices above total (marina registration) */
  showUnitPriceBreakdown?: boolean;
  unitPriceLabelPrefix?: string;
  /** Marina cruise add-ons from package JSONB */
  marinaAddons?: MarinaAddon[];
  selectedMarinaAddons?: string[];
  onToggleMarinaAddon?: (id: string) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  isMobile,
  pkg,
  slug,
  soloTravellerEnabled,
  isSoloTraveller,
  setIsSoloTraveller,
  soloTravellerGender,
  setSoloTravellerGender,
  soloTravellerShareConsent,
  setSoloTravellerShareConsent,
  withVisa,
  setWithVisa,
  visaForAdults,
  setVisaForAdults,
  visaForChildren,
  setVisaForChildren,
  visaForInfants,
  setVisaForInfants,
  persons,
  setPersons,
  updatePersonCount,
  getPersonsDisplayText,
  selectedDate,
  setSelectedDate,
  selectedDateString,
  handleDateStringSelect,
  handleDateSelect,
  month,
  setMonth,
  showPersonsDropdown,
  setShowPersonsDropdown,
  showDateDropdown,
  setShowDateDropdown,
  showDatePicker,
  setShowDatePicker,
  personsDropdownRef,
  dateDropdownRef,
  datePickerRef,
  isPackageType,
  getAvailableDates,
  getDisabledDates,
  getPricesForDate,
  formatPrice,
  getOriginalPrice,
  calculatedPrice,
  isDiscountActive,
  hasActiveAgentSubscription,
  agentDiscountAmount,
  priceBeforeAgentDiscount,
  loading,
  dateRangesReady,
  handleAddToCart,
  showAddons = false,
  addonDeals = [],
  addonHotelServices = [],
  addonPrivateTransfers = [],
  onAddonDealsChange,
  onAddonHotelServicesChange,
  onAddonPrivateTransfersChange,
  onToggleAddonDeal,
  onToggleAddonHotelService,
  onToggleAddonPrivateTransfer,
  addonNights = 0,
  surcharges = [],
  selectedDateSurcharge = 0,
  primaryActionLabel = 'Add to Cart',
  showUnitPriceBreakdown = false,
  unitPriceLabelPrefix,
  marinaAddons = [],
  selectedMarinaAddons = [],
  onToggleMarinaAddon,
}: BookingModalProps) {
  const isMarinaCruise = slug === 'marina-cruise-dinner';

  const marinaCalendarBounds = useMemo(() => {
    if (!isMarinaCruise || !pkg) return null;
    return getMarinaCruiseCalendarBounds(
      pkg.booking_days,
      pkg.bookable_dates,
      new Date(),
      pkg.excluded_dates
    );
  }, [isMarinaCruise, pkg?.booking_days, pkg?.bookable_dates, pkg?.excluded_dates]);

  useEffect(() => {
    if (!isOpen || !isMarinaCruise || !marinaCalendarBounds) return;
    const key = calendarMonthKey(month);
    const from = calendarMonthKey(marinaCalendarBounds.fromMonth);
    const to = calendarMonthKey(marinaCalendarBounds.toMonth);
    if (key < from) setMonth(marinaCalendarBounds.fromMonth);
    else if (key > to) setMonth(marinaCalendarBounds.toMonth);
  }, [
    isOpen,
    isMarinaCruise,
    marinaCalendarBounds,
    month,
    setMonth,
  ]);

  useEffect(() => {
    if (!isOpen || !isMobile || !showDatePicker || !datePickerRef.current) return;
    const timer = window.setTimeout(() => {
      datePickerRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [isOpen, isMobile, showDatePicker]);

  if (!isOpen) return null;

  const showVisaOption = shouldShowOptionalVisaInBookingModal(slug, pkg);
  const fixedTourDates = getTourFixedBookingDates(pkg?.package_id);
  const usesFixedTourDates = hasTourFixedBookingDates(pkg?.package_id);
  const weekendRangeCalendarBounds = getTourWeekendRangeCalendarBounds(
    pkg?.package_id
  );
  const calendarBounds = isMarinaCruise
    ? marinaCalendarBounds
    : weekendRangeCalendarBounds;

  const calendarClassName = [
    isMobile
      ? 'mobile-custom-calendar booking-modal-calendar'
      : 'custom-calendar booking-modal-calendar',
    slug === 'marina-cruise-dinner' ? 'marina-cruise-calendar' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const marinaHideToday = isMarinaCruise ? startOfDay(new Date()) : undefined;

  const calendarNavButtonClass = isMobile
    ? 'mobile-calendar-nav-button'
    : 'calendar-nav-button';

  const formatFixedTourDateLabel = (dateStr: string) => {
    const parsed = parseDateStringToLocal(dateStr);
    return parsed ? format(parsed, 'd MMMM') : dateStr;
  };

  const selectedFixedTourDateLabel = selectedDate
    ? format(selectedDate, 'd MMMM')
    : fixedTourDates?.[0]
      ? formatFixedTourDateLabel(fixedTourDates[0])
      : '';

  const modalClass = [
    isMobile ? 'mobile-booking-modal' : 'desktop-booking-modal',
    showDateDropdown ? 'booking-dates-dropdown-active' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const overlayClass = isMobile ? 'mobile-booking-modal-overlay' : 'desktop-booking-modal-overlay';
  const headerClass = isMobile ? 'mobile-booking-modal-header' : 'desktop-booking-modal-header';
  const titleClass = isMobile ? 'mobile-booking-modal-title' : 'desktop-booking-modal-title';
  const closeClass = isMobile ? 'mobile-booking-modal-close' : 'desktop-booking-modal-close';
  const contentClass = isMobile ? 'mobile-booking-modal-content' : 'desktop-booking-modal-content';
  const priceSectionClass = isMobile ? 'mobile-booking-price-section' : 'booking-price-section';
  const inputSelectorsClass = isMobile ? 'mobile-input-selectors' : 'input-selectors';
  const actionsClass = isMobile ? 'mobile-booking-actions' : 'booking-actions';
  const addToCartButtonClass = isMobile ? 'mobile-booking-add-to-cart-button' : 'booking-add-to-cart-button';

  const handleSoloTravellerChange = (checked: boolean) => {
    const wasVisaSelected = withVisa;
    setIsSoloTraveller(checked);
    setSoloTravellerShareConsent(false);
    setSoloTravellerGender(null);
    if (checked) {
      setPersons({ adult: 1, child: 0, infant: 0 });
      setShowPersonsDropdown(false);
      if (wasVisaSelected) {
        setVisaForAdults(1);
        setVisaForChildren(0);
        setVisaForInfants(0);
      } else {
        setWithVisa(false);
        setVisaForAdults(0);
        setVisaForChildren(0);
        setVisaForInfants(0);
      }
    } else {
      const isOfferPackage = slug === 'offer-packages';
      const isFlexibleDatePackage = slug === 'flexible-date-packages';
      const newAdultCount = (isOfferPackage || isFlexibleDatePackage) ? 2 : 1;
      setPersons({
        adult: newAdultCount,
        child: 0,
        infant: 0,
      });
      if (wasVisaSelected) {
        setVisaForAdults(newAdultCount);
        setVisaForChildren(0);
        setVisaForInfants(0);
      }
    }
  };

  const handleVisaChange = (checked: boolean) => {
    setWithVisa(checked);
    if (!checked) {
      setVisaForAdults(0);
      setVisaForChildren(0);
      setVisaForInfants(0);
    } else {
      if (isSoloTraveller) {
        setVisaForAdults(1);
        setVisaForChildren(0);
        setVisaForInfants(0);
      } else {
        setVisaForAdults(persons.adult);
        setVisaForChildren(persons.child);
        setVisaForInfants(persons.infant);
      }
    }
  };

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        <div className={headerClass}>
          <h3 className={titleClass}>Booking Details</h3>
          <button className={closeClass} onClick={onClose} aria-label='Close booking modal'>
            <X className={isMobile ? 'close-icon' : 'desktop-booking-modal-close-icon'} />
          </button>
        </div>
        <div className={contentClass}>
          {/* Solo Traveller */}
          {soloTravellerEnabled && (
            <div className='solo-traveller-block'>
              <label className='solo-checkbox'>
                <input
                  type='checkbox'
                  checked={isSoloTraveller}
                  onChange={e => handleSoloTravellerChange(e.target.checked)}
                />
                Solo Traveller (AED{' '}
                {(() => {
                  if (slug === 'flexible-date-packages') {
                    const prices = getPricesForDate();
                    const soloPrice = prices.soloTravellerPrice ?? prices.adultPrice ?? pkg.package_price;
                    return formatPrice(soloPrice).replace('AED ', '').trim();
                  }
                  return formatPrice(pkg.solo_traveller_price || pkg.package_price).replace('AED ', '').trim();
                })()}
                )
              </label>

              {isSoloTraveller && (
                <div className='solo-options'>
                  <div className='solo-gender-pills'>
                    <button
                      className={`solo-pill ${soloTravellerGender === 'male' ? 'active' : ''}`}
                      onClick={() => setSoloTravellerGender('male')}
                    >
                      Male
                    </button>
                    <button
                      className={`solo-pill ${soloTravellerGender === 'female' ? 'active' : ''}`}
                      onClick={() => setSoloTravellerGender('female')}
                    >
                      Female
                    </button>
                  </div>
                  <label className='solo-consent'>
                    <input
                      type='checkbox'
                      checked={soloTravellerShareConsent}
                      onChange={e => setSoloTravellerShareConsent(e.target.checked)}
                    />
                    {`I am comfortable to share the room with ${
                      soloTravellerGender === 'female' ? 'female' : 'male'
                    } passengers`}
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Visa add-on: only when backend enables (with_visa) and at least one visa price is greater than 0 AED */}
          {showVisaOption && (
            <div className='visa-option-block'>
              <label className='visa-checkbox'>
                <input type='checkbox' checked={withVisa} onChange={e => handleVisaChange(e.target.checked)} />
                With Visa (Indian passport Holder)
              </label>

              {withVisa && (
                <div className='visa-options'>
                  {(isSoloTraveller ? 1 : persons.adult) > 0 && (
                    <div className='visa-counter-row'>
                      <span className='visa-counter-label'>
                        Visa for Adults ({isSoloTraveller ? 1 : persons.adult})
                      </span>
                      <div className='visa-counter-controls'>
                        <button
                          className='visa-counter-button'
                          onClick={() => {
                            if (isSoloTraveller) return;
                            setVisaForAdults(Math.max(0, visaForAdults - 1));
                          }}
                          disabled={visaForAdults === 0 || (isSoloTraveller && visaForAdults === 1)}
                        >
                          <Minus size={14} style={{ color: '#fd6b06' }} />
                        </button>
                        <span className='visa-counter-value'>{visaForAdults}</span>
                        <button
                          className='visa-counter-button'
                          onClick={() => {
                            if (isSoloTraveller) return;
                            setVisaForAdults(Math.min(persons.adult, visaForAdults + 1));
                          }}
                          disabled={visaForAdults >= (isSoloTraveller ? 1 : persons.adult)}
                        >
                          <Plus size={14} style={{ color: '#fd6b06' }} />
                        </button>
                      </div>
                    </div>
                  )}
                  {persons.child > 0 && (
                    <div className='visa-counter-row'>
                      <span className='visa-counter-label'>Visa for Children ({persons.child})</span>
                      <div className='visa-counter-controls'>
                        <button
                          className='visa-counter-button'
                          onClick={() => setVisaForChildren(Math.max(0, visaForChildren - 1))}
                          disabled={visaForChildren === 0}
                        >
                          <Minus size={14} style={{ color: '#fd6b06' }} />
                        </button>
                        <span className='visa-counter-value'>{visaForChildren}</span>
                        <button
                          className='visa-counter-button'
                          onClick={() => setVisaForChildren(Math.min(persons.child, visaForChildren + 1))}
                          disabled={visaForChildren >= persons.child}
                        >
                          <Plus size={14} style={{ color: '#fd6b06' }} />
                        </button>
                      </div>
                    </div>
                  )}
                  {persons.infant > 0 && (
                    <div className='visa-counter-row'>
                      <span className='visa-counter-label'>Visa for Infants ({persons.infant})</span>
                      <div className='visa-counter-controls'>
                        <button
                          className='visa-counter-button'
                          onClick={() => setVisaForInfants(Math.max(0, visaForInfants - 1))}
                          disabled={visaForInfants === 0}
                        >
                          <Minus size={14} style={{ color: '#fd6b06' }} />
                        </button>
                        <span className='visa-counter-value'>{visaForInfants}</span>
                        <button
                          className='visa-counter-button'
                          onClick={() => setVisaForInfants(Math.min(persons.infant, visaForInfants + 1))}
                          disabled={visaForInfants >= persons.infant}
                        >
                          <Plus size={14} style={{ color: '#fd6b06' }} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Input Selectors */}
          <div
            className={`${inputSelectorsClass}${showDatePicker ? (isMobile ? ' mobile-date-picker-open' : ' booking-date-picker-open') : ''}${showDateDropdown ? (isMobile ? ' mobile-dates-dropdown-open' : ' booking-dates-dropdown-open') : ''}`}
          >
            {/* Persons Selector */}
            <div
              className={isMobile ? 'mobile-booking-input-wrapper booking-modal-field' : 'booking-input-wrapper booking-modal-field'}
              ref={personsDropdownRef}
            >
              <Users className={isMobile ? 'mobile-booking-input-icon' : 'booking-input-icon'} />
              <input
                type='text'
                placeholder='Persons'
                className={isMobile ? 'mobile-booking-input' : 'booking-input'}
                value={getPersonsDisplayText()}
                readOnly
                disabled={isSoloTraveller && !isMobile}
                onClick={() => !isSoloTraveller && setShowPersonsDropdown(!showPersonsDropdown)}
              />
              <ChevronDown className={isMobile ? 'mobile-booking-dropdown-chevron' : 'booking-dropdown-chevron'} />
              {showPersonsDropdown && (
                <div className={isMobile ? 'mobile-booking-persons-dropdown' : 'booking-persons-dropdown'}>
                  <div className={isMobile ? 'mobile-person-counter-row' : 'person-counter-row'}>
                    <span className={isMobile ? 'mobile-person-label' : 'person-label'}>
                      Adult <span className='person-age-info'>(8+ years)</span>
                    </span>
                    <div className={isMobile ? 'mobile-person-counter' : 'person-counter'}>
                      <button
                        className={isMobile ? 'mobile-counter-button' : 'counter-button'}
                        onClick={() => updatePersonCount('adult', -1)}
                        disabled={
                          isSoloTraveller
                            ? true
                            : slug === 'offer-packages' || slug === 'flexible-date-packages'
                              ? persons.adult <= 2
                              : persons.adult <= 1
                        }
                      >
                        <Minus className={isMobile ? 'mobile-counter-icon' : 'counter-icon'} />
                      </button>
                      <span className={isMobile ? 'mobile-counter-value' : 'counter-value'}>{persons.adult}</span>
                      <button
                        className={isMobile ? 'mobile-counter-button' : 'counter-button'}
                        onClick={() => updatePersonCount('adult', 1)}
                        disabled={isSoloTraveller}
                      >
                        <Plus className={isMobile ? 'mobile-counter-icon' : 'counter-icon'} />
                      </button>
                    </div>
                  </div>
                  <div className={isMobile ? 'mobile-person-counter-row' : 'person-counter-row'}>
                    <span className={isMobile ? 'mobile-person-label' : 'person-label'}>
                      Child <span className='person-age-info'>(3-8 years)</span>
                    </span>
                    <div className={isMobile ? 'mobile-person-counter' : 'person-counter'}>
                      <button
                        className={isMobile ? 'mobile-counter-button' : 'counter-button'}
                        onClick={() => updatePersonCount('child', -1)}
                        disabled={isSoloTraveller || persons.child === 0}
                      >
                        <Minus className={isMobile ? 'mobile-counter-icon' : 'counter-icon'} />
                      </button>
                      <span className={isMobile ? 'mobile-counter-value' : 'counter-value'}>{persons.child}</span>
                      <button
                        className={isMobile ? 'mobile-counter-button' : 'counter-button'}
                        onClick={() => updatePersonCount('child', 1)}
                        disabled={isSoloTraveller}
                      >
                        <Plus className={isMobile ? 'mobile-counter-icon' : 'counter-icon'} />
                      </button>
                    </div>
                  </div>
                  <div className={isMobile ? 'mobile-person-counter-row' : 'person-counter-row'}>
                    <span className={isMobile ? 'mobile-person-label' : 'person-label'}>
                      Infant <span className='person-age-info'>(0-2 years)</span>
                    </span>
                    <div className={isMobile ? 'mobile-person-counter' : 'person-counter'}>
                      <button
                        className={isMobile ? 'mobile-counter-button' : 'counter-button'}
                        onClick={() => updatePersonCount('infant', -1)}
                        disabled={isSoloTraveller || persons.infant === 0}
                      >
                        <Minus className={isMobile ? 'mobile-counter-icon' : 'counter-icon'} />
                      </button>
                      <span className={isMobile ? 'mobile-counter-value' : 'counter-value'}>{persons.infant}</span>
                      <button
                        className={isMobile ? 'mobile-counter-button' : 'counter-button'}
                        onClick={() => updatePersonCount('infant', 1)}
                        disabled={isSoloTraveller}
                      >
                        <Plus className={isMobile ? 'mobile-counter-icon' : 'counter-icon'} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Date Picker / Calendar */}
            {usesFixedTourDates && fixedTourDates ? (
              <div
                className={
                  isMobile
                    ? 'mobile-booking-input-wrapper booking-modal-field'
                    : 'booking-input-wrapper booking-modal-field'
                }
                ref={dateDropdownRef}
              >
                <Calendar
                  className={
                    isMobile ? 'mobile-booking-input-icon' : 'booking-input-icon'
                  }
                />
                <input
                  type='text'
                  readOnly
                  aria-label='Tour date'
                  className={isMobile ? 'mobile-booking-input' : 'booking-input'}
                  value={selectedFixedTourDateLabel}
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                />
                <ChevronDown
                  className={
                    isMobile
                      ? 'mobile-booking-dropdown-chevron'
                      : 'booking-dropdown-chevron'
                  }
                />
                {showDateDropdown && (
                  <div
                    className={
                      isMobile
                        ? 'mobile-booking-dates-dropdown'
                        : 'booking-dates-dropdown'
                    }
                    onWheel={e => e.stopPropagation()}
                    onTouchMove={e => e.stopPropagation()}
                  >
                    {fixedTourDates.map(dateStr => (
                      <div
                        key={dateStr}
                        className={
                          isMobile
                            ? 'mobile-booking-date-item'
                            : 'booking-date-item'
                        }
                        onClick={e => {
                          e.stopPropagation();
                          const parsed = parseDateStringToLocal(dateStr);
                          if (parsed) {
                            handleDateSelect(parsed);
                          }
                          setShowDateDropdown(false);
                        }}
                      >
                        <span>{formatFixedTourDateLabel(dateStr)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isPackageType() ? (
              <div
                className={isMobile ? 'mobile-booking-input-wrapper booking-modal-field' : 'booking-input-wrapper booking-modal-field'}
                ref={dateDropdownRef}
              >
                <Calendar className={isMobile ? 'mobile-booking-input-icon' : 'booking-input-icon'} />
                <input
                  type='text'
                  placeholder={getAvailableDates().length === 0 ? 'No dates available' : 'Select date'}
                  className={isMobile ? 'mobile-booking-input' : 'booking-input'}
                  value={
                    selectedDateString
                      ? (() => {
                          const d = parseDateStringToLocal(selectedDateString);
                          return d ? format(d, slug === 'flexible-date-packages' ? 'MMM dd, yyyy hh:mm a' : 'MMM dd, yyyy') : '';
                        })()
                      : ''
                  }
                  readOnly
                  disabled={getAvailableDates().length === 0}
                  onClick={() => {
                    if (getAvailableDates().length > 0) {
                      setShowDateDropdown(!showDateDropdown);
                    }
                  }}
                />
                <ChevronDown className={isMobile ? 'mobile-booking-dropdown-chevron' : 'booking-dropdown-chevron'} />
                {showDateDropdown && getAvailableDates().length > 0 && (
                  <div
                    className={isMobile ? 'mobile-booking-dates-dropdown' : 'booking-dates-dropdown'}
                    onWheel={e => e.stopPropagation()}
                    onTouchMove={e => e.stopPropagation()}
                  >
                    {getAvailableDates().map((dateStr, idx) => {
                      const dateSurcharge = getSurchargeAmountForDate(dateStr, surcharges);
                      return (
                      <div
                        key={idx}
                        className={isMobile ? 'mobile-booking-date-item' : 'booking-date-item'}
                        onClick={e => {
                          e.stopPropagation();
                          handleDateStringSelect(dateStr);
                        }}
                      >
                        <div className='booking-date-item-row'>
                          <span>
                            {(() => {
                              const d = parseDateStringToLocal(dateStr);
                              return d ? format(d, slug === 'flexible-date-packages' ? 'MMM dd, yyyy hh:mm a' : 'MMM dd, yyyy') : dateStr;
                            })()}
                          </span>
                          {dateSurcharge > 0 && (
                            <span className='date-surcharge-badge'>
                              +AED {dateSurcharge.toFixed(0)} surcharge
                            </span>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
                {selectedDateSurcharge > 0 && (
                  <span className='date-surcharge-badge date-surcharge-badge-inline'>
                    Surcharge +AED {selectedDateSurcharge.toFixed(2)}
                  </span>
                )}
              </div>
            ) : (
              <div
                className={
                  isMobile
                    ? `mobile-booking-input-wrapper booking-modal-field${showDatePicker ? ' mobile-booking-date-picker-open' : ''}`
                    : `booking-input-wrapper booking-modal-field${showDatePicker ? ' booking-date-picker-open' : ''}`
                }
                ref={datePickerRef}
              >
                <div className='booking-modal-field-row'>
                  <Calendar className={isMobile ? 'mobile-booking-input-icon' : 'booking-input-icon'} />
                  <input
                    type='text'
                    placeholder='Add dates'
                    className={isMobile ? 'mobile-booking-input' : 'booking-input'}
                    value={selectedDate ? format(selectedDate, slug === 'flexible-date-packages' ? 'MMM dd, yyyy hh:mm a' : 'MMM dd, yyyy') : ''}
                    readOnly
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  />
                </div>
                {showDatePicker && (
                  <div
                    className={isMobile ? 'mobile-booking-calendar-dropdown' : 'booking-calendar-dropdown'}
                    onClick={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                  >
                    {slug === 'flexible-date-packages' && !loading && dateRangesReady && pkg && pkg.package_id && pkg.date_ranges && Array.isArray(pkg.date_ranges) && pkg.date_ranges.length > 0 ? (
                      <FlexibleDateCalendar
                        key={`${isMobile ? 'mobile' : 'desktop'}-calendar-${pkg.package_id}-${pkg.date_ranges.length}-${dateRangesReady}`}
                        packageId={pkg.package_id}
                        endDate={pkg.end_date || undefined}
                        dateRanges={pkg.date_ranges}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        month={month}
                        onMonthChange={setMonth}
                      />
                    ) : (
                      <>
                        <DayPicker
                          mode='single'
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          disabled={getDisabledDates}
                          numberOfMonths={1}
                          showOutsideDays={!isMarinaCruise}
                          month={month}
                          onMonthChange={setMonth}
                          fromMonth={calendarBounds?.fromMonth}
                          toMonth={calendarBounds?.toMonth}
                          className={calendarClassName}
                          modifiers={
                            marinaHideToday
                              ? { marinaToday: marinaHideToday }
                              : undefined
                          }
                          modifiersClassNames={{
                            disabled: 'rdp-day_unavailable',
                            ...(isMarinaCruise ? { marinaToday: 'rdp-day_hidden' } : {}),
                          }}
                          components={{
                            Nav: () => <></>,
                            MonthCaption: captionProps => (
                              <BookingInlineMonthCaption
                                calendarMonth={captionProps.calendarMonth}
                                setMonth={setMonth}
                                weekendRangeCalendarBounds={calendarBounds}
                                navButtonClass={calendarNavButtonClass}
                              />
                            ),
                          }}
                        />
                        {isMobile && (
                          <div className='mobile-calendar-footer'>
                            <button
                              className='mobile-clear-dates-button'
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedDate(undefined);
                              }}
                            >
                              Clear dates
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {slug === 'offer-packages' && (
              <div className='booking-flexible-date-link-wrap'>
                <Link href='/travel-enquiry' className='booking-flexible-date-link'>
                  Looking for flexible date package?
                </Link>
              </div>
            )}
          </div>

          {/* Add-ons (Offer Packages only) - shown after date selector */}
          {showAddons && onAddonDealsChange && onAddonHotelServicesChange && onAddonPrivateTransfersChange && (
            <AddonsSection
              selectedDeals={addonDeals}
              selectedServices={addonHotelServices}
              selectedTransfers={addonPrivateTransfers}
              onSelectDeals={onAddonDealsChange}
              onSelectServices={onAddonHotelServicesChange}
              onSelectTransfers={onAddonPrivateTransfersChange}
              onToggleDeal={onToggleAddonDeal}
              onToggleService={onToggleAddonHotelService}
              onToggleTransfer={onToggleAddonPrivateTransfer}
              nights={addonNights}
              isMobile={isMobile}
            />
          )}

          {/* Marina cruise add-ons */}
          {slug === 'marina-cruise-dinner' &&
            marinaAddons.length > 0 &&
            onToggleMarinaAddon && (
              <MarinaAddonsSection
                addons={marinaAddons}
                selectedIds={selectedMarinaAddons}
                onToggle={onToggleMarinaAddon}
                adults={isSoloTraveller ? 1 : persons.adult}
                children={isSoloTraveller ? 0 : persons.child}
              />
            )}

          {/* Price Section */}
          <div className={priceSectionClass}>
            {showUnitPriceBreakdown && (() => {
              const prices = getPricesForDate();
              const prefix = unitPriceLabelPrefix ? `${unitPriceLabelPrefix} ` : '';
              const marinaAddonRows =
                slug === 'marina-cruise-dinner' && selectedMarinaAddons.length > 0
                  ? marinaAddons.filter(a => selectedMarinaAddons.includes(a.id))
                  : [];
              const adults = isSoloTraveller ? 1 : persons.adult;
              const children = isSoloTraveller ? 0 : persons.child;
              return (
                <div className='booking-unit-price-breakdown'>
                  {prices.adultPrice > 0 && persons.adult > 0 && (
                    <div className={`${isMobile ? 'mobile-booking-price-row' : 'booking-price-row'} booking-unit-price-row`}>
                      <span className={isMobile ? 'mobile-booking-price-label' : 'booking-price-label'}>
                        {prefix}Adult × {persons.adult}
                      </span>
                      <span className={isMobile ? 'mobile-booking-price-amount' : 'booking-price-amount'}>
                        {formatPrice(prices.adultPrice * persons.adult)}
                      </span>
                    </div>
                  )}
                  {prices.childPrice > 0 && persons.child > 0 && (
                    <div className={`${isMobile ? 'mobile-booking-price-row' : 'booking-price-row'} booking-unit-price-row`}>
                      <span className={isMobile ? 'mobile-booking-price-label' : 'booking-price-label'}>
                        {prefix}Child × {persons.child}
                      </span>
                      <span className={isMobile ? 'mobile-booking-price-amount' : 'booking-price-amount'}>
                        {formatPrice(prices.childPrice * persons.child)}
                      </span>
                    </div>
                  )}
                  {marinaAddonRows.map(addon => {
                    const lineTotal =
                      (Number(addon.adult_price) || 0) * adults +
                      (Number(addon.child_price) || 0) * children;
                    if (lineTotal <= 0) return null;
                    return (
                      <div
                        key={addon.id}
                        className={`${isMobile ? 'mobile-booking-price-row' : 'booking-price-row'} booking-unit-price-row`}
                      >
                        <span className={isMobile ? 'mobile-booking-price-label' : 'booking-price-label'}>
                          {addon.name}
                        </span>
                        <span className={isMobile ? 'mobile-booking-price-amount' : 'booking-price-amount'}>
                          {formatPrice(lineTotal)}
                        </span>
                      </div>
                    );
                  })}
                  {(prices.adultPrice > 0 || prices.childPrice > 0 || marinaAddonRows.length > 0) && (
                    <div className='booking-unit-price-divider' />
                  )}
                </div>
              );
            })()}
            {hasActiveAgentSubscription && agentDiscountAmount && agentDiscountAmount > 0 && priceBeforeAgentDiscount && (
              <>
                <span className={`${isMobile ? 'mobile-booking-price-original' : 'booking-price-original'} agent-discount-original`}>
                  {formatPrice(priceBeforeAgentDiscount)}
                </span>
                <div className='agent-discount-badge-container'>
                  <span className='agent-discount-badge'>
                    Premium Partner Discount
                    <span className='agent-discount-badge-amount'>
                      -{formatPrice(agentDiscountAmount).replace('AED ', '')}
                    </span>
                  </span>
                </div>
              </>
            )}
            {isDiscountActive && getOriginalPrice() !== calculatedPrice && !(hasActiveAgentSubscription && agentDiscountAmount && agentDiscountAmount > 0) && (
              <span className={`${isMobile ? 'mobile-booking-price-original' : 'booking-price-original'} agent-discount-original`}>
                {formatPrice(getOriginalPrice())}
              </span>
            )}
            <div className={`${isMobile ? 'mobile-booking-price-row' : 'booking-price-row'}`}>
              <span className={isMobile ? 'mobile-booking-price-label' : 'booking-price-label'}>
                TOTAL
              </span>
              <span className={`${isMobile ? 'mobile-booking-price-amount' : 'booking-price-amount'} ${isDiscountActive || (hasActiveAgentSubscription && agentDiscountAmount && agentDiscountAmount > 0) ? 'discounted' : ''}`}>
                {formatPrice(calculatedPrice !== null ? calculatedPrice : pkg.package_price || 0)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={actionsClass}>
            <button onClick={handleAddToCart} className={addToCartButtonClass}>
              {primaryActionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
