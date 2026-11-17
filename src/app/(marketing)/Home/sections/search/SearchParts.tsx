'use client';

import { Minus, Plus } from 'lucide-react';
import Calendar, { isoOf } from '@/components/site/ui/Calendar';
import { FlexibleDateCalendar } from '@/components/marketing/FlexibleDateCalendar';
import { parseDateStringToLocal } from '@/lib/utils';
import { MIN_ADULTS, type HolidaySearch, type Pax } from './useHolidaySearch';

/* Controls shared by the desktop search card and the phone search sheet.
   They take the search state from useHolidaySearch and only draw it. */

const PAX_ROWS: { key: keyof Pax; label: string; hint: string }[] = [
  { key: 'adult', label: 'Adults', hint: `Minimum ${MIN_ADULTS}` },
  { key: 'child', label: 'Children', hint: '2 – 11 years' },
  { key: 'infant', label: 'Infants', hint: 'Under 2' },
];

export function paxText(p: Pax): string {
  const parts = [`${p.adult} Adult${p.adult === 1 ? '' : 's'}`];
  if (p.child) parts.push(`${p.child} Child${p.child === 1 ? '' : 'ren'}`);
  if (p.infant) parts.push(`${p.infant} Infant${p.infant === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

/** Adults / Children / Infants rows with − n + steppers (.bk-pax rows). */
export function PaxRows({ pax, onStep }: { pax: Pax; onStep: HolidaySearch['stepPax'] }) {
  return (
    <>
      {PAX_ROWS.map((row) => {
        const min = row.key === 'adult' ? MIN_ADULTS : 0;
        return (
          <div className="bk-pax__row" key={row.key}>
            <span className="bk-pax__text">
              <b>{row.label}</b>
              <small>{row.hint}</small>
            </span>
            <span className="bk-pax__stepper">
              <button type="button" aria-label={`Remove ${row.label}`} disabled={pax[row.key] <= min} onClick={() => onStep(row.key, -1)}>
                <Minus size={13} strokeWidth={2.4} aria-hidden="true" />
              </button>
              <output aria-live="polite">{pax[row.key]}</output>
              <button type="button" aria-label={`Add ${row.label}`} onClick={() => onStep(row.key, 1)}>
                <Plus size={13} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </span>
          </div>
        );
      })}
    </>
  );
}

/** The calendar for 'flexible' / 'calendar' date modes ('list' uses a
    picker of its own). `onPicked` fires once a day is chosen. */
export function DateCalendar({ search: s, onPicked }: { search: HolidaySearch; onPicked?: () => void }) {
  if (s.dateMode === 'flexible' && s.pkg) {
    const pkg = s.pkg;
    return (
      <FlexibleDateCalendar
        packageId={pkg.package_id}
        startDate={pkg.start_date}
        endDate={pkg.end_date}
        dateRanges={pkg.date_ranges as never}
        adultPrice={pkg.adult_price ?? pkg.package_price}
        surchargeBlockDaysBefore={pkg.surcharge_block_days_before as number | null | undefined}
        selectedDate={parseDateStringToLocal(s.date) ?? undefined}
        onDateSelect={(d) => {
          s.setDate(d ? isoOf(d) : '');
          if (d) onPicked?.();
        }}
        month={s.flexMonth}
        onMonthChange={s.setFlexMonth}
      />
    );
  }

  return (
    <Calendar
      value={s.date}
      min={s.minDate}
      onChange={(iso) => {
        s.setDate(iso);
        onPicked?.();
      }}
    />
  );
}
