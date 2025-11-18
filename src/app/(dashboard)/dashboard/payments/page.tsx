'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

type PaymentRow = {
  id: string;
  package_ids: string[];
  total_amount: number;
  payment_amount?: number | null;
  payment_amount_currency?: string | null;
  payment_method: string;
  payment_status: string;
  payment_transaction_id?: string | null;
  payment_type?: string | null;
  payment_gateway?: string | null;
  payment_done?: string | null;
  booking_status: string;
  passengers: any; // JSONB
  cart_items: any; // JSONB
  notes?: string | null;
  customer_notes?: string | null;
  created_at: string;
  updated_at: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

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
        });
        if (query) params.append('search', query);
        if (paymentStatusFilter)
          params.append('payment_status', paymentStatusFilter);
        if (bookingStatusFilter)
          params.append('booking_status', bookingStatusFilter);

        const res = await fetch(`/api/bookings?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load payments');
        const json = await res.json();
        if (!active) return;
        setPayments(json.data ?? []);
        setTotal(json.pagination?.total ?? 0);
      } catch (e: any) {
        if (!active) return;
        if (e.name !== 'AbortError') {
          setError(e?.message ?? 'Error');
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
  }, [page, limit, query, paymentStatusFilter, bookingStatusFilter]);

  // Debounced search typing
  const [pendingQuery, setPendingQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(pendingQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

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

  const getBookingStatusBadge = (status: string) => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#fef3c7', text: '#92400e' },
      confirmed: { bg: '#dbeafe', text: '#1e40af' },
      cancelled: { bg: '#fee2e2', text: '#991b1b' },
      completed: { bg: '#d1fae5', text: '#065f46' },
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

  const getPassengerInfo = (passengers: any) => {
    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return { name: '-', email: '-', phone: '-' };
    }
    const firstPassenger = passengers[0];
    const firstName = firstPassenger?.firstName || '';
    const lastName = firstPassenger?.lastName || '';
    return {
      name: `${firstName} ${lastName}`.trim() || '-',
      email: firstPassenger?.email || '-',
      phone: firstPassenger?.phone || '-',
    };
  };

  const formatCurrency = (
    amount: number | null | undefined,
    currency: string | null | undefined = 'INR'
  ) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  const handleViewDetails = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setModalOpen(true);
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Payments</h3>
        <p>View and manage payment transactions</p>
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
            <option value=''>All Payment Status</option>
            <option value='pending'>Pending</option>
            <option value='completed'>Completed</option>
            <option value='failed'>Failed</option>
            <option value='refunded'>Refunded</option>
          </select>
          <select
            value={bookingStatusFilter}
            onChange={e => {
              setBookingStatusFilter(e.target.value);
              setPage(1);
            }}
            className='select_filter'
            style={{ marginLeft: '8px' }}
          >
            <option value=''>All Booking Status</option>
            <option value='pending'>Pending</option>
            <option value='confirmed'>Confirmed</option>
            <option value='cancelled'>Cancelled</option>
            <option value='completed'>Completed</option>
          </select>
        </div>
      </div>

      <div className='table_wrapper'>
        <table className='table'>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Customer</th>
              <th>Total Amount</th>
              <th>Payment Amount</th>
              <th>Payment Status</th>
              <th>Booking Status</th>
              <th>Gateway</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className='table_loading'>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={9} className='table_empty'>
                  No payments found
                </td>
              </tr>
            )}
            {!loading &&
              payments.map(payment => {
                const passengerInfo = getPassengerInfo(payment.passengers);
                return (
                  <tr key={payment.id}>
                    <td>
                      {payment.payment_transaction_id || (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <div>
                        <div>{passengerInfo.name}</div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {passengerInfo.email}
                        </div>
                      </div>
                    </td>
                    <td>{formatCurrency(payment.total_amount)}</td>
                    <td>
                      {payment.payment_amount
                        ? formatCurrency(
                            payment.payment_amount,
                            payment.payment_amount_currency
                          )
                        : '-'}
                    </td>
                    <td>{getPaymentStatusBadge(payment.payment_status)}</td>
                    <td>{getBookingStatusBadge(payment.booking_status)}</td>
                    <td>
                      {payment.payment_gateway ? (
                        <span style={{ textTransform: 'uppercase' }}>
                          {payment.payment_gateway}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {payment.created_at
                        ? format(
                            new Date(payment.created_at),
                            'MMM dd, yyyy HH:mm'
                          )
                        : '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className='btn_secondary'
                      >
                        View Details
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

      {/* Details Modal */}
      {modalOpen && selectedPayment && (
        <div className='modal_overlay' onClick={() => setModalOpen(false)}>
          <div className='modal_content' onClick={e => e.stopPropagation()}>
            <div className='modal_header'>
              <h3>Payment Details</h3>
              <button
                onClick={() => setModalOpen(false)}
                className='modal_close'
              >
                ×
              </button>
            </div>
            <div className='modal_body'>
              <div className='detail_section'>
                <h4 className='detail_section_title'>Payment Information</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Transaction ID:</strong>
                    <span>
                      {selectedPayment.payment_transaction_id || 'N/A'}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Payment Status:</strong>
                    {getPaymentStatusBadge(selectedPayment.payment_status)}
                  </div>
                  <div className='detail_item'>
                    <strong>Booking Status:</strong>
                    {getBookingStatusBadge(selectedPayment.booking_status)}
                  </div>
                  <div className='detail_item'>
                    <strong>Payment Gateway:</strong>
                    <span>
                      {selectedPayment.payment_gateway
                        ? selectedPayment.payment_gateway.toUpperCase()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Payment Method:</strong>
                    <span>{selectedPayment.payment_method || 'N/A'}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Payment Type:</strong>
                    <span>
                      {selectedPayment.payment_type
                        ? selectedPayment.payment_type.toUpperCase()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Total Amount:</strong>
                    <span>{formatCurrency(selectedPayment.total_amount)}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Payment Amount:</strong>
                    <span>
                      {selectedPayment.payment_amount
                        ? formatCurrency(
                            selectedPayment.payment_amount,
                            selectedPayment.payment_amount_currency
                          )
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='detail_section'>
                <h4 className='detail_section_title'>Passenger Information</h4>
                {selectedPayment.passengers &&
                Array.isArray(selectedPayment.passengers) ? (
                  selectedPayment.passengers.map(
                    (passenger: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: '16px',
                          padding: '12px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div className='detail_grid'>
                          <div className='detail_item'>
                            <strong>Name:</strong>
                            <span>
                              {passenger.salutation || ''}{' '}
                              {passenger.firstName || ''}{' '}
                              {passenger.lastName || ''}
                            </span>
                          </div>
                          <div className='detail_item'>
                            <strong>Email:</strong>
                            <a
                              href={`mailto:${passenger.email}`}
                              style={{ color: 'var(--accent)' }}
                            >
                              {passenger.email || 'N/A'}
                            </a>
                          </div>
                          <div className='detail_item'>
                            <strong>Phone:</strong>
                            <a
                              href={`tel:${passenger.phone}`}
                              style={{ color: 'var(--accent)' }}
                            >
                              {passenger.phone || 'N/A'}
                            </a>
                          </div>
                          <div className='detail_item'>
                            <strong>WhatsApp:</strong>
                            <span>{passenger.whatsapp || 'N/A'}</span>
                          </div>
                          <div className='detail_item'>
                            <strong>Country:</strong>
                            <span>{passenger.country || 'N/A'}</span>
                          </div>
                          <div className='detail_item'>
                            <strong>Nationality:</strong>
                            <span>{passenger.nationality || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className='detail_message'>
                    No passenger information available
                  </div>
                )}
              </div>

              {selectedPayment.customer_notes && (
                <div className='detail_section'>
                  <h4 className='detail_section_title'>Customer Notes</h4>
                  <div className='detail_message'>
                    {selectedPayment.customer_notes}
                  </div>
                </div>
              )}

              {selectedPayment.notes && (
                <div className='detail_section'>
                  <h4 className='detail_section_title'>Admin Notes</h4>
                  <div className='detail_message'>{selectedPayment.notes}</div>
                </div>
              )}

              <div className='detail_section'>
                <h4 className='detail_section_title'>Timestamps</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Created:</strong>
                    <span>
                      {selectedPayment.created_at
                        ? format(
                            new Date(selectedPayment.created_at),
                            'MMM dd, yyyy HH:mm:ss'
                          )
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Last Updated:</strong>
                    <span>
                      {selectedPayment.updated_at
                        ? format(
                            new Date(selectedPayment.updated_at),
                            'MMM dd, yyyy HH:mm:ss'
                          )
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className='modal_footer'>
              <button
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
