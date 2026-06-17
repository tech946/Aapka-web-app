'use client';

import {
  ALL_TOUR_BOOKING_DAYS,
  TOUR_WEEKDAYS,
} from '@/lib/tour-booking-days';
import './tour-booking-days.css';

type TourBookingDaysSelectorProps = {
  selectedDays: number[];
  onSelectedDaysChange: (days: number[]) => void;
  /** When true, all days can be deselected (requires specific dates instead). */
  allowEmpty?: boolean;
};

export default function TourBookingDaysSelector({
  selectedDays,
  onSelectedDaysChange,
  allowEmpty = false,
}: TourBookingDaysSelectorProps) {
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (!allowEmpty && selectedDays.length <= 1) return;
      onSelectedDaysChange(selectedDays.filter(d => d !== day));
      return;
    }
    onSelectedDaysChange([...selectedDays, day].sort((a, b) => a - b));
  };

  const selectAll = () => onSelectedDaysChange([...ALL_TOUR_BOOKING_DAYS]);
  const clearAll = () => onSelectedDaysChange([]);

  return (
    <div className='form_row full_width'>
      <label>Available Booking Days{allowEmpty ? '' : ' *'}</label>
      <p className='tour-booking-days-hint'>
        {allowEmpty
          ? 'Optional — select weekdays customers can book. If none are selected, add at least one specific date below.'
          : 'Select which days of the week customers can book this tour. Only these days will be selectable on the website calendar.'}
      </p>
      <div className='tour-booking-days-toolbar'>
        <button type='button' className='tour-booking-days-select-all' onClick={selectAll}>
          Select all
        </button>
        {allowEmpty && (
          <button type='button' className='tour-booking-days-select-all' onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>
      <div className='tour-booking-days-grid'>
        {TOUR_WEEKDAYS.map(({ value, label, short }) => {
          const isSelected = selectedDays.includes(value);
          return (
            <button
              key={value}
              type='button'
              className={`tour-booking-day-toggle ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleDay(value)}
              aria-pressed={isSelected}
              title={label}
            >
              <span className='tour-booking-day-short'>{short}</span>
              <span className='tour-booking-day-label'>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
