'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Calendar, Tag, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import './deals-modal.css';

interface Package {
  package_id: string;
  package_name: string;
  adult_price: number | null;
  child_price: number | null;
  infant_price: number | null;
  solo_traveller_price: number | null;
  thumbnail_image: string | null;
}

interface Deal {
  id: string;
  package_id: string;
  deal_adult_price: number | null;
  deal_child_price: number | null;
  deal_infant_price: number | null;
  deal_solo_traveller_price: number | null;
  original_adult_price: number | null;
  original_child_price: number | null;
  original_infant_price: number | null;
  original_solo_traveller_price: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  packages?: Package;
}

export default function DealsOfTheDayClient() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState({
    package_id: '',
    deal_adult_price: '',
    deal_child_price: '',
    deal_infant_price: '',
    deal_solo_traveller_price: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  // Load deals and packages
  useEffect(() => {
    loadDeals();
    loadPackages();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/package-deals?include_expired=true');
      if (!res.ok) throw new Error('Failed to load deals');
      const json = await res.json();
      setDeals(json.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const res = await fetch('/api/packages?status=active&limit=1000');
      if (!res.ok) throw new Error('Failed to load packages');
      const json = await res.json();
      setPackages(json.data || []);
    } catch (error: any) {
      console.error('Failed to load packages:', error);
    }
  };

  const formatDateTimeLocal = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleOpenModal = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        package_id: deal.package_id,
        deal_adult_price: deal.deal_adult_price?.toString() || '',
        deal_child_price: deal.deal_child_price?.toString() || '',
        deal_infant_price: deal.deal_infant_price?.toString() || '',
        deal_solo_traveller_price: deal.deal_solo_traveller_price?.toString() || '',
        start_date: formatDateTimeLocal(deal.start_date),
        end_date: formatDateTimeLocal(deal.end_date),
        is_active: deal.is_active,
      });
    } else {
      setEditingDeal(null);
      // Set default dates (today and tomorrow)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        package_id: '',
        deal_adult_price: '',
        deal_child_price: '',
        deal_infant_price: '',
        deal_solo_traveller_price: '',
        start_date: formatDateTimeLocal(today.toISOString()),
        end_date: formatDateTimeLocal(tomorrow.toISOString()),
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
        deal_adult_price: formData.deal_adult_price ? Number(formData.deal_adult_price) : null,
        deal_child_price: formData.deal_child_price ? Number(formData.deal_child_price) : null,
        deal_infant_price: formData.deal_infant_price ? Number(formData.deal_infant_price) : null,
        deal_solo_traveller_price: formData.deal_solo_traveller_price ? Number(formData.deal_solo_traveller_price) : null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      const url = editingDeal
        ? `/api/package-deals/${editingDeal.id}`
        : '/api/package-deals';
      const method = editingDeal ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to save deal');
      }

      toast.success(editingDeal ? 'Deal updated successfully' : 'Deal created successfully');
      handleCloseModal();
      loadDeals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/package-deals/${dealId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete deal');

      toast.success('Deal deleted successfully');
      loadDeals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete deal');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (deal: Deal) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/package-deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !deal.is_active }),
      });

      if (!res.ok) throw new Error('Failed to update deal');

      toast.success(`Deal ${!deal.is_active ? 'activated' : 'deactivated'}`);
      loadDeals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update deal');
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packages.find((p) => p.package_id === formData.package_id);
  const now = new Date();

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Deals of the Day</h3>
        <p>Manage special pricing deals for packages</p>
      </div>

      <div className="deals-toolbar">
        <div className="deals-toolbar-content">
          <div className="deals-toolbar-info">
            <h4 className="deals-toolbar-title">Deals Management</h4>
            <p className="deals-toolbar-subtitle">{deals.length} {deals.length === 1 ? 'deal' : 'deals'} total</p>
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
          <p>Loading deals...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="deals-empty-state">
          <div className="deals-empty-icon">
            <Tag size={48} />
          </div>
          <h3>No deals found</h3>
          <p>Create your first deal to get started with special pricing offers.</p>
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
                    {deal.packages?.thumbnail_image && (
                      <div className="deal-thumbnail">
                        <img
                          src={deal.packages.thumbnail_image}
                          alt={deal.packages.package_name || 'Package'}
                        />
                      </div>
                    )}
                    <div className="deal-package-details">
                      <h4 className="deal-package-name">
                        {deal.packages?.package_name || 'Unknown Package'}
                      </h4>
                      <span className="deal-package-id">ID: {deal.package_id.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <div className={`deal-status-badge deal-status-${isActive ? 'active' : isExpired ? 'expired' : isUpcoming ? 'upcoming' : 'inactive'}`}>
                    <StatusIcon size={14} />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>

                <div className="deal-card-body">
                  <div className="deal-section">
                    <h5 className="deal-section-title">Deal Prices</h5>
                    <div className="deal-prices-grid">
                      {deal.deal_adult_price !== null && (
                        <div className="deal-price-item">
                          <span className="deal-price-label">Adult</span>
                          <span className="deal-price-value">AED {deal.deal_adult_price.toLocaleString()}</span>
                        </div>
                      )}
                      {deal.deal_child_price !== null && (
                        <div className="deal-price-item">
                          <span className="deal-price-label">Child</span>
                          <span className="deal-price-value">AED {deal.deal_child_price.toLocaleString()}</span>
                        </div>
                      )}
                      {deal.deal_infant_price !== null && (
                        <div className="deal-price-item">
                          <span className="deal-price-label">Infant</span>
                          <span className="deal-price-value">AED {deal.deal_infant_price.toLocaleString()}</span>
                        </div>
                      )}
                      {deal.deal_solo_traveller_price !== null && (
                        <div className="deal-price-item">
                          <span className="deal-price-label">Solo</span>
                          <span className="deal-price-value">AED {deal.deal_solo_traveller_price.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

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
                </div>

                <div className="deal-card-footer">
                  <button
                    className="deal-toggle-btn"
                    onClick={() => handleToggleActive(deal)}
                  >
                    {deal.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <div className="deal-actions">
                    <button
                      className="deal-action-btn deal-action-edit"
                      onClick={() => handleOpenModal(deal)}
                      title="Edit deal"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="deal-action-btn deal-action-delete"
                      onClick={() => handleDelete(deal.id)}
                      title="Delete deal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal_overlay" onClick={handleCloseModal}>
          <div className="modal deals-modal" onClick={(e) => e.stopPropagation()}>
            <div className="deals-modal-header">
              <h4>
                {editingDeal ? 'Edit Deal' : 'Create New Deal'}
              </h4>
              <button 
                className="deals-modal-close-btn" 
                onClick={handleCloseModal}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="deals-modal-body">
                <div className="deals-form-row">
                  <label className="deals-form-label">
                    Package <span className="deals-form-label-required">*</span>
                  </label>
                  <select
                    className="deals-form-select"
                    value={formData.package_id}
                    onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                    required
                    disabled={!!editingDeal}
                  >
                    <option value="">Select a package</option>
                    {packages.map((pkg) => (
                      <option key={pkg.package_id} value={pkg.package_id}>
                        {pkg.package_name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPackage && (
                  <div className="deals-original-prices-box">
                    <div className="deals-original-prices-title">
                      Original Prices
                    </div>
                    <div className="deals-original-prices-grid">
                      {selectedPackage.adult_price !== null && (
                        <div><strong>Adult:</strong> AED {selectedPackage.adult_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      )}
                      {selectedPackage.child_price !== null && (
                        <div><strong>Child:</strong> AED {selectedPackage.child_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      )}
                      {selectedPackage.infant_price !== null && (
                        <div><strong>Infant:</strong> AED {selectedPackage.infant_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      )}
                      {selectedPackage.solo_traveller_price !== null && (
                        <div><strong>Solo Traveller:</strong> AED {selectedPackage.solo_traveller_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="deals-prices-section">
                  <div className="deals-prices-title">
                    Deal Prices
                  </div>
                  <div className="deals-prices-hint">
                    Leave empty to keep original price
                  </div>
                  <div className="deals-prices-grid">
                    <div className="deals-form-row deals-price-field">
                      <label className="deals-price-label">Adult Price (AED)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.deal_adult_price}
                        onChange={(e) => setFormData({ ...formData, deal_adult_price: e.target.value })}
                        placeholder="Enter deal price"
                        className="deals-price-input"
                      />
                    </div>

                    <div className="deals-form-row deals-price-field">
                      <label className="deals-price-label">Child Price (AED)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.deal_child_price}
                        onChange={(e) => setFormData({ ...formData, deal_child_price: e.target.value })}
                        placeholder="Enter deal price"
                        className="deals-price-input"
                      />
                    </div>

                    <div className="deals-form-row deals-price-field">
                      <label className="deals-price-label">Infant Price (AED)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.deal_infant_price}
                        onChange={(e) => setFormData({ ...formData, deal_infant_price: e.target.value })}
                        placeholder="Enter deal price"
                        className="deals-price-input"
                      />
                    </div>

                    <div className="deals-form-row deals-price-field">
                      <label className="deals-price-label">Solo Traveller Price (AED)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.deal_solo_traveller_price}
                        onChange={(e) => setFormData({ ...formData, deal_solo_traveller_price: e.target.value })}
                        placeholder="Enter deal price"
                        className="deals-price-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="deals-dates-grid">
                  <div className="deals-form-row">
                    <label className="deals-form-label">
                      Start Date <span className="deals-form-label-required">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="deals-date-input"
                    />
                  </div>

                  <div className="deals-form-row">
                    <label className="deals-form-label">
                      End Date <span className="deals-form-label-required">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      min={formData.start_date}
                      className="deals-date-input"
                    />
                  </div>
                </div>

                <div className="deals-form-row">
                  <label className="deals-checkbox-row">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="deals-checkbox"
                    />
                    <span>Active (Deal will be available when active and within date range)</span>
                  </label>
                </div>
              </div>
              <div className="deals-modal-footer">
                <button 
                  type="button" 
                  className="btn_secondary" 
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn_primary" 
                  disabled={loading}
                >
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
