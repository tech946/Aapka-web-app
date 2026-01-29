'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Mail, Phone, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';

type Subscription = {
  id: string;
  subscription_type: string;
  amount_paid: number;
  currency: string;
  payment_status: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

type AgentRow = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  resident_country: string;
  mobile_number: string;
  subscription_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subscriptions: Subscription[] | null;
};

export default function AgentsClient() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (page <= 4) {
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
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
        if (query) params.append('q', query);

        const res = await fetch(`/api/agents?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load agents');
        const json = await res.json();
        if (!active) return;
        setRows(json.data ?? []);
        setTotal(json.total ?? 0);
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
  }, [page, limit, query]);

  // Debounced search typing
  const [pendingQuery, setPendingQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(pendingQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
          isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isActive ? (
          <>
            <CheckCircle size={12} />
            Active
          </>
        ) : (
          <>
            <XCircle size={12} />
            Inactive
          </>
        )}
      </span>
    );
  };

  const getSubscriptionStatus = (subscriptions: Subscription[] | null) => {
    if (!subscriptions || subscriptions.length === 0) {
      return <span className="text-gray-500 text-sm">No subscription</span>;
    }
    const subscription = subscriptions[0];
    const isActive = subscription.is_active && subscription.payment_status === 'completed';
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const isExpired = endDate < now;

    if (isExpired) {
      return <span className="text-red-600 text-sm font-medium">Expired</span>;
    }
    if (isActive) {
      return (
        <span className="text-green-600 text-sm font-medium">
          Active until {format(endDate, 'MMM dd, yyyy')}
        </span>
      );
    }
    return <span className="text-yellow-600 text-sm font-medium">Pending</span>;
  };

  const handleViewDetails = (agent: AgentRow) => {
    setSelectedAgent(agent);
    setModalOpen(true);
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Agents</h3>
        <p>Manage registered agents and their subscriptions</p>
      </div>

      <div className='table_toolbar'>
        <div className='table_search'>
          <input
            type='text'
            placeholder='Search by email, mobile, or name...'
            value={pendingQuery}
            onChange={e => setPendingQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className='error_message' style={{ marginBottom: '1rem', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      <div className='table_wrapper'>
        <table className='table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Country</th>
              <th>Status</th>
              <th>Subscription</th>
              <th>Registered</th>
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
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className='table_empty'>
                  No agents found
                </td>
              </tr>
            )}
            {!loading &&
              rows.map(agent => (
                <tr key={agent.id}>
                  <td>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{agent.full_name}</span>
                    </div>
                  </td>
                  <td>
                    <a
                      href={`mailto:${agent.email}`}
                      className='text-blue-600 hover:underline flex items-center gap-1'
                    >
                      <Mail size={14} />
                      {agent.email}
                    </a>
                  </td>
                  <td>
                    <a
                      href={`tel:${agent.mobile_number}`}
                      className='text-blue-600 hover:underline flex items-center gap-1'
                    >
                      <Phone size={14} />
                      {agent.mobile_number}
                    </a>
                  </td>
                  <td>
                    <div className='flex items-center gap-1 text-gray-600'>
                      <MapPin size={14} />
                      {agent.resident_country}
                    </div>
                  </td>
                  <td>{getStatusBadge(agent.is_active)}</td>
                  <td>{getSubscriptionStatus(agent.subscriptions)}</td>
                  <td>
                    <div className='flex items-center gap-1 text-gray-600'>
                      <Calendar size={14} />
                      {agent.created_at
                        ? format(new Date(agent.created_at), 'MMM dd, yyyy')
                        : '-'}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleViewDetails(agent)}
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
      {modalOpen && selectedAgent && (
        <div className='modal_overlay' onClick={() => setModalOpen(false)}>
          <div className='modal_content' onClick={e => e.stopPropagation()}>
            <div className='modal_header'>
              <h3>Agent Details</h3>
              <button
                onClick={() => setModalOpen(false)}
                className='modal_close'
              >
                ×
              </button>
            </div>
            <div className='modal_body'>
              <div className='detail_section'>
                <h4 className='detail_section_title'>Agent Information</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Full Name:</strong>
                    <span>{selectedAgent.full_name}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Email:</strong>
                    <a
                      href={`mailto:${selectedAgent.email}`}
                      className='text-blue-600 hover:underline'
                    >
                      {selectedAgent.email}
                    </a>
                  </div>
                  <div className='detail_item'>
                    <strong>Mobile Number:</strong>
                    <a
                      href={`tel:${selectedAgent.mobile_number}`}
                      className='text-blue-600 hover:underline'
                    >
                      {selectedAgent.mobile_number}
                    </a>
                  </div>
                  <div className='detail_item'>
                    <strong>Resident Country:</strong>
                    <span>{selectedAgent.resident_country}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Status:</strong>
                    {getStatusBadge(selectedAgent.is_active)}
                  </div>
                </div>
              </div>

              {selectedAgent.subscriptions && selectedAgent.subscriptions.length > 0 && (
                <div className='detail_section'>
                  <h4 className='detail_section_title'>Subscription Details</h4>
                  <div className='detail_grid'>
                    {selectedAgent.subscriptions.map((sub, idx) => {
                      const endDate = new Date(sub.end_date);
                      const startDate = new Date(sub.start_date);
                      const now = new Date();
                      const isExpired = endDate < now;
                      const isActive = sub.is_active && sub.payment_status === 'completed';

                      return (
                        <div key={sub.id || idx} className='detail_item'>
                          <div className='space-y-2'>
                            <div>
                              <strong>Type:</strong>
                              <span className='ml-2 capitalize'>{sub.subscription_type.replace('_', ' ')}</span>
                            </div>
                            <div>
                              <strong>Amount Paid:</strong>
                              <span className='ml-2'>{sub.amount_paid} {sub.currency}</span>
                            </div>
                            <div>
                              <strong>Payment Status:</strong>
                              <span className={`ml-2 capitalize ${
                                sub.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {sub.payment_status}
                              </span>
                            </div>
                            <div>
                              <strong>Start Date:</strong>
                              <span className='ml-2'>{format(startDate, 'MMM dd, yyyy')}</span>
                            </div>
                            <div>
                              <strong>End Date:</strong>
                              <span className={`ml-2 ${isExpired ? 'text-red-600' : ''}`}>
                                {format(endDate, 'MMM dd, yyyy')}
                                {isExpired && ' (Expired)'}
                              </span>
                            </div>
                            <div>
                              <strong>Subscription Status:</strong>
                              {isActive ? (
                                <span className='ml-2 text-green-600 font-medium'>Active</span>
                              ) : (
                                <span className='ml-2 text-gray-600'>Inactive</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className='detail_section'>
                <h4 className='detail_section_title'>Metadata</h4>
                <div className='detail_grid'>
                  <div className='detail_item'>
                    <strong>Registered:</strong>
                    <span>
                      {format(
                        new Date(selectedAgent.created_at),
                        'MMM dd, yyyy HH:mm'
                      )}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>Last Updated:</strong>
                    <span>
                      {format(
                        new Date(selectedAgent.updated_at),
                        'MMM dd, yyyy HH:mm'
                      )}
                    </span>
                  </div>
                  <div className='detail_item'>
                    <strong>User ID:</strong>
                    <span className='font-mono text-xs'>{selectedAgent.user_id}</span>
                  </div>
                  <div className='detail_item'>
                    <strong>Agent ID:</strong>
                    <span className='font-mono text-xs'>{selectedAgent.id}</span>
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
