'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import type { AddonHotelService } from '../types';
import './AddonSection.css';

interface AddonHotelServicesSectionProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  services: AddonHotelService[];
  loading?: boolean;
  onFetch: () => void;
}

export function AddonHotelServicesSection({
  selectedIds,
  onChange,
  services,
  loading = false,
  onFetch,
}: AddonHotelServicesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasAttemptedRef.current = false;
      return;
    }
    if (services.length > 0 || loading || hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    onFetch();
  }, [isOpen, services.length, loading, onFetch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.addon-dropdown-wrap')) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggle = (id: string) => {
    if (loading) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const label =
    selectedIds.length > 0
      ? `Hotel Night Services (${selectedIds.length} selected)`
      : 'Hotel Night Services';

  return (
    <div className="addon-dropdown-wrap customize-addon-dropdown">
      <button
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
      {isOpen && (
        <div className="addon-dropdown-panel">
          {loading ? (
            <div className="addon-dropdown-loading">
              <Loader2 size={18} className="addon-dropdown-spinner" />
              <span>Loading...</span>
            </div>
          ) : !services.length ? (
            <p className="addon-dropdown-empty">No hotel services available</p>
          ) : (
            <div className="addon-dropdown-list">
              {services.map((s) => {
                const checked = selectedIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`addon-dropdown-item ${checked ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      className="addon-dropdown-checkbox"
                    />
                    <span className="addon-dropdown-item-text">
                      {s.name}
                      {s.adult_price > 0 ? ` – AED ${s.adult_price}` : ''}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
