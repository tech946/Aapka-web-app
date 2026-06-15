'use client';

import Link from 'next/link';
import { X, Users, Calendar, ChevronDown, Plus, Minus } from 'lucide-react';
import { AddonsSection } from '@/components/marketing/AddonsModal/AddonsSection';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { FlexibleDateCalendar } from '@/components/marketing/FlexibleDateCalendar';
import { parseDateStringToLocal } from '@/lib/utils';
import { shouldShowOptionalVisaInBookingModal } from '@/lib/package-visa';
import { getTourFixedBookingDates, getTourWeekendMonthRule, hasTourFixedBookingDates } from '@/lib/package-config';
import { getSurchargeAmountForDate } from '@/lib/surcharge-master';
import './booking-modal.css';

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
}: BookingModalProps) {
  if (!isOpen) return null;

  const showVisaOption = shouldShowOptionalVisaInBookingModal(slug, pkg);
  const fixedTourDates = getTourFixedBookingDates(pkg?.package_id);
  const usesFixedTourDates = hasTourFixedBookingDates(pkg?.package_id);
  const weekendMonthRule = getTourWeekendMonthRule(pkg?.package_id);
  const weekendMonthCalendarBounds = weekendMonthRule
    ? {
        fromMonth: new Date(weekendMonthRule.year, weekendMonthRule.month - 1, 1),
        toMonth: new Date(weekendMonthRule.year, weekendMonthRule.month - 1, 1),
      }
    : null;

  const formatFixedTourDateLabel = (dateStr: string) => {
    const parsed = parseDateStringToLocal(dateStr);
    return parsed ? format(parsed, 'd MMMM') : dateStr;
  };

  const selectedFixedTourDateLabel = selectedDate
    ? format(selectedDate, 'd MMMM')
    : fixedTourDates?.[0]
      ? formatFixedTourDateLabel(fixedTourDates[0])
      : '';

  const modalClass = isMobile ? 'mobile-booking-modal' : 'desktop-booking-modal';
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
          <div className={inputSelectorsClass}>
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
                  <div className={isMobile ? 'mobile-booking-dates-dropdown' : 'booking-dates-dropdown'}>
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
                className={isMobile ? 'mobile-booking-input-wrapper booking-modal-field' : 'booking-input-wrapper booking-modal-field'}
                ref={datePickerRef}
              >
                <Calendar className={isMobile ? 'mobile-booking-input-icon' : 'booking-input-icon'} />
                <input
                  type='text'
                  placeholder='Add dates'
                  className={isMobile ? 'mobile-booking-input' : 'booking-input'}
                  value={selectedDate ? format(selectedDate, slug === 'flexible-date-packages' ? 'MMM dd, yyyy hh:mm a' : 'MMM dd, yyyy') : ''}
                  readOnly
                  onClick={() => setShowDatePicker(!showDatePicker)}
                />
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
                        {isMobile && (
                          <div className='mobile-calendar-header-nav'>
                            <button
                              className='mobile-calendar-nav-button'
                              onClick={e => {
                                e.stopPropagation();
                                const newMonth = new Date(month);
                                newMonth.setMonth(newMonth.getMonth() - 1);
                                setMonth(newMonth);
                              }}
                            >
                              ‹
                            </button>
                            <button
                              className='mobile-calendar-nav-button'
                              onClick={e => {
                                e.stopPropagation();
                                const newMonth = new Date(month);
                                newMonth.setMonth(newMonth.getMonth() + 1);
                                setMonth(newMonth);
                              }}
                            >
                              ›
                            </button>
                          </div>
                        )}
                        <DayPicker
                          mode='single'
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          disabled={getDisabledDates}
                          numberOfMonths={1}
                          showOutsideDays={true}
                          month={month}
                          onMonthChange={setMonth}
                          fromMonth={weekendMonthCalendarBounds?.fromMonth}
                          toMonth={weekendMonthCalendarBounds?.toMonth}
                          className={isMobile ? 'mobile-custom-calendar' : 'custom-calendar'}
                          modifiersClassNames={{
                            disabled: 'rdp-day_unavailable',
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

          {/* Price Section */}
          <div className={priceSectionClass}>
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
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
