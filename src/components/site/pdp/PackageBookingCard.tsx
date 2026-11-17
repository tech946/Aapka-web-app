'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FlexibleDateCalendar } from '@/components/marketing/FlexibleDateCalendar';
import { parseDateStringToLocal } from '@/lib/utils';
import { shouldShowOptionalVisaInBookingModal } from '@/lib/package-visa';
import {
  getTourFixedBookingDates,
  getTourWeekendRangeCalendarBounds,
  hasTourFixedBookingDates,
} from '@/lib/package-config';
import { getMarinaCruiseCalendarBounds, type MarinaAddon } from '@/lib/marina-cruise-config';
import {
  BkCard,
  BkCheck,
  BkCounters,
  BkDateField,
  BkDateSelect,
  BkFlexLink,
  BkFoot,
  BkPersons,
  BkPrice,
  BkStep,
  BkTrust,
  offLabel,
  type PaxId,
  type Quote,
} from './booking';
import { money } from './pdp-data';
import BookingWizard, { type WizardDates, type WizardReview } from './BookingWizard';
import { defaultRange, useAnyDateRules, useDateList } from './wizard-dates';
import { PACKAGE_PAGE_DEFAULTS } from '@/content/package-page';
import 'react-day-picker/dist/style.css';

/* ==========================================================================
   Booking card for the package detail pages (/category/<slug>/<package>)
   and Marina cruises — the old Booking Details modal, inline in the
   redesign's card. Every rule it had is kept: solo traveller (gender +
   room-sharing consent), optional visa, persons and their minimums, fixed
   tour dates, offer-package departures, any-date calendar, tour / cruise
   calendars with their month bounds, Marina add-ons. State and the booking
   live in the page; this only renders and reports changes.
   ========================================================================== */

type Persons = { adult: number; child: number; infant: number };

