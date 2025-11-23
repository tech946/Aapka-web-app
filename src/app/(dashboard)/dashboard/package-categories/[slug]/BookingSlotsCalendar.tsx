'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import 'react-day-picker/dist/style.css';
import './booking-slots-calendar.css';

type BookingSlot = {
  id: string;
  fromDate: string;
  toDate: string;
};

type BookingSlotsCalendarProps = {
  bookingSlots: BookingSlot[];
  onBookingSlotsChange: (slots: BookingSlot[]) => void;
};

export default function BookingSlotsCalendar({
  bookingSlots,
  onBookingSlotsChange,
}: BookingSlotsCalendarProps) {
  const [bookingSlotRange, setBookingSlotRange] = useState<
    DateRange | undefined
  >(undefined);
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());
  const bookingCalendarRef = useRef<HTMLDivElement>(null);
  const [calendarPosition, setCalendarPosition] = useState<'above' | 'below'>(
    'below'
  );

  // Calculate calendar position based on available space
  useEffect(() => {
    if (showBookingCalendar && bookingCalendarRef.current) {
      const inputElement = bookingCalendarRef.current.querySelector('input');
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        const calendarHeight = 400; // Approximate calendar height

        // If there's more space below or equal space, open below; otherwise above
        if (spaceBelow >= calendarHeight || spaceBelow >= spaceAbove) {
          setCalendarPosition('below');
        } else {
          setCalendarPosition('above');
        }
      }
    }
  }, [showBookingCalendar]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bookingCalendarRef.current &&
        !bookingCalendarRef.current.contains(event.target as Node)
      ) {
        setShowBookingCalendar(false);
      }
    };

    if (showBookingCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBookingCalendar]);

  const handleAddRange = () => {
    if (!bookingSlotRange?.from || !bookingSlotRange?.to) {
      toast.error('Please select a complete date range');
      return;
    }
    const newFrom = bookingSlotRange.from;
    const newTo = bookingSlotRange.to;
    const fromDate = format(newFrom, 'yyyy-MM-dd');
    const toDate = format(newTo, 'yyyy-MM-dd');
    // Check for overlapping ranges
    const overlaps = bookingSlots.some(slot => {
      const slotFrom = new Date(slot.fromDate);
      const slotTo = new Date(slot.toDate);
      return (
        (newFrom >= slotFrom && newFrom <= slotTo) ||
        (newTo >= slotFrom && newTo <= slotTo) ||
        (newFrom <= slotFrom && newTo >= slotTo)
      );
    });
    if (overlaps) {
      toast.error('This date range overlaps with an existing range');
      return;
    }
    onBookingSlotsChange([
      ...bookingSlots,
      {
        id: crypto.randomUUID?.() || String(Date.now()),
        fromDate,
        toDate,
      },
    ]);
    setBookingSlotRange(undefined);
    toast.success('Date range added');
  };

  const handleRemoveSlot = (slotId: string) => {
    onBookingSlotsChange(bookingSlots.filter(x => x.id !== slotId));
  };

  return (
    <div className='form_row full_width'>
      <label>Booking Slots (Unavailable Date Ranges)</label>
      <div
        className='date_input_group'
        ref={bookingCalendarRef}
        style={{ position: 'relative' }}
      >
        <input
          type='text'
          placeholder='Select date range'
          value={
            bookingSlotRange?.from && bookingSlotRange?.to
              ? `${format(bookingSlotRange.from, 'MMM dd, yyyy')} - ${format(bookingSlotRange.to, 'MMM dd, yyyy')}`
              : bookingSlotRange?.from
                ? format(bookingSlotRange.from, 'MMM dd, yyyy')
                : ''
          }
          readOnly
          onClick={() => setShowBookingCalendar(!showBookingCalendar)}
        />
        {showBookingCalendar && (
          <div
            className={`booking-calendar-dropdown calendar-dropdown-${calendarPosition}`}
            onClick={e => e.stopPropagation()}
          >
            <div className='calendar-header-nav'>
              <button
                className='calendar-nav-button'
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
                className='calendar-nav-button'
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
            <DayPicker
              mode='range'
              selected={bookingSlotRange}
              onSelect={setBookingSlotRange}
              numberOfMonths={1}
              showOutsideDays={true}
              month={month}
              onMonthChange={setMonth}
              className='custom-calendar'
            />
            <div className='calendar-footer'>
              <button
                className='clear-dates-button'
                onClick={e => {
                  e.stopPropagation();
                  setBookingSlotRange(undefined);
                }}
              >
                Clear dates
              </button>
              <button
                className='btn_primary'
                style={{ marginLeft: '12px' }}
                onClick={e => {
                  e.stopPropagation();
                  handleAddRange();
                }}
              >
                Add Range
              </button>
            </div>
          </div>
        )}
      </div>
      {bookingSlots.length > 0 && (
        <div className='date_chips' style={{ marginTop: '12px' }}>
          {bookingSlots.map(slot => (
            <span key={slot.id} className='date_chip'>
              {format(new Date(slot.fromDate), 'MMM dd, yyyy')} -{' '}
              {format(new Date(slot.toDate), 'MMM dd, yyyy')}
              <button type='button' onClick={() => handleRemoveSlot(slot.id)}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
