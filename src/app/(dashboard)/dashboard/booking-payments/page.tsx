'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

type CartItem = {
  packageId?: string;
  adults?: number;
  children?: number;
  infants?: number;
  selectedDate?: string | null;
  isSoloTraveller?: boolean;
  withVisa?: boolean;
  price?: number;
};

type LtdBookingRow = {
  id: string;
  limited_time_deal_id?: string | null;
  ltd_package_name?: string | null;
  package_ids: string[];
  total_amount: number;
  payment_amount?: number | null;
  payment_amount_currency?: string | null;
  payment_method: string;
  payment_status: string;
  payment_transaction_id?: string | null;
  payment_type?: string | null;
  payment_gateway?: string | null;
  booking_status: string;
  passengers: unknown;
  cart_items: unknown;
  created_at: string;
  updated_at: string;
};

function getFirstCartItem(booking: LtdBookingRow): CartItem | null {
  if (!Array.isArray(booking.cart_items) || booking.cart_items.length === 0)
    return null;
  return booking.cart_items[0] as CartItem;
}

function getLeadPassenger(booking: LtdBookingRow) {
  const passengers = Array.isArray(booking.passengers)
    ? booking.passengers
    : [];
  const p = (passengers[0] || {}) as Record<string, string>;
  const name = `${p.salutation || ''} ${p.firstName || ''} ${p.lastName || ''}`.trim();
  return {
    salutation: p.salutation || '',
    name: name || '—',
    firstName: p.firstName || '',
    lastName: p.lastName || '',
    email: p.email || '—',
    phone: p.phone || '—',
    whatsapp: p.whatsapp || '—',
  };
}

function formatTravelDate(raw: string | null | undefined): string {
  if (!raw) return '—';
  const d = new Date(String(raw).split('T')[0]);
  if (Number.isNaN(d.getTime())) return String(raw);
  return format(d, 'MMM dd, yyyy');
}

/** Solo = 1 adult, 0 child, 0 infant for display (matches API-normalized cart_items) */
function getDisplayAdults(item: CartItem | null): string | number {
  if (!item) return '—';
  if (item.isSoloTraveller) return 1;
  return item.adults ?? '—';
}

function getDisplayChildren(item: CartItem | null): string | number {
  if (!item) return '—';
  if (item.isSoloTraveller) return 0;
  return item.children ?? '—';
}

function getDisplayInfants(item: CartItem | null): string | number {
  if (!item) return '—';
  if (item.isSoloTraveller) return 0;
  return item.infants ?? '—';
}

