'use client';

import { Calendar } from 'lucide-react';
import './CheckInDateSelector.css';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

interface CheckInDateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  disabled?: boolean;
  /** Effective nights — used to compute check-out date */
  effectiveNights?: number;
}

export function CheckInDateSelector({
  value,
  onChange,
  minDate,
  disabled = false,
  effectiveNights = 0,
}: CheckInDateSelectorProps) {
  const today = new Date().toISOString().split('T')[0];
  const min = minDate || today;
  const checkOutDate = value && effectiveNights > 0 ? addDays(value, effectiveNights) : '';

  return (
    <div className="checkin-date-selector">
      <label className="checkin-date-label">
        <Calendar size={16} />
        Travel Dates
      </label>
      <div className="checkin-date-fields">
        <div className="checkin-date-field">
          <span className="checkin-date-field-label">Check-in</span>
          <input
            type="date"
            className="checkin-date-input"
            value={value || min}
            min={min}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="checkin-date-field">
          <span className="checkin-date-field-label">Check-out</span>
          <div className="checkin-date-output">
            {checkOutDate ? formatDisplayDate(checkOutDate) : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
