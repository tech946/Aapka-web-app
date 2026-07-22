'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ChevronDown, Minus, Plus } from 'lucide-react';
import type { AddonHotelService, SelectedHotelService } from '../types';
import './AddonSection.css';

interface AddonHotelServicesSectionProps {
  selectedServices: SelectedHotelService[];
  onChange: (services: SelectedHotelService[]) => void;
  services: AddonHotelService[];
  loading?: boolean;
  onFetch: () => void;
  /** Base package nights - used for "+N Night(s)" badge when quantity extends stay */
  baseNights?: number;
}

export function AddonHotelServicesSection({
  selectedServices,
  onChange,
  services,
  loading = false,
  onFetch,
  baseNights = 0,
}: AddonHotelServicesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasAttemptedRef.current = false;
      setDropdownStyle(null);
      return;
    }
    if (services.length > 0 || loading || hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    onFetch();
  }, [isOpen, services.length, loading, onFetch]);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownStyle({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.addon-dropdown-wrap') && !target.closest('.addon-dropdown-panel-portal')) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  const addOrUpdate = (serviceId: string, quantity: number) => {
    if (quantity < 1) {
      onChange(selectedServices.filter((s) => s.serviceId !== serviceId));
      return;
    }
    const existing = selectedServices.find((s) => s.serviceId === serviceId);
    if (existing) {
      onChange(
        selectedServices.map((s) =>
          s.serviceId === serviceId ? { ...s, quantity } : s
        )
      );
    } else {
      onChange([...selectedServices, { serviceId, quantity }]);
    }
  };

  const remove = (serviceId: string) => {
    onChange(selectedServices.filter((s) => s.serviceId !== serviceId));
  };

  const getQuantity = (serviceId: string) =>
    selectedServices.find((s) => s.serviceId === serviceId)?.quantity ?? 0;

  const totalSelected = selectedServices.reduce((s, x) => s + x.quantity, 0);
  const label =
    totalSelected > 0
      ? `Hotel Night Services (${totalSelected} selected)`
      : 'Hotel Night Services';

  const panelContent = (
    <div
      className="addon-dropdown-panel addon-dropdown-panel-portal"
      style={
        dropdownStyle
          ? {
              position: 'fixed',
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              zIndex: 10000,
            }
          : undefined
      }
    >
      {loading ? (
        <div className="addon-dropdown-loading">
          <Loader2 size={18} className="addon-dropdown-spinner" />
          <span>Loading...</span>
        </div>
      ) : !services.length ? (
        <p className="addon-dropdown-empty">No hotel services available</p>
      ) : (
        <div className="addon-dropdown-list addon-hotel-services-list">
          {services.map((s) => {
            const qty = getQuantity(s.id);
            const isSelected = qty > 0;
            return (
              <div
                key={s.id}
                className={`addon-dropdown-item addon-hotel-service-item ${isSelected ? 'selected' : ''}`}
              >
                <div className="addon-hotel-service-info">
                  <span className="addon-dropdown-item-text">
                    {s.name}
                  </span>
                  {isSelected && (
                    <span className="addon-hotel-service-nights-badge">
                      +{qty} Night{qty !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="addon-hotel-service-qty-controls">
                  {isSelected ? (
                    <>
                      <button
                        type="button"
                        className="addon-qty-btn"
                        onClick={() => addOrUpdate(s.id, qty - 1)}
                        aria-label="Decrease"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="addon-qty-value">{qty}</span>
                      <button
                        type="button"
                        className="addon-qty-btn"
                        onClick={() => addOrUpdate(s.id, qty + 1)}
                        aria-label="Increase"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        className="addon-remove-btn"
                        onClick={() => remove(s.id)}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="addon-qty-btn addon-add-btn"
                      onClick={() => addOrUpdate(s.id, 1)}
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="addon-dropdown-wrap customize-addon-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className={`addon-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{label}</span>
        <ChevronDown
          size={18}
          className={`addon-dropdown-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>
      {isOpen &&
        dropdownStyle &&
        typeof document !== 'undefined' &&
        createPortal(panelContent, document.body)}
    </div>
  );
}
