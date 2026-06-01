'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import 'react-day-picker/dist/style.css';
import '../FlexibleDateCalendar/flexible-date-calendar.css';

interface LimitedTimeDealCalendarProps {
  dealId: string;
  availableDates: string[];
  travelDatesStatus?: 'none' | 'all_past' | 'available';
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
}

export default function LimitedTimeDealCalendar({
  dealId,
  availableDates,
  travelDatesStatus = 'none',
  selectedDate,
  onDateSelect,
  month,
  onMonthChange,
}: LimitedTimeDealCalendarProps) {
  const [availability, setAvailability] = useState<
    Record<string, { available: number; isSoldOut: boolean }>
  >({});
  const [maxPerDay, setMaxPerDay] = useState(48);

  const availableDateSet = useMemo(
    () => new Set(availableDates),
    [availableDates]
  );

  const { minMonth, maxMonth } = useMemo(() => {
    if (availableDates.length === 0) {
      const now = new Date();
      return { minMonth: startOfMonth(now), maxMonth: endOfMonth(now) };
    }
    const sorted = [...availableDates].sort();
    return {
      minMonth: startOfMonth(parseISO(sorted[0])),
      maxMonth: endOfMonth(parseISO(sorted[sorted.length - 1])),
    };
  }, [availableDates]);

  useEffect(() => {
    if (!dealId) return;

    const fetchAvailability = async () => {
      try {
        const res = await fetch(
          `/api/limited-time-deals/availability?deal_id=${dealId}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setAvailability(json.data);
          setMaxPerDay(Number(json.maxBookingsPerDay) || 48);
        }
      } catch (error) {
        console.error('Failed to fetch LTD availability:', error);
      }
    };

    fetchAvailability();
  }, [dealId]);

  const getDisabledDates = useCallback(
    (date: Date): boolean => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!availableDateSet.has(dateStr)) return true;

      const info = availability[dateStr];
      if (info?.isSoldOut) return true;

      return false;
    },
    [availableDateSet, availability]
  );

  const getDateInfo = useCallback(
    (dateStr: string): { available: number; isSoldOut: boolean } => {
      return availability[dateStr] ?? { available: maxPerDay, isSoldOut: false };
    },
    [availability, maxPerDay]
  );

  const CustomDayButton = ({ day, modifiers, ...buttonProps }: any) => {
    const date = day.date;
    const dateStr = format(date, 'yyyy-MM-dd');
    const info = getDateInfo(dateStr);
    const isDisabled = modifiers.disabled;
    const isSelected = modifiers.selected;

    return (
      <button
        {...buttonProps}
        className={`flexible-day-button ${isSelected ? 'selected' : ''} ${isDisabled || info.isSoldOut ? 'disabled' : ''} ${info.isSoldOut ? 'sold-out' : ''}`}
        disabled={isDisabled || info.isSoldOut}
      >
        <span className="flexible-day-number">{date.getDate()}</span>
        {info.isSoldOut ? (
          <span className="flexible-day-soldout">Sold Out</span>
        ) : !isDisabled ? (
          <span
            className="flexible-day-price"
            title={`${info.available} seats left (max ${maxPerDay} per day; only completed payments reduce availability)`}
          >
            {info.available} left
          </span>
        ) : (
          <span className="flexible-day-na">N/A</span>
        )}
      </button>
    );
  };

  if (availableDates.length === 0) {
    return (
      <div className="flexible-date-calendar-wrapper">
        <p className="ltd-calendar-cap-hint">
          {travelDatesStatus === 'all_past'
            ? 'All configured travel dates have passed. Add new future dates in Dashboard → Offer Packages → edit this package.'
            : 'No travel dates configured for this package. Add dates in Dashboard → Offer Packages → edit this package.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flexible-date-calendar-wrapper">
      <div className="flexible-calendar-header-nav">
        <button
          className="flexible-calendar-nav-button"
          disabled={startOfMonth(month) <= minMonth}
          onClick={() => {
            const prev = new Date(month);
            prev.setMonth(prev.getMonth() - 1);
            onMonthChange(prev);
          }}
        >
          ‹
        </button>
        <button
          className="flexible-calendar-nav-button"
          disabled={endOfMonth(month) >= maxMonth}
          onClick={() => {
            const next = new Date(month);
            next.setMonth(next.getMonth() + 1);
            onMonthChange(next);
          }}
        >
          ›
        </button>
      </div>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        disabled={getDisabledDates}
        month={month}
        onMonthChange={onMonthChange}
        fromMonth={minMonth}
        toMonth={maxMonth}
        className="flexible-date-calendar"
        components={{ DayButton: CustomDayButton }}
      />
      <div className="flexible-calendar-footer">
        <p className="ltd-calendar-cap-hint">
          Dates from offer package travel dates · up to <strong>{maxPerDay}</strong>{' '}
          seats per day · each date shows <strong>seats left</strong> (only{' '}
          <strong>completed</strong> LTD payments count).
        </p>
        <button
          type="button"
          className="flexible-clear-dates-button"
          onClick={() => onDateSelect(undefined)}
        >
          Clear dates
        </button>
      </div>
    </div>
  );
};
