'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ChevronDown, Gift, Bed, Car } from 'lucide-react';
import './addon-modal.css';

interface AddonsSectionProps {
  selectedDeals: string[];
  selectedServices: string[];
  selectedTransfers: string[];
  onSelectDeals: (ids: string[]) => void;
  onSelectServices: (ids: string[]) => void;
  onSelectTransfers: (ids: string[]) => void;
  nights?: number;
  isMobile: boolean;
}

// Simple in-memory cache for the current browser session
let cachedDeals: Array<{ id: string; name: string; adult_price: number; category_name: string | null }> | null = null;
let cachedServices: Array<{ id: string; name: string; adult_price: number }> | null = null;
let cachedTransfers: Array<{ id: string; name: string; adult_price: number; pax_type: string; fixed_pax: number | null; min_pax: number | null; max_pax: number | null }> | null = null;

export function AddonsSection({
  selectedDeals,
  selectedServices,
  selectedTransfers,
  onSelectDeals,
  onSelectServices,
  onSelectTransfers,
  nights = 0,
  isMobile,
}: AddonsSectionProps) {
  const [deals, setDeals] = useState<Array<{ id: string; name: string; adult_price: number; category_name: string | null }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; adult_price: number }>>([]);
  const [transfers, setTransfers] = useState<Array<{ id: string; name: string; adult_price: number; pax_type: string; fixed_pax: number | null; min_pax: number | null; max_pax: number | null }>>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'deals' | 'services' | 'transfers' | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const dealsRef = useRef<HTMLDivElement | null>(null);
  const servicesRef = useRef<HTMLDivElement | null>(null);
  const transfersRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchDeals();
    fetchServices();
    fetchTransfers();
  }, []);

  const fetchDeals = async () => {
    if (cachedDeals) {
      setDeals(cachedDeals);
      return;
    }
    setLoadingDeals(true);
    try {
      const params = new URLSearchParams();
      if (nights > 0) params.set('nights', String(nights));
      const res = await fetch(`/api/website/addon-deals?${params}`);
      const data = await res.json();
      if (res.ok && data.addon_deals) {
        cachedDeals = data.addon_deals;
        setDeals(data.addon_deals);
      } else {
        setDeals([]);
      }
    } catch {
      setDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  const fetchServices = async () => {
    if (cachedServices) {
      setServices(cachedServices);
      return;
    }
    setLoadingServices(true);
    try {
      const res = await fetch('/api/website/addon-hotel-services');
      const data = await res.json();
      if (res.ok && data.addon_hotel_services) {
        cachedServices = data.addon_hotel_services;
        setServices(data.addon_hotel_services);
      } else {
        setServices([]);
      }
    } catch {
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchTransfers = async () => {
    if (cachedTransfers) {
      setTransfers(cachedTransfers);
      return;
    }
    setLoadingTransfers(true);
    try {
      const res = await fetch('/api/website/addon-private-transfers');
      const data = await res.json();
      if (res.ok && data.addon_private_transfers) {
        cachedTransfers = data.addon_private_transfers;
        setTransfers(data.addon_private_transfers);
      } else {
        setTransfers([]);
      }
    } catch {
      setTransfers([]);
    } finally {
      setLoadingTransfers(false);
    }
  };

  const toggleDeal = (id: string) => {
    if (selectedDeals.includes(id)) onSelectDeals(selectedDeals.filter((x) => x !== id));
    else onSelectDeals([...selectedDeals, id]);
  };
  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) onSelectServices(selectedServices.filter((x) => x !== id));
    else onSelectServices([...selectedServices, id]);
  };
  const toggleTransfer = (id: string) => {
    if (selectedTransfers.includes(id)) onSelectTransfers(selectedTransfers.filter((x) => x !== id));
    else onSelectTransfers([...selectedTransfers, id]);
  };

  const openFor = useCallback((type: 'deals' | 'services' | 'transfers') => {
    const ref =
      type === 'deals' ? dealsRef.current : type === 'services' ? servicesRef.current : transfersRef.current;
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    setAnchorRect(rect);
    setOpenDropdown(prev => (prev === type ? null : type));
  }, []);

  const closeDropdown = useCallback(() => {
    setOpenDropdown(null);
    setAnchorRect(null);
  }, []);

  const dealsLabel =
    selectedDeals.length > 0 ? `Addon Deals (${selectedDeals.length} selected)` : 'Addon Deals';
  const servicesLabel =
    selectedServices.length > 0
      ? `Addon Hotel Services (${selectedServices.length} selected)`
      : 'Addon Hotel Services';
  const transfersLabel =
    selectedTransfers.length > 0
      ? `Addon Private Transfers (${selectedTransfers.length} selected)`
      : 'Addon Private Transfers';

  const wrapperClass = isMobile ? 'mobile-booking-input-wrapper' : 'booking-input-wrapper';
  const inputClass = isMobile ? 'mobile-booking-input' : 'booking-input';
  const chevronClass = isMobile ? 'mobile-booking-dropdown-chevron' : 'booking-dropdown-chevron';

  const dropdownContent = (type: 'deals' | 'services' | 'transfers') => {
    if (type === 'deals') {
      if (loadingDeals) {
        return (
          <div className="addon-modal-loading">
            <Loader2 size={18} className="addon-modal-loading-spinner" />
            <span>Loading...</span>
          </div>
        );
      }
      if (deals.length === 0) {
        return <div className="addon-modal-dropdown-empty">No deals available</div>;
      }
      return deals.map(d => (
        <label
          key={d.id}
          className={`addon-modal-dropdown-item ${selectedDeals.includes(d.id) ? 'selected' : ''}`}
        >
          <input
            type="checkbox"
            checked={selectedDeals.includes(d.id)}
            onChange={() => toggleDeal(d.id)}
            className="addon-modal-dropdown-checkbox"
          />
          <span className="addon-modal-dropdown-item-text">
            {d.name}
            {d.category_name ? ` [${d.category_name}]` : ''}
          </span>
        </label>
      ));
    }

    if (type === 'services') {
      if (loadingServices) {
        return (
          <div className="addon-modal-loading">
            <Loader2 size={18} className="addon-modal-loading-spinner" />
            <span>Loading...</span>
          </div>
        );
      }
      if (services.length === 0) {
        return <div className="addon-modal-dropdown-empty">No services available</div>;
      }
      return services.map(s => (
        <label
          key={s.id}
          className={`addon-modal-dropdown-item ${selectedServices.includes(s.id) ? 'selected' : ''}`}
        >
          <input
            type="checkbox"
            checked={selectedServices.includes(s.id)}
            onChange={() => toggleService(s.id)}
            className="addon-modal-dropdown-checkbox"
          />
          <span className="addon-modal-dropdown-item-text">
            {s.name}
          </span>
        </label>
      ));
    }

    // transfers
    if (loadingTransfers) {
      return (
        <div className="addon-modal-loading">
          <Loader2 size={18} className="addon-modal-loading-spinner" />
          <span>Loading...</span>
        </div>
      );
    }
    if (transfers.length === 0) {
      return <div className="addon-modal-dropdown-empty">No transfers available</div>;
    }
    return transfers.map(t => (
      <label
        key={t.id}
        className={`addon-modal-dropdown-item ${selectedTransfers.includes(t.id) ? 'selected' : ''}`}
      >
        <input
          type="checkbox"
          checked={selectedTransfers.includes(t.id)}
          onChange={() => toggleTransfer(t.id)}
          className="addon-modal-dropdown-checkbox"
        />
        <span className="addon-modal-dropdown-item-text">
          {t.name}
          {t.pax_type === 'fixed' && t.fixed_pax ? ` [${t.fixed_pax} pax]` : ''}
          {t.pax_type === 'min_max' && t.min_pax != null && t.max_pax != null
            ? ` [${t.min_pax}-${t.max_pax} pax]`
            : ''}
        </span>
      </label>
    ));
  };

  const dropdown = openDropdown && anchorRect
    ? createPortal(
        <div className="addons-dropdown-portal-backdrop" onClick={closeDropdown}>
          <div
            className="addons-dropdown-portal"
            style={{
              top: anchorRect.bottom + window.scrollY + 4,
              left: anchorRect.left + window.scrollX,
              width: anchorRect.width,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="addon-modal-dropdown-wrapper">
              <div className="addon-modal-dropdown-list">{dropdownContent(openDropdown)}</div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="booking-addons-section">
      <h4 className="booking-addons-title">Add-ons</h4>

      <div className="addon-modal-section">
        <div className={wrapperClass} ref={dealsRef}>
          <Gift className={isMobile ? 'mobile-booking-input-icon' : 'booking-input-icon'} />
          <input
            type="text"
            readOnly
            className={inputClass}
            value={dealsLabel}
            onClick={() => openFor('deals')}
          />
          <ChevronDown className={chevronClass} />
        </div>
      </div>

      <div className="addon-modal-section">
        <div className={wrapperClass} ref={servicesRef}>
          <Bed className={isMobile ? 'mobile-booking-input-icon' : 'booking-input-icon'} />
          <input
            type="text"
            readOnly
            className={inputClass}
            value={servicesLabel}
            onClick={() => openFor('services')}
          />
          <ChevronDown className={chevronClass} />
        </div>
      </div>

      <div className="addon-modal-section">
        <div className={wrapperClass} ref={transfersRef}>
          <Car className={isMobile ? 'mobile-booking-input-icon' : 'booking-input-icon'} />
          <input
            type="text"
            readOnly
            className={inputClass}
            value={transfersLabel}
            onClick={() => openFor('transfers')}
          />
          <ChevronDown className={chevronClass} />
        </div>
      </div>

      {dropdown}
    </div>
  );
}
