'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Mail, Phone, MessageSquare } from 'lucide-react';

type ContactQueryRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function ContactQueriesClient() {
  const [rows, setRows] = useState<ContactQueryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<ContactQueryRow | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

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
        if (statusFilter) params.append('status', statusFilter);

        const res = await fetch(`/api/contact?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load contact queries');
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
  }, [page, limit, query, statusFilter]);

  // Debounced search typing
  const [pendingQuery, setPendingQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(pendingQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || statusColors.new
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleViewDetails = (query: ContactQueryRow) => {
    setSelectedQuery(query);
    setModalOpen(true);
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Contact Queries</h3>
        <p>Manage and respond to customer inquiries</p>
      </div>

      <div className='table_toolbar'>
        <div className='table_search'>
          <input
            type='text'
            placeholder='Search by name, email, phone...'
            value={pendingQuery}
            onChange={e => setPendingQuery(e.target.value)}
          />
        </div>
        <div className='table_actions'>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className='select_filter'
          >
            <option value=''>All Status</option>
            <option value='new'>New</option>
            <option value='contacted'>Contacted</option>
            <option value='resolved'>Resolved</option>
            <option value='archived'>Archived</option>
          </select>
        </div>
      </div>

      <div className='table_wrapper'>
        <table className='table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
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
                  No contact queries found
                </td>
              </tr>
            )}
            {!loading &&
              rows.map(r => (
                <tr key={r.id}>
                  <td>
                    {r.first_name} {r.last_name}
                  </td>
                  <td>
                    <a
                      href={`mailto:${r.email}`}
                      className='text-blue-600 hover:underline'
                    >
                      {r.email}
                    </a>
                  </td>
                  <td>
                    <a
                      href={`tel:${r.phone}`}
                      className='text-blue-600 hover:underline'
                    >
                      {r.phone}
                    </a>
                  </td>
                  <td>{getStatusBadge(r.status)}</td>
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
                      View Details
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
      {modalOpen && selectedQuery && (
        <div className='modal_overlay' onClick={() => setModalOpen(false)}>
          <div className='modal_content' onClick={e => e.stopPropagation()}>
            <div className='modal_header'>
              <h3>Contact Query Details</h3>
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
                    <span>
                      {selectedQuery.first_name} {selectedQuery.last_name}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Email:</strong>
                    <a
                      href={`mailto:${selectedQuery.email}`}
                      className='text-blue-600 hover:underline'
                    >
                      {selectedQuery.email}
                    </a>
                  </div>
                  <div className='detail_item'>
                    <strong>Phone:</strong>
                    <a
                      href={`tel:${selectedQuery.phone}`}
                      className='text-blue-600 hover:underline'
                    >
                      {selectedQuery.phone}
                    </a>
                  </div>
                </div>
              </div>

              {selectedQuery.message && (
                <div className='detail_section'>
                  <h4 className='detail_section_title'>Message</h4>
                  <div className='detail_message'>{selectedQuery.message}</div>
                </div>
              )}

              <div className='detail_section'>
                <h4 className='detail_section_title'>Status & Metadata</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Status:</strong>
                    {getStatusBadge(selectedQuery.status)}
                  </div>
                  <div className='detail_item'>
                    <strong>Submitted:</strong>
                    <span>
                      {format(
                        new Date(selectedQuery.created_at),
                        'MMM dd, yyyy HH:mm'
                      )}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Last Updated:</strong>
                    <span>
                      {format(
                        new Date(selectedQuery.updated_at),
                        'MMM dd, yyyy HH:mm'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {selectedQuery.notes && (
                <div className='detail_section'>
                  <h4 className='detail_section_title'>Admin Notes</h4>
                  <div className='detail_message'>{selectedQuery.notes}</div>
                </div>
              )}
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
