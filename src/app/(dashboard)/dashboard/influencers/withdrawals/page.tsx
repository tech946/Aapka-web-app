'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

type Withdrawal = {
  id: string;
  influencer_id: string;
  amount: number;
  status: string;
  payment_method: string;
  bank_account_name: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  influencers: { name: string; email: string } | null;
};

export default function InfluencerWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [acting, setActing] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<{ id: string; notes: string } | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/influencer-admin/withdrawals?${params}`);
      const json = await res.json();
      if (res.ok && json.data) setWithdrawals(json.data);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    id: string,
    action: 'paid' | 'reject',
    adminNotes?: string
  ) => {
    setActing(id);
    try {
      const res = await fetch(`/api/influencer-admin/withdrawals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, admin_notes: adminNotes || '' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      toast.success(action === 'paid' ? 'Marked as paid' : 'Rejected');
      setNotesModal(null);
      setWithdrawals(prev =>
        prev.map(w =>
          w.id === id ? { ...w, status: action === 'paid' ? 'paid' : 'rejected' } : w
        )
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard_loader">
        <div className="dashboard_loader_spinner" />
        <p>Loading withdrawals...</p>
      </div>
    );
  }

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Withdrawal Requests</h3>
        <p>Process influencer payout requests. Mark as paid after completing bank transfer.</p>
      </div>

      <div className="table_toolbar">
        <div className="table_search" />
        <div className="table_actions">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select_filter">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="table_wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Influencer</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Payment Details</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={6} className="table_empty">No withdrawals found</td>
              </tr>
            ) : (
              withdrawals.map(row => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.influencers?.name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.influencers?.email || ''}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ₹{parseFloat(String(row.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {row.payment_method === 'upi' ? (
                      <>UPI: {row.upi_id || '—'}</>
                    ) : (
                      <>{row.bank_account_name}, {row.bank_account_number?.slice(-4)}..., IFSC: {row.ifsc_code}</>
                    )}
                  </td>
                  <td>
                    <span className={`deal-status-badge ${
                      row.status === 'paid' ? 'deal-status-active' :
                      row.status === 'rejected' ? 'deal-status-expired' : 'deal-status-upcoming'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(new Date(row.requested_at), 'MMM d, yyyy')}</td>
                  <td>
                    {row.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setNotesModal({ id: row.id, notes: '' })} className="btn_primary btn_small">
                          Mark Paid
                        </button>
                        <button onClick={() => handleAction(row.id, 'reject')} disabled={!!acting} className="table_action_btn table_action_delete" title="Reject">
                          {acting === row.id ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <X size={16} />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {notesModal && (
        <div className="modal_overlay" onClick={() => setNotesModal(null)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal_header">
              <h4 style={{ margin: 0 }}>Mark as Paid</h4>
            </div>
            <div className="modal_body">
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                Add transaction reference or notes (optional)
              </p>
              <div className="form_row">
                <textarea
                  value={notesModal.notes}
                  onChange={e => setNotesModal({ ...notesModal, notes: e.target.value })}
                  placeholder="e.g. NEFT Ref: 123456789"
                  style={{ minHeight: 80 }}
                />
              </div>
            </div>
            <div className="modal_footer">
              <button onClick={() => setNotesModal(null)} className="btn_secondary">Cancel</button>
              <button onClick={() => handleAction(notesModal.id, 'paid', notesModal.notes)} disabled={!!acting} className="btn_primary">
                {acting === notesModal.id ? 'Processing...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
