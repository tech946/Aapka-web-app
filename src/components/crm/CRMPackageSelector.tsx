'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ChevronDown, Check, AlertCircle, RefreshCw } from 'lucide-react';
import './CRMPackageSelector.css';

export interface CRMPackageOption {
  id: string;
  package_id: string;
  name: string;
  package_number: string | null;
  adult_amount: number;
  child_amount: number;
  infant_amount: number;
}

interface CRMPackageSelectorProps {
  value: CRMPackageOption | null;
  onChange: (pkg: CRMPackageOption | null) => void;
  nights?: number | null;
}

export function CRMPackageSelector({ value, onChange, nights }: CRMPackageSelectorProps) {
  const [packages, setPackages] = useState<CRMPackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (nights && nights > 0) params.set('nights', String(nights));
      const res = await fetch(`/api/website/crm/packages?${params}`);
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg = data?.details ?? data?.error ?? `HTTP ${res.status}`;
        setError(typeof msg === 'string' ? msg : `HTTP ${res.status}`);
        setPackages([]);
        return;
      }

      if (data.packages) {
        setPackages(
          (data.packages as any[]).map((p: any) => ({
            id: p.id ?? p.package_id,
            package_id: p.id ?? p.package_id,
            name: p.name ?? p.package_number ?? '',
            package_number: p.package_number ?? null,
            adult_amount: p.adult_amount ?? 0,
            child_amount: p.child_amount ?? 0,
            infant_amount: p.infant_amount ?? 0,
          }))
        );
        setError(null);
      } else {
        setPackages([]);
        setError('CRM returned no packages. Check that packages exist in the CRM.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error. Is the CRM running?';
      setError(msg);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [nights]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.crm-package-selector') && !target.closest('.crm-package-list-portal')) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Position dropdown via portal (avoids modal overflow clipping)
  useEffect(() => {
    function updatePosition() {
      if (triggerRef.current && isOpen) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 260;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        const top = shouldOpenUpward
          ? rect.top - Math.min(dropdownHeight, spaceAbove - 8)
          : rect.bottom + 4;
        setDropdownPosition({
          top,
          left: rect.left,
          width: rect.width,
        });
      }
    }
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      // Listen to scroll on scrollable ancestors (e.g. modal body)
      const scrollParents: Element[] = [];
      let el: Element | null = triggerRef.current?.parentElement ?? null;
      while (el) {
        const s = window.getComputedStyle(el);
        if (s.overflow === 'auto' || s.overflow === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') {
          scrollParents.push(el);
        }
        el = el.parentElement;
      }
      scrollParents.forEach((p) => p.addEventListener('scroll', updatePosition, true));

      const raf = requestAnimationFrame(updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        scrollParents.forEach((p) => p.removeEventListener('scroll', updatePosition, true));
        cancelAnimationFrame(raf);
      };
    }
  }, [isOpen]);

  const extractNights = (name: string) => {
    const m = name.match(/(\d+)\s*night/i);
    return m ? parseInt(m[1], 10) : null;
  };

  return (
    <div className="crm-package-selector">
      <label className="crm-package-label">Select a Package (from CRM)</label>
      {error && (
        <div className="crm-package-error">
          <AlertCircle size={18} />
          <div>
            <strong>Packages failed to load</strong>
            <p>{error}</p>
            <p style={{ fontSize: 12, marginTop: 6, color: '#6b7280' }}>
              Ensure CRM is running and WEBSITE_API_KEY matches in both apps. For local dev use CRM_API_URL=http://localhost:3000
            </p>
            <button type="button" className="crm-package-retry" onClick={() => fetchPackages()} disabled={loading}>
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="crm-package-loading">
          <Loader2 size={20} className="crm-package-spinner" />
          <span>Loading CRM packages...</span>
        </div>
      ) : (
        <div className="crm-package-dropdown">
          <button
            ref={triggerRef}
            type="button"
            className={`crm-package-trigger ${isOpen ? 'open' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span className={`crm-package-trigger-text ${!value ? 'placeholder' : ''}`}>
              {value ? `${value.name}${extractNights(value.name) ? ` (${extractNights(value.name)} nights)` : ''}` : 'Choose a package'}
            </span>
            <ChevronDown size={18} className={`crm-package-chevron ${isOpen ? 'open' : ''}`} />
          </button>
          {isOpen && typeof window !== 'undefined' && createPortal(
            <ul
              className="crm-package-list crm-package-list-portal"
              role="listbox"
              style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: 260,
                zIndex: 100001,
              }}
            >
                <li
                  role="option"
                  className="crm-package-option"
                  onClick={() => { onChange(null); setIsOpen(false); }}
                >
                  <span className="crm-package-option-text">Clear selection</span>
                </li>
                {packages.map((pkg) => {
                  const n = extractNights(pkg.name);
                  const isSelected = value?.id === pkg.id;
                  return (
                    <li
                      key={pkg.id}
                      role="option"
                      aria-selected={isSelected}
                      className={`crm-package-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => { onChange(pkg); setIsOpen(false); }}
                    >
                      <div className="crm-package-option-content">
                        <span className="crm-package-option-text">{pkg.name}</span>
                        {n && <span className="crm-package-option-meta">{n} nights</span>}
                      </div>
                      {isSelected && <Check size={16} style={{ color: '#fd6b06', flexShrink: 0 }} />}
                    </li>
                  );
                })}
            </ul>,
            document.body
          )}
        </div>
      )}
      {nights && nights > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
          Filtering by {nights} night{nights !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
