'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { parseDateStringToLocal } from '@/lib/utils';
import { format } from 'date-fns';
import { Edit2, X } from 'lucide-react';

interface DateAvailability {
  id: string;
  date: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  availableSeats: number;
  isSoldOut: boolean;
}

interface FlexibleDatePackageDatesProps {
  dates: DateAvailability[];
  onDatesChange: (dates: DateAvailability[]) => void;
  defaultAdultPrice?: string;
  defaultChildPrice?: string;
  defaultInfantPrice?: string;
}

export default function FlexibleDatePackageDates({
  dates,
  onDatesChange,
  defaultAdultPrice = '',
  defaultChildPrice = '',
  defaultInfantPrice = '',
}: FlexibleDatePackageDatesProps) {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [rangeAdultPrice, setRangeAdultPrice] = useState<string>(
    defaultAdultPrice || ''
  );
  const [rangeChildPrice, setRangeChildPrice] = useState<string>(
    defaultChildPrice || ''
  );
  const [rangeInfantPrice, setRangeInfantPrice] = useState<string>(
    defaultInfantPrice || ''
  );
  const [soldOutFromDate, setSoldOutFromDate] = useState<string>('');
  const [soldOutToDate, setSoldOutToDate] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingDateList, setEditingDateList] = useState<string[]>([]);
  const [editingRangeMeta, setEditingRangeMeta] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [editForm, setEditForm] = useState<{
    adultPrice: string;
    childPrice: string;
    infantPrice: string;
  } | null>(null);

  // Prefill range pricing from the Pricing section (props), but don't override user-entered values.
  useEffect(() => {
    if (!rangeAdultPrice && defaultAdultPrice) setRangeAdultPrice(defaultAdultPrice);
    if (!rangeChildPrice && defaultChildPrice) setRangeChildPrice(defaultChildPrice);
    if (!rangeInfantPrice && defaultInfantPrice) setRangeInfantPrice(defaultInfantPrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultAdultPrice, defaultChildPrice, defaultInfantPrice]);

  // Create a map for quick lookup
  const datesMap = useMemo(() => {
    const map = new Map<string, DateAvailability>();
    dates.forEach(d => map.set(d.date, d));
    return map;
  }, [dates]);

  const generateDateRange = () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both from and to dates');
      return;
    }

    const adultPriceNum = Number(rangeAdultPrice);
    const childPriceNum = rangeChildPrice ? Number(rangeChildPrice) : 0;
    const infantPriceNum = rangeInfantPrice ? Number(rangeInfantPrice) : 0;

    if (!rangeAdultPrice || Number.isNaN(adultPriceNum)) {
      toast.error('Please enter a valid Adult Price for this date range');
      return;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      toast.error('From date must be before to date');
      return;
    }

    const newDates: DateAvailability[] = [];
    const currentDate = new Date(from);

    while (currentDate <= to) {
      const dateStr = currentDate.toISOString().split('T')[0];
      // Only add if doesn't exist
      if (!datesMap.has(dateStr)) {
        newDates.push({
          id: crypto.randomUUID?.() || String(Date.now() + currentDate.getTime()),
          date: dateStr,
          adultPrice: adultPriceNum,
          childPrice: childPriceNum,
          infantPrice: infantPriceNum,
          availableSeats: 45, // Always 45, seats are managed automatically via bookings
          isSoldOut: false,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (newDates.length === 0) {
      toast.info('All dates in range are already added');
      return;
    }

    onDatesChange([...dates, ...newDates]);
    toast.success(`Added ${newDates.length} date(s)`);
    setFromDate('');
    setToDate('');
    setRangeAdultPrice(defaultAdultPrice || '');
    setRangeChildPrice(defaultChildPrice || '');
    setRangeInfantPrice(defaultInfantPrice || '');
  };

  const startEditing = (dateStr: string) => {
    const dateData = datesMap.get(dateStr);
    if (dateData) {
      setEditingDate(dateStr);
      setEditingDateList([dateStr]);
      setEditingRangeMeta(null);
      setEditForm({
        adultPrice: String(dateData.adultPrice),
        childPrice: String(dateData.childPrice),
        infantPrice: String(dateData.infantPrice),
      });
      setShowEditModal(true);
    }
  };

  const startEditingRange = (range: {
    from: string;
    to: string;
    adultPrice: number;
    childPrice: number;
    infantPrice: number;
    dates: DateAvailability[];
  }) => {
    setEditingDate(range.from);
    setEditingDateList(range.dates.map(d => d.date));
    setEditingRangeMeta({ from: range.from, to: range.to });
    const firstDate = range.dates[0];
    setEditForm({
      adultPrice: String(range.adultPrice),
      childPrice: String(range.childPrice),
      infantPrice: String(range.infantPrice),
    });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingDate || !editForm) return;

    const adultPriceNum = Number(editForm.adultPrice);
    const childPriceNum = editForm.childPrice ? Number(editForm.childPrice) : 0;
    const infantPriceNum = editForm.infantPrice ? Number(editForm.infantPrice) : 0;

    if (!editForm.adultPrice || Number.isNaN(adultPriceNum)) {
      toast.error('Please enter a valid Adult Price');
      return;
    }

    const targetDates = editingDateList.length > 0 ? editingDateList : [editingDate];
    const updated = dates.map(d =>
      targetDates.includes(d.date)
        ? {
            ...d,
            adultPrice: adultPriceNum,
            childPrice: childPriceNum,
            infantPrice: infantPriceNum,
            availableSeats: 45, // Always 45, seats are managed automatically
            // Keep existing isSoldOut value
          }
        : d
    );
    onDatesChange(updated);
    toast.success(editingRangeMeta ? 'Range updated' : 'Date updated');

    setShowEditModal(false);
    setEditingDate(null);
    setEditingDateList([]);
    setEditingRangeMeta(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingDate(null);
    setEditingDateList([]);
    setEditingRangeMeta(null);
    setEditForm(null);
  };

  const removeDate = (dateStr: string) => {
    const existingDate = datesMap.get(dateStr);
    if (existingDate) {
      onDatesChange(dates.filter(d => d.id !== existingDate.id));
      toast.success('Date removed');
    }
  };

  const markDatesAsSoldOut = () => {
    if (!soldOutFromDate || !soldOutToDate) {
      toast.error('Please select both From Date and To Date');
      return;
    }

    const from = new Date(soldOutFromDate);
    const to = new Date(soldOutToDate);

    if (from > to) {
      toast.error('From date must be before to date');
      return;
    }

    const newSoldOutDates: DateAvailability[] = [];
    const datesToUpdate = new Set<string>();
    const currentDate = new Date(from);
    const defaultAdult = defaultAdultPrice ? Number(defaultAdultPrice) : 0;
    const defaultChild = defaultChildPrice ? Number(defaultChildPrice) : 0;
    const defaultInfant = defaultInfantPrice ? Number(defaultInfantPrice) : 0;

    // First, collect all dates that need to be updated or created
    while (currentDate <= to) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingDate = datesMap.get(dateStr);
      
      if (existingDate) {
        // Mark existing date for update
        datesToUpdate.add(dateStr);
      } else {
        // Create new sold out date entry
        newSoldOutDates.push({
          id: crypto.randomUUID?.() || String(Date.now() + currentDate.getTime()),
          date: dateStr,
          adultPrice: defaultAdult,
          childPrice: defaultChild,
          infantPrice: defaultInfant,
          availableSeats: 45,
          isSoldOut: true,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Update all existing dates and add new ones in a single operation
    const updatedDates = dates.map(d =>
      datesToUpdate.has(d.date)
        ? { ...d, isSoldOut: true }
        : d
    );

    const finalDates = [...updatedDates, ...newSoldOutDates];
    onDatesChange(finalDates);

    const totalDates = datesToUpdate.size + newSoldOutDates.length;
    if (datesToUpdate.size > 0 && newSoldOutDates.length > 0) {
      toast.success(`Updated ${datesToUpdate.size} existing date(s) and marked ${newSoldOutDates.length} new date(s) as sold out`);
    } else if (datesToUpdate.size > 0) {
      toast.success(`Updated ${datesToUpdate.size} existing date(s) to sold out`);
    } else {
      toast.success(`Marked ${newSoldOutDates.length} date(s) as sold out`);
    }

    setSoldOutFromDate('');
    setSoldOutToDate('');
  };

  // Group dates into consecutive ranges
  const dateRanges = useMemo(() => {
    if (dates.length === 0) return [];
    
    const sortedDates = [...dates].sort((a, b) => a.date.localeCompare(b.date));
    const ranges: Array<{ from: string; to: string; adultPrice: number; childPrice: number; infantPrice: number; dates: DateAvailability[] }> = [];
    let currentRange: { from: string; to: string; adultPrice: number; childPrice: number; infantPrice: number; dates: DateAvailability[] } | null = null;

    sortedDates.forEach((date: DateAvailability) => {
      // Skip sold out dates for range grouping
      if (date.isSoldOut) return;

      const dateObj = parseDateStringToLocal(date.date);
      if (!dateObj) return;

      if (!currentRange) {
        currentRange = {
          from: date.date,
          to: date.date,
          adultPrice: date.adultPrice,
          childPrice: date.childPrice,
          infantPrice: date.infantPrice,
          dates: [date],
        };
      } else {
        const lastDate = parseDateStringToLocal(currentRange.to);
        if (lastDate) {
          const nextDay = new Date(lastDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayStr = format(nextDay, 'yyyy-MM-dd');

          // Check if this date is consecutive and has same prices
          if (
            date.date === nextDayStr &&
            date.adultPrice === currentRange.adultPrice &&
            date.childPrice === currentRange.childPrice &&
            date.infantPrice === currentRange.infantPrice
          ) {
            currentRange.to = date.date;
            currentRange.dates.push(date);
          } else {
            ranges.push(currentRange);
            currentRange = {
              from: date.date,
              to: date.date,
              adultPrice: date.adultPrice,
              childPrice: date.childPrice,
              infantPrice: date.infantPrice,
              dates: [date],
            };
          }
        }
      }
    });

    if (currentRange) {
      ranges.push(currentRange);
    }

    return ranges;
  }, [dates]);

  // Get sold out dates grouped into ranges
  const soldOutRanges = useMemo(() => {
    const soldOutDatesList = dates.filter((d: DateAvailability) => d.isSoldOut).sort((a, b) => a.date.localeCompare(b.date));
    if (soldOutDatesList.length === 0) return [];

    const ranges: Array<{ from: string; to: string; dates: DateAvailability[] }> = [];
    let currentRange: { from: string; to: string; dates: DateAvailability[] } | null = null;

    soldOutDatesList.forEach((date: DateAvailability) => {
      const dateObj = parseDateStringToLocal(date.date);
      if (!dateObj) return;

      if (!currentRange) {
        currentRange = {
          from: date.date,
          to: date.date,
          dates: [date],
        };
      } else {
        const lastDate = parseDateStringToLocal(currentRange.to);
        if (lastDate) {
          const nextDay = new Date(lastDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayStr = format(nextDay, 'yyyy-MM-dd');

          // Check if this date is consecutive
          if (date.date === nextDayStr) {
            currentRange.to = date.date;
            currentRange.dates.push(date);
          } else {
            ranges.push(currentRange);
            currentRange = {
              from: date.date,
              to: date.date,
              dates: [date],
            };
          }
        }
      }
    });

    if (currentRange) {
      ranges.push(currentRange);
    }

    return ranges;
  }, [dates]);

  return (
    <div className='form_row full_width'>
     
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        Date Range & Pricing
        <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
          ({dates.length} dates configured)
        </span>
      </label>

      {/* Date Range Input */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            From Date
          </label>
          <input
            type='date'
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            To Date
          </label>
          <input
            type='date'
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Adult Price (AED) *
          </label>
          <input
            type='text'
            inputMode='numeric'
            value={rangeAdultPrice}
            onChange={e => {
              const val = e.target.value;
              // Allow empty string or valid numbers
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setRangeAdultPrice(val);
              }
            }}
            placeholder={defaultAdultPrice || '1400'}
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Child Price (AED)
          </label>
          <input
            type='text'
            inputMode='numeric'
            value={rangeChildPrice}
            onChange={e => {
              const val = e.target.value;
              // Allow empty string or valid numbers
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setRangeChildPrice(val);
              }
            }}
            placeholder={defaultChildPrice || '0'}
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Infant Price (AED)
          </label>
          <input
            type='text'
            inputMode='numeric'
            value={rangeInfantPrice}
            onChange={e => {
              const val = e.target.value;
              // Allow empty string or valid numbers
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setRangeInfantPrice(val);
              }
            }}
            placeholder={defaultInfantPrice || '0'}
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <button
            type='button'
            className='btn_add_date'
            onClick={generateDateRange}
            style={{ padding: '6px 14px', whiteSpace: 'nowrap', fontSize: '14px' }}
          >
            Generate Dates
          </button>
        </div>
      </div>

      <div style={{ width: '100%', marginTop: '2px', marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
          Default values are prefilled from the Pricing section below, but you can override prices per date-range here.
        </p>
      </div>

      {/* Date Ranges List */}
      {dateRanges.length > 0 && (
        <div>
          <div style={{ marginBottom: '16px', fontWeight: '600', fontSize: '15px', color: '#1f2937' }}>
            Configured Date Ranges
          </div>
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '12px', 
            overflow: 'hidden',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Date Range</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Adult Price (AED)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Child Price (AED)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Infant Price (AED)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Discount</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>No. of Dates</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dateRanges.map((range: { from: string; to: string; adultPrice: number; childPrice: number; infantPrice: number; dates: DateAvailability[] }, idx: number) => {
                  const fromDateObj = parseDateStringToLocal(range.from);
                  const toDateObj = parseDateStringToLocal(range.to);
                  const fromDisplay = fromDateObj ? format(fromDateObj, 'MMM dd, yyyy') : range.from;
                  const toDisplay = toDateObj ? format(toDateObj, 'MMM dd, yyyy') : range.to;
                  const isSingleDate = range.from === range.to;
                  const firstDate = range.dates[0];
                  const hasDiscount = (firstDate?.adultDiscountAmount && firstDate.adultDiscountAmount > 0) ||
                                    (firstDate?.childDiscountAmount && firstDate.childDiscountAmount > 0) ||
                                    (firstDate?.infantDiscountAmount && firstDate.infantDiscountAmount > 0);

                  return (
                    <tr 
                      key={`range-${idx}`} 
                      style={{ 
                        borderBottom: idx < dateRanges.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        {isSingleDate ? (
                          <span>{fromDisplay}</span>
                        ) : (
                          <span>
                            <span style={{ fontWeight: '600' }}>{fromDisplay}</span>
                            <span style={{ color: '#6b7280', margin: '0 8px' }}>→</span>
                            <span style={{ fontWeight: '600' }}>{toDisplay}</span>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#059669', fontWeight: '600' }}>
                        AED {range.adultPrice.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#059669', fontWeight: '600' }}>
                        AED {range.childPrice.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#059669', fontWeight: '600' }}>
                        AED {range.infantPrice.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#9ca3af' }}>
                        —
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}>
                          {range.dates.length} {range.dates.length === 1 ? 'date' : 'dates'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          type='button'
                          onClick={() => startEditingRange(range)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#f97316',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ea580c';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f97316';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

       {/* Mark Dates as Sold Out Section */}
      <h5 className='section_title' style={{ marginTop: '24px', marginBottom: '16px' }}>
        Mark Dates as Sold Out
      </h5>
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
              From Date *
            </label>
            <input
              type='date'
              value={soldOutFromDate}
              onChange={e => setSoldOutFromDate(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '14px', border: '1px solid #dc2626' }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
              To Date *
            </label>
            <input
              type='date'
              value={soldOutToDate}
              onChange={e => setSoldOutToDate(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '14px', border: '1px solid #dc2626' }}
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <button
              type='button'
              onClick={markDatesAsSoldOut}
              style={{
                padding: '6px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              Mark as Sold Out
            </button>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#991b1b', marginTop: '8px', marginBottom: 0 }}>
          Select a date range and click the button to mark those dates as sold out. If dates already exist, they will be updated. If not, new sold out entries will be created.
        </p>
      </div>


      {/* Sold Out Date Ranges */}
      {soldOutRanges.length > 0 && (
        <div>
          <div style={{ marginBottom: '16px', fontWeight: '600', fontSize: '15px', color: '#dc2626' }}>
            Sold Out Date Ranges ({soldOutRanges.reduce((sum, range) => sum + range.dates.length, 0)} dates)
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '10px',
          }}>
            {soldOutRanges.map((range: { from: string; to: string; dates: DateAvailability[] }) => {
              const fromDateObj = parseDateStringToLocal(range.from);
              const toDateObj = parseDateStringToLocal(range.to);
              const fromDisplay = fromDateObj ? format(fromDateObj, 'MMM dd, yyyy') : range.from;
              const toDisplay = toDateObj ? format(toDateObj, 'MMM dd, yyyy') : range.to;
              const isSingleDate = range.from === range.to;
              const dateCount = range.dates.length;

              return (
                <span
                  key={`soldout-${range.from}-${range.to}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.1)',
                  }}
                >
                  <span>
                    {isSingleDate ? (
                      fromDisplay
                    ) : (
                      <>
                        <span style={{ fontWeight: '600' }}>{fromDisplay}</span>
                        <span style={{ margin: '0 6px', opacity: 0.7 }}>→</span>
                        <span style={{ fontWeight: '600' }}>{toDisplay}</span>
                      </>
                    )}
                  </span>
                  <button
                    type='button'
                    onClick={() => {
                      // Remove all dates in range
                      const datesToRemove = new Set(range.dates.map(d => d.date));
                      onDatesChange(dates.filter(d => !datesToRemove.has(d.date)));
                      toast.success(`Removed ${dateCount} sold out date(s)`);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title='Remove range'
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Date Modal */}
      {showEditModal && editingDate && editForm && (
        <div 
          className='modal_overlay' 
          onClick={cancelEdit}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div 
            className='modal' 
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              maxWidth: '760px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <div 
              className='modal_header'
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                {editingRangeMeta ? (
                  <>
                    Edit Range:{' '}
                    {(() => {
                      const fromObj = parseDateStringToLocal(editingRangeMeta.from);
                      const toObj = parseDateStringToLocal(editingRangeMeta.to);
                      const fromLabel = fromObj ? format(fromObj, 'MMM d, yyyy') : editingRangeMeta.from;
                      const toLabel = toObj ? format(toObj, 'MMM d, yyyy') : editingRangeMeta.to;
                      return `${fromLabel} → ${toLabel}`;
                    })()}{' '}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>
                      ({editingDateList.length} {editingDateList.length === 1 ? 'date' : 'dates'})
                    </span>
                  </>
                ) : (
                  <>
                    Edit Date:{' '}
                    {format(parseDateStringToLocal(editingDate) || new Date(editingDate), 'MMM d, yyyy')}
                  </>
                )}
              </h4>
              <button 
                className='modal_close' 
                onClick={cancelEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                ×
              </button>
            </div>
            <div 
              className='modal_body'
              style={{
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: editingRangeMeta ? 'repeat(2, minmax(0, 1fr)) repeat(3, minmax(0, 1fr))' : '1fr repeat(3, minmax(0, 1fr))',
                  gap: '12px',
                  alignItems: 'end',
                  marginBottom: '20px',
                }}
              >
                {editingRangeMeta ? (
                  <>
                    <div className='form_row' style={{ marginBottom: 0 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        From Date
                      </label>
                      <input
                        type='text'
                        value={format(
                          parseDateStringToLocal(editingRangeMeta.from) || new Date(editingRangeMeta.from),
                          'MMM d, yyyy'
                        )}
                        readOnly
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280',
                          cursor: 'not-allowed',
                          fontSize: '13px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                      />
                    </div>
                    <div className='form_row' style={{ marginBottom: 0 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        To Date
                      </label>
                      <input
                        type='text'
                        value={format(
                          parseDateStringToLocal(editingRangeMeta.to) || new Date(editingRangeMeta.to),
                          'MMM d, yyyy'
                        )}
                        readOnly
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280',
                          cursor: 'not-allowed',
                          fontSize: '13px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className='form_row' style={{ marginBottom: 0 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                      Date
                    </label>
                    <input
                      type='text'
                      value={format(
                        parseDateStringToLocal(editingDate) || new Date(editingDate),
                        'MMM d, yyyy'
                      )}
                      readOnly
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#f9fafb',
                        color: '#6b7280',
                        cursor: 'not-allowed',
                        fontSize: '13px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                      }}
                    />
                  </div>
                )}

                <div className='form_row' style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    Adult (AED) *
                  </label>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={editForm.adultPrice}
                    onChange={e => {
                      const val = e.target.value;
                      // Allow empty string or valid numbers
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setEditForm({ ...editForm, adultPrice: val });
                      }
                    }}
                    placeholder='1400'
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f97316';
                      e.currentTarget.style.outline = 'none';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>

                <div className='form_row' style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    Child (AED)
                  </label>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={editForm.childPrice}
                    onChange={e => {
                      const val = e.target.value;
                      // Allow empty string or valid numbers
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setEditForm({ ...editForm, childPrice: val });
                      }
                    }}
                    placeholder='0'
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f97316';
                      e.currentTarget.style.outline = 'none';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>

                <div className='form_row' style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    Infant (AED)
                  </label>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={editForm.infantPrice}
                    onChange={e => {
                      const val = e.target.value;
                      // Allow empty string or valid numbers
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setEditForm({ ...editForm, infantPrice: val });
                      }
                    }}
                    placeholder='0'
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f97316';
                      e.currentTarget.style.outline = 'none';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>

              </div>
            </div>
            <div 
              className='modal_footer' 
              style={{ 
                padding: '20px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <button
                type='button'
                onClick={() => {
                  if (editingRangeMeta) {
                    const toRemove = new Set(editingDateList);
                    onDatesChange(dates.filter(d => !toRemove.has(d.date)));
                    toast.success('Range removed');
                  } else {
                    removeDate(editingDate);
                  }
                  cancelEdit();
                }}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                }}
              >
                <X size={16} />
                {editingRangeMeta ? 'Remove Range' : 'Remove Date'}
              </button>
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button 
                  type='button'
                  onClick={cancelEdit}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={saveEdit}
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ea580c';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f97316';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
              </div>
            </div>
          )}
    </div>
  );
}
