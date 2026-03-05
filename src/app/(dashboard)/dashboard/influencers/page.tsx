'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail, UserCheck, UserX } from 'lucide-react';

type InfluencerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  total_earned: number;
  total_withdrawn: number;
  available_balance: number;
  pending_amount: number;
};

export default function InfluencersPage() {
  const [rows, setRows] = useState<InfluencerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/influencer-admin/influencers');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load');
      setRows(json.data ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load influencers');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (row: InfluencerRow) => {
    const newStatus = row.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/influencer-admin/influencers/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to update');
      toast.success(`Influencer ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
      setRows(prev =>
        prev.map(r => (r.id === row.id ? { ...r, status: newStatus } : r))
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="dashboard_loader">
        <div className="dashboard_loader_spinner" />
        <p>Loading influencers...</p>
      </div>
    );
  }

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Manage Influencers</h3>
        <p>View and manage your influencer partners</p>
      </div>

      <div className="table_toolbar">
        <div className="table_search" />
        <div className="table_actions">
          <Link href="/dashboard/influencers/invite" className="btn_primary">
            <Mail size={16} />
            Send Invitation
          </Link>
        </div>
      </div>

      <div className="table_wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Total Earned</th>
              <th style={{ textAlign: 'right' }}>Available</th>
              <th style={{ textAlign: 'right' }}>Pending</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="table_empty">
                  No influencers yet.{' '}
                  <Link href="/dashboard/influencers/invite" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    Send your first invitation
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>{row.name || '—'}</td>
                  <td>{row.email}</td>
                  <td>
                    <span className={`deal-status-badge ${row.status === 'active' ? 'deal-status-active' : 'deal-status-inactive'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    ₹{row.total_earned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    ₹{row.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    ₹{row.pending_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleStatus(row)}
                      className="table_action_btn"
                      title={row.status === 'active' ? 'Suspend' : 'Reactivate'}
                    >
                      {row.status === 'active' ? (
                        <><UserX size={14} /> Suspend</>
                      ) : (
                        <><UserCheck size={14} /> Reactivate</>
                      )}
                    </button>
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