function monthKey(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

/** Month header for the tour / cruise calendars (month bounds respected). */
function MonthCaption({
  calendarMonth,
  setMonth,
  bounds,
}: {
  calendarMonth: { date: Date };
  setMonth: (value: Date) => void;
  bounds: { fromMonth: Date; toMonth: Date } | null;
}) {
  const shown = calendarMonth.date;
  const prev = new Date(shown.getFullYear(), shown.getMonth() - 1, 1);
  const next = new Date(shown.getFullYear(), shown.getMonth() + 1, 1);
  const canPrev = bounds ? monthKey(prev) >= monthKey(bounds.fromMonth) : true;
  const canNext = bounds ? monthKey(next) <= monthKey(bounds.toMonth) : true;
  return (
    <div className="mcal__head">
      <button type="button" className="mcal__nav" aria-label="Previous month" disabled={!canPrev} onClick={() => canPrev && setMonth(prev)}>
        <ChevronLeft size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <p className="mcal__title" aria-live="polite">
        {format(shown, 'MMMM yyyy')}
      </p>
      <button type="button" className="mcal__nav" aria-label="Next month" disabled={!canNext} onClick={() => canNext && setMonth(next)}>
        <ChevronRight size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );
}

export interface PackageBookingCardProps {
  pkg: any;
  slug: string;
  // solo traveller
  soloTravellerEnabled: boolean;
  soloTravellerOnly?: boolean;
  isSoloTraveller: boolean;
  setIsSoloTraveller: (value: boolean) => void;
  soloTravellerGender: 'male' | 'female' | null;
  setSoloTravellerGender: (value: 'male' | 'female' | null) => void;
  soloTravellerShareConsent: boolean;
  setSoloTravellerShareConsent: (value: boolean) => void;
  soloRoomType?: 'private' | 'shared';
  // visa
  withVisa: boolean;
  setWithVisa: (value: boolean) => void;
  visaForAdults: number;
  setVisaForAdults: (value: number) => void;
  visaForChildren: number;
  setVisaForChildren: (value: number) => void;
  visaForInfants: number;
  setVisaForInfants: (value: number) => void;
  // persons
  persons: Persons;
  setPersons: (value: Persons) => void;
  updatePersonCount: (type: PaxId, delta: number) => void;
  // dates
  selectedDate: Date | undefined;
  selectedDateString: string;
  handleDateStringSelect: (dateStr: string) => void;
  handleDateSelect: (date: Date | undefined) => void;
  month: Date;
  setMonth: (value: Date) => void;
  isPackageType: () => boolean;
  getAvailableDates: () => string[];
  getDisabledDates: (date: Date) => boolean;
  getPricesForDate: () => { adultPrice: number; childPrice: number; infantPrice: number; soloTravellerPrice?: number | null };
  loading: boolean;
  dateRangesReady: boolean;
  // price (the page's own numbers)
  quote: Quote;
  /** the price isn't published yet: no booking, enquiry only */
  revealing?: boolean;
  payNote?: ReactNode;
  assurances: string[];
  // actions
  onBookNow: () => void;
  bookLabel?: string;
  // Marina cruise add-ons
  marinaAddons?: MarinaAddon[];
  selectedMarinaAddons?: string[];
  onToggleMarinaAddon?: (id: string) => void;
}

function addonHint(addon: MarinaAddon, adults: number, children: number): string {
  const a = Number(addon.adult_price) || 0;
  const c = Number(addon.child_price) || 0;
  const parts: string[] = [];
  if (a > 0 && adults > 0) parts.push(`Adult ${money(a)}`);
  if (c > 0 && children > 0) parts.push(`Child ${money(c)}`);
  if (parts.length) return parts.join(' · ');
  if (a > 0) return `${money(a)} / adult`;
  if (c > 0) return `${money(c)} / child`;
  return 'Included';
}

export default function PackageBookingCard(props: PackageBookingCardProps) {
  const text = PACKAGE_PAGE_DEFAULTS;
  const {
    pkg,
    slug,
    soloTravellerEnabled,
    soloTravellerOnly = false,
    isSoloTraveller,
    setIsSoloTraveller,
    soloTravellerGender,
    setSoloTravellerGender,
    soloTravellerShareConsent,
    setSoloTravellerShareConsent,
    soloRoomType = 'shared',
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
    selectedDate,
    selectedDateString,
    handleDateStringSelect,
    handleDateSelect,
    month,
    setMonth,
    isPackageType,
    getAvailableDates,
    getDisabledDates,
    getPricesForDate,
    loading,
    dateRangesReady,
    quote,
    revealing,
    payNote,
    assurances,
    onBookNow,
    bookLabel = 'Book now',
    marinaAddons = [],
    selectedMarinaAddons = [],
    onToggleMarinaAddon,
  } = props;

  const isMarina = slug === 'marina-cruise-dinner';
  const isFlexible = slug === 'flexible-date-packages';
  const [calOpen, setCalOpen] = useState(false);

  const marinaBounds = useMemo(() => {
    if (!isMarina || !pkg) return null;
    return getMarinaCruiseCalendarBounds(pkg.booking_days, pkg.bookable_dates, new Date(), pkg.excluded_dates);
  }, [isMarina, pkg]);

  // keep the cruise calendar inside the months that have sailings
  useEffect(() => {
    if (!isMarina || !marinaBounds) return;
    const key = monthKey(month);
    if (key < monthKey(marinaBounds.fromMonth)) setMonth(marinaBounds.fromMonth);
    else if (key > monthKey(marinaBounds.toMonth)) setMonth(marinaBounds.toMonth);
  }, [isMarina, marinaBounds, month, setMonth]);

  const prices = getPricesForDate();
  const showVisaOption = shouldShowOptionalVisaInBookingModal(slug, pkg);
  const fixedTourDates = getTourFixedBookingDates(pkg?.package_id);
  const usesFixedTourDates = hasTourFixedBookingDates(pkg?.package_id) && !!fixedTourDates;
  const bounds = isMarina ? marinaBounds : getTourWeekendRangeCalendarBounds(pkg?.package_id);
  const offerOrFlexible = slug === 'offer-packages' || isFlexible;

  /* solo + visa toggles: same resets as the old booking modal */
  function onSoloChange(checked: boolean) {
    const hadVisa = withVisa;
    setIsSoloTraveller(checked);
    setSoloTravellerShareConsent(false);
    setSoloTravellerGender(null);
    if (checked) {
      setPersons({ adult: 1, child: 0, infant: 0 });
      if (hadVisa) {
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
      const adults = offerOrFlexible ? 2 : 1;
      setPersons({ adult: adults, child: 0, infant: 0 });
      if (hadVisa) {
        setVisaForAdults(adults);
        setVisaForChildren(0);
        setVisaForInfants(0);
      }
    }
  }

  function onVisaChange(checked: boolean) {
    setWithVisa(checked);
    if (!checked) {
      setVisaForAdults(0);
      setVisaForChildren(0);
      setVisaForInfants(0);
    } else if (isSoloTraveller) {
      setVisaForAdults(1);
      setVisaForChildren(0);
      setVisaForInfants(0);
    } else {
      setVisaForAdults(persons.adult);
      setVisaForChildren(persons.child);
      setVisaForInfants(persons.infant);
    }
  }

  /* ------------------------------------------------------------ dates */
  const fixedTourLabel = (d: string) => {
    const parsed = parseDateStringToLocal(d);
    return parsed ? format(parsed, 'd MMMM yyyy') : d;
  };
  const departureLabel = (d: string) => {
    const parsed = parseDateStringToLocal(d);
    return parsed ? format(parsed, 'EEE, d MMM yyyy') : d;
  };

  let dateField: ReactNode;
  let dateChosen: boolean;
  if (usesFixedTourDates) {
    dateChosen = !!selectedDate;
    dateField = (
      <BkDateSelect
        value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
        options={fixedTourDates!.map((d) => ({ value: d, label: fixedTourLabel(d) }))}
        placeholder="Select tour date"
        onChange={(d) => {
          const parsed = parseDateStringToLocal(d);
          if (parsed) handleDateSelect(parsed);
        }}
      />
    );
  } else if (isPackageType()) {
    const dates = getAvailableDates();
    dateChosen = !!selectedDateString;
    dateField = (
      <BkDateSelect
        value={selectedDateString}
        options={dates.map((d) => ({ value: d, label: departureLabel(d) }))}
        placeholder={dates.length ? 'Select departure date' : 'No dates available'}
        disabled={!dates.length}
        onChange={handleDateStringSelect}
      />
    );
  } else {
    dateChosen = !!selectedDate;
    /* any-date calendar shows the per-adult price on each day; with visa
       picked it includes the adult visa fee, as the old modal did */
    const calendarAdultPrice = prices.adultPrice + (withVisa ? Number(pkg?.adult_visa_price) || 0 : 0);
    const marinaToday = isMarina ? startOfDay(new Date()) : undefined;
    dateField = (
      <BkDateField
        value={selectedDate ? format(selectedDate, 'EEE, d MMM yyyy') : ''}
        placeholder={isMarina ? 'Select cruise date' : isFlexible ? 'Select travel date' : 'Select tour date'}
        open={calOpen}
        onOpenChange={setCalOpen}
      >
        {isFlexible ? (
          !loading && dateRangesReady && pkg?.package_id ? (
            <FlexibleDateCalendar
              key={`calendar-${pkg.package_id}`}
              packageId={pkg.package_id}
              startDate={pkg.start_date || undefined}
              endDate={pkg.end_date || undefined}
              dateRanges={pkg.date_ranges}
              adultPrice={calendarAdultPrice}
              surchargeBlockDaysBefore={pkg.surcharge_block_days_before}
              selectedDate={selectedDate}
              onDateSelect={(d) => {
                handleDateSelect(d);
                if (d) setCalOpen(false);
              }}
              month={month}
              onMonthChange={setMonth}
            />
          ) : (
            <p className="bk-cal-loading">Loading dates…</p>
          )
        ) : (
          <div className="mcal bk-cal">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                handleDateSelect(d);
                if (d) setCalOpen(false);
              }}
              disabled={getDisabledDates}
              numberOfMonths={1}
              showOutsideDays={!isMarina}
              month={month}
              onMonthChange={setMonth}
              startMonth={bounds?.fromMonth}
              endMonth={bounds?.toMonth}
              modifiers={marinaToday ? { marinaToday } : undefined}
              modifiersClassNames={isMarina ? { marinaToday: 'rdp-day_hidden' } : undefined}
              components={{
                Nav: () => <></>,
                MonthCaption: (cp) => <MonthCaption calendarMonth={cp.calendarMonth} setMonth={setMonth} bounds={bounds} />,
              }}
            />
          </div>
        )}
      </BkDateField>
    );
  }

  /* ------------------------------------------------------------ issue */
  let issue: string | null = null;
  if (!dateChosen) issue = isMarina ? 'Select your cruise date' : 'Select your travel date';
  else if (isSoloTraveller && !soloTravellerGender) issue = "Select the solo traveller's gender";
  else if (isSoloTraveller && soloRoomType !== 'private' && !soloTravellerShareConsent) issue = 'Confirm room sharing';

  const adultMin = isSoloTraveller ? 1 : Math.max(offerOrFlexible ? 2 : 1, Number(pkg?.min_adults) || 1);
  const ages = (id: PaxId, unit: number) => {
    const age = id === 'adult' ? '8+ years' : id === 'child' ? '3–8 years' : '0–2 years';
    return unit > 0 ? `${age} · ${money(unit)}` : age;
  };
  const soloPrice = prices.soloTravellerPrice ?? prices.adultPrice ?? pkg?.package_price;
  const personRows = [
    { id: 'adult' as PaxId, label: 'Adult', hint: ages('adult', prices.adultPrice), value: persons.adult, min: adultMin },
    { id: 'child' as PaxId, label: 'Child', hint: ages('child', prices.childPrice), value: persons.child, min: 0 },
    { id: 'infant' as PaxId, label: 'Infant', hint: ages('infant', prices.infantPrice), value: persons.infant, min: 0 },
  ];

  /* ------------------------------------------------------------ Book now modal
     the same date rules as the fields above, as one month list */
  const listedDates = usesFixedTourDates ? fixedTourDates! : isPackageType() ? getAvailableDates() : [];
  const dateList = useDateList(listedDates);
  const anyDate = useAnyDateRules(isFlexible, {
    startDate: pkg?.start_date,
    endDate: pkg?.end_date,
    dateRanges: pkg?.date_ranges,
    surchargeBlockDaysBefore: pkg?.surcharge_block_days_before,
  });
  let wizardDates: WizardDates;
  if (usesFixedTourDates || isPackageType()) {
    wizardDates = {
      fromMonth: dateList.fromMonth,
      toMonth: dateList.toMonth,
      isDisabled: (d) => !dateList.has(d),
      selected: usesFixedTourDates ? selectedDate : (parseDateStringToLocal(selectedDateString) ?? undefined),
      onSelect: (d) => (usesFixedTourDates ? handleDateSelect(d) : handleDateStringSelect(dateList.original(d))),
    };
  } else if (isFlexible) {
    wizardDates = {
      fromMonth: anyDate.fromMonth,
      toMonth: anyDate.toMonth,
      isDisabled: anyDate.isDisabled,
      loading: anyDate.loading || loading || !dateRangesReady,
      selected: selectedDate,
      onSelect: handleDateSelect,
    };
  } else {
    const range = bounds ?? defaultRange();
    const today = startOfDay(new Date());
    wizardDates = {
      fromMonth: range.fromMonth,
      toMonth: range.toMonth,
      // cruises can't be booked for today (the card hides it too)
      isDisabled: (d) => getDisabledDates(d) || (isMarina && isSameDay(d, today)),
      loading,
      selected: selectedDate,
      onSelect: handleDateSelect,
    };
  }

  const head = revealing ? (
    <BkPrice now={null} basis="per adult" placeholder="Price revealing soon" />
  ) : (
    <BkPrice now={quote.now || null} strike={quote.strike} off={offLabel(quote.now, quote.strike)} basis={quote.basis} />
  );

  const foot = (
    <BkFoot
      total={quote.total}
      travellers={quote.travellers}
      lines={quote.lines}
      meta={payNote}
      savings={quote.savings}
      issue={issue}
      bookLabel={bookLabel}
      onBook={onBookNow}
      closed={
        revealing ? (
          <p className="bk-closed">
            {text.pricesFinalisingNote}
          </p>
        ) : undefined
      }
    />
  );

  /* the card's other choices, shared with the Book now modal */
  const travellingStep =
    soloTravellerEnabled || showVisaOption ? (
      <BkStep label="Travelling">
        {soloTravellerEnabled ? (
          <BkCheck
            label="Solo traveller"
            price={soloPrice ? money(soloPrice) : undefined}
            checked={isSoloTraveller}
            locked={soloTravellerOnly}
            onChange={onSoloChange}
          >
            <div className="ui-choice" role="group" aria-label="Solo traveller gender">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={soloTravellerGender === g}
                  className={'ui-choice__item' + (soloTravellerGender === g ? ' is-active' : '')}
                  onClick={() => setSoloTravellerGender(g)}
                >
                  {g === 'male' ? 'Male' : 'Female'}
                </button>
              ))}
            </div>
            {/* a private room isn't shared, so there's nothing to agree to */}
            {soloRoomType !== 'private' ? (
              <label className="ui-consent bk-consent">
                <input
                  type="checkbox"
                  className="ui-check"
                  checked={soloTravellerShareConsent}
                  onChange={(e) => setSoloTravellerShareConsent(e.target.checked)}
                />
                <span>
                  I am comfortable to share the room with {soloTravellerGender === 'female' ? 'female' : 'male'} passengers
                </span>
              </label>
            ) : null}
          </BkCheck>
        ) : null}

        {showVisaOption ? (
          <BkCheck
            label="With visa (Indian passport holders)"
            price={Number(pkg?.adult_visa_price) > 0 ? `${money(Number(pkg.adult_visa_price))} / adult` : undefined}
            checked={withVisa}
            onChange={onVisaChange}
          >
            <BkCounters
              rows={[
                {
                  id: 'adult' as PaxId,
                  label: 'Adults',
                  hint: `of ${isSoloTraveller ? 1 : persons.adult}`,
                  value: visaForAdults,
                  min: isSoloTraveller ? 1 : 0,
                  max: isSoloTraveller ? 1 : persons.adult,
                },
                ...(persons.child > 0
                  ? [{ id: 'child' as PaxId, label: 'Children', hint: `of ${persons.child}`, value: visaForChildren, min: 0, max: persons.child }]
                  : []),
                ...(persons.infant > 0
                  ? [{ id: 'infant' as PaxId, label: 'Infants', hint: `of ${persons.infant}`, value: visaForInfants, min: 0, max: persons.infant }]
                  : []),
              ]}
              onStep={(id, d) => {
                if (id === 'adult') setVisaForAdults(Math.max(0, Math.min(persons.adult, visaForAdults + d)));
                else if (id === 'child') setVisaForChildren(Math.max(0, Math.min(persons.child, visaForChildren + d)));
                else setVisaForInfants(Math.max(0, Math.min(persons.infant, visaForInfants + d)));
              }}
            />
          </BkCheck>
        ) : null}
      </BkStep>
    ) : null;
  const addonsStep =
    isMarina && marinaAddons.length > 0 && onToggleMarinaAddon ? (
      <BkStep label="Add-ons">
        {marinaAddons.map((a) => (
          <BkCheck
            key={a.id}
            label={a.name}
            price={addonHint(a, isSoloTraveller ? 1 : persons.adult, isSoloTraveller ? 0 : persons.child)}
            checked={selectedMarinaAddons.includes(a.id)}
            onChange={() => onToggleMarinaAddon(a.id)}
          />
        ))}
      </BkStep>
    ) : null;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const review: WizardReview = {
    travellers: isSoloTraveller
      ? [`Solo traveller${soloTravellerGender ? ` · ${soloTravellerGender === 'male' ? 'Male' : 'Female'}` : ''}`]
      : [
          ...(persons.adult > 0 ? [plural(persons.adult, 'Adult', 'Adults')] : []),
          ...(persons.child > 0 ? [plural(persons.child, 'Child', 'Children')] : []),
          ...(persons.infant > 0 ? [plural(persons.infant, 'Infant', 'Infants')] : []),
        ],
    extras: [
      ...(isSoloTraveller && soloRoomType !== 'private' && soloTravellerShareConsent ? ['Happy to share a room'] : []),
      ...(withVisa
        ? [
            `Visa for ${[
              visaForAdults > 0 ? plural(visaForAdults, 'adult', 'adults') : '',
              visaForChildren > 0 ? plural(visaForChildren, 'child', 'children') : '',
              visaForInfants > 0 ? plural(visaForInfants, 'infant', 'infants') : '',
            ]
              .filter(Boolean)
              .join(', ') || 'no one yet'}`,
          ]
        : []),
      ...marinaAddons.filter((a) => selectedMarinaAddons.includes(a.id)).map((a) => a.name),
    ],
    lines: quote.lines,
  };
  const soloIssue =
    isSoloTraveller && !soloTravellerGender
      ? "Select the solo traveller's gender"
      : isSoloTraveller && soloRoomType !== 'private' && !soloTravellerShareConsent
        ? 'Confirm room sharing'
        : null;

  return (
    <>
    <BkCard head={head} foot={foot}>
      {revealing ? null : (
        <>
          {travellingStep}

          <BkStep label={soloTravellerOnly ? 'Date' : 'Travellers & date'}>
            {soloTravellerOnly ? null : (
              <BkPersons disabled={isSoloTraveller} onStep={updatePersonCount} rows={personRows} />
            )}
            {dateField}
            {slug === 'offer-packages' ? <BkFlexLink /> : null}
          </BkStep>

          {addonsStep}
        </>
      )}

      <BkTrust items={assurances} />
    </BkCard>
    <BookingWizard
      closed={
        revealing ? (
          <p>{text.pricesFinalisingNote}</p>
        ) : undefined
      }
      pax={
        soloTravellerOnly
          ? null
          : {
              rows: personRows,
              onStep: updatePersonCount,
              locked: isSoloTraveller ? 'Solo traveller: 1 adult. Untick "Solo traveller" below to add people.' : null,
            }
      }
      options={
        travellingStep || addonsStep ? (
          <>
            {travellingStep}
            {addonsStep}
          </>
        ) : null
      }
      stepIssue={soloIssue}
      note={payNote}
      dates={wizardDates}
      dateTitle={isMarina ? 'Choose your cruise date' : 'Choose your travel date'}
      total={quote.total}
      travellers={quote.travellers}
      issue={issue && dateChosen ? issue : null}
      onBook={onBookNow}
      bookLabel={bookLabel}
      review={review}
    />
    </>
  );
}
