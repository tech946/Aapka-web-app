'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Calendar, Zap, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { generateShortSlug } from '@/lib/utils';
import './deals-modal.css';

interface Package {
  package_id: string;
  package_name: string;
  package_days?: number | null;
  package_nights?: number | null;
  adult_price: number | null;
  child_price: number | null;
  infant_price: number | null;
  solo_traveller_price: number | null;
  thumbnail_image: string | null;
}

interface LimitedTimeDeal {
  id: string;
  offer_package_id: string;
  start_date: string;
  end_date: string;
  booking_fee_aed: number;
  max_bookings_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  package?: Package;
}

export default function LimitedTimeDealsClient() {
  const [deals, setDeals] = useState<LimitedTimeDeal[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<LimitedTimeDeal | null>(null);
  const [formData, setFormData] = useState({
    offer_package_id: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    loadDeals();
    loadPackages();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/limited-time-deals?include_expired=true');
      if (!res.ok) throw new Error('Failed to load limited time deals');
      const json = await res.json();
      setDeals(json.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load limited time deals');
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const res = await fetch('/api/packages?categorySlug=offer-packages&status=active&limit=500');
      if (!res.ok) throw new Error('Failed to load offer packages');
      const json = await res.json();
      setPackages(json.data || []);
    } catch (error: any) {
      console.error('Failed to load packages:', error);
    }
  };

  const formatDateLocal = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenModal = (deal?: LimitedTimeDeal) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        offer_package_id: deal.offer_package_id,
        start_date: formatDateLocal(deal.start_date),
        end_date: formatDateLocal(deal.end_date),
        is_active: deal.is_active,
      });
    } else {
      setEditingDeal(null);
      const today = new Date();
      const startDefault = new Date(today.getFullYear(), 9, 15); // Mid Oct
      const endDefault = new Date(today.getFullYear() + 1, 2, 15); // Mid March
      setFormData({
        offer_package_id: '',
        start_date: formatDateLocal(startDefault.toISOString()),
        end_date: formatDateLocal(endDefault.toISOString()),
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDeal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const submitData = {
        ...formData,
        start_date: new Date(formData.start_date + 'T00:00:00').toISOString(),
        end_date: new Date(formData.end_date + 'T23:59:59').toISOString(),
      };

      const url = editingDeal
        ? `/api/limited-time-deals/${editingDeal.id}`
        : '/api/limited-time-deals';
      const method = editingDeal ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to save limited time deal');
      }

      toast.success(editingDeal ? 'Limited time deal updated' : 'Limited time deal created');
      handleCloseModal();
      loadDeals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this limited time deal?')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/limited-time-deals/${dealId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Limited time deal deleted');
      loadDeals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (deal: LimitedTimeDeal) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/limited-time-deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !deal.is_active }),
      });

      if (!res.ok) throw new Error('Failed to update');

      toast.success(`Deal ${!deal.is_active ? 'activated' : 'deactivated'}`);
      loadDeals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Limited Time Deals</h3>
        <p>Same offer packages with 100 AED booking fee, mid Oct–mid March, max 46 bookings/day</p>
      </div>

      <div className="deals-toolbar">
        <div className="deals-toolbar-content">
          <div className="deals-toolbar-info">
            <h4 className="deals-toolbar-title">Limited Time Deals</h4>
            <p className="deals-toolbar-subtitle">{deals.length} deal{deals.length !== 1 ? 's' : ''} total</p>
          </div>
          <button className="btn_primary deals-add-btn" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            <span>Add Deal</span>
          </button>
        </div>
      </div>

      {loading && !deals.length ? (
        <div className="deals-loading-state">
          <div className="deals-loading-spinner"></div>
          <p>Loading limited time deals...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="deals-empty-state">
          <div className="deals-empty-icon">
            <Zap size={48} />
          </div>
          <h3>No limited time deals</h3>
          <p>Create a deal to offer packages for mid Oct–mid March with 100 AED booking fee.</p>
          <button className="btn_primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            Create First Deal
          </button>
        </div>
      ) : (
        <div className="deals-grid">
          {deals.map((deal) => {
            const startDate = new Date(deal.start_date);
            const endDate = new Date(deal.end_date);
            const isActive = deal.is_active && now >= startDate && now <= endDate;
            const isExpired = now > endDate;
            const isUpcoming = now < startDate;

            const statusConfig = isActive
              ? { label: 'Active', icon: CheckCircle2, bg: '#dcfce7', color: '#166534', border: '#86efac' }
              : isExpired
                ? { label: 'Expired', icon: XCircle, bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
                : isUpcoming
                  ? { label: 'Upcoming', icon: Clock, bg: '#fef3c7', color: '#92400e', border: '#fde68a' }
                  : { label: 'Inactive', icon: AlertCircle, bg: '#e5e7eb', color: '#374151', border: '#d1d5db' };

            const StatusIcon = statusConfig.icon;

            return (
              <div key={deal.id} className="deal-card">
                <div className="deal-card-header">
                  <div className="deal-package-info">
                    {deal.package?.thumbnail_image && (
                      <div className="deal-thumbnail">
                        <img src={deal.package.thumbnail_image} alt={deal.package.package_name || 'Package'} />
                      </div>
                    )}
                    <div className="deal-package-details">
                      <h4 className="deal-package-name">{deal.package?.package_name || 'Unknown Package'}</h4>
                      <span className="deal-package-id">100 AED booking fee · max {deal.max_bookings_per_day}/day</span>
                    </div>
                  </div>
                  <div className={`deal-status-badge deal-status-${isActive ? 'active' : isExpired ? 'expired' : isUpcoming ? 'upcoming' : 'inactive'}`}>
                    <StatusIcon size={14} />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>

                <div className="deal-card-body">
                  <div className="deal-section">
                    <h5 className="deal-section-title">Date Range</h5>
                    <div className="deal-dates">
                      <div className="deal-date-item">
                        <Calendar size={16} />
                        <div>
                          <span className="deal-date-label">Start</span>
                          <span className="deal-date-value">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="deal-date-separator">→</div>
                      <div className="deal-date-item">
                        <Calendar size={16} />
                        <div>
                          <span className="deal-date-label">End</span>
                          <span className="deal-date-value">{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="deal-section">
                    <a href={`${baseUrl}/limited-time-deals/${encodeURIComponent(generateShortSlug(deal.package?.package_name || 'pkg', deal.package?.package_id || deal.offer_package_id, deal.package?.package_days, deal.package?.package_nights))}`} target="_blank" rel="noopener noreferrer" className="deal-view-link">
                      View on website →
                    </a>
                  </div>
                </div>

                <div className="deal-card-footer">
                  <button className="deal-toggle-btn" onClick={() => handleToggleActive(deal)}>
                    {deal.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <div className="deal-actions">
                    <button className="deal-action-btn deal-action-edit" onClick={() => handleOpenModal(deal)} title="Edit">
                      <Edit size={16} />
                    </button>
                    <button className="deal-action-btn deal-action-delete" onClick={() => handleDelete(deal.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal_overlay" onClick={handleCloseModal}>
          <div className="modal deals-modal" onClick={(e) => e.stopPropagation()}>
            <div className="deals-modal-header">
              <h4>{editingDeal ? 'Edit Limited Time Deal' : 'Create Limited Time Deal'}</h4>
              <button className="deals-modal-close-btn" onClick={handleCloseModal} type="button">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="deals-modal-body">
                <div className="deals-form-row">
                  <label className="deals-form-label">
                    Offer Package <span className="deals-form-label-required">*</span>
                  </label>
                  <select
                    className="deals-form-select"
                    value={formData.offer_package_id}
                    onChange={(e) => setFormData({ ...formData, offer_package_id: e.target.value })}
                    required
                    disabled={!!editingDeal}
                  >
                    <option value="">Select offer package</option>
                    {packages.map((p) => (
                      <option key={p.package_id} value={p.package_id}>
                        {p.package_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="deals-form-row">
                  <label className="deals-form-label">
                    Start Date (e.g. mid Oct) <span className="deals-form-label-required">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="deals-date-input"
                  />
                </div>

                <div className="deals-form-row">
                  <label className="deals-form-label">
                    End Date (e.g. mid March) <span className="deals-form-label-required">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    min={formData.start_date}
                    className="deals-date-input"
                  />
                </div>

                <div className="deals-form-row">
                  <label className="deals-checkbox-row">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="deals-checkbox"
                    />
                    <span>Active (deal visible on website when within date range)</span>
                  </label>
                </div>
              </div>
              <div className="deals-modal-footer">
                <button type="button" className="btn_secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn_primary" disabled={loading}>
                  {loading ? 'Saving...' : editingDeal ? 'Update Deal' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
