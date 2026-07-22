'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ChevronDown } from 'lucide-react';
import type { AddonDeal } from '../types';
import './AddonSection.css';

interface AddonDealsSectionProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  deals: AddonDeal[];
  loading?: boolean;
  nights: number;
  onFetch: (nights: number) => void;
}

export function AddonDealsSection({
  selectedIds,
  onChange,
  deals,
  loading = false,
  nights,
  onFetch,
}: AddonDealsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasAttemptedRef = useRef(false);
  const prevNightsRef = useRef(nights);

  useEffect(() => {
    if (prevNightsRef.current !== nights) {
      prevNightsRef.current = nights;
      hasAttemptedRef.current = false;
    }
  }, [nights]);

  useEffect(() => {
    if (!isOpen) {
      hasAttemptedRef.current = false;
      setDropdownStyle(null);
      return;
    }
    if (deals.length > 0 || loading || hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    onFetch(nights);
  }, [isOpen, deals.length, loading, nights, onFetch]);

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
      ? `Addon Deals (${selectedIds.length} selected)`
      : 'Addon Deals';

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
      ) : !deals.length ? (
        <p className="addon-dropdown-empty">No addon deals available</p>
      ) : (
        <div className="addon-dropdown-list">
          {deals.map((d) => {
            const checked = selectedIds.includes(d.id);
            return (
              <label
                key={d.id}
                className={`addon-dropdown-item ${checked ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(d.id)}
                  className="addon-dropdown-checkbox"
                />
                <span className="addon-dropdown-item-text">
                  {d.name}
                </span>
              </label>
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