export default function BookingPaymentsPage() {
  const [rows, setRows] = useState<LtdBookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LtdBookingRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(pendingQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          limited_time_deal: 'only',
        });
        if (query) params.append('search', query);
        if (paymentStatusFilter)
          params.append('payment_status', paymentStatusFilter);

        const res = await fetch(`/api/bookings?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load booking payments');
        const json = await res.json();
        if (!active) return;
        setRows(json.data ?? []);
        setTotal(json.pagination?.total ?? 0);
      } catch (e: unknown) {
        if (!active) return;
        if ((e as Error).name !== 'AbortError') {
          setError((e as Error)?.message ?? 'Error');
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
  }, [page, limit, query, paymentStatusFilter]);

  const getPaymentStatusBadge = (status: string) => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#fef3c7', text: '#92400e' },
      completed: { bg: '#d1fae5', text: '#065f46' },
      failed: { bg: '#fee2e2', text: '#991b1b' },
      refunded: { bg: '#e0e7ff', text: '#3730a3' },
    };
    const colors = statusColors[status] || statusColors.pending;
    return (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: colors.bg,
          color: colors.text,
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (
    amount: number | null | undefined,
    currency: string | null | undefined = 'AED'
  ) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'AED',
    }).format(amount);
  };

  const openDetails = (row: LtdBookingRow) => {
    setSelected(row);
    setModalOpen(true);
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Booking payments</h3>
        <p>
          Limited time deal <strong>booking fees</strong> only (not full package
          checkout). Each row shows the details captured when the customer paid.
        </p>
      </div>

      <div className='table_toolbar'>
        <div className='table_search'>
          <input
            type='text'
            placeholder='Search by transaction ID, notes...'
            value={pendingQuery}
            onChange={e => setPendingQuery(e.target.value)}
          />
        </div>
        <div className='table_actions'>
          <select
            value={paymentStatusFilter}
            onChange={e => {
              setPaymentStatusFilter(e.target.value);
              setPage(1);
            }}
            className='select_filter'
          >
            <option value=''>All payment status</option>
            <option value='pending'>Pending</option>
            <option value='completed'>Completed</option>
            <option value='failed'>Failed</option>
            <option value='refunded'>Refunded</option>
          </select>
        </div>
      </div>

      <div className='table_wrapper' style={{ overflowX: 'auto' }}>
        <table className='table'>
          <thead>
            <tr>
              <th>Created</th>
              <th>Package</th>
              <th>Customer</th>
              <th>Phone / WhatsApp</th>
              <th>Travel date</th>
              <th>Adults</th>
              <th>Children</th>
              <th>Infants</th>
              <th>Solo</th>
              <th>Visa</th>
              <th>Booking fee paid</th>
              <th>Status</th>
              <th>Transaction</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={14} className='table_loading'>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={14} className='table_empty'>
                  No limited time deal booking payments yet
                </td>
              </tr>
            )}
            {!loading &&
              rows.map(row => {
                const item = getFirstCartItem(row);
                const lead = getLeadPassenger(row);
                const pkgName =
                  row.ltd_package_name ||
                  (item?.packageId
                    ? `Package ${String(item.packageId).slice(0, 8)}…`
                    : '—');
                return (
                  <tr key={row.id}>
                    <td>
                      {row.created_at
                        ? format(new Date(row.created_at), 'MMM dd, yyyy HH:mm')
                        : '—'}
                    </td>
                    <td style={{ maxWidth: 200, fontWeight: 600 }}>{pkgName}</td>
                    <td>
                      <div>{lead.name}</div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {lead.email}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      <div>{lead.phone}</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {lead.whatsapp}
                      </div>
                    </td>
                    <td>{formatTravelDate(item?.selectedDate)}</td>
                    <td>{getDisplayAdults(item)}</td>
                    <td>{getDisplayChildren(item)}</td>
                    <td>{getDisplayInfants(item)}</td>
                    <td>{item?.isSoloTraveller ? 'Yes' : '—'}</td>
                    <td>{item?.withVisa ? 'Yes' : '—'}</td>
                    <td>
                      {formatCurrency(
                        row.payment_amount ?? row.total_amount,
                        row.payment_amount_currency
                      )}
                    </td>
                    <td>{getPaymentStatusBadge(row.payment_status)}</td>
                    <td
                      style={{
                        fontSize: '12px',
                        fontFamily: 'ui-monospace, monospace',
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={row.payment_transaction_id || ''}
                    >
                      {row.payment_transaction_id || '—'}
                    </td>
                    <td>
                      <button
                        type='button'
                        onClick={() => openDetails(row)}
                        className='btn_secondary'
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className='table_pagination'>
        <div className='pagination_info'>
          Page {page} of {totalPages} • {total} total
        </div>
        <div className='pagination_controls'>
          <button
            type='button'
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            type='button'
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
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
        </div>
      </div>

      {error && (
        <p style={{ color: '#b91c1c', marginTop: 12 }}>{error}</p>
      )}

      {modalOpen && selected && (
        <div className='modal_overlay' onClick={() => setModalOpen(false)}>
          <div
            className='modal_content'
            onClick={e => e.stopPropagation()}
            style={{ width: '640px', maxWidth: '94vw' }}
          >
            <div className='modal_header'>
              <h3>Limited time deal · booking payment</h3>
              <button
                type='button'
                onClick={() => setModalOpen(false)}
                className='modal_close'
              >
                ×
              </button>
            </div>
            <div className='modal_body'>
              <div className='detail_section'>
                <h4 className='detail_section_title'>Booking reference</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Booking ID:</strong>
                    <span style={{ fontFamily: 'monospace' }}>{selected.id}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Limited time deal ID:</strong>
                    <span style={{ fontFamily: 'monospace' }}>
                      {selected.limited_time_deal_id || '—'}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Transaction ID:</strong>
                    <span>{selected.payment_transaction_id || '—'}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Gateway:</strong>
                    <span>
                      {(selected.payment_gateway || '—').toUpperCase()}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Payment status:</strong>
                    {getPaymentStatusBadge(selected.payment_status)}
                  </div>
                  <div className='detail_item'>
                    <strong>Booking fee paid:</strong>
                    <span>
                      {formatCurrency(
                        selected.payment_amount ?? selected.total_amount,
                        selected.payment_amount_currency
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className='detail_section'>
                <h4 className='detail_section_title'>Package & travel</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Package name:</strong>
                    <span>
                      {selected.ltd_package_name ||
                        getFirstCartItem(selected)?.packageId ||
                        '—'}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Package ID:</strong>
                    <span style={{ fontFamily: 'monospace' }}>
                      {getFirstCartItem(selected)?.packageId || '—'}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Selected travel date:</strong>
                    <span>
                      {formatTravelDate(
                        getFirstCartItem(selected)?.selectedDate
                      )}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Cart line price (fee total):</strong>
                    <span>
                      {getFirstCartItem(selected)?.price != null
                        ? formatCurrency(
                            getFirstCartItem(selected)!.price,
                            selected.payment_amount_currency
                          )
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='detail_section'>
                <h4 className='detail_section_title'>Travellers (as selected)</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Solo traveller:</strong>
                    <span>
                      {getFirstCartItem(selected)?.isSoloTraveller
                        ? 'Yes'
                        : 'No'}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Adults:</strong>
                    <span>{getDisplayAdults(getFirstCartItem(selected))}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Children:</strong>
                    <span>{getDisplayChildren(getFirstCartItem(selected))}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Infants:</strong>
                    <span>{getDisplayInfants(getFirstCartItem(selected))}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>With visa (Indian passport):</strong>
                    <span>
                      {getFirstCartItem(selected)?.withVisa ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='detail_section'>
                <h4 className='detail_section_title'>
                  Lead passenger (form details)
                </h4>
                <div className='detail_grid'>
                  {(() => {
                    const lead = getLeadPassenger(selected);
                    return (
                      <>
                        <div className='detail_item'>
                          <strong>Name:</strong>
                          <span>{lead.name}</span>
                        </div>
                        <div className='detail_item'>
                          <strong>Email:</strong>
                          <a href={`mailto:${lead.email}`}>{lead.email}</a>
                        </div>
                        <div className='detail_item'>
                          <strong>Phone:</strong>
                          <span>{lead.phone}</span>
                        </div>
                        <div className='detail_item'>
                          <strong>WhatsApp:</strong>
                          <span>{lead.whatsapp}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className='detail_section'>
                <h4 className='detail_section_title'>Timestamps</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Created:</strong>
                    <span>
                      {selected.created_at
                        ? format(
                            new Date(selected.created_at),
                            'MMM dd, yyyy HH:mm:ss'
                          )
                        : '—'}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Updated:</strong>
                    <span>
                      {selected.updated_at
                        ? format(
                            new Date(selected.updated_at),
                            'MMM dd, yyyy HH:mm:ss'
                          )
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className='modal_footer'>
              <button
                type='button'
                onClick={() => setModalOpen(false)}
                className='btn_secondary'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
