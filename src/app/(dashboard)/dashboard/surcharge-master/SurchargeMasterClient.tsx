'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

type SurchargeRow = {
  id: string;
  price: number;
  from_date: string;
  to_date: string;
  created_at?: string | null;
  updated_at?: string | null;
};

function formatDate(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB');
}

function toInputDate(value: string | undefined): string {
  if (!value) return '';
  return value.split('T')[0];
}

export default function SurchargeMasterClient() {
  const [rows, setRows] = useState<SurchargeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SurchargeRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        const res = await fetch(`/api/surcharge-master?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error ?? 'Failed to load surcharges');
        }
        const json = await res.json();
        if (!active) return;
        setRows(json.data ?? []);
        setTotal(json.total ?? 0);
      } catch (e: unknown) {
        if (!active) return;
        if (e instanceof Error && e.name !== 'AbortError') {
          toast.error(e.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, limit, reloadKey]);

  const handleDelete = (row: SurchargeRow) => {
    if (!confirm(`Delete surcharge AED ${row.price} (${formatDate(row.from_date)} – ${formatDate(row.to_date)})?`)) {
      return;
    }

    setDeletingId(row.id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/surcharge-master/${row.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error ?? 'Failed to delete');
        }
        toast.success('Surcharge deleted');
        setReloadKey(k => k + 1);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to delete');
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Surcharge Master</h3>
        <p>Manage surcharges by date range</p>
      </div>

      <div className='table_toolbar'>
        <div className='table_search' />
        <div className='table_actions'>
          <button
            className='btn_primary'
            onClick={() => {
              setEditingRow(null);
              setModalOpen(true);
            }}
          >
            Add Surcharge
          </button>
        </div>
      </div>

      <div className='table_wrapper'>
        <table className='table'>
          <thead>
            <tr>
              <th>Price (AED)</th>
              <th>From Date</th>
              <th>To Date</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className='table_loading'>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className='table_empty'>
                  No surcharges found
                </td>
              </tr>
            )}
            {!loading &&
              rows.map(row => (
                <tr key={row.id}>
                  <td>{Number(row.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{formatDate(row.from_date)}</td>
                  <td>{formatDate(row.to_date)}</td>
                  <td>
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className='table_action_btn'
                        onClick={() => {
                          setEditingRow(row);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className='btn_secondary btn_small btn_danger'
                        onClick={() => handleDelete(row)}
                        disabled={deletingId === row.id || isPending}
                        title='Delete surcharge'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className='table_pagination'>
        <div className='pagination_info'>
          Page {page} of {totalPages} • {total} total
        </div>
        <div className='pagination_controls'>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <select
            value={limit}
            onChange={e => {
              setPage(1);
              setLimit(parseInt(e.target.value, 10));
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {modalOpen && (
        <SurchargeModal
          row={editingRow}
          submitting={isPending}
          onClose={() => {
            setModalOpen(false);
            setEditingRow(null);
          }}
          onSubmit={({ price, from_date, to_date }) => {
            startTransition(async () => {
              try {
                const isEdit = !!editingRow;
                const res = await fetch('/api/surcharge-master', {
                  method: isEdit ? 'PUT' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(
                    isEdit
                      ? { id: editingRow.id, price, from_date, to_date }
                      : { price, from_date, to_date }
                  ),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to save');
                }
                toast.success(isEdit ? 'Surcharge updated' : 'Surcharge added');
                setModalOpen(false);
                setEditingRow(null);
                if (!isEdit) setPage(1);
                setReloadKey(k => k + 1);
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : 'Failed to save');
              }
            });
          }}
        />
      )}
    </div>
  );
}

function SurchargeModal({
  row,
  onClose,
  onSubmit,
  submitting,
}: {
  row: SurchargeRow | null;
  onClose: () => void;
  onSubmit: (data: {
    price: number;
    from_date: string;
    to_date: string;
  }) => void;
  submitting: boolean;
}) {
  const [price, setPrice] = useState(
    row?.price != null ? String(row.price) : ''
  );
  const [fromDate, setFromDate] = useState(toInputDate(row?.from_date));
  const [toDate, setToDate] = useState(toInputDate(row?.to_date));

  useEffect(() => {
    setPrice(row?.price != null ? String(row.price) : '');
    setFromDate(toInputDate(row?.from_date));
    setToDate(toInputDate(row?.to_date));
  }, [row]);

  const handleSubmit = () => {
    const priceNum = Number(price);
    if (!fromDate || !toDate) {
      toast.error('Please select from and to dates');
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      toast.error('To date must be on or after from date');
      return;
    }
    onSubmit({ price: priceNum, from_date: fromDate, to_date: toDate });
  };

  const modalContent = (
    <div className='modal_overlay' onClick={onClose}>
      <div className='modal' onClick={e => e.stopPropagation()}>
        <div className='modal_header'>
          <h4>{row ? 'Edit Surcharge' : 'Add Surcharge'}</h4>
          <button className='modal_close' onClick={onClose}>
            ×
          </button>
        </div>
        <div className='modal_body'>
          <div className='form_row'>
            <label>Price (AED) *</label>
            <input
              type='text'
              inputMode='decimal'
              value={price}
              onChange={e => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setPrice(val);
                }
              }}
              placeholder='e.g. 150'
            />
          </div>
          <div className='form_row'>
            <label>From Date *</label>
            <input
              type='date'
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
          <div className='form_row'>
            <label>To Date *</label>
            <input
              type='date'
              value={toDate}
              min={fromDate || undefined}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
        </div>
        <div className='modal_footer'>
          <button onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className='btn_primary'
            onClick={handleSubmit}
            disabled={submitting || !price || !fromDate || !toDate}
          >
            {submitting ? 'Saving...' : row ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
