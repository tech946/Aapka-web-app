'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { FileDown, Mail, Phone } from 'lucide-react';

type PdfEnquiryRow = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  package_id: string | null;
  package_name: string | null;
  pdf_url: string;
  created_at: string;
};

export default function PdfEnquiriesClient() {
  const [rows, setRows] = useState<PdfEnquiryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<PdfEnquiryRow | null>(null);
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
        const res = await fetch(`/api/pdf-enquiries?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load PDF enquiries');
        const json = await res.json();
        if (!active) return;
        setRows(json.data ?? []);
        setTotal(json.pagination?.total ?? 0);
      } catch (e: any) {
        if (!active) return;
        if (e.name !== 'AbortError') setError(e?.message ?? 'Error');
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

  const handleViewDetails = (row: PdfEnquiryRow) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>PDF Enquiries</h3>
        <p>Users who requested PDF brochures for packages</p>
      </div>

      <div className='table_wrapper'>
        <table className='table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>Package</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className='table_loading'>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className='table_empty'>
                  No PDF enquiries yet
                </td>
              </tr>
            )}
            {!loading &&
              rows.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td>
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
                      href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-green-600 hover:underline inline-flex items-center gap-1'
                    >
                      <Phone size={14} />
                      {r.whatsapp}
                    </a>
                  </td>
                  <td style={{ maxWidth: 200 }}>{r.package_name || '-'}</td>
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

      {/* Pagination */}
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

      {/* Details Modal */}
      {modalOpen && selectedRow && (
        <div className='modal_overlay' onClick={() => setModalOpen(false)}>
          <div className='modal_content' onClick={e => e.stopPropagation()}>
            <div className='modal_header'>
              <h3>PDF Enquiry Details</h3>
              <button
                onClick={() => setModalOpen(false)}
                className='modal_close'
              >
                ×
              </button>
            </div>
            <div className='modal_body'>
              <div className='detail_section'>
                <h4 className='detail_section_title'>Contact Information</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Name:</strong>
                    <span>{selectedRow.name}</span>
                  </div>
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
                      href={`https://wa.me/${selectedRow.whatsapp.replace(/\D/g, '')}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-green-600 hover:underline'
                    >
                      {selectedRow.whatsapp}
                    </a>
                  </div>
                </div>
              </div>

              <div className='detail_section'>
                <h4 className='detail_section_title'>Package</h4>
                <div className='detail_grid'>
                  <div className='detail_item' style={{ gridColumn: '1 / -1' }}>
                    <strong>Package Name:</strong>
                    <span>{selectedRow.package_name || '-'}</span>
                  </div>
                </div>
              </div>

              <div className='detail_section'>
                <h4 className='detail_section_title'>PDF & Date</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Requested:</strong>
                    <span>
                      {format(
                        new Date(selectedRow.created_at),
                        'MMM dd, yyyy HH:mm'
                      )}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>PDF:</strong>
                    <a
                      href={selectedRow.pdf_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:underline inline-flex items-center gap-1'
                    >
                      <FileDown size={14} />
                      Open PDF
                    </a>
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
