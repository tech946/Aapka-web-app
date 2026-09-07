'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { parseDateStringToLocal } from '@/lib/utils';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import {
  DEFAULT_SURCHARGE_BLOCK_DAYS_BEFORE,
  MAX_SURCHARGE_BLOCK_DAYS_BEFORE,
  getSurchargeBlockedWindows,
  normalizeSurchargeBlockDaysBefore,
} from '@/lib/anydate-availability';
import type { SurchargeMasterEntry } from '@/lib/surcharge-master';

/**
 * Any-date packages are bookable on any date. The only thing configured here is
 * what to close off: dates marked sold out, and how many days ahead of a hotel
 * surcharge range to stop taking bookings.
 *
 * `isSoldOut` is always true on the entries this component produces — the price
 * fields stay on the type only so older records keep parsing.
 */
export interface DateRange {
  id: string;
  fromDate: string;
  toDate: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  soloTravellerPrice?: number | null;
  isSoldOut: boolean;
}

interface FlexibleDatePackageDatesProps {
  dateRanges: DateRange[];
  onDateRangesChange: (dateRanges: DateRange[]) => void;
  surchargeBlockDaysBefore: string;
  onSurchargeBlockDaysBeforeChange: (value: string) => void;
}

export default function FlexibleDatePackageDates({
  dateRanges,
  onDateRangesChange,
  surchargeBlockDaysBefore,
  onSurchargeBlockDaysBeforeChange,
}: FlexibleDatePackageDatesProps) {
  // Sold out form
  const [soldOutFromDate, setSoldOutFromDate] = useState<string>('');
  const [soldOutToDate, setSoldOutToDate] = useState<string>('');

  // Hotel surcharges, so the blocked windows can be previewed here
  const [surcharges, setSurcharges] = useState<SurchargeMasterEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchSurcharges = async () => {
      try {
        const res = await fetch('/api/surcharge-master?limit=100&page=1');
        const json = await res.json();
        if (!cancelled && Array.isArray(json?.data)) {
          setSurcharges(json.data);
        }
      } catch {
        // Preview only - a failed fetch just hides the blocked-window list
      }
    };

    fetchSurcharges();
    return () => {
      cancelled = true;
    };
  }, []);

  const markAsSoldOut = () => {
    if (!soldOutFromDate || !soldOutToDate) {
      toast.error('Please select both from and to dates');
      return;
    }

    const from = new Date(soldOutFromDate);
    const to = new Date(soldOutToDate);

    if (from > to) {
      toast.error('From date must be before or equal to to date');
      return;
    }

    const newRange: DateRange = {
      id: crypto.randomUUID?.() || String(Date.now()),
      fromDate: soldOutFromDate,
      toDate: soldOutToDate,
      adultPrice: 0,
      childPrice: 0,
      infantPrice: 0,
      soloTravellerPrice: null,
      isSoldOut: true,
    };

    onDateRangesChange([...dateRanges, newRange]);
    toast.success('Date range marked as sold out');

    // Reset form
    setSoldOutFromDate('');
    setSoldOutToDate('');
  };

  const removeRange = (id: string) => {
    onDateRangesChange(dateRanges.filter(r => r.id !== id));
    toast.success('Date range removed');
  };

  const soldOutRanges = dateRanges
    .filter(r => r.isSoldOut)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate));

  /** "3 Nov – 10 Nov 2026", dropping the repeated year and the single-date arrow */
  const formatRange = (from: Date, to: Date) => {
    if (from.getTime() === to.getTime()) return format(from, 'd MMM yyyy');
    if (from.getFullYear() === to.getFullYear()) {
      return `${format(from, 'd MMM')} – ${format(to, 'd MMM yyyy')}`;
    }
    return `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`;
  };

  const formatRangeStrings = (fromStr: string, toStr: string) => {
    const from = parseDateStringToLocal(fromStr);
    const to = parseDateStringToLocal(toStr);
    if (!from || !to) return `${fromStr} – ${toStr}`;
    return formatRange(from, to);
  };

  // Upcoming surcharge windows the calendar will close off
  const blockedWindows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getSurchargeBlockedWindows(surcharges, surchargeBlockDaysBefore)
      .filter(w => w.to >= today)
      .sort((a, b) => a.from.getTime() - b.from.getTime());
  }, [surcharges, surchargeBlockDaysBefore]);

  const effectiveBlockDays = normalizeSurchargeBlockDaysBefore(
    surchargeBlockDaysBefore
  );

  return (
    <div className='form_row full_width'>
      <h5 className='section_title' style={{ marginTop: '0', marginBottom: '12px' }}>
        Any-Date Availability
      </h5>
      <div
        style={{
          marginBottom: '18px',
          padding: '10px 14px',
          backgroundColor: 'var(--badge-bg)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--text)',
          lineHeight: 1.5,
        }}
      >
        Travellers can book <strong>any date</strong> on this package, priced
        from the Pricing section below. Only the dates you mark sold out, and
        hotel surcharge dates, are closed off.
      </div>

      {/* Surcharge blackout */}
      <h5 className='section_title' style={{ marginTop: '0', marginBottom: '12px' }}>
        Hotel Surcharge Blackout
      </h5>
      <div
        style={{
          marginBottom: '18px',
          padding: '14px 16px',
          backgroundColor: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        <label
          style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text)',
          }}
        >
          Days blocked before a surcharge *
        </label>
        <input
          type='number'
          min={0}
          max={MAX_SURCHARGE_BLOCK_DAYS_BEFORE}
          value={surchargeBlockDaysBefore}
          onChange={e => onSurchargeBlockDaysBeforeChange(e.target.value)}
          placeholder={String(DEFAULT_SURCHARGE_BLOCK_DAYS_BEFORE)}
          style={{
            width: '90px',
            padding: '5px 8px',
            fontSize: '13px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        />
        <div
          style={{
            marginTop: '6px',
            fontSize: '10.5px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Surcharge dates are never bookable. Set to {effectiveBlockDays}, the{' '}
          {effectiveBlockDays === 1 ? 'day' : `${effectiveBlockDays} days`}{' '}
          before each surcharge starts{' '}
          {effectiveBlockDays === 1 ? 'is' : 'are'} closed as well — a 6 Nov –
          10 Nov surcharge with 3 days blocks 3 Nov – 10 Nov. Surcharge ranges
          are managed in Surcharge Master.
        </div>

        {blockedWindows.length > 0 && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '12px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Upcoming blocked windows ({blockedWindows.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {blockedWindows.map(window => (
                <span
                  key={window.surcharge.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    backgroundColor: 'var(--badge-bg)',
                    color: 'var(--accent)',
                    border: '1px solid var(--badge-fg)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatRange(window.from, window.to)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mark as Sold Out Section */}
      <h5 className='section_title' style={{ marginTop: '18px', marginBottom: '12px' }}>
        Mark Dates as Sold Out
      </h5>
      <div
        style={{
          marginBottom: '14px',
          padding: '14px 16px',
          backgroundColor: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '160px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              From Date *
            </label>
            <input
              type='date'
              value={soldOutFromDate}
              onChange={e => setSoldOutFromDate(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '6px' }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '160px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              To Date *
            </label>
            <input
              type='date'
              value={soldOutToDate}
              onChange={e => setSoldOutToDate(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '6px' }}
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <button
              type='button'
              onClick={markAsSoldOut}
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Mark as Sold Out
            </button>
          </div>
        </div>

        {soldOutRanges.length > 0 && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '12px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Sold out dates ({soldOutRanges.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {soldOutRanges.map(range => (
                <span
                  key={range.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 6px 3px 10px',
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fca5a5',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatRangeStrings(range.fromDate, range.toDate)}
                  <button
                    type='button'
                    onClick={() => removeRange(range.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b91c1c',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title='Remove'
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
