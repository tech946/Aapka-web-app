'use client';

import { useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAddonDeals, useAddonHotelServices, useAddonPrivateTransfers } from '@/hooks/use-marketing-queries';
import './addon-modal.css';

export interface AddonDeal {
  id: string;
  name: string;
  adult_price: number;
  child_price: number;
  infant_price: number;
  category_name: string | null;
}

export interface AddonHotelService {
  id: string;
  name: string;
  adult_price: number;
  child_price: number;
  infant_price: number;
}

export interface AddonPrivateTransfer {
  id: string;
  name: string;
  pax_type: string;
  fixed_pax: number | null;
  min_pax: number | null;
  max_pax: number | null;
  adult_price: number;
  child_price: number;
  infant_price: number;
}

interface AddonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDeals: string[];
  selectedServices: string[];
  selectedTransfers: string[];
  onSelectDeals: (ids: string[]) => void;
  onSelectServices: (ids: string[]) => void;
  onSelectTransfers: (ids: string[]) => void;
  nights?: number;
}

export function AddonsModal({
  isOpen,
  onClose,
  selectedDeals,
  selectedServices,
  selectedTransfers,
  onSelectDeals,
  onSelectServices,
  onSelectTransfers,
  nights = 0,
}: AddonsModalProps) {
  const { data: dealsRaw = [], isLoading: loadingDeals } = useAddonDeals(nights, isOpen);
  const { data: servicesRaw = [], isLoading: loadingServices } = useAddonHotelServices(isOpen);
  const { data: transfersRaw = [], isLoading: loadingTransfers } = useAddonPrivateTransfers(isOpen);

  const deals = useMemo(
    () => (Array.isArray(dealsRaw) ? dealsRaw : []) as AddonDeal[],
    [dealsRaw]
  );
  const services = useMemo(
    () => (Array.isArray(servicesRaw) ? servicesRaw : []) as AddonHotelService[],
    [servicesRaw]
  );
  const transfers = useMemo(
    () => (Array.isArray(transfersRaw) ? transfersRaw : []) as AddonPrivateTransfer[],
    [transfersRaw]
  );

  const toggleDeal = (id: string) => {
    if (selectedDeals.includes(id)) {
      onSelectDeals(selectedDeals.filter((x) => x !== id));
    } else {
      onSelectDeals([...selectedDeals, id]);
    }
  };

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      onSelectServices(selectedServices.filter((x) => x !== id));
    } else {
      onSelectServices([...selectedServices, id]);
    }
  };

  const toggleTransfer = (id: string) => {
    if (selectedTransfers.includes(id)) {
      onSelectTransfers(selectedTransfers.filter((x) => x !== id));
    } else {
      onSelectTransfers([...selectedTransfers, id]);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="addon-modal-overlay" onClick={handleOverlayClick}>
      <div className="addon-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="addon-modal-header">
          <h2 className="addon-modal-title">Add Add-ons to Your Package</h2>
          <button type="button" onClick={onClose} className="addon-modal-close-btn" aria-label="Close">
            <X className="addon-modal-close-icon" />
          </button>
        </div>

        <div className="addon-modal-body">
          {/* Addon Deals */}
          <div className="addon-modal-section">
            <h3 className="addon-modal-section-title">Addon Deals</h3>
            <div className="addon-modal-form-group">
              <label className="addon-modal-label">Select addon deals</label>
              {loadingDeals ? (
                <div className="addon-modal-loading">
                  <Loader2 size={20} className="addon-modal-loading-spinner" />
                  <span>Loading deals...</span>
                </div>
              ) : (
                <div className="addon-modal-dropdown-wrapper">
                  <div className="addon-modal-dropdown-list">
                    {deals.length === 0 ? (
                      <div className="addon-modal-dropdown-empty">No deals available</div>
                    ) : (
                      deals.map((d) => {
                        const checked = selectedDeals.includes(d.id);
                        return (
                          <label
                            key={d.id}
                            className={`addon-modal-dropdown-item ${checked ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDeal(d.id)}
                              className="addon-modal-dropdown-checkbox"
                            />
                            <span className="addon-modal-dropdown-item-text">
                              {d.name}
                              {d.adult_price > 0 ? ` - AED ${d.adult_price} (Adult)` : ''}
                              {d.category_name ? ` [${d.category_name}]` : ''}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Addon Hotel Services */}
          <div className="addon-modal-section">
            <h3 className="addon-modal-section-title">Addon Hotel Services</h3>
            <div className="addon-modal-form-group">
              <label className="addon-modal-label">Select hotel services</label>
              {loadingServices ? (
                <div className="addon-modal-loading">
                  <Loader2 size={20} className="addon-modal-loading-spinner" />
                  <span>Loading services...</span>
                </div>
              ) : (
                <div className="addon-modal-dropdown-wrapper">
                  <div className="addon-modal-dropdown-list">
                    {services.length === 0 ? (
                      <div className="addon-modal-dropdown-empty">No services available</div>
                    ) : (
                      services.map((s) => {
                        const checked = selectedServices.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`addon-modal-dropdown-item ${checked ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(s.id)}
                              className="addon-modal-dropdown-checkbox"
                            />
                            <span className="addon-modal-dropdown-item-text">
                              {s.name}
                              {s.adult_price > 0 ? ` - AED ${s.adult_price} (Adult)` : ''}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Addon Private Transfers */}
          <div className="addon-modal-section">
            <h3 className="addon-modal-section-title">Addon Private Transfers</h3>
            <div className="addon-modal-form-group">
              <label className="addon-modal-label">Select private transfers</label>
              {loadingTransfers ? (
                <div className="addon-modal-loading">
                  <Loader2 size={20} className="addon-modal-loading-spinner" />
                  <span>Loading transfers...</span>
                </div>
              ) : (
                <div className="addon-modal-dropdown-wrapper">
                  <div className="addon-modal-dropdown-list">
                    {transfers.length === 0 ? (
                      <div className="addon-modal-dropdown-empty">No transfers available</div>
                    ) : (
                      transfers.map((t) => {
                        const checked = selectedTransfers.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`addon-modal-dropdown-item ${checked ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTransfer(t.id)}
                              className="addon-modal-dropdown-checkbox"
                            />
                            <span className="addon-modal-dropdown-item-text">
                              {t.name}
                              {t.adult_price > 0 ? ` - AED ${t.adult_price} (Adult)` : ''}
                              {t.pax_type === 'fixed' && t.fixed_pax ? ` [${t.fixed_pax} pax]` : ''}
                              {t.pax_type === 'min_max' && t.min_pax != null && t.max_pax != null
                                ? ` [${t.min_pax}-${t.max_pax} pax]`
                                : ''}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="addon-modal-footer">
          <button type="button" onClick={onClose} className="addon-modal-btn addon-modal-btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
