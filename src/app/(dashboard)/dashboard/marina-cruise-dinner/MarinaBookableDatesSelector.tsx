'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { parseDateStringToLocal } from '@/lib/utils';

type MarinaBookableDatesSelectorProps = {
  dates: string[];
  onDatesChange: (dates: string[]) => void;
};

export default function MarinaBookableDatesSelector({
  dates,
  onDatesChange,
}: MarinaBookableDatesSelectorProps) {
  const [pendingDate, setPendingDate] = useState('');

  const addDate = () => {
    if (!pendingDate) {
      toast.error('Please select a date to add');
      return;
    }
    if (dates.includes(pendingDate)) {
      toast.error('Date already added');
      return;
    }
    onDatesChange([...dates, pendingDate].sort());
    setPendingDate('');
  };

  const removeDate = (value: string) => {
    onDatesChange(dates.filter(d => d !== value));
  };

  return (
    <div className='form_row full_width'>
      <label>Select Dates</label>
      <p className='tour-booking-days-hint'>
        Add specific calendar dates customers can book. Required if no booking
        days are selected above; otherwise optional extras on top of weekdays.
      </p>
      <div className='date_input_group'>
        <input
          type='date'
          value={pendingDate}
          onChange={e => setPendingDate(e.target.value)}
        />
        <button type='button' className='btn_add_date' onClick={addDate}>
          + Add Date
        </button>
      </div>
      {dates.length > 0 && (
        <div className='date_chips'>
          {dates.map(dateStr => {
            const parsed = parseDateStringToLocal(dateStr);
            const display = parsed
              ? parsed.toLocaleDateString()
              : dateStr;
            return (
              <span key={dateStr} className='date_chip'>
                {display}
                <button type='button' onClick={() => removeDate(dateStr)}>
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
