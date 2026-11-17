'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import LimitedTimeDealCalendar from '@/components/marketing/LimitedTimeDealCalendar';
import { useBooking, type BookingRequest } from '@/context/BookingContext';
import {
  getOfferPackageTravelDates,
  getOfferPackageTravelDatesStatus,
} from '@/lib/offer-package-dates';
import { useAgentStatus } from '@/hooks/use-marketing-queries';
import { applyAgentDiscount, getAgentDiscountPercentage } from '@/lib/agent-discount';
import { replaceLtdOccupancyPhrases } from '@/lib/ltd-copy';
import { getPackageGalleryImages } from '@/lib/package-gallery';
import { parseDateStringToLocal } from '@/lib/utils';
import { LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';
import { inclusionsOf } from '@/components/site/listing/listing-data';
import PdpShell from '@/components/site/pdp/PdpShell';
import PdpState from '@/components/site/pdp/PdpState';
import {
  BkCard,
  BkCheck,
  BkDateField,
  BkFlexLink,
  BkFoot,
  BkPersons,
  BkPrice,
  BkStep,
  BkTrust,
  buildQuote,
  offLabel,
} from '@/components/site/pdp/booking';
import { durationLabel, money } from '@/components/site/pdp/pdp-data';
import BookingWizard from '@/components/site/pdp/BookingWizard';
import { useDateList, useDealSoldOut } from '@/components/site/pdp/wizard-dates';

/** Solo-only packages take a single traveller: no adult/child/infant choice,
    no min_adults floor, and only the solo price is ever shown. */
function isSoloOnlyPackage(
  pkg: Pick<Package, 'solo_traveller_enabled' | 'solo_traveller_only'> | null | undefined
) {
  return Boolean(pkg?.solo_traveller_only && pkg?.solo_traveller_enabled);
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
  solo_traveller_only?: boolean | null;
  min_adults?: number | null;
  with_visa?: boolean | null;
  adult_visa_price?: number | null;
  child_visa_price?: number | null;
  infant_visa_price?: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  agent_discount?: number | null;
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
  const { startBooking } = useBooking();
  const packageSlug = params?.packageSlug as string;

  const [deal, setDeal] = useState<LimitedTimeDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());
  const [persons, setPersons] = useState({ adult: 2, child: 0, infant: 0 });
  const [isSoloTraveller, setIsSoloTraveller] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const pkg = deal?.package;
  const soloOnly = isSoloOnlyPackage(pkg);
  const availableTravelDates = useMemo(
    () => getOfferPackageTravelDates(pkg?.travel_dates),
    [pkg?.travel_dates]
  );
  const travelDatesStatus = useMemo(
    () => getOfferPackageTravelDatesStatus(pkg?.travel_dates),
    [pkg?.travel_dates]
  );
  const { data: agentData } = useAgentStatus();
  const agentDiscount = getAgentDiscountPercentage(
    pkg,
    !!agentData?.hasActiveSubscription
  );
  /* Date surcharges were removed from offer-package pricing (LTDs are offer
     packages), so nothing is added to the total here. */

  const calculatedPrice = useMemo(() => {
    if (!pkg) return 0;
    if ((isSoloTraveller || soloOnly) && pkg.solo_traveller_enabled) {
      const solo =
        Number(pkg.solo_traveller_price) ||
        Number(pkg.adult_price) ||
        Number(pkg.package_price) ||
        0;
      return solo;
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
    return total;
  }, [pkg, persons, isSoloTraveller, soloOnly]);

  /* Solo-only packages have no traveller choice: the booking is always one
     solo traveller, so lock the state as soon as the package resolves. */
  useEffect(() => {
    if (!soloOnly) return;
    setIsSoloTraveller(true);
    setPersons({ adult: 1, child: 0, infant: 0 });
  }, [soloOnly]);

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

  /** Checks the deal and hands it to checkout; false (with a toast) when something is missing. */
  const prepareBooking = (): boolean => {
    if (!deal || !pkg) return false;
    if (!selectedDate) {
      toast.error('Please select a travel date before continuing.');
      return false;
    }
    const minAdults = pkg.min_adults ?? 2;
    if (!soloOnly && !isSoloTraveller && persons.adult < minAdults) {
      toast.error(`Minimum ${minAdults} adults required`);
      return false;
    }
    const totalPassengers =
      soloOnly || isSoloTraveller
        ? 1
        : persons.adult + persons.child + persons.infant;
    if (totalPassengers === 0) {
      toast.error('Select at least one passenger');
      return false;
    }

    const bookingRequest: BookingRequest = {
      packageId: pkg.package_id,
      packageSlug,
      categorySlug: 'offer-packages',
      adults: soloOnly || isSoloTraveller ? 1 : persons.adult,
      children: soloOnly || isSoloTraveller ? 0 : persons.child,
      infants: soloOnly || isSoloTraveller ? 0 : persons.infant,
      selectedDate: format(selectedDate, 'yyyy-MM-dd'),
      isSoloTraveller: soloOnly || isSoloTraveller,
      withVisa: false,
    };

    startBooking(bookingRequest);
    return true;
  };

  /** Book now: this one booking, straight to checkout (the deal
      page's original single action). */
  const handleBookNow = () => {
    if (prepareBooking()) router.push('/checkout');
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

  // Book now modal: the deal calendar's days (listed dates minus sold-out ones)
  const dealDates = useDateList(availableTravelDates);
  const dealSoldOut = useDealSoldOut(deal?.id);

  if (loading) return <PdpState loading />;

  if (!deal || !pkg) {
    return (
      <PdpState
        title='Deal not found'
        backHref={holidaysHref(LIMITED_DEALS.key)}
        backLabel='Back to limited time deals'
      />
    );
  }

  const images = getPackageGalleryImages(pkg.gallery, pkg.thumbnail_image);
  const duration = durationLabel(pkg.package_days, pkg.package_nights);
  const solo = (isSoloTraveller || soloOnly) && !!pkg.solo_traveller_enabled;
  const adultP = Number(pkg.adult_price) || 0;
  const childP = Number(pkg.child_price) || 0;
  const infantP = Number(pkg.infant_price) || 0;
  const soloP =
    Number(pkg.solo_traveller_price) ||
    adultP ||
    Number(pkg.package_price) ||
    0;
  const quote = buildQuote({
    solo,
    persons,
    prices: { adultPrice: adultP, childPrice: childP, infantPrice: infantP, soloTravellerPrice: soloP },
    packagePrice: !adultP && !childP && !infantP ? Number(pkg.package_price) || 0 : null,
    pct: agentDiscount,
    pctLabel: agentDiscount ? `Agent discount (${agentDiscount}%)` : null,
    // the deal page showed agent prices discounted, as AgentDiscountPrice does
    total: agentDiscount
      ? (applyAgentDiscount(calculatedPrice, agentDiscount) as number)
      : calculatedPrice,
  });

  const endsOn = parseDateStringToLocal(deal.end_date);
  const endsLabel = endsOn ? format(endsOn, 'd MMM') : '';
  const minAdults = pkg.min_adults ?? 2;

  const whatsappText = `Hi, I have a question about the limited time deal on ${pkg.package_name}${duration ? ` (${duration})` : ''}.`;
  const issue = !selectedDate ? 'Select your travel date' : null;

  // solo traveller choice, shared by the card and the Book now modal
  const soloStep =
    pkg.solo_traveller_enabled ? (
      <BkStep label='Travelling'>
        <BkCheck
          label={soloOnly ? 'Solo traveller · 1 person' : 'Solo traveller'}
          price={soloP ? money(soloP) : undefined}
          checked={solo}
          locked={soloOnly}
          onChange={v => {
            setIsSoloTraveller(v);
            if (v) setPersons({ adult: 1, child: 0, infant: 0 });
            else setPersons(prev => ({ ...prev, adult: minAdults }));
          }}
        />
      </BkStep>
    ) : null;

  const booking = (
    <BkCard
      head={
        <BkPrice
          now={quote.now || null}
          strike={quote.strike}
          off={offLabel(quote.now, quote.strike)}
          basis={quote.basis}
        />
      }
      foot={
        <BkFoot
          total={quote.total}
          travellers={quote.travellers}
          lines={quote.lines}
          savings={quote.savings}
          issue={issue}
          onBook={handleBookNow}
        />
      }
    >
      {soloStep}

      <BkStep label={soloOnly ? 'Date' : 'Travellers & date'}>
        {soloOnly ? null : (
          <BkPersons
            disabled={isSoloTraveller}
            onStep={updatePersonCount}
            rows={[
              { id: 'adult', label: 'Adult', hint: adultP ? `12+ years · ${money(adultP)}` : '12+ years', value: persons.adult, min: minAdults },
              { id: 'child', label: 'Child', hint: childP ? `2–8 years · ${money(childP)}` : '2–8 years', value: persons.child, min: 0 },
              { id: 'infant', label: 'Infant', hint: infantP ? `Under 2 · ${money(infantP)}` : 'Under 2', value: persons.infant, min: 0 },
            ]}
          />
        )}
        <BkDateField
          value={selectedDate ? format(selectedDate, 'EEE, d MMM yyyy') : ''}
          placeholder='Select travel date'
          open={showCalendar}
          onOpenChange={setShowCalendar}
        >
          <LimitedTimeDealCalendar
            dealId={deal.id}
            availableDates={availableTravelDates}
            travelDatesStatus={travelDatesStatus}
            selectedDate={selectedDate}
            onDateSelect={d => {
              setSelectedDate(d);
              if (d) setShowCalendar(false);
            }}
            month={month}
            onMonthChange={setMonth}
          />
        </BkDateField>
        <BkFlexLink />
      </BkStep>

      <BkTrust
        items={[
          ...(endsLabel ? [`Deal price until ${endsLabel}`] : []),
          'Limited bookings each day',
          ...(agentDiscount ? [`${agentDiscount}% agent discount applied`] : []),
        ]}
      />
    </BkCard>
  );

  const wizard = (
    <BookingWizard
      pax={
        soloOnly
          ? null
          : {
              rows: [
                { id: 'adult', label: 'Adult', hint: adultP ? `12+ years · ${money(adultP)}` : '12+ years', value: persons.adult, min: minAdults },
                { id: 'child', label: 'Child', hint: childP ? `2–8 years · ${money(childP)}` : '2–8 years', value: persons.child, min: 0 },
                { id: 'infant', label: 'Infant', hint: infantP ? `Under 2 · ${money(infantP)}` : 'Under 2', value: persons.infant, min: 0 },
              ],
              onStep: updatePersonCount,
              locked: isSoloTraveller ? 'Solo traveller: 1 adult. Untick "Solo traveller" below to add people.' : null,
            }
      }
      options={soloStep}
      dates={{
        fromMonth: dealDates.fromMonth,
        toMonth: dealDates.toMonth,
        isDisabled: d => !dealDates.has(d) || dealSoldOut.has(format(d, 'yyyy-MM-dd')),
        selected: selectedDate,
        onSelect: setSelectedDate,
      }}
      total={quote.total}
      travellers={quote.travellers}
      issue={null}
      onBook={handleBookNow}
    />
  );

  return (
    <PdpShell
      images={images}
      name={pkg.package_name}
      duration={duration}
      kind='Limited Time Deal'
      badge={endsLabel ? LIMITED_DEALS.badge.replace('{date}', endsLabel) : LIMITED_DEALS.label}
      inclusions={inclusionsOf(pkg as never, null)}
      copy={{
        overview: pkg.overview,
        description: pkg.package_description,
        holidayHtml: pkg.holiday_description_html,
        itinerary: pkg.itinerary,
        inclusionHtml: pkg.inclusion_html,
        exclusionHtml: pkg.exclusion_html,
        termsHtml: pkg.terms_html,
      }}
      rewrite={replaceLtdOccupancyPhrases}
      notes={[
        {
          id: 'cancellation',
          title: 'Cancellation policy',
          body: (
            <p>
              Cancellation charges depend on how close to travel you cancel.{' '}
              <Link href='/cancellation-policy'>Read the cancellation policy</Link>.
            </p>
          ),
        },
      ]}
      from={{ now: quote.now || null, strike: quote.strike, basis: quote.basis }}
      sticky={{
        price: money(quote.total),
        sub: `${quote.travellers} traveller${quote.travellers === 1 ? '' : 's'} · Limited time deal`,
      }}
      whatsappText={whatsappText}
      booking={
        <>
          {booking}
          {wizard}
        </>
      }
    />
  );
}
