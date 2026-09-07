'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format, startOfDay, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { parseDateStringToLocal } from '@/lib/utils';
import { MIN_BOOKING_LEAD_DAYS } from '@/lib/offer-package-dates';
import {
  getAnyDateBlockReason,
  type AnyDateSoldOutRange,
} from '@/lib/anydate-availability';
import type { SurchargeMasterEntry } from '@/lib/surcharge-master';
import 'react-day-picker/dist/style.css';
import './flexible-date-calendar.css';

/** Months of forward browsing offered when the package has no end date. */
const DEFAULT_MONTHS_AHEAD = 18;

interface FlexibleDateCalendarProps {
  packageId: string;
  endDate?: string | null;
  /** Only entries flagged `isSoldOut` are used — any-date packages have no pricing ranges. */
  dateRanges?: AnyDateSoldOutRange[] | null;
  /** Per-adult price shown on each bookable day. */
  adultPrice?: number | null;
  /** Days before a hotel surcharge that are also blocked (defaults to 3). */
  surchargeBlockDaysBefore?: number | null;
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
}

export default function FlexibleDateCalendar({
  packageId,
  endDate,
  dateRanges,
  adultPrice,
  surchargeBlockDaysBefore,
  selectedDate,
  onDateSelect,
  month,
  onMonthChange,
}: FlexibleDateCalendarProps) {
  const [seatAvailability, setSeatAvailability] = useState<Record<string, number>>({});
  const [defaultSeats, setDefaultSeats] = useState<number>(45);
  const [surcharges, setSurcharges] = useState<SurchargeMasterEntry[]>([]);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Sold out ranges are the only date_ranges entries that still matter
  const soldOutRanges = useMemo(
    () => (Array.isArray(dateRanges) ? dateRanges : []),
    [dateRanges]
  );

  // Fetch seat availability
  useEffect(() => {
    if (!packageId) return;

    const fetchSeatAvailability = async () => {
      try {
        const response = await fetch(
          `/api/package-seat-availability?package_id=${packageId}`
        );
        const result = await response.json();
        if (result.success && result.data) {
          setSeatAvailability(result.data);
          setDefaultSeats(result.defaultSeats || 45);
        }
      } catch (error) {
        console.error('Failed to fetch seat availability:', error);
      }
    };

    fetchSeatAvailability();
  }, [packageId]);

  // Fetch hotel surcharge date ranges - these (and the days before them) are unbookable
  useEffect(() => {
    let cancelled = false;

    const fetchSurcharges = async () => {
      try {
        const response = await fetch('/api/surcharge-master?limit=100&page=1');
        const result = await response.json();
        if (!cancelled && Array.isArray(result?.data)) {
          setSurcharges(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch surcharges:', error);
      }
    };

    fetchSurcharges();
    return () => {
      cancelled = true;
    };
  }, []);

  // Get available seats for a date
  const getAvailableSeats = useCallback(
    (dateStr: string): number => {
      // If date has specific availability, use it; otherwise use default
      if (seatAvailability[dateStr] !== undefined) {
        return seatAvailability[dateStr];
      }
      return defaultSeats;
    },
    [seatAvailability, defaultSeats]
  );

  // Why a date cannot be booked (null when it is bookable)
  const getBlockReason = useCallback(
    (date: Date) =>
      getAnyDateBlockReason(date, {
        soldOutRanges,
        surcharges,
        surchargeBlockDaysBefore,
        endDate,
      }),
    [soldOutRanges, surcharges, surchargeBlockDaysBefore, endDate]
  );

  const getDisabledDates = useCallback(
    (date: Date): boolean => getBlockReason(date) !== null,
    [getBlockReason]
  );

  // First month that can hold a bookable date
  const minNavigationMonth = useMemo(() => {
    const firstBookable = startOfDay(new Date());
    firstBookable.setDate(firstBookable.getDate() + MIN_BOOKING_LEAD_DAYS + 1);
    return startOfMonth(firstBookable);
  }, []);

  // Any date is bookable, so browsing runs to the end date or a rolling horizon
  const maxNavigationMonth = useMemo(() => {
    if (endDate) {
      const parsed = parseDateStringToLocal(endDate);
      if (parsed) return endOfMonth(parsed);
    }
    return endOfMonth(addMonths(new Date(), DEFAULT_MONTHS_AHEAD));
  }, [endDate]);

  // Check if can navigate to next month
  const canNavigateNext = useMemo(() => {
    if (!maxNavigationMonth) return true;
    const nextMonthStart = startOfMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    return nextMonthStart <= maxNavigationMonth;
  }, [month, maxNavigationMonth]);

  // Check if can navigate to previous month (not before the first bookable month)
  const canNavigatePrev = useMemo(() => {
    const prevMonthStart = startOfMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    return prevMonthStart >= minNavigationMonth;
  }, [month, minNavigationMonth]);

  // Check if device is touch-enabled (for disabling tooltips on mobile)
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Custom DayButton to show price or status with tooltip (desktop only)
  const CustomDayButton = ({ day, modifiers, ...buttonProps }: any) => {
    const date = day.date;
    const dateStr = format(date, 'yyyy-MM-dd');
    const blockReason = getBlockReason(date);
    const isDisabled = modifiers.disabled || blockReason !== null;
    const isSelected = modifiers.selected;
    // Surcharge dates are presented to travellers the same way as sold out dates
    const isSoldOut = blockReason === 'sold-out' || blockReason === 'surcharge';

    // Desktop only: Show tooltip on hover
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isTouchDevice) return; // No tooltip on touch devices
      if (!isDisabled) {
        setHoveredDate(dateStr);
        const rect = e.currentTarget.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        setTooltipPosition({
          x: rect.left + rect.width / 2 + scrollX,
          y: rect.top - 10 + scrollY,
        });
      }
    };

    const handleMouseLeave = () => {
      if (isTouchDevice) return;
      setHoveredDate(null);
      setTooltipPosition(null);
    };

    // Determine what to show below the date
    // Priority: Sold Out (incl. surcharge dates) > Available (price) > N/A
    let statusDisplay: React.ReactNode = null;

    if (isSoldOut) {
      statusDisplay = <span className="flexible-day-soldout">Sold Out</span>;
    } else if (!isDisabled) {
      const price = Number(adultPrice) || 0;
      statusDisplay = (
        <span className="flexible-day-price">
          {price > 0 ? `${price}` : 'Free'}
        </span>
      );
    } else {
      // Past dates, the booking lead window, or dates after the package end date
      statusDisplay = <span className="flexible-day-na">N/A</span>;
    }

    return (
      <button
        {...buttonProps}
        className={`flexible-day-button ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isSoldOut ? 'sold-out' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isDisabled}
      >
        <span className="flexible-day-number">{date.getDate()}</span>
        {statusDisplay}
      </button>
    );
  };

  return (
    <div className='flexible-date-calendar-wrapper'>
      <div className='flexible-calendar-header-nav'>
        <button
          className='flexible-calendar-nav-button'
          disabled={!canNavigatePrev}
          onClick={e => {
            e.stopPropagation();
            if (canNavigatePrev) {
              const newMonth = new Date(month);
              newMonth.setMonth(newMonth.getMonth() - 1);
              onMonthChange(newMonth);
            }
          }}
          style={{ opacity: canNavigatePrev ? 1 : 0.3, cursor: canNavigatePrev ? 'pointer' : 'not-allowed' }}
        >
          ‹
        </button>
        <button
          className='flexible-calendar-nav-button'
          disabled={!canNavigateNext}
          onClick={e => {
            e.stopPropagation();
            if (canNavigateNext) {
              const newMonth = new Date(month);
              newMonth.setMonth(newMonth.getMonth() + 1);
              onMonthChange(newMonth);
            }
          }}
          style={{ opacity: canNavigateNext ? 1 : 0.3, cursor: canNavigateNext ? 'pointer' : 'not-allowed' }}
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
        fromMonth={minNavigationMonth}
        toMonth={maxNavigationMonth || undefined}
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
      {/* Tooltip rendered via portal */}
      {hoveredDate && tooltipPosition && typeof window !== 'undefined' && createPortal(
        <div
          className="flexible-day-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          <div className="flexible-day-tooltip-content">
            <div className="flexible-day-tooltip-seats">
              {getAvailableSeats(hoveredDate)} seats left
            </div>
          </div>
          <div className="flexible-day-tooltip-arrow"></div>
        </div>,
        document.body
      )}
    </div>
  );
}
