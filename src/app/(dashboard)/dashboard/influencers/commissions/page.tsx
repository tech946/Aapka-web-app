'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

type PackageCommission = {
  package_id: string;
  package_name: string;
  status: string;
  commission_id: string | null;
  commission_percent: number;
  is_active: boolean;
};

export default function InfluencerCommissionsPage() {
  const [packages, setPackages] = useState<PackageCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/influencer-admin/commissions');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load');
      setPackages(json.data ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load commissions');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pkg: PackageCommission, percent: number, isActive: boolean) => {
    setSaving(pkg.package_id);
    try {
      const res = await fetch('/api/influencer-admin/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'package',
          entity_id: pkg.package_id,
          commission_percent: percent,
          is_active: isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      toast.success('Commission saved');
      setPackages(prev =>
        prev.map(p =>
          p.package_id === pkg.package_id
            ? { ...p, commission_percent: percent, is_active: isActive }
            : p
        )
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard_loader">
        <div className="dashboard_loader_spinner" />
        <p>Loading commissions...</p>
      </div>
    );
  }

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Commission Settings</h3>
        <p>Set commission percentage for each package. Influencers see these rates on their portal.</p>
      </div>

      <div className="table_wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Package</th>
              <th>Commission %</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan={4} className="table_empty">No packages found</td>
              </tr>
            ) : (
              packages.map(pkg => (
                <PackageCommissionRow
                  key={pkg.package_id}
                  pkg={pkg}
                  onSave={handleSave}
                  saving={saving === pkg.package_id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PackageCommissionRow({
  pkg,
  onSave,
  saving,
}: {
  pkg: PackageCommission;
  onSave: (p: PackageCommission, percent: number, isActive: boolean) => void;
  saving: boolean;
}) {
  const [percent, setPercent] = useState(String(pkg.commission_percent || 0));
  const [isActive, setIsActive] = useState(pkg.is_active);

  useEffect(() => {
    setPercent(String(pkg.commission_percent || 0));
    setIsActive(pkg.is_active);
  }, [pkg.commission_percent, pkg.is_active]);

  const handleSubmit = () => {
    const val = parseFloat(percent);
    if (Number.isNaN(val) || val < 0 || val > 100) {
      toast.error('Commission must be 0–100');
      return;
    }
    onSave(pkg, val, isActive);
  };

  return (
    <tr>
      <td>
        <span style={{ fontWeight: 600 }}>{pkg.package_name}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
          ({pkg.package_id.slice(0, 8)}...)
        </span>
      </td>
      <td>
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={percent}
          onChange={e => setPercent(e.target.value)}
          style={{ width: 100, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--panel-2)', color: 'var(--text)' }}
        />
      </td>
      <td>
        <label className="status_toggle_wrapper" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          <span className="status_toggle_label">Yes</span>
        </label>
      </td>
      <td>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn_primary btn_small"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {saving ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><Save size={16} /> Save</>}
        </button>
      </td>
    </tr>
  );
}
