'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ChevronDown, Check } from 'lucide-react';
import type { PackageOption } from '../types';
import './PackageSelector.css';

interface PackageSelectorProps {
  value: PackageOption | null;
  onChange: (pkg: PackageOption | null) => void;
}

export function PackageSelector({ value, onChange }: PackageSelectorProps) {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/packages?status=active&limit=300');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data)) {
          setPackages(
            data.data.map((p: any) => ({
              package_id: p.package_id,
              package_name: p.package_name,
              package_price: p.package_price ?? null,
              package_nights: p.package_nights ?? null,
              package_days: p.package_days ?? null,
              adult_price: p.adult_price ?? null,
              child_price: p.child_price ?? null,
              infant_price: p.infant_price ?? null,
              solo_traveller_enabled: p.solo_traveller_enabled ?? null,
              solo_traveller_price: p.solo_traveller_price ?? null,
              min_adults: p.min_adults ?? null,
              category_name: p.category_name ?? null,
              category_slug: p.category_slug ?? null,
              crm_package_id: p.crm_package_id ?? null,
            }))
          );
        } else {
          setPackages([]);
        }
      } catch {
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDropdownStyle(null);
      return;
    }
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
      if (!target.closest('.customize-package-selector') && !target.closest('.customize-package-list-portal')) {
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

  return (
    <div className="customize-package-selector">
      <label className="customize-package-label">Select a Package</label>
      {loading ? (
        <div className="customize-package-loading">
          <Loader2 size={20} className="customize-package-spinner" />
          <span>Loading packages...</span>
        </div>
      ) : (
        <div className="customize-package-dropdown">
          <button
            ref={triggerRef}
            type="button"
            className={`customize-package-trigger ${isOpen ? 'open' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span className={`customize-package-trigger-text ${!value ? 'placeholder' : ''}`}>
              {value
                ? `${value.package_name}${value.package_nights ? ` (${value.package_nights} nights)` : ''}`
                : 'Choose a package'}
            </span>
            <ChevronDown
              size={18}
              className={`customize-package-chevron ${isOpen ? 'open' : ''}`}
            />
          </button>
          {isOpen &&
            dropdownStyle &&
            typeof document !== 'undefined' &&
            createPortal(
              <ul
                className="customize-package-list customize-package-list-portal"
                role="listbox"
                style={{
                  position: 'fixed',
                  top: dropdownStyle.top,
                  left: dropdownStyle.left,
                  width: dropdownStyle.width,
                  zIndex: 10000,
                }}
              >
                <li
                  role="option"
                  className="customize-package-option"
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                >
                  <span className="customize-package-option-text">Clear selection</span>
                </li>
                {packages.map((pkg) => {
                  const isSelected = value?.package_id === pkg.package_id;
                  return (
                    <li
                      key={pkg.package_id}
                      role="option"
                      aria-selected={isSelected}
                      className={`customize-package-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        onChange(pkg);
                        setIsOpen(false);
                      }}
                    >
                      <div className="customize-package-option-content">
                        <span className="customize-package-option-text">{pkg.package_name}</span>
                        {pkg.package_nights && (
                          <span className="customize-package-option-meta">
                            {pkg.package_nights} nights
                          </span>
                        )}
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
    </div>
  );
}
