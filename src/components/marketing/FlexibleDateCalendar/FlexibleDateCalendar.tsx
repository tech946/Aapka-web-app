'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { parseDateStringToLocal } from '@/lib/utils';
import 'react-day-picker/dist/style.css';
import './flexible-date-calendar.css';

interface DateRange {
  id: string;
  fromDate: string;
  toDate: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  soloTravellerPrice?: number | null;
  isSoldOut: boolean;
}

interface FlexibleDateCalendarProps {
  packageId: string;
  endDate?: string | null;
  dateRanges?: DateRange[] | null;
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
}

export default function FlexibleDateCalendar({
  packageId,
  endDate,
  dateRanges,
  selectedDate,
  onDateSelect,
  month,
  onMonthChange,
}: FlexibleDateCalendarProps) {
  const [seatAvailability, setSeatAvailability] = useState<Record<string, number>>({});
  const [defaultSeats, setDefaultSeats] = useState<number>(45);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

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

  // Find the date range that contains a specific date
  const findDateRangeForDate = useCallback(
    (dateStr: string): DateRange | null => {
      if (!dateRanges || !Array.isArray(dateRanges)) return null;
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      
      for (const range of dateRanges) {
        const fromDate = new Date(range.fromDate);
        const toDate = new Date(range.toDate);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        
        if (targetDate >= fromDate && targetDate <= toDate) {
          return range;
        }
      }
      return null;
    },
    [dateRanges]
  );

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

  // Calculate the last available date from date ranges
  const lastAvailableDate = useMemo(() => {
    if (!dateRanges || dateRanges.length === 0) return null;
    
    let maxDate: Date | null = null;
    for (const range of dateRanges) {
      const toDate = new Date(range.toDate);
      toDate.setHours(0, 0, 0, 0);
      if (!maxDate || toDate > maxDate) {
        maxDate = toDate;
      }
    }
    return maxDate;
  }, [dateRanges]);

  // Calculate max month for navigation (use end_date or last date from ranges)
  const maxNavigationMonth = useMemo(() => {
    let maxDate: Date | null = null;
    
    // Use end_date if provided
    if (endDate) {
      const parsed = parseDateStringToLocal(endDate);
      if (parsed) {
        maxDate = parsed;
      }
    }
    
    // Also consider lastAvailableDate
    if (lastAvailableDate) {
      if (!maxDate || lastAvailableDate > maxDate) {
        maxDate = lastAvailableDate;
      }
    }
    
    return maxDate ? endOfMonth(maxDate) : null;
  }, [endDate, lastAvailableDate]);

  // Check if can navigate to next month
  const canNavigateNext = useMemo(() => {
    if (!maxNavigationMonth) return true;
    const nextMonthStart = startOfMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    return nextMonthStart <= maxNavigationMonth;
  }, [month, maxNavigationMonth]);

  // Check if can navigate to previous month (not before current month)
  const canNavigatePrev = useMemo(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const prevMonthStart = startOfMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    return prevMonthStart >= currentMonthStart;
  }, [month]);

  // Check if a date should be disabled
  const getDisabledDates = useCallback(
    (date: Date): boolean => {
      const today = startOfDay(new Date());
      const checkDate = startOfDay(date);

      // Disable past dates
      if (checkDate < today) return true;

      // Disable dates within 6 days from today
      const sixDaysFromNow = new Date(today);
      sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);
      if (checkDate <= sixDaysFromNow) return true;

      // Disable dates after package end_date
      if (endDate) {
        const parsedEndDate = parseDateStringToLocal(endDate);
        if (parsedEndDate) {
          const endDateStart = startOfDay(parsedEndDate);
          if (checkDate > endDateStart) return true;
        }
      }

      // Check if date is within any date range
      const dateStr = format(date, 'yyyy-MM-dd');
      const dateRange = findDateRangeForDate(dateStr);

      // Disable if not in any date range
      if (!dateRange) return true;

      // Disable if range is sold out
      if (dateRange.isSoldOut) return true;

      return false;
    },
    [endDate, findDateRangeForDate]
  );

  // Check if device is touch-enabled (for hiding hover tooltips on mobile)
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Custom DayButton to show price or status with tooltip
  const CustomDayButton = ({ day, modifiers, ...buttonProps }: any) => {
    const date = day.date;
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateRange = findDateRangeForDate(dateStr);
    const isDisabled = modifiers.disabled;
    const isSelected = modifiers.selected;
    const isSoldOut = dateRange?.isSoldOut;
    const availableSeats = !isDisabled && !isSoldOut ? getAvailableSeats(dateStr) : 0;

    // Only show tooltip on non-touch devices (desktop with mouse)
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isTouchDevice) return; // Skip tooltip on touch devices
      if (!isDisabled && !isSoldOut && dateRange) {
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
      setHoveredDate(null);
      setTooltipPosition(null);
    };

    // Extract onClick from buttonProps to ensure it's properly called
    const { onClick: originalOnClick, ...restButtonProps } = buttonProps;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Clear any tooltip on click (for hybrid devices)
      setHoveredDate(null);
      setTooltipPosition(null);
      // Call original onClick from DayPicker
      if (originalOnClick) {
        originalOnClick(e);
      }
    };

    return (
      <button
        {...restButtonProps}
        onClick={handleClick}
        className={`flexible-day-button ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ touchAction: 'manipulation' }}
      >
        <span className="flexible-day-number">{date.getDate()}</span>
        {isDisabled ? (
          <span className="flexible-day-na">N/A</span>
        ) : dateRange && !isSoldOut ? (
          <span className="flexible-day-price">
            {dateRange.adultPrice > 0 ? `${dateRange.adultPrice}` : 'Free'}
          </span>
        ) : dateRange && isSoldOut ? (
          <span className="flexible-day-soldout">Sold Out</span>
        ) : null}
      </button>
    );
  };

  // Show message if no date ranges are configured
  if (!dateRanges || dateRanges.length === 0) {
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
        fromMonth={startOfMonth(new Date())}
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
