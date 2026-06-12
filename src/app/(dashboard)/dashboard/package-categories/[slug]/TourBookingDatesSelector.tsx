'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { parseDateStringToLocal } from '@/lib/utils';
import './tour-booking-days.css';

type TourBookingDatesSelectorProps = {
  bookingDates: Array<{ id: string; value: string }>;
  onBookingDatesChange: (
    dates: Array<{ id: string; value: string }>
  ) => void;
};

export default function TourBookingDatesSelector({
  bookingDates,
  onBookingDatesChange,
}: TourBookingDatesSelectorProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const addDate = (value: string) => {
    if (!value) {
      toast.error('Please select a date to add');
      return;
    }
    if (bookingDates.some(d => d.value === value)) {
      toast.error('Date already added');
      return;
    }
    onBookingDatesChange([
      ...bookingDates,
      {
        id: crypto.randomUUID?.() || String(Date.now()),
        value,
      },
    ]);
  };

  return (
    <div className='form_row full_width'>
      <label>Specific Booking Dates (Optional)</label>
      <p className='tour-booking-days-hint'>
        Add exact dates customers can book. When added, only these dates appear
        on the website calendar for this tour (overrides weekday selection above).
        Leave empty to use weekday rules instead.
      </p>
      <div className='date_input_group'>
        <input
          ref={dateInputRef}
          type='date'
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDate(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        <button
          type='button'
          className='btn_add_date'
          onClick={() => {
            if (!dateInputRef.current?.value) {
              toast.error('Please select a date to add');
              return;
            }
            addDate(dateInputRef.current.value);
            dateInputRef.current.value = '';
          }}
        >
          + Add Date
        </button>
      </div>
      {bookingDates.length > 0 && (
        <div className='date_chips' style={{ marginTop: '12px' }}>
          {bookingDates.map(d => {
            const parsed = parseDateStringToLocal(d.value);
            const display = parsed ? parsed.toLocaleDateString() : d.value;
            return (
              <span key={d.id} className='date_chip'>
                {display}
                <button
                  type='button'
                  onClick={() =>
                    onBookingDatesChange(
                      bookingDates.filter(x => x.id !== d.id)
                    )
                  }
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
