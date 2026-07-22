'use client';

import { Plus, Minus, User } from 'lucide-react';
import type { PersonCounts } from '../types';
import type { PackageOption } from '../types';
import './PersonSelector.css';

interface PersonSelectorProps {
  value: PersonCounts;
  onChange: (value: PersonCounts) => void;
  isSoloTraveller: boolean;
  onSoloTravellerChange: (value: boolean) => void;
  package: PackageOption | null;
  disabled?: boolean;
}

export function PersonSelector({
  value,
  onChange,
  isSoloTraveller,
  onSoloTravellerChange,
  package: pkg,
  disabled = false,
}: PersonSelectorProps) {
  const minAdults = isSoloTraveller ? 1 : (pkg?.min_adults ?? 1);
  const soloEnabled = !!(pkg?.solo_traveller_enabled);

  const updateCount = (field: keyof PersonCounts, delta: number) => {
    if (disabled || isSoloTraveller) return;
    const next = { ...value };
    next[field] = Math.max(0, (next[field] ?? 0) + delta);
    if (field === 'adults' && next.adults < minAdults) {
      next.adults = minAdults;
    }
    onChange(next);
  };

  const handleSoloChange = (checked: boolean) => {
    onSoloTravellerChange(checked);
    if (checked) {
      onChange({ adults: 1, children: 0, infants: 0 });
    } else {
      onChange({
        adults: Math.max(pkg?.min_adults ?? 1, 1),
        children: value.children,
        infants: value.infants,
      });
    }
  };

  return (
    <div className="customize-person-selector">
      <label className="customize-person-label">Travellers</label>

      {soloEnabled && (
        <div className={`customize-person-solo-block ${isSoloTraveller ? 'checked' : ''}`}>
          <label className="customize-person-solo-checkbox">
            <input
              type="checkbox"
              checked={isSoloTraveller}
              onChange={(e) => handleSoloChange(e.target.checked)}
              disabled={disabled}
              className="customize-person-solo-input"
            />
            <User size={18} className="customize-person-solo-icon" />
            <span>
              Solo Traveller
              {pkg?.solo_traveller_price != null && pkg.solo_traveller_price > 0 && (
                <span className="customize-person-solo-price">
                  {' '}
                  – AED {pkg.solo_traveller_price.toLocaleString()}
                </span>
              )}
            </span>
          </label>
        </div>
      )}

      {(!isSoloTraveller || !soloEnabled) && (
        <div className="customize-person-grid">
          <div className="customize-person-item">
            <span className="customize-person-name">Adults</span>
            <div className="customize-person-controls">
              <button
                type="button"
                className="customize-person-btn"
                onClick={() => updateCount('adults', -1)}
                disabled={disabled || value.adults <= minAdults}
                aria-label="Decrease adults"
              >
                <Minus size={16} />
              </button>
              <span className="customize-person-count">{value.adults}</span>
              <button
                type="button"
                className="customize-person-btn"
                onClick={() => updateCount('adults', 1)}
                disabled={disabled}
                aria-label="Increase adults"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="customize-person-item">
            <span className="customize-person-name">Children</span>
            <div className="customize-person-controls">
              <button
                type="button"
                className="customize-person-btn"
                onClick={() => updateCount('children', -1)}
                disabled={disabled || value.children <= 0}
                aria-label="Decrease children"
              >
                <Minus size={16} />
              </button>
              <span className="customize-person-count">{value.children}</span>
              <button
                type="button"
                className="customize-person-btn"
                onClick={() => updateCount('children', 1)}
                disabled={disabled}
                aria-label="Increase children"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="customize-person-item">
            <span className="customize-person-name">Infants</span>
            <div className="customize-person-controls">
              <button
                type="button"
                className="customize-person-btn"
                onClick={() => updateCount('infants', -1)}
                disabled={disabled || value.infants <= 0}
                aria-label="Decrease infants"
              >
                <Minus size={16} />
              </button>
              <span className="customize-person-count">{value.infants}</span>
              <button
                type="button"
                className="customize-person-btn"
                onClick={() => updateCount('infants', 1)}
                disabled={disabled}
                aria-label="Increase infants"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isSoloTraveller && soloEnabled && (
        <p className="customize-person-hint">1 traveller — solo pricing applied</p>
      )}
      {pkg && !isSoloTraveller && minAdults > 1 && (
        <p className="customize-person-hint">Minimum {minAdults} adults required</p>
      )}
    </div>
  );
}
