'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

type Conversion = {
  id: string;
  referral_code: string;
  influencer_id: string;
  booking_id: string;
  payment_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  created_at: string;
  influencers: { name: string; email: string } | null;
};

export default function InfluencerConversionsPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetchConversions();
  }, [statusFilter]);

  const fetchConversions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/influencer-admin/conversions?${params}`);
      const json = await res.json();
      if (res.ok && json.data) setConversions(json.data);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActing(id);
    try {
      const res = await fetch(`/api/influencer-admin/conversions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      toast.success(action === 'approve' ? 'Conversion approved' : 'Conversion rejected');
      setConversions(prev =>
        prev.map(c => (c.id === id ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c))
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
        <p>Loading conversions...</p>
      </div>
    );
  }

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Referral Conversions</h3>
        <p>Approve or reject conversions to credit influencer wallets</p>
      </div>

      <div className="table_toolbar">
        <div className="table_search" />
        <div className="table_actions">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="select_filter"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="table_wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Influencer</th>
              <th>Booking</th>
              <th style={{ textAlign: 'right' }}>Payment</th>
              <th style={{ textAlign: 'right' }}>Commission</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {conversions.length === 0 ? (
              <tr>
                <td colSpan={7} className="table_empty">No conversions found</td>
              </tr>
            ) : (
              conversions.map(row => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.influencers?.name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.influencers?.email || ''}</div>
                  </td>
                  <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{row.booking_id?.slice(0, 8)}...</td>
                  <td style={{ textAlign: 'right' }}>₹{parseFloat(String(row.payment_amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>₹{parseFloat(String(row.commission_amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`deal-status-badge ${
                      row.status === 'paid' ? 'deal-status-active' :
                      row.status === 'rejected' ? 'deal-status-expired' :
                      row.status === 'approved' ? 'deal-status-upcoming' : 'deal-status-inactive'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(new Date(row.created_at), 'MMM d, yyyy')}</td>
                  <td>
                    {row.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleAction(row.id, 'approve')} disabled={!!acting} className="table_action_btn deal-action-edit" title="Approve">
                          {acting === row.id ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={16} />}
                        </button>
                        <button onClick={() => handleAction(row.id, 'reject')} disabled={!!acting} className="table_action_btn table_action_delete" title="Reject">
                          <X size={16} />
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
    </div>
  );
}
