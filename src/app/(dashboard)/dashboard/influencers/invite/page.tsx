'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Mail, Copy } from 'lucide-react';
import { format } from 'date-fns';

type Invitation = {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export default function InviteInfluencersPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRegisterUrl, setLastRegisterUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/influencer-admin/invitations');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load');
      setInvitations(json.data ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Enter an email address');
      return;
    }

    setSending(true);
    setLastRegisterUrl(null);
    try {
      const res = await fetch('/api/influencer-admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to send');
      toast.success(json.message ?? 'Invitation sent');
      setEmail('');
      fetchInvitations();
      if (json.registerUrl) setLastRegisterUrl(json.registerUrl);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  return (
    <div className="dashboard_page invite_page">
      <div className="heading_block">
        <h3>Send Invitations</h3>
        <p>Invite influencers to join your program. They will receive an email with a unique registration link (valid 7 days).</p>
      </div>

      <div className="form_section invite_form_section">
        <form onSubmit={handleSubmit} className="form_grid" style={{ maxWidth: 560, marginBottom: 0 }}>
          <div className="form_row full_width" style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 0 }}>
            <div className="form_row" style={{ flex: 1 }}>
              <label>Email address</label>
              <input
                type="email"
                placeholder="influencer@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={sending}
              />
            </div>
            <button type="submit" disabled={sending} className="btn_primary" style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {sending ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><Mail size={18} /> Send Invite</>}
            </button>
          </div>
        </form>

        {lastRegisterUrl && (
          <div style={{ padding: 12, background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manual link (email not configured):</span>
            <code style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastRegisterUrl}</code>
            <button onClick={() => copyUrl(lastRegisterUrl)} className="table_action_btn" title="Copy">
              <Copy size={16} />
            </button>
          </div>
        )}
      </div>

      <h3 className="section_title invite_section_title">Sent Invitations</h3>
      <div className="table_wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="table_loading">
                  <div className="dashboard_loader_spinner" style={{ margin: '20px auto' }} />
                </td>
              </tr>
            ) : invitations.length === 0 ? (
              <tr>
                <td colSpan={4} className="table_empty">No invitations sent yet</td>
              </tr>
            ) : (
              invitations.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.email}</td>
                  <td>
                    <span
                      className={`deal-status-badge ${
                        inv.status === 'used' ? 'deal-status-active' :
                        inv.status === 'expired' ? 'deal-status-expired' : 'deal-status-upcoming'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(new Date(inv.expires_at), 'MMM d, yyyy')}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(new Date(inv.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
