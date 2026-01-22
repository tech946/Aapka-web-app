'use client';

import { useState, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, startOfDay } from 'date-fns';
import { parseDateStringToLocal } from '@/lib/utils';
import 'react-day-picker/dist/style.css';
import './flexible-date-calendar.css';

interface FlexibleDateAvailability {
  date: string;
  adult_price: number;
  child_price: number;
  infant_price: number;
  available_seats: number;
  is_sold_out: boolean;
}

interface FlexibleDateCalendarProps {
  packageId: string;
  endDate?: string | null;
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
}

export default function FlexibleDateCalendar({
  packageId,
  endDate,
  selectedDate,
  onDateSelect,
  month,
  onMonthChange,
}: FlexibleDateCalendarProps) {
  const [availability, setAvailability] = useState<FlexibleDateAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch date availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!packageId) {
        console.log('[FlexibleDateCalendar] No packageId provided');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        console.log('[FlexibleDateCalendar] Fetching availability for package:', packageId);
        const response = await fetch(
          `/api/package-date-availability?package_id=${packageId}`
        );
        const result = await response.json();
        console.log('[FlexibleDateCalendar] API Response:', result);
        if (result.data && Array.isArray(result.data)) {
          console.log('[FlexibleDateCalendar] Found', result.data.length, 'dates');
          if (result.data.length > 0) {
            console.log('[FlexibleDateCalendar] Sample date:', result.data[0]);
          }
          setAvailability(result.data);
        } else {
          console.log('[FlexibleDateCalendar] No data found or invalid format');
        }
      } catch (error) {
        console.error('[FlexibleDateCalendar] Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [packageId]);

  // Get availability info for a specific date
  const getDateInfo = useCallback(
    (dateStr: string) => {
      const found = availability.find(avail => {
        const dbDate = avail.date?.split('T')[0];
        return dbDate === dateStr || avail.date === dateStr;
      });
      return found;
    },
    [availability]
  );

  // Check if a date should be disabled
  const getDisabledDates = useCallback(
    (date: Date): boolean => {
      const today = startOfDay(new Date());
      const checkDate = startOfDay(date);

      // Disable past dates
      if (checkDate < today) return true;

      // Disable dates after package end_date
      if (endDate) {
        const parsedEndDate = parseDateStringToLocal(endDate);
        if (parsedEndDate) {
          const endDateStart = startOfDay(parsedEndDate);
          if (checkDate > endDateStart) return true;
        }
      }

      // Check availability
      const dateStr = format(date, 'yyyy-MM-dd');
      const availInfo = getDateInfo(dateStr);

      // Disable if not in availability data
      if (!availInfo) return true;

      // Disable if sold out or no seats
      if (availInfo.is_sold_out || availInfo.available_seats <= 0) return true;

      return false;
    },
    [endDate, getDateInfo]
  );

  // Custom DayButton to show seat counts
  const CustomDayButton = ({ day, modifiers, ...buttonProps }: any) => {
    const date = day.date;
    const dateStr = format(date, 'yyyy-MM-dd');
    const availInfo = getDateInfo(dateStr);
    const isDisabled = modifiers.disabled;
    const isSelected = modifiers.selected;
    const isSoldOut = availInfo?.is_sold_out || (availInfo?.available_seats ?? 0) <= 0;

    return (
      <button
        {...buttonProps}
        className={`flexible-day-button ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
      >
        <span className="flexible-day-number">{date.getDate()}</span>
        {isDisabled ? (
          <span className="flexible-day-na">N/A</span>
        ) : availInfo && !isSoldOut ? (
          <span className="flexible-day-seats">{availInfo.available_seats} seats</span>
        ) : availInfo && isSoldOut ? (
          <span className="flexible-day-soldout">Sold Out</span>
        ) : null}
      </button>
    );
  };

  if (loading) {
    return (
      <div className='flexible-date-calendar-loading'>
        <div className='loading-spinner'></div>
        <span>Loading dates...</span>
      </div>
    );
  }

  // Show message if no dates are configured
  if (availability.length === 0) {
    console.log('[FlexibleDateCalendar] No availability data loaded. PackageId:', packageId);
    return (
      <div className='flexible-date-calendar-wrapper'>
        <div className='flexible-calendar-header-nav'>
          <button
            className='flexible-calendar-nav-button'
            onClick={e => {
              e.stopPropagation();
              const newMonth = new Date(month);
              newMonth.setMonth(newMonth.getMonth() - 1);
              onMonthChange(newMonth);
            }}
          >
            ‹
          </button>
          <button
            className='flexible-calendar-nav-button'
            onClick={e => {
              e.stopPropagation();
              const newMonth = new Date(month);
              newMonth.setMonth(newMonth.getMonth() + 1);
              onMonthChange(newMonth);
            }}
          >
            ›
          </button>
        </div>
        <DayPicker
          mode='single'
          selected={selectedDate}
          onSelect={onDateSelect}
          disabled={() => true}
          numberOfMonths={1}
          showOutsideDays={true}
          month={month}
          onMonthChange={onMonthChange}
          className='flexible-date-calendar'
          modifiersClassNames={{
            disabled: 'rdp-day_unavailable',
          }}
        />
        <div className='flexible-calendar-no-dates'>
          No dates available. Please contact support.
        </div>
        <div className='flexible-calendar-footer'>
          <button
            className='flexible-clear-dates-button'
            onClick={e => {
              e.stopPropagation();
              onDateSelect(undefined);
            }}
          >
            Clear dates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flexible-date-calendar-wrapper'>
      <div className='flexible-calendar-header-nav'>
        <button
          className='flexible-calendar-nav-button'
          onClick={e => {
            e.stopPropagation();
            const newMonth = new Date(month);
            newMonth.setMonth(newMonth.getMonth() - 1);
            onMonthChange(newMonth);
          }}
        >
          ‹
        </button>
        <button
          className='flexible-calendar-nav-button'
          onClick={e => {
            e.stopPropagation();
            const newMonth = new Date(month);
            newMonth.setMonth(newMonth.getMonth() + 1);
            onMonthChange(newMonth);
          }}
        >
          ›
        </button>
      </div>
      <DayPicker
        mode='single'
        selected={selectedDate}
        onSelect={onDateSelect}
        disabled={getDisabledDates}
        numberOfMonths={1}
        showOutsideDays={true}
        month={month}
        onMonthChange={onMonthChange}
        className='flexible-date-calendar'
        components={{
          DayButton: CustomDayButton,
        }}
      />
      <div className='flexible-calendar-footer'>
        <button
          className='flexible-clear-dates-button'
          onClick={e => {
            e.stopPropagation();
            onDateSelect(undefined);
          }}
        >
          Clear dates
        </button>
      </div>
    </div>
  );
}
