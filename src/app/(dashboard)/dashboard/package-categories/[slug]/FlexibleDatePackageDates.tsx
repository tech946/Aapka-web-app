'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { parseDateStringToLocal } from '@/lib/utils';
import { format } from 'date-fns';
import { Edit2, X, Plus } from 'lucide-react';

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
  defaultAdultPrice?: string;
  defaultChildPrice?: string;
  defaultInfantPrice?: string;
}

export default function FlexibleDatePackageDates({
  dateRanges,
  onDateRangesChange,
  defaultAdultPrice = '',
  defaultChildPrice = '',
  defaultInfantPrice = '',
}: FlexibleDatePackageDatesProps) {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [rangeAdultPrice, setRangeAdultPrice] = useState<string>(defaultAdultPrice || '');
  const [rangeChildPrice, setRangeChildPrice] = useState<string>(defaultChildPrice || '');
  const [rangeInfantPrice, setRangeInfantPrice] = useState<string>(defaultInfantPrice || '');
  const [rangeSoloTravellerPrice, setRangeSoloTravellerPrice] = useState<string>('');
  
  // Sold out form
  const [soldOutFromDate, setSoldOutFromDate] = useState<string>('');
  const [soldOutToDate, setSoldOutToDate] = useState<string>('');
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRange, setEditingRange] = useState<DateRange | null>(null);
  const [editForm, setEditForm] = useState<{
    fromDate: string;
    toDate: string;
    adultPrice: string;
    childPrice: string;
    infantPrice: string;
    soloTravellerPrice: string;
  } | null>(null);

  const addDateRange = () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both from and to dates');
      return;
    }

    const adultPriceNum = Number(rangeAdultPrice);
    const childPriceNum = rangeChildPrice ? Number(rangeChildPrice) : 0;
    const infantPriceNum = rangeInfantPrice ? Number(rangeInfantPrice) : 0;

    if (!rangeAdultPrice || Number.isNaN(adultPriceNum)) {
      toast.error('Please enter a valid Adult Price');
      return;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      toast.error('From date must be before or equal to to date');
      return;
    }

    // Check for overlapping ranges
    const hasOverlap = dateRanges.some(range => {
      if (range.isSoldOut) return false; // Don't check overlap with sold out ranges
      const rangeFrom = new Date(range.fromDate);
      const rangeTo = new Date(range.toDate);
      return (from <= rangeTo && to >= rangeFrom);
    });

    if (hasOverlap) {
      toast.error('This date range overlaps with an existing range');
      return;
    }

    const soloTravellerPriceNum = rangeSoloTravellerPrice ? Number(rangeSoloTravellerPrice) : null;
    
    console.log('rangeSoloTravellerPrice input value:', rangeSoloTravellerPrice);
    console.log('soloTravellerPriceNum calculated:', soloTravellerPriceNum);

    const newRange: DateRange = {
      id: crypto.randomUUID?.() || String(Date.now()),
      fromDate,
      toDate,
      adultPrice: adultPriceNum,
      childPrice: childPriceNum,
      infantPrice: infantPriceNum,
      soloTravellerPrice: soloTravellerPriceNum,
      isSoldOut: false,
    };

    console.log('Adding new date range:', JSON.stringify(newRange, null, 2));
    onDateRangesChange([...dateRanges, newRange]);
    toast.success('Date range added');
    
    // Reset form
    setFromDate('');
    setToDate('');
    setRangeAdultPrice(defaultAdultPrice || '');
    setRangeChildPrice(defaultChildPrice || '');
    setRangeInfantPrice(defaultInfantPrice || '');
    setRangeSoloTravellerPrice('');
  };

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

  const startEditing = (range: DateRange) => {
    setEditingRange(range);
    setEditForm({
      fromDate: range.fromDate,
      toDate: range.toDate,
      adultPrice: String(range.adultPrice),
      childPrice: String(range.childPrice),
      infantPrice: String(range.infantPrice),
      soloTravellerPrice: range.soloTravellerPrice ? String(range.soloTravellerPrice) : '',
    });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingRange || !editForm) return;

    const adultPriceNum = Number(editForm.adultPrice);
    const childPriceNum = editForm.childPrice ? Number(editForm.childPrice) : 0;
    const infantPriceNum = editForm.infantPrice ? Number(editForm.infantPrice) : 0;
    const soloTravellerPriceNum = editForm.soloTravellerPrice ? Number(editForm.soloTravellerPrice) : null;

    console.log('saveEdit - editForm.soloTravellerPrice:', editForm.soloTravellerPrice);
    console.log('saveEdit - soloTravellerPriceNum:', soloTravellerPriceNum);

    if (!editForm.adultPrice || Number.isNaN(adultPriceNum)) {
      toast.error('Please enter a valid Adult Price');
      return;
    }

    if (!editForm.fromDate || !editForm.toDate) {
      toast.error('Please select both from and to dates');
      return;
    }

    const from = new Date(editForm.fromDate);
    const to = new Date(editForm.toDate);

    if (from > to) {
      toast.error('From date must be before or equal to to date');
      return;
    }

    // Check for overlapping ranges (excluding the current one being edited)
    const hasOverlap = dateRanges.some(range => {
      if (range.id === editingRange.id || range.isSoldOut) return false;
      const rangeFrom = new Date(range.fromDate);
      const rangeTo = new Date(range.toDate);
      return (from <= rangeTo && to >= rangeFrom);
    });

    if (hasOverlap) {
      toast.error('This date range overlaps with an existing range');
      return;
    }

    const updated = dateRanges.map(r =>
      r.id === editingRange.id
        ? {
            ...r,
            fromDate: editForm.fromDate,
            toDate: editForm.toDate,
            adultPrice: adultPriceNum,
            childPrice: childPriceNum,
            infantPrice: infantPriceNum,
            soloTravellerPrice: soloTravellerPriceNum,
          }
        : r
    );
    
    console.log('Updating date range:', updated.find(r => r.id === editingRange.id));
    onDateRangesChange(updated);
    toast.success('Date range updated');
    cancelEdit();
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingRange(null);
    setEditForm(null);
  };

  const removeRange = (id: string) => {
    onDateRangesChange(dateRanges.filter(r => r.id !== id));
    toast.success('Date range removed');
  };

  // Separate available and sold out ranges
  const availableRanges = dateRanges
    .filter(r => !r.isSoldOut)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate));
  const soldOutRanges = dateRanges
    .filter(r => r.isSoldOut)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate));

  const formatDateDisplay = (dateStr: string) => {
    const dateObj = parseDateStringToLocal(dateStr);
    return dateObj ? format(dateObj, 'MMM dd, yyyy') : dateStr;
  };

  return (
    <div className='form_row full_width'>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        Date Range & Pricing
        <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
          ({dateRanges.length} range(s) configured)
        </span>
      </label>

      {/* Add Date Range Form */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            From Date *
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
            To Date *
          </label>
          <input
            type='date'
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '100px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Adult Price (AED) *
          </label>
          <input
            type='text'
            inputMode='numeric'
            value={rangeAdultPrice}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setRangeAdultPrice(val);
              }
            }}
            placeholder={defaultAdultPrice || '1400'}
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '100px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Child Price (AED)
          </label>
          <input
            type='text'
            inputMode='numeric'
            value={rangeChildPrice}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setRangeChildPrice(val);
              }
            }}
            placeholder={defaultChildPrice || '0'}
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '100px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Infant Price (AED)
          </label>
          <input
            type='text'
            inputMode='numeric'
            value={rangeInfantPrice}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setRangeInfantPrice(val);
              }
            }}
            placeholder={defaultInfantPrice || '0'}
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '100px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Solo Traveller Price (AED)
          </label>
          <input
            type='text'
            inputMode='numeric'
            value={rangeSoloTravellerPrice}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setRangeSoloTravellerPrice(val);
              }
            }}
            placeholder='Optional'
            style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <button
            type='button'
            className='btn_add_date'
            onClick={addDateRange}
            style={{ padding: '6px 14px', whiteSpace: 'nowrap', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            Add Range
          </button>
        </div>
      </div>

      {/* Available Date Ranges Table */}
      {availableRanges.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
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
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Adult Price</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Child Price</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Infant Price</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Solo Traveller Price</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {availableRanges.map((range, idx) => {
                  const isSingleDate = range.fromDate === range.toDate;
                  return (
                    <tr 
                      key={range.id} 
                      style={{ 
                        borderBottom: idx < availableRanges.length - 1 ? '1px solid #f3f4f6' : 'none',
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        {isSingleDate ? (
                          <span>{formatDateDisplay(range.fromDate)}</span>
                        ) : (
                          <span>
                            <span style={{ fontWeight: '600' }}>{formatDateDisplay(range.fromDate)}</span>
                            <span style={{ color: '#6b7280', margin: '0 8px' }}>→</span>
                            <span style={{ fontWeight: '600' }}>{formatDateDisplay(range.toDate)}</span>
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
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: range.soloTravellerPrice ? '#059669' : '#9ca3af', fontWeight: '600' }}>
                        {range.soloTravellerPrice ? `AED ${range.soloTravellerPrice.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type='button'
                            onClick={() => startEditing(range)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f97316',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            type='button'
                            onClick={() => removeRange(range.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mark as Sold Out Section */}
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
              onClick={markAsSoldOut}
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
              }}
            >
              Mark as Sold Out
            </button>
          </div>
        </div>
      </div>

      {/* Sold Out Ranges */}
      {soldOutRanges.length > 0 && (
        <div>
          <div style={{ marginBottom: '16px', fontWeight: '600', fontSize: '15px', color: '#dc2626' }}>
            Sold Out Date Ranges ({soldOutRanges.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {soldOutRanges.map(range => {
              const isSingleDate = range.fromDate === range.toDate;
              return (
                <span
                  key={range.id}
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
                  }}
                >
                  <span>
                    {isSingleDate ? (
                      formatDateDisplay(range.fromDate)
                    ) : (
                      <>
                        <span style={{ fontWeight: '600' }}>{formatDateDisplay(range.fromDate)}</span>
                        <span style={{ margin: '0 6px', opacity: 0.7 }}>→</span>
                        <span style={{ fontWeight: '600' }}>{formatDateDisplay(range.toDate)}</span>
                      </>
                    )}
                  </span>
                  <button
                    type='button'
                    onClick={() => removeRange(range.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px',
                    }}
                    title='Remove'
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRange && editForm && (
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
              maxWidth: '600px',
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
                Edit Date Range
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
                }}
              >
                ×
              </button>
            </div>
            <div className='modal_body' style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    From Date *
                  </label>
                  <input
                    type='date'
                    value={editForm.fromDate}
                    onChange={e => setEditForm({ ...editForm, fromDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    To Date *
                  </label>
                  <input
                    type='date'
                    value={editForm.toDate}
                    onChange={e => setEditForm({ ...editForm, toDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    Adult Price (AED) *
                  </label>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={editForm.adultPrice}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setEditForm({ ...editForm, adultPrice: val });
                      }
                    }}
                    placeholder='1400'
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    Child Price (AED)
                  </label>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={editForm.childPrice}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setEditForm({ ...editForm, childPrice: val });
                      }
                    }}
                    placeholder='0'
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    Infant Price (AED)
                  </label>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={editForm.infantPrice}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setEditForm({ ...editForm, infantPrice: val });
                      }
                    }}
                    placeholder='0'
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    Solo Traveller Price (AED)
                  </label>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={editForm.soloTravellerPrice}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setEditForm({ ...editForm, soloTravellerPrice: val });
                      }
                    }}
                    placeholder='Optional'
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
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
                justifyContent: 'flex-end', 
                gap: '12px',
              }}
            >
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
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
