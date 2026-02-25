'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [packageDetails, setPackageDetails] = useState<Record<string, any>>({});
  const [loadingPackages, setLoadingPackages] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Show max 7 page numbers

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page <= 4) {
        // Near the start: 1 2 3 4 5 ... last
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        // Near the end: 1 ... (last-4) (last-3) (last-2) (last-1) last
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle: 1 ... (page-1) page (page+1) ... last
        pages.push('ellipsis');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

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
  }, [page, limit, query, paymentStatusFilter]);

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
    currency: string | null | undefined = 'AED'
  ) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'AED',
    }).format(amount);
  };

  const handleViewDetails = async (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setModalOpen(true);
    setPackageDetails({});
    setLoadingPackages(true);

    // Fetch package details for cart items
    if (payment.cart_items && Array.isArray(payment.cart_items)) {
      const packageIds = [
        ...new Set(
          payment.cart_items
            .map((item: any) => item.packageId)
            .filter((id: any) => id)
        ),
      ];

      if (packageIds.length > 0) {
        try {
          // Fetch all packages once and filter by IDs
          const res = await fetch(`/api/packages?status=all&limit=10000`);
          if (res.ok) {
            const json = await res.json();
            const detailsMap: Record<string, any> = {};
            packageIds.forEach((packageId: string) => {
              const packageData = json.data?.find(
                (pkg: any) => pkg.package_id === packageId
              );
              if (packageData) {
                detailsMap[packageId] = packageData;
              }
            });
            setPackageDetails(detailsMap);
          }
        } catch (error) {
          console.error('Failed to fetch package details:', error);
        }
      }
    }
    setLoadingPackages(false);
  };

  const handleExportSinglePayment = (payment: PaymentRow) => {
    try {
      const passengers = Array.isArray(payment.passengers)
        ? payment.passengers
        : [];
      const excelData: any[] = [];

      if (passengers.length === 0) {
        excelData.push({
          'Transaction ID': payment.payment_transaction_id || 'N/A',
          'Payment Status': payment.payment_status,
          'Booking Status': payment.booking_status,
          'Payment Gateway': payment.payment_gateway || 'N/A',
          'Payment Method': payment.payment_method || 'N/A',
          'Payment Type': payment.payment_type || 'N/A',
          'Total Amount': payment.total_amount,
          'Payment Amount': payment.payment_amount || 0,
          'Payment Currency': payment.payment_amount_currency || 'AED',
          'Passenger Name': 'N/A',
          Salutation: 'N/A',
          'First Name': 'N/A',
          'Last Name': 'N/A',
          Email: 'N/A',
          Phone: 'N/A',
          WhatsApp: 'N/A',
          Country: 'N/A',
          Nationality: 'N/A',
          'Passport Expiry': 'N/A',
          'Pickup Location': 'N/A',
          'Permanent Address': 'N/A',
          'Applicant Photo': 'N/A',
          'Passport Main Copy': 'N/A',
          'Passport Last Page': 'N/A',
          'Passport Cover': 'N/A',
          'Pancard': 'N/A',
          'Birth Certificate': 'N/A',
          'Customer Notes': payment.customer_notes || '',
          'Admin Notes': payment.notes || '',
          'Created At': payment.created_at
            ? format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm:ss')
            : 'N/A',
          'Updated At': payment.updated_at
            ? format(new Date(payment.updated_at), 'MMM dd, yyyy HH:mm:ss')
            : 'N/A',
        });
      } else {
        passengers.forEach((passenger: any) => {
          const documents = passenger.documents || {};
          excelData.push({
            'Transaction ID': payment.payment_transaction_id || 'N/A',
            'Payment Status': payment.payment_status,
            'Booking Status': payment.booking_status,
            'Payment Gateway': payment.payment_gateway || 'N/A',
            'Payment Method': payment.payment_method || 'N/A',
            'Payment Type': payment.payment_type || 'N/A',
            'Total Amount': payment.total_amount,
            'Payment Amount': payment.payment_amount || 0,
            'Payment Currency': payment.payment_amount_currency || 'AED',
            'Passenger Name':
              `${passenger.salutation || ''} ${passenger.firstName || ''} ${passenger.lastName || ''}`.trim(),
            Salutation: passenger.salutation || 'N/A',
            'First Name': passenger.firstName || 'N/A',
            'Last Name': passenger.lastName || 'N/A',
            Email: passenger.email || 'N/A',
            Phone: passenger.phone || 'N/A',
            WhatsApp: passenger.whatsapp || 'N/A',
            Country: passenger.country || 'N/A',
            Nationality: passenger.nationality || 'N/A',
            'Passport Expiry': passenger.passportExpiry || 'N/A',
            'Pickup Location': passenger.pickupLocation || 'N/A',
            'Permanent Address': passenger.permanentAddress || 'N/A',
            'Applicant Photo': documents.applicantPhoto || 'N/A',
            'Passport Main Copy': documents.passportMainCopy || 'N/A',
            'Passport Last Page': documents.passportLastPage || 'N/A',
            'Passport Cover': documents.passportCover || 'N/A',
            'Pancard': documents.nationalIdCard || 'N/A',
            'Birth Certificate': documents.birthCertificate || 'N/A',
            'Customer Notes': payment.customer_notes || '',
            'Admin Notes': payment.notes || '',
            'Created At': payment.created_at
              ? format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm:ss')
              : 'N/A',
            'Updated At': payment.updated_at
              ? format(new Date(payment.updated_at), 'MMM dd, yyyy HH:mm:ss')
              : 'N/A',
          });
        });
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payment Details');

      // Auto-size columns
      const colWidths = Object.keys(excelData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15),
      }));
      ws['!cols'] = colWidths;

      // Generate filename
      const transactionId =
        payment.payment_transaction_id || payment.id.substring(0, 8);
      const filename = `payment_${transactionId}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
    } catch (error: any) {
      console.error('Export error:', error);
      alert('Failed to export: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleExportToExcel = async () => {
    try {
      // Fetch all payments (without pagination)
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Large limit to get all
      });
      if (query) params.append('search', query);
      if (paymentStatusFilter)
        params.append('payment_status', paymentStatusFilter);

      const res = await fetch(`/api/bookings?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load payments');
      const json = await res.json();
      const allPayments = json.data ?? [];

      // Prepare data for Excel
      const excelData: any[] = [];

      allPayments.forEach((payment: PaymentRow) => {
        const passengers = Array.isArray(payment.passengers)
          ? payment.passengers
          : [];

        if (passengers.length === 0) {
          // Add row even if no passengers
          excelData.push({
            'Transaction ID': payment.payment_transaction_id || 'N/A',
            'Payment Status': payment.payment_status,
            'Booking Status': payment.booking_status,
            'Payment Gateway': payment.payment_gateway || 'N/A',
            'Payment Method': payment.payment_method || 'N/A',
            'Payment Type': payment.payment_type || 'N/A',
            'Total Amount': payment.total_amount,
            'Payment Amount': payment.payment_amount || 0,
            'Payment Currency': payment.payment_amount_currency || 'INR',
            'Passenger Name': 'N/A',
            Salutation: 'N/A',
            'First Name': 'N/A',
            'Last Name': 'N/A',
            Email: 'N/A',
            Phone: 'N/A',
            WhatsApp: 'N/A',
            Country: 'N/A',
            Nationality: 'N/A',
            'Passport Expiry': 'N/A',
            'Pickup Location': 'N/A',
            'Permanent Address': 'N/A',
            'Applicant Photo': 'N/A',
            'Passport Main Copy': 'N/A',
            'Passport Last Page': 'N/A',
            'Passport Cover': 'N/A',
            'Pancard': 'N/A',
            'Birth Certificate': 'N/A',
            'Customer Notes': payment.customer_notes || '',
            'Admin Notes': payment.notes || '',
            'Created At': payment.created_at
              ? format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm:ss')
              : 'N/A',
            'Updated At': payment.updated_at
              ? format(new Date(payment.updated_at), 'MMM dd, yyyy HH:mm:ss')
              : 'N/A',
          });
        } else {
          // Add a row for each passenger
          passengers.forEach((passenger: any) => {
            const documents = passenger.documents || {};
            excelData.push({
              'Transaction ID': payment.payment_transaction_id || 'N/A',
              'Payment Status': payment.payment_status,
              'Booking Status': payment.booking_status,
              'Payment Gateway': payment.payment_gateway || 'N/A',
              'Payment Method': payment.payment_method || 'N/A',
              'Payment Type': payment.payment_type || 'N/A',
              'Total Amount': payment.total_amount,
              'Payment Amount': payment.payment_amount || 0,
              'Payment Currency': payment.payment_amount_currency || 'INR',
              'Passenger Name':
                `${passenger.salutation || ''} ${passenger.firstName || ''} ${passenger.lastName || ''}`.trim(),
              Salutation: passenger.salutation || 'N/A',
              'First Name': passenger.firstName || 'N/A',
              'Last Name': passenger.lastName || 'N/A',
              Email: passenger.email || 'N/A',
              Phone: passenger.phone || 'N/A',
              WhatsApp: passenger.whatsapp || 'N/A',
              Country: passenger.country || 'N/A',
              Nationality: passenger.nationality || 'N/A',
              'Passport Expiry': passenger.passportExpiry || 'N/A',
              'Pickup Location': passenger.pickupLocation || 'N/A',
              'Permanent Address': passenger.permanentAddress || 'N/A',
              'Applicant Photo': documents.applicantPhoto || 'N/A',
              'Passport Main Copy': documents.passportMainCopy || 'N/A',
              'Passport Last Page': documents.passportLastPage || 'N/A',
              'Passport Cover': documents.passportCover || 'N/A',
              'Pancard': documents.nationalIdCard || 'N/A',
              'Birth Certificate': documents.birthCertificate || 'N/A',
              'Customer Notes': payment.customer_notes || '',
              'Admin Notes': payment.notes || '',
              'Created At': payment.created_at
                ? format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm:ss')
                : 'N/A',
              'Updated At': payment.updated_at
                ? format(new Date(payment.updated_at), 'MMM dd, yyyy HH:mm:ss')
                : 'N/A',
            });
          });
        }
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payments');

      // Auto-size columns
      const colWidths = Object.keys(excelData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15),
      }));
      ws['!cols'] = colWidths;

      // Generate filename with timestamp
      const filename = `payments_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
    } catch (error: any) {
      console.error('Export error:', error);
      alert('Failed to export: ' + (error?.message || 'Unknown error'));
    }
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
              <th>Gateway</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className='table_loading'>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={8} className='table_empty'>
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
                    <td>{formatCurrency(payment.total_amount, 'AED')}</td>
                    <td>
                      {payment.payment_amount
                        ? formatCurrency(
                            payment.payment_amount,
                            payment.payment_amount_currency
                          )
                        : '-'}
                    </td>
                    <td>{getPaymentStatusBadge(payment.payment_status)}</td>
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
          <div className='pagination_numbers'>
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className='pagination_ellipsis'>
                    ...
                  </span>
                );
              }
              const pageNumber = pageNum as number;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`pagination_number ${
                    page === pageNumber ? 'active' : ''
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
          <button
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

      {/* Details Modal */}
      {modalOpen && selectedPayment && (
        <div className='modal_overlay' onClick={() => setModalOpen(false)}>
          <div
            className='modal_content'
            onClick={e => e.stopPropagation()}
            style={{ width: '800px', maxWidth: '90vw' }}
          >
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
                    <span>
                      {formatCurrency(selectedPayment.total_amount, 'AED')}
                    </span>
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
                    (passenger: any, idx: number) => {
                      const documents = passenger.documents || {};
                      const address = passenger.permanentAddress || '';
                      const totalAdults = (selectedPayment.cart_items || []).reduce(
                        (s: number, i: any) =>
                          s + (i.isSoloTraveller ? 1 : i.adults || 0),
                        0
                      );
                      const passengerTitle =
                        idx === 0
                          ? 'Lead Passenger'
                          : idx >= totalAdults
                            ? `Child ${idx - totalAdults + 1} Documents`
                            : `Passenger ${idx + 1}`;

                      return (
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
                          <h5
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: 'var(--text)',
                              margin: '0 0 12px 0',
                              paddingBottom: '8px',
                              width: 'max-content',
                              borderBottom: '2px solid var(--accent)',
                            }}
                          >
                            {passengerTitle}
                          </h5>
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
                            <div className='detail_item'>
                              <strong>Passport Expiry:</strong>
                              <span>
                                {passenger.passportExpiry
                                  ? format(
                                      new Date(passenger.passportExpiry),
                                      'MMM dd, yyyy'
                                    )
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className='detail_item'>
                              <strong>Pickup Location:</strong>
                              <span>{passenger.pickupLocation || 'N/A'}</span>
                            </div>
                            <div
                              className='detail_item'
                              style={{ gridColumn: '1 / -1' }}
                            >
                              <strong>Permanent Address:</strong>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                <span
                                  title={address || 'N/A'}
                                  style={{
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {address || 'N/A'}
                                </span>
                                {address && address.length > 50 && (
                                  <span
                                    title={address}
                                    style={{
                                      cursor: 'help',
                                      color: 'var(--accent)',
                                      fontSize: '14px',
                                      lineHeight: 1,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: '2px 6px',
                                      backgroundColor: 'var(--panel-2)',
                                      borderRadius: '4px',
                                      border: '1px solid var(--border)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    i
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Documents Section */}
                          {(documents.applicantPhoto ||
                            documents.passportMainCopy ||
                            documents.passportLastPage ||
                            documents.passportCover ||
                            (idx < totalAdults && documents.nationalIdCard) ||
                            documents.birthCertificate) && (
                            <div
                              style={{
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid var(--border)',
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--text-muted)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '12px',
                                  display: 'block',
                                }}
                              >
                                Documents
                              </strong>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, 1fr)',
                                  gap: '12px',
                                }}
                              >
                                {documents.applicantPhoto && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      Applicant Photo
                                    </strong>
                                    <a
                                      href={documents.applicantPhoto}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      style={{
                                        display: 'block',
                                        overflow: 'hidden',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                      }}
                                    >
                                      <img
                                        src={documents.applicantPhoto}
                                        alt='Applicant Photo'
                                        style={{
                                          width: '100%',
                                          height: '120px',
                                          objectFit: 'cover',
                                          display: 'block',
                                        }}
                                      />
                                    </a>
                                  </div>
                                )}
                                {documents.passportMainCopy && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      Passport Main Copy
                                    </strong>
                                    <a
                                      href={documents.passportMainCopy}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      style={{
                                        display: 'block',
                                        overflow: 'hidden',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                      }}
                                    >
                                      <img
                                        src={documents.passportMainCopy}
                                        alt='Passport Main Copy'
                                        style={{
                                          width: '100%',
                                          height: '120px',
                                          objectFit: 'cover',
                                          display: 'block',
                                        }}
                                      />
                                    </a>
                                  </div>
                                )}
                                {documents.passportLastPage && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      Passport Last Page
                                    </strong>
                                    <a
                                      href={documents.passportLastPage}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      style={{
                                        display: 'block',
                                        overflow: 'hidden',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                      }}
                                    >
                                      <img
                                        src={documents.passportLastPage}
                                        alt='Passport Last Page'
                                        style={{
                                          width: '100%',
                                          height: '120px',
                                          objectFit: 'cover',
                                          display: 'block',
                                        }}
                                      />
                                    </a>
                                  </div>
                                )}
                                {documents.passportCover && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      Passport Cover
                                    </strong>
                                    <a
                                      href={documents.passportCover}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      style={{
                                        display: 'block',
                                        overflow: 'hidden',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                      }}
                                    >
                                      <img
                                        src={documents.passportCover}
                                        alt='Passport Cover'
                                        style={{
                                          width: '100%',
                                          height: '120px',
                                          objectFit: 'cover',
                                          display: 'block',
                                        }}
                                      />
                                    </a>
                                  </div>
                                )}
                                {idx < totalAdults && documents.nationalIdCard && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      Pancard
                                    </strong>
                                    <a
                                      href={documents.nationalIdCard}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      style={{
                                        display: 'block',
                                        overflow: 'hidden',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                      }}
                                    >
                                      <img
                                        src={documents.nationalIdCard}
                                        alt='Pancard'
                                        style={{
                                          width: '100%',
                                          height: '120px',
                                          objectFit: 'cover',
                                          display: 'block',
                                        }}
                                      />
                                    </a>
                                  </div>
                                )}
                                {(documents.birthCertificate ||
                                  (documents.birthCertificates &&
                                    documents.birthCertificates[0])) && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      Birth Certificate
                                    </strong>
                                    <a
                                      href={
                                        documents.birthCertificate ||
                                        documents.birthCertificates?.[0]
                                      }
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      style={{
                                        display: 'block',
                                        overflow: 'hidden',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                      }}
                                    >
                                      <img
                                        src={
                                          documents.birthCertificate ||
                                          documents.birthCertificates?.[0]
                                        }
                                        alt='Birth Certificate'
                                        style={{
                                          width: '100%',
                                          height: '120px',
                                          objectFit: 'cover',
                                          display: 'block',
                                        }}
                                      />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )
                ) : (
                  <div className='detail_message'>
                    No passenger information available
                  </div>
                )}
              </div>

              {/* Infant Documents Section */}
              {selectedPayment.infant_documents &&
                Array.isArray(selectedPayment.infant_documents) &&
                selectedPayment.infant_documents.length > 0 && (
                  <div className='detail_section'>
                    <h4 className='detail_section_title'>
                      Infant Documents
                    </h4>
                    {selectedPayment.infant_documents.map(
                      (infantDocs: any, idx: number) => (
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
                          <h5
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: 'var(--text)',
                              margin: '0 0 12px 0',
                              paddingBottom: '8px',
                              width: 'max-content',
                              borderBottom: '2px solid var(--accent)',
                            }}
                          >
                            Infant {idx + 1} Documents
                          </h5>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '12px',
                              marginTop: '12px',
                            }}
                          >
                            {infantDocs.applicantPhoto && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  Applicant Photo
                                </strong>
                                <a
                                  href={infantDocs.applicantPhoto}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  <img
                                    src={infantDocs.applicantPhoto}
                                    alt='Applicant Photo'
                                    style={{
                                      width: '100%',
                                      height: '120px',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                </a>
                              </div>
                            )}
                            {infantDocs.passportMainCopy && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  Passport Main Copy
                                </strong>
                                <a
                                  href={infantDocs.passportMainCopy}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  <img
                                    src={infantDocs.passportMainCopy}
                                    alt='Passport Main Copy'
                                    style={{
                                      width: '100%',
                                      height: '120px',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                </a>
                              </div>
                            )}
                            {infantDocs.passportLastPage && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  Passport Last Page
                                </strong>
                                <a
                                  href={infantDocs.passportLastPage}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  <img
                                    src={infantDocs.passportLastPage}
                                    alt='Passport Last Page'
                                    style={{
                                      width: '100%',
                                      height: '120px',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                </a>
                              </div>
                            )}
                            {infantDocs.passportCover && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  Passport Cover
                                </strong>
                                <a
                                  href={infantDocs.passportCover}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  <img
                                    src={infantDocs.passportCover}
                                    alt='Passport Cover'
                                    style={{
                                      width: '100%',
                                      height: '120px',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                </a>
                              </div>
                            )}
                            {infantDocs.birthCertificate && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  Birth Certificate
                                </strong>
                                <a
                                  href={infantDocs.birthCertificate}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  <img
                                    src={infantDocs.birthCertificate}
                                    alt='Birth Certificate'
                                    style={{
                                      width: '100%',
                                      height: '120px',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* Cart Items / Package Details Section */}
              {selectedPayment.cart_items &&
                Array.isArray(selectedPayment.cart_items) &&
                selectedPayment.cart_items.length > 0 && (
                  <div className='detail_section'>
                    <h4 className='detail_section_title'>Package Details</h4>
                    {loadingPackages ? (
                      <div className='detail_message'>
                        Loading package details...
                      </div>
                    ) : (
                      selectedPayment.cart_items.map(
                        (cartItem: any, idx: number) => {
                          const packageData =
                            packageDetails[cartItem.packageId];
                          return (
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
                              <h5
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: 'var(--text)',
                                  margin: '0 0 12px 0',
                                  paddingBottom: '8px',
                                  width: 'max-content',
                                  borderBottom: '2px solid var(--accent)',
                                }}
                              >
                                Package {idx + 1}
                              </h5>
                              <div className='detail_grid'>
                                {packageData ? (
                                  <>
                                    {/* First Row: Package Name and Duration */}
                                    <div className='detail_item'>
                                      <strong>Package Name:</strong>
                                      <span>
                                        {packageData.package_name || 'N/A'}
                                      </span>
                                    </div>
                                    <div className='detail_item'>
                                      <strong>Duration:</strong>
                                      <span>
                                        {packageData.package_days || 0} Days/
                                        {packageData.package_nights || 0} Nights
                                      </span>
                                    </div>

                                    {/* Second Row: Adults, Children, Infants */}
                                    <div className='detail_item'>
                                      <strong>Adults:</strong>
                                      <span>{cartItem.adults || 0}</span>
                                    </div>
                                    <div className='detail_item'>
                                      <strong>Children:</strong>
                                      <span>{cartItem.children || 0}</span>
                                    </div>
                                    <div className='detail_item'>
                                      <strong>Infants:</strong>
                                      <span>{cartItem.infants || 0}</span>
                                    </div>

                                    {/* Thumbnail Image */}
                                    {packageData.thumbnail_image && (
                                      <div
                                        className='detail_item'
                                        style={{ gridColumn: '1 / -1' }}
                                      >
                                        <strong>Thumbnail:</strong>
                                        <div style={{ marginTop: '8px' }}>
                                          <img
                                            src={packageData.thumbnail_image}
                                            alt={packageData.package_name}
                                            style={{
                                              maxWidth: '200px',
                                              maxHeight: '150px',
                                              borderRadius: '6px',
                                              border: '1px solid var(--border)',
                                              objectFit: 'cover',
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Selected Date if available */}
                                    {cartItem.selectedDate && (
                                      <div className='detail_item'>
                                        <strong>Selected Date:</strong>
                                        <span>
                                          {format(
                                            new Date(cartItem.selectedDate),
                                            'MMM dd, yyyy'
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className='detail_item'>
                                      <strong>Package ID:</strong>
                                      <span>{cartItem.packageId || 'N/A'}</span>
                                      <div
                                        style={{
                                          marginTop: '8px',
                                          fontSize: '12px',
                                          color: 'var(--text-muted)',
                                        }}
                                      >
                                        Package details not found
                                      </div>
                                    </div>
                                    <div className='detail_item'>
                                      <strong>Adults:</strong>
                                      <span>{cartItem.adults || 0}</span>
                                    </div>
                                    <div className='detail_item'>
                                      <strong>Children:</strong>
                                      <span>{cartItem.children || 0}</span>
                                    </div>
                                    <div className='detail_item'>
                                      <strong>Infants:</strong>
                                      <span>{cartItem.infants || 0}</span>
                                    </div>
                                    {cartItem.selectedDate && (
                                      <div className='detail_item'>
                                        <strong>Selected Date:</strong>
                                        <span>
                                          {format(
                                            new Date(cartItem.selectedDate),
                                            'MMM dd, yyyy'
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )
                    )}
                  </div>
                )}

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
                onClick={() => handleExportSinglePayment(selectedPayment)}
                className='btn_primary'
              >
                Export to Excel
              </button>
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
