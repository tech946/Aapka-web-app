'use client';

import { useState, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import 'react-day-picker/dist/style.css';
import '../FlexibleDateCalendar/flexible-date-calendar.css';

interface LimitedTimeDealCalendarProps {
  dealId: string;
  startDate: string;
  endDate: string;
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
}

export default function LimitedTimeDealCalendar({
  dealId,
  startDate,
  endDate,
  selectedDate,
  onDateSelect,
  month,
  onMonthChange,
}: LimitedTimeDealCalendarProps) {
  const [availability, setAvailability] = useState<Record<string, { available: number; isSoldOut: boolean }>>({});
  const [maxPerDay, setMaxPerDay] = useState(46);

  useEffect(() => {
    if (!dealId) return;

    const fetchAvailability = async () => {
      try {
        const res = await fetch(`/api/limited-time-deals/availability?deal_id=${dealId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setAvailability(json.data);
          setMaxPerDay(json.maxBookingsPerDay || 46);
        }
      } catch (error) {
        console.error('Failed to fetch LTD availability:', error);
      }
    };

    fetchAvailability();
  }, [dealId]);

  const getDisabledDates = useCallback(
    (date: Date): boolean => {
      const today = startOfDay(new Date());
      const sixDaysFromNow = new Date(today);
      sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);
      const checkDate = startOfDay(date);

      if (checkDate < today) return true;
      if (checkDate <= sixDaysFromNow) return true;

      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      if (checkDate < start || checkDate > end) return true;

      const dateStr = format(date, 'yyyy-MM-dd');
      const info = availability[dateStr];
      if (info?.isSoldOut) return true;

      return false;
    },
    [startDate, endDate, availability]
  );

  const getDateInfo = useCallback(
    (dateStr: string): { available: number; isSoldOut: boolean } => {
      return availability[dateStr] ?? { available: maxPerDay, isSoldOut: false };
    },
    [availability, maxPerDay]
  );

  const minMonth = startOfMonth(new Date(startDate));
  const maxMonth = endOfMonth(new Date(endDate));

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
          <span className="flexible-day-price">{info.available} left</span>
        ) : (
          <span className="flexible-day-na">N/A</span>
        )}
      </button>
    );
  };

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
}
