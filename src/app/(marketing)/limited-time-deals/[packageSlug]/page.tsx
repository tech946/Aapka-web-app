'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap, Minus, Plus, X, Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PackageGallery from '@/app/(marketing)/category/[slug]/[packageId]/PackageGallery';
import PackageDetailsTabs from '@/app/(marketing)/category/[slug]/[packageId]/PackageDetailsTabs';
import LimitedTimeDealCalendar from '@/components/marketing/LimitedTimeDealCalendar';
import '../../category/packages.css';
import '../../category/[slug]/[packageId]/package-details.css';

const BOOKING_FEE_AED = 1; // TODO: revert to 100 after testing

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
  const packageSlug = params?.packageSlug as string;

  const [deal, setDeal] = useState<LimitedTimeDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [leadPassenger, setLeadPassenger] = useState({
    salutation: 'Mr',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());
  const [persons, setPersons] = useState({ adult: 2, child: 0, infant: 0 });
  const [isSoloTraveller, setIsSoloTraveller] = useState(false);
  const [withVisa, setWithVisa] = useState(false);
  const [visaForAdults, setVisaForAdults] = useState(0);
  const [visaForChildren, setVisaForChildren] = useState(0);
  const [visaForInfants, setVisaForInfants] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const pkg = deal?.package;
  const bookingFeePerPerson = BOOKING_FEE_AED; // TODO: revert to `Number(deal?.booking_fee_aed) || BOOKING_FEE_AED` after testing
  const totalPersons = isSoloTraveller ? 1 : persons.adult + persons.child + persons.infant;
  const totalAmount = totalPersons * bookingFeePerPerson;

  const formatPrice = (price: number) => {
    return `AED ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const continueButtonLabel = `Continue – ${formatPrice(totalAmount)}`;

  useEffect(() => {
    if (withVisa) {
      setVisaForAdults(persons.adult);
      setVisaForChildren(persons.child);
      setVisaForInfants(persons.infant);
    }
  }, [withVisa, persons.adult, persons.child, persons.infant]);

  useEffect(() => {
    if (!showCalendar) return;
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);

  useEffect(() => {
    if (showModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
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
          const matchingDeal = deals.find(d => d.offer_package_id === foundPkg.package_id);
          if (matchingDeal) {
            setDeal({ ...matchingDeal, package: foundPkg });
            const start = new Date(matchingDeal.start_date);
            if (month < start) setMonth(start);
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

  const handleStep1Continue = () => {
    if (!deal || !pkg) return;
    if (!selectedDate) {
      toast.error('Please select a travel date');
      return;
    }
    const minAdults = pkg.min_adults ?? 2;
    if (!isSoloTraveller && persons.adult < minAdults) {
      toast.error(`Minimum ${minAdults} adults required`);
      return;
    }
    if (totalPersons === 0) {
      toast.error('Select at least one passenger');
      return;
    }
    setModalStep(2);
  };

  const handleProceedToPayment = async () => {
    if (!deal || !pkg || !selectedDate) return;
    const { salutation, firstName, lastName, email, phone, whatsapp } = leadPassenger;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !whatsapp.trim()) {
      toast.error('Please fill all required passenger details');
      return;
    }
    setIsSubmitting(true);
    try {

      const bookingRes = await fetch('/api/checkout-limited-time-deal/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limitedTimeDealId: deal.id,
          cartItems: [{
            packageId: pkg.package_id,
            adults: isSoloTraveller ? 1 : persons.adult,
            children: isSoloTraveller ? 0 : persons.child,
            infants: persons.infant,
            selectedDate: format(selectedDate, 'yyyy-MM-dd'),
            isSoloTraveller,
            withVisa,
            price: totalAmount,
          }],
          passengers: [{
            salutation,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            whatsapp: whatsapp.trim(),
          }],
          infantDocuments: [],
          paymentMethod: 'ccavenue',
          totalAmount,
          paymentType: 'full',
          paymentAmount: totalAmount,
          currency: 'AED',
        }),
      });

      const bookingResult = await bookingRes.json();
      if (!bookingRes.ok || !bookingResult.success) {
        throw new Error(bookingResult.error || 'Failed to create booking');
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const cancelUrl = `${origin}/limited-time-deals/${packageSlug}?error=payment_cancelled`;

      const orderRes = await fetch('/api/payments/ccavenue/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingResult.bookingId,
          amount: totalAmount,
          currency: 'AED',
          customerName: `${firstName} ${lastName}`.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          paymentType: 'full',
          cancelUrl,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = orderData.redirectUrl;
      const encInput = document.createElement('input');
      encInput.type = 'hidden';
      encInput.name = 'encRequest';
      encInput.value = orderData.encRequest;
      form.appendChild(encInput);
      const accessInput = document.createElement('input');
      accessInput.type = 'hidden';
      accessInput.name = 'access_code';
      accessInput.value = orderData.accessCode;
      form.appendChild(accessInput);
      document.body.appendChild(form);
      form.submit();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setShowCalendar(false);
    setModalStep(1);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalStep(1);
    setShowCalendar(false);
  };

  const updatePersonCount = (type: 'adult' | 'child' | 'infant', delta: number) => {
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
      <div className="package-details-page">
        <div className="package-details-loading">Loading...</div>
      </div>
    );
  }

  if (!deal || !pkg) {
    return (
      <div className="package-details-page">
        <div className="package-details-error">
          <h2>Deal or package not found</h2>
          <Link href="/limited-time-deals" className="back-button"><ArrowLeft /> Back to Limited Time Deals</Link>
        </div>
      </div>
    );
  }

  const images = (pkg.gallery?.length ? pkg.gallery : pkg.thumbnail_image ? [pkg.thumbnail_image] : []) as string[];

  return (
    <div className="package-details-page">
      <div className="package-hero-section">
        <PackageGallery images={images} packageName={pkg.package_name} />
        <div className="package-hero-details">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Zap size={20} style={{ color: '#fd6b06' }} />
            <span style={{ fontSize: 12, color: '#fd6b06', fontWeight: 600 }}>Limited Time Deal</span>
          </div>
          <h1 className="package-hero-title">{pkg.package_name}</h1>
          <div className="package-hero-pricing">
            <span className="package-hero-price-current">
              AED {bookingFeePerPerson.toLocaleString()} booking fee per person
            </span>
          </div>
          {pkg.package_description && <p className="package-hero-description">{pkg.package_description}</p>}
          <div className="package-hero-buttons">
            <button type="button" className="package-hero-add-to-cart-button" onClick={handleOpenModal}>
              Book Now
            </button>
          </div>
        </div>
      </div>
      <PackageDetailsTabs pkg={pkg} />

      {showModal && typeof window !== 'undefined' && createPortal(
        <div className="desktop-booking-modal-overlay" onClick={handleCloseModal}>
          <div
            className="desktop-booking-modal"
            onClick={e => e.stopPropagation()}
            style={{ width: 520, maxWidth: 'calc(100vw - 40px)' }}
          >
            <div className="desktop-booking-modal-header">
              <h3 className="desktop-booking-modal-title">
                {modalStep === 1 ? 'Select Date & Travellers' : 'Lead Passenger Details'}
              </h3>
              <button type="button" className="desktop-booking-modal-close" onClick={handleCloseModal} aria-label="Close">
                <X className="desktop-booking-modal-close-icon" size={20} />
              </button>
            </div>
            <div className="desktop-booking-modal-content" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
              {modalStep === 1 ? (
                <>
                  {/* Date dropdown */}
                  <div className="ltd-date-dropdown-wrapper" ref={calendarRef}>
                    <button
                      type="button"
                      className="ltd-date-dropdown-trigger"
                      onClick={() => setShowCalendar(prev => !prev)}
                    >
                      <Calendar size={18} className="ltd-date-icon" />
                      <span className={selectedDate ? 'ltd-date-value' : 'ltd-date-placeholder'}>
                        {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select travel date'}
                      </span>
                      <ChevronDown size={18} className={`ltd-date-chevron ${showCalendar ? 'ltd-date-chevron-open' : ''}`} />
                    </button>
                    {showCalendar && (
                      <div className="ltd-date-calendar-dropdown">
                        <LimitedTimeDealCalendar
                          dealId={deal.id}
                          startDate={deal.start_date}
                          endDate={deal.end_date}
                          selectedDate={selectedDate}
                          onDateSelect={d => {
                            setSelectedDate(d);
                            setShowCalendar(false);
                          }}
                          month={month}
                          onMonthChange={setMonth}
                        />
                      </div>
                    )}
                  </div>

                  {pkg.solo_traveller_enabled && (
                    <div className="solo-traveller-block">
                      <label className="solo-checkbox">
                        <input
                          type="checkbox"
                          checked={isSoloTraveller}
                          onChange={e => {
                            const v = e.target.checked;
                            setIsSoloTraveller(v);
                            if (v) {
                              setPersons({ adult: 1, child: 0, infant: 0 });
                              setVisaForAdults(0);
                              setVisaForChildren(0);
                              setVisaForInfants(0);
                              setWithVisa(false);
                            } else {
                              setPersons(prev => ({ ...prev, adult: pkg.min_adults ?? 2 }));
                            }
                          }}
                        />
                        Solo Traveller {pkg.solo_traveller_price != null ? `(AED ${pkg.solo_traveller_price.toLocaleString()})` : ''}
                      </label>
                    </div>
                  )}

                  {pkg.with_visa && (
                    <div className="visa-option-block">
                      <label className="visa-checkbox">
                        <input
                          type="checkbox"
                          checked={withVisa}
                          onChange={e => {
                            const v = e.target.checked;
                            setWithVisa(v);
                            if (v) {
                              setVisaForAdults(persons.adult);
                              setVisaForChildren(persons.child);
                              setVisaForInfants(persons.infant);
                            } else {
                              setVisaForAdults(0);
                              setVisaForChildren(0);
                              setVisaForInfants(0);
                            }
                          }}
                        />
                        With Visa (Indian passport Holder)
                      </label>
                    </div>
                  )}

                  <div className="ltd-person-counters">
                    <div className="person-counter-row">
                      <span className="person-label">Adult <span className="person-age-info">(8+ years)</span></span>
                      <div className="person-counter">
                        <button type="button" className="counter-button" onClick={() => updatePersonCount('adult', -1)} disabled={isSoloTraveller || persons.adult <= (pkg.min_adults ?? 2)}>
                          <Minus className="counter-icon" size={18} />
                        </button>
                        <span className="counter-value">{persons.adult}</span>
                        <button type="button" className="counter-button" onClick={() => updatePersonCount('adult', 1)} disabled={isSoloTraveller}>
                          <Plus className="counter-icon" size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="person-counter-row">
                      <span className="person-label">Child <span className="person-age-info">(3-8 years)</span></span>
                      <div className="person-counter">
                        <button type="button" className="counter-button" onClick={() => updatePersonCount('child', -1)} disabled={isSoloTraveller || persons.child === 0}>
                          <Minus className="counter-icon" size={18} />
                        </button>
                        <span className="counter-value">{persons.child}</span>
                        <button type="button" className="counter-button" onClick={() => updatePersonCount('child', 1)} disabled={isSoloTraveller}>
                          <Plus className="counter-icon" size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="person-counter-row">
                      <span className="person-label">Infant <span className="person-age-info">(0-2 years)</span></span>
                      <div className="person-counter">
                        <button type="button" className="counter-button" onClick={() => updatePersonCount('infant', -1)} disabled={persons.infant === 0}>
                          <Minus className="counter-icon" size={18} />
                        </button>
                        <span className="counter-value">{persons.infant}</span>
                        <button type="button" className="counter-button" onClick={() => updatePersonCount('infant', 1)}>
                          <Plus className="counter-icon" size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price summary */}
                  <div className="ltd-price-summary">
                    <span>Booking Fee</span>
                    <strong>{formatPrice(totalAmount)}</strong>
                    <span className="ltd-price-breakdown">
                      ({totalPersons} {totalPersons === 1 ? 'person' : 'persons'} × AED {bookingFeePerPerson})
                    </span>
                  </div>
                </>
              ) : (
                <div className="input-selectors" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="booking-input-wrapper">
                    <label>Salutation *</label>
                    <select
                      value={leadPassenger.salutation}
                      onChange={e => setLeadPassenger(p => ({ ...p, salutation: e.target.value }))}
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>
                  <div className="booking-input-wrapper">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={leadPassenger.firstName}
                      onChange={e => setLeadPassenger(p => ({ ...p, firstName: e.target.value }))}
                      placeholder="First name"
                    />
                  </div>
                  <div className="booking-input-wrapper">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={leadPassenger.lastName}
                      onChange={e => setLeadPassenger(p => ({ ...p, lastName: e.target.value }))}
                      placeholder="Last name"
                    />
                  </div>
                  <div className="booking-input-wrapper">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={leadPassenger.email}
                      onChange={e => setLeadPassenger(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                    />
                  </div>
                  <div className="booking-input-wrapper">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      value={leadPassenger.phone}
                      onChange={e => setLeadPassenger(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone"
                    />
                  </div>
                  <div className="booking-input-wrapper">
                    <label>WhatsApp *</label>
                    <input
                      type="tel"
                      value={leadPassenger.whatsapp}
                      onChange={e => setLeadPassenger(p => ({ ...p, whatsapp: e.target.value }))}
                      placeholder="WhatsApp number"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="ltd-modal-footer">
              <button
                type="button"
                onClick={modalStep === 1 ? handleCloseModal : () => setModalStep(1)}
                className="pdf-modal-cancel-button"
                style={{ flex: 1 }}
              >
                {modalStep === 1 ? 'Cancel' : 'Back'}
              </button>
              {modalStep === 1 ? (
                <button
                  type="button"
                  onClick={handleStep1Continue}
                  className="booking-add-to-cart-button"
                  disabled={!selectedDate}
                  style={{ flex: 1 }}
                >
                  {continueButtonLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="booking-add-to-cart-button"
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                >
                  {isSubmitting ? 'Processing...' : `Proceed to Payment – ${formatPrice(totalAmount)}`}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
