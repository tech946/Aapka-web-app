'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Mail, Phone } from 'lucide-react';

const STATUS_IN_UAE_LABELS: Record<string, string> = {
  residence_in_uae: 'Residence in UAE',
  tourist_in_uae: 'Tourist in UAE',
};

const OMAN_VISA_LABELS: Record<string, string> = {
  i_have_oman_visa: 'I have Oman visa',
  i_dont_need_visa: "I don't need visa",
  visa_on_arrival: 'Visa on arrival',
};

const FLIGHT_HOTEL_LABELS: Record<string, string> = {
  flight_ticket: 'Flight ticket',
  hotel_booking: 'Hotel booking',
  both: 'Both',
  none: 'None',
};

type OmanTransportRow = {
  id: string;
  travelling_date: string;
  lead_passenger_name: string;
  whatsapp_number: string;
  calling_number: string | null;
  email: string;
  nationality: string;
  status_in_uae: string;
  oman_visa_status: string;
  number_of_adults: number;
  number_of_children: number;
  flight_hotel_booking: string | null;
  passport_validity_accepted?: boolean;
  terms_accepted: boolean;
  created_at: string;
};

export default function OmanTransportEnquiriesClient() {
  const [rows, setRows] = useState<OmanTransportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<OmanTransportRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page <= 4) {
        for (let i = 2; i <= 5; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
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
        const res = await fetch(`/api/oman-transport-enquiries?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load Oman transport enquiries');
        const json = await res.json();
        if (!active) return;
        setRows(json.data ?? []);
        setTotal(json.pagination?.total ?? 0);
      } catch (e: unknown) {
        if (!active) return;
        const err = e as Error;
        if (err.name !== 'AbortError') setError(err?.message ?? 'Error');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, limit]);

  const handleViewDetails = (row: OmanTransportRow) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const formatDate = (d: string) =>
    d ? format(new Date(d), 'MMM dd, yyyy') : '-';

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Oman Transport Enquiries</h3>
        <p>Transportation bookings from UAE to Oman border</p>
      </div>

      <div className='table_wrapper'>
        <table className='table'>
          <thead>
            <tr>
              <th>Date</th>
              <th>Lead Passenger</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>Nationality</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className='table_loading'>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className='table_empty'>
                  No Oman transport enquiries yet
                </td>
              </tr>
            )}
            {!loading &&
              rows.map(r => (
                <tr key={r.id}>
                  <td>{formatDate(r.travelling_date)}</td>
                  <td>{r.lead_passenger_name}</td>
                  <td>
                    <a
                      href={`mailto:${r.email}`}
                      className='text-blue-600 hover:underline inline-flex items-center gap-1'
                    >
                      <Mail size={14} />
                      {r.email}
                    </a>
                  </td>
                  <td>
                    <a
                      href={`https://wa.me/${r.whatsapp_number.replace(/\D/g, '')}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-green-600 hover:underline inline-flex items-center gap-1'
                    >
                      <Phone size={14} />
                      {r.whatsapp_number}
                    </a>
                  </td>
                  <td>{r.nationality || '-'}</td>
                  <td>
                    {r.created_at
                      ? format(new Date(r.created_at), 'MMM dd, yyyy HH:mm')
                      : '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleViewDetails(r)}
                      className='btn_secondary'
                    >
                      View
                    </button>
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
                  className={`pagination_number ${page === pageNumber ? 'active' : ''}`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

      {modalOpen && selectedRow && (
        <div className='modal_overlay' onClick={() => setModalOpen(false)}>
          <div className='modal_content' onClick={e => e.stopPropagation()}>
            <div className='modal_header'>
              <h3>Oman Transport Enquiry Details</h3>
              <button
                onClick={() => setModalOpen(false)}
                className='modal_close'
              >
                ×
              </button>
            </div>
            <div className='modal_body'>
              <div className='detail_section'>
                <h4 className='detail_section_title'>Passenger Information</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Lead Passenger:</strong>
                    <span>{selectedRow.lead_passenger_name}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Travelling Date:</strong>
                    <span>{formatDate(selectedRow.travelling_date)}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Nationality:</strong>
                    <span>{selectedRow.nationality}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Adults:</strong>
                    <span>{selectedRow.number_of_adults}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Children:</strong>
                    <span>{selectedRow.number_of_children}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Status in UAE:</strong>
                    <span>
                      {STATUS_IN_UAE_LABELS[selectedRow.status_in_uae] ||
                        selectedRow.status_in_uae}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Oman Visa Status:</strong>
                    <span>
                      {OMAN_VISA_LABELS[selectedRow.oman_visa_status] ||
                        selectedRow.oman_visa_status}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Flight/Hotel:</strong>
                    <span>
                      {selectedRow.flight_hotel_booking
                        ? FLIGHT_HOTEL_LABELS[selectedRow.flight_hotel_booking] ||
                          selectedRow.flight_hotel_booking
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
              <div className='detail_section'>
                <h4 className='detail_section_title'>Contact Information</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Email:</strong>
                    <a
                      href={`mailto:${selectedRow.email}`}
                      className='text-blue-600 hover:underline'
                    >
                      {selectedRow.email}
                    </a>
                  </div>
                  <div className='detail_item'>
                    <strong>WhatsApp:</strong>
                    <a
                      href={`https://wa.me/${selectedRow.whatsapp_number.replace(/\D/g, '')}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-green-600 hover:underline'
                    >
                      {selectedRow.whatsapp_number}
                    </a>
                  </div>
                  <div className='detail_item'>
                    <strong>Calling:</strong>
                    <span>{selectedRow.calling_number || '-'}</span>
                  </div>
                </div>
              </div>
              <div className='detail_section'>
                <h4 className='detail_section_title'>Submitted</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Created:</strong>
                    <span>
                      {format(
                        new Date(selectedRow.created_at),
                        'MMM dd, yyyy HH:mm'
                      )}
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
