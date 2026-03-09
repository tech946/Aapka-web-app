'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import type { AddonPrivateTransfer } from '../types';
import './AddonSection.css';

interface AddonPrivateTransfersSectionProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  transfers: AddonPrivateTransfer[];
  loading?: boolean;
  onFetch: () => void;
}

export function AddonPrivateTransfersSection({
  selectedIds,
  onChange,
  transfers,
  loading = false,
  onFetch,
}: AddonPrivateTransfersSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasAttemptedRef.current = false;
      return;
    }
    if (transfers.length > 0 || loading || hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    onFetch();
  }, [isOpen, transfers.length, loading, onFetch]);

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

  const paxLabel = (t: AddonPrivateTransfer) => {
    if (t.pax_type === 'fixed' && t.fixed_pax != null)
      return ` [${t.fixed_pax} pax]`;
    if (t.pax_type === 'min_max' && t.min_pax != null && t.max_pax != null)
      return ` [${t.min_pax}-${t.max_pax} pax]`;
    return '';
  };

  const label =
    selectedIds.length > 0
      ? `Private Transfers (${selectedIds.length} selected)`
      : 'Private Transfers';

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
          ) : !transfers.length ? (
            <p className="addon-dropdown-empty">No private transfers available</p>
          ) : (
            <div className="addon-dropdown-list">
              {transfers.map((t) => {
                const checked = selectedIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`addon-dropdown-item ${checked ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(t.id)}
                      className="addon-dropdown-checkbox"
                    />
                    <span className="addon-dropdown-item-text">
                      {t.name}
                      {t.adult_price > 0 ? ` – AED ${t.adult_price}` : ''}
                      {paxLabel(t)}
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
