'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Mail, Phone, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

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
  /** Set once "Push lead to CRM" has run (database/add-crm-push-to-contact-queries.sql). */
  crm_lead_reference?: string | null;
  crm_assignee_name?: string | null;
  pushed_to_crm_at?: string | null;
};

type CrmUser = { id: string; full_name: string; email_address: string | null };

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

  // "Push lead to CRM" opens a dialog: the admin must pick the CRM agent who
  // gets the lead, then the query goes through the same pipe as the
  // travel-enquiry form (create, or merge by WhatsApp number).
  const [pushTarget, setPushTarget] = useState<ContactQueryRow | null>(null);
  const [crmUsers, setCrmUsers] = useState<CrmUser[] | null>(null);
  const [crmUsersError, setCrmUsersError] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [pushing, setPushing] = useState(false);

  const openPushDialog = (row: ContactQueryRow) => {
    setPushTarget(row);
    setAssigneeId('');
  };

  // Agents are loaded once per page visit, on first open.
  useEffect(() => {
    if (!pushTarget || crmUsers !== null) return;
    let cancelled = false;
    setCrmUsersError(null);
    fetch('/api/contact/crm-users')
      .then(async res => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Could not load CRM users');
        if (!cancelled) setCrmUsers(json.users ?? []);
      })
      .catch(e => {
        if (!cancelled) setCrmUsersError(e?.message ?? 'Could not load CRM users');
      });
    return () => {
      cancelled = true;
    };
  }, [pushTarget, crmUsers]);

  const pushToCrm = async () => {
    if (!pushTarget || !assigneeId || pushing) return;
    const row = pushTarget;
    setPushing(true);
    try {
      const res = await fetch(`/api/contact/${row.id}/push-to-crm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json.hint ? `${json.error} — ${json.hint}` : json.error || 'Failed to push lead to CRM'
        );
      }
      const saved: ContactQueryRow = json.data ?? {
        ...row,
        crm_lead_reference: json.reference,
        crm_assignee_name: json.assignment?.assignee_name ?? null,
        pushed_to_crm_at: new Date().toISOString(),
      };
      setRows(prev => prev.map(r => (r.id === row.id ? { ...r, ...saved } : r)));
      setSelectedQuery(prev => (prev && prev.id === row.id ? { ...prev, ...saved } : prev));
      toast.success(json.message || `Lead ${json.reference} created in CRM`);
      setPushTarget(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to push lead to CRM');
    } finally {
      setPushing(false);
    }
  };

  const renderPushControl = (row: ContactQueryRow, compact = false) =>
    row.crm_lead_reference ? (
      <span
        className='crm_pushed_badge'
        title={[
          row.crm_assignee_name ? `Assigned to ${row.crm_assignee_name}` : null,
          row.pushed_to_crm_at
            ? `Pushed ${format(new Date(row.pushed_to_crm_at), 'MMM dd, yyyy HH:mm')}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ') || undefined}
      >
        <CheckCircle2 size={14} aria-hidden />
        In CRM · {row.crm_lead_reference}
      </span>
    ) : (
      <button
        type='button'
        className={compact ? 'btn_secondary btn_push_crm' : 'btn_primary btn_push_crm'}
        onClick={() => openPushDialog(row)}
        title='Create this query as a lead in the CRM and assign it to an agent'
      >
        <Send size={14} aria-hidden />
        Push lead to CRM
      </button>
    );

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
                    <div className='row_actions'>
                      <button
                        onClick={() => handleViewDetails(r)}
                        className='btn_secondary'
                      >
                        View Details
                      </button>
                      {renderPushControl(r, true)}
                    </div>
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
                  {selectedQuery.crm_lead_reference && (
                    <div className='detail_item'>
                      <strong>CRM Lead:</strong>
                      <span>
                        {selectedQuery.crm_lead_reference}
                        {selectedQuery.crm_assignee_name
                          ? ` · assigned to ${selectedQuery.crm_assignee_name}`
                          : ''}
                        {selectedQuery.pushed_to_crm_at
                          ? ` · pushed ${format(new Date(selectedQuery.pushed_to_crm_at), 'MMM dd, yyyy HH:mm')}`
                          : ''}
                      </span>
                    </div>
                  )}
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
              {renderPushControl(selectedQuery)}
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

      {/* Push to CRM dialog: pick the agent, then push */}
      {pushTarget && (
        <div className='modal_overlay' onClick={() => !pushing && setPushTarget(null)}>
          <div
            className='modal_content modal_content--sm'
            onClick={e => e.stopPropagation()}
            role='dialog'
            aria-labelledby='push-crm-title'
          >
            <div className='modal_header'>
              <h3 id='push-crm-title'>Push lead to CRM</h3>
              <button
                type='button'
                onClick={() => setPushTarget(null)}
                className='modal_close'
                disabled={pushing}
              >
                ×
              </button>
            </div>
            <div className='modal_body'>
              <div className='push_crm_summary'>
                <strong>
                  {pushTarget.first_name} {pushTarget.last_name}
                </strong>
                <span>
                  {pushTarget.phone}
                  {pushTarget.email ? ` · ${pushTarget.email}` : ''}
                </span>
              </div>
              <p className='push_crm_note'>
                This creates the query as a lead in the CRM exactly like a website enquiry
                (source <code>website-contact</code>). If a lead with this WhatsApp number
                already exists, the message is added to it instead.
              </p>

              <label className='push_crm_field'>
                <span>
                  Assign to agent <em>*</em>
                </span>
                {crmUsersError ? (
                  <span className='push_crm_error'>
                    {crmUsersError}{' '}
                    <button
                      type='button'
                      className='link_button'
                      onClick={() => {
                        setCrmUsers(null);
                        setCrmUsersError(null);
                      }}
                    >
                      Retry
                    </button>
                  </span>
                ) : (
                  <select
                    className='select_filter'
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    disabled={crmUsers === null || pushing}
                    required
                  >
                    <option value=''>
                      {crmUsers === null
                        ? 'Loading CRM users…'
                        : crmUsers.length === 0
                          ? 'No active CRM agents found'
                          : 'Select a CRM agent'}
                    </option>
                    {(crmUsers ?? []).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name}
                        {u.email_address ? ` — ${u.email_address}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            </div>
            <div className='modal_footer'>
              <button
                type='button'
                onClick={() => setPushTarget(null)}
                className='btn_secondary'
                disabled={pushing}
              >
                Cancel
              </button>
              <button
                type='button'
                className='btn_primary btn_push_crm'
                onClick={pushToCrm}
                disabled={!assigneeId || pushing}
                title={!assigneeId ? 'Choose an agent first' : undefined}
              >
                <Send size={14} aria-hidden />
                {pushing ? 'Pushing…' : 'Push & assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
