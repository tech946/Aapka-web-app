'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import type { PackageOption, PersonCounts, AddonDeal, AddonHotelService, AddonPrivateTransfer } from '../types';
import './CustomizePackagePreview.css';

function calcAddonPrice(
  items: Array<{ adult_price: number; child_price: number; infant_price: number }>,
  persons: PersonCounts
): number {
  return items.reduce((sum, item) => {
    return (
      sum +
      persons.adults * (item.adult_price ?? 0) +
      persons.children * (item.child_price ?? 0) +
      persons.infants * (item.infant_price ?? 0)
    );
  }, 0);
}

function calcPackageBase(
  pkg: PackageOption,
  persons: PersonCounts,
  isSoloTraveller: boolean
): number {
  if (isSoloTraveller && pkg.solo_traveller_enabled) {
    return pkg.solo_traveller_price ?? pkg.adult_price ?? pkg.package_price ?? 0;
  }
  const hasPerPerson =
    (pkg.adult_price != null && pkg.adult_price > 0) ||
    (pkg.child_price != null && pkg.child_price > 0) ||
    (pkg.infant_price != null && pkg.infant_price > 0);
  if (hasPerPerson) {
    return (
      (persons.adults ?? 0) * (pkg.adult_price ?? 0) +
      (persons.children ?? 0) * (pkg.child_price ?? 0) +
      (persons.infants ?? 0) * (pkg.infant_price ?? 0)
    );
  }
  return pkg.package_price ?? 0;
}

interface CustomizePackagePreviewProps {
  package: PackageOption;
  persons: PersonCounts;
  isSoloTraveller: boolean;
  selectedDeals: AddonDeal[];
  selectedServices: AddonHotelService[];
  selectedTransfers: AddonPrivateTransfer[];
  /** Effective nights (base + hotel service extension) - matches sidebar */
  effectiveNightsOverride?: number;
  /** Effective days (nights + 1) - matches sidebar */
  effectiveDaysOverride?: number;
}

export function CustomizePackagePreview({
  package: pkg,
  persons,
  isSoloTraveller,
  selectedDeals,
  selectedServices,
  selectedTransfers,
}: CustomizePackagePreviewProps) {
  const addonPersons: PersonCounts = isSoloTraveller
    ? { adults: 1, children: 0, infants: 0 }
    : persons;

  const packageBase = calcPackageBase(pkg, persons, isSoloTraveller);
  const addonDealsPrice = calcAddonPrice(selectedDeals, addonPersons);
  const addonServicesPrice = calcAddonPrice(selectedServices, addonPersons);
  const addonTransfersPrice = calcAddonPrice(selectedTransfers, addonPersons);
  const total = packageBase + addonDealsPrice + addonServicesPrice + addonTransfersPrice;

  const paxLabel = [
    persons.adults > 0 ? `${persons.adults} Adult${persons.adults !== 1 ? 's' : ''}` : '',
    persons.children > 0 ? `${persons.children} Child${persons.children !== 1 ? 'ren' : ''}` : '',
    persons.infants > 0 ? `${persons.infants} Infant${persons.infants !== 1 ? 's' : ''}` : '',
  ]
    .filter(Boolean)
    .join(', ') || '0 Guests';

  const hasAddons =
    selectedDeals.length > 0 || selectedServices.length > 0 || selectedTransfers.length > 0;

  return (
    <div id="customize-package-preview" className="customize-preview-container" data-package-id={pkg.package_id}>
      {/* Cover page */}
      <div className="customize-preview-page customize-preview-page-first">
        <div className="customize-preview-top-section">
          <div className="customize-preview-logo-container">
            <img src="/aapka-tourism-logo.png" alt="Aapka Tourism" className="customize-preview-logo-img" />
          </div>
          <h1 className="customize-preview-itinerary-title">{pkg.package_name}</h1>
        </div>
        <div className="customize-preview-itinerary-details">
          <div className="customize-preview-detail-row">
            <span className="customize-preview-detail-label">Duration</span>
            <span className="customize-preview-detail-value">
              {effectiveNightsOverride != null && effectiveNightsOverride > 0
                ? `${effectiveNightsOverride} Night${effectiveNightsOverride !== 1 ? 's' : ''}${effectiveDaysOverride != null && effectiveDaysOverride > 0 ? ` • ${effectiveDaysOverride} Day${effectiveDaysOverride !== 1 ? 's' : ''}` : ''}`
                : effectiveDaysOverride != null && effectiveDaysOverride > 0
                  ? `${effectiveDaysOverride} Day${effectiveDaysOverride !== 1 ? 's' : ''}`
                  : pkg.package_nights
                    ? `${pkg.package_nights} Nights${pkg.package_days ? ` • ${pkg.package_days} Days` : ''}`
                    : pkg.package_days
                      ? `${pkg.package_days} Days`
                      : '-'}
            </span>
          </div>
          <div className="customize-preview-detail-row">
            <span className="customize-preview-detail-label">Travellers</span>
            <span className="customize-preview-detail-value">{paxLabel}</span>
          </div>
          {isSoloTraveller && (
            <div className="customize-preview-detail-row">
              <span className="customize-preview-detail-label">Type</span>
              <span className="customize-preview-detail-value">Solo Traveller</span>
            </div>
          )}
        </div>
        <div className="customize-preview-illustration-section">
          <div className="customize-preview-illustration-image">
            <img src="/images/pdf-globe.webp" alt="Travel Globe" />
          </div>
        </div>
        <div className="customize-preview-footer-section">
          <div className="customize-preview-footer-company">Aapka Tourism</div>
          <div className="customize-preview-footer-contact">+971 56 780 9460</div>
          <div className="customize-preview-footer-address">Dubai, UAE</div>
          <div className="customize-preview-footer-gst">GST applicable as per UAE law</div>
        </div>
      </div>

      {/* Content page: Package + Addons + Total */}
      <div className="customize-preview-page customize-preview-page-content">
        <div className="customize-preview-timeline" />
        <div className="customize-preview-type-badge-header">
          <div className="customize-preview-type-badge-icon">
            <Building2 size={16} />
          </div>
          <span className="customize-preview-type-badge">Package Summary</span>
        </div>

        <div className="customize-preview-cart-item">
          <div className="customize-preview-cart-item-header">
            <div className="customize-preview-cart-item-name">{pkg.package_name}</div>
          </div>
          <div className="customize-preview-cart-item-details">
            <div className="customize-preview-cart-detail-row">
              <span className="customize-preview-detail-label">Base</span>
              <span className="customize-preview-detail-value">AED {packageBase.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {selectedDeals.length > 0 && (
          <>
            <div className="customize-preview-timeline" />
            <div className="customize-preview-type-badge-header">
              <div className="customize-preview-type-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <span className="customize-preview-type-badge">Add-on Deals</span>
            </div>
            {selectedDeals.map((deal) => (
              <div key={deal.id} className="customize-preview-cart-item">
                <div className="customize-preview-cart-item-header">
                  <div className="customize-preview-cart-item-name">{deal.name}</div>
                  {deal.category_name && (
                    <span className="customize-preview-cart-item-meta">{deal.category_name}</span>
                  )}
                </div>
                <div className="customize-preview-cart-item-details">
                  <div className="customize-preview-cart-detail-row">
                    <span className="customize-preview-detail-label">Price</span>
                    <span className="customize-preview-detail-value">AED {deal.adult_price?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {selectedServices.length > 0 && (
          <>
            <div className="customize-preview-timeline" />
            <div className="customize-preview-type-badge-header">
              <div className="customize-preview-type-badge-icon">
                <Building2 size={16} />
              </div>
              <span className="customize-preview-type-badge">Hotel Services</span>
            </div>
            {selectedServices.map((service) => (
              <div key={service.id} className="customize-preview-cart-item">
                <div className="customize-preview-cart-item-header">
                  <div className="customize-preview-cart-item-name">{service.name}</div>
                </div>
                <div className="customize-preview-cart-item-details">
                  <div className="customize-preview-cart-detail-row">
                    <span className="customize-preview-detail-label">Price</span>
                    <span className="customize-preview-detail-value">AED {service.adult_price?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {selectedTransfers.length > 0 && (
          <>
            <div className="customize-preview-timeline" />
            <div className="customize-preview-type-badge-header">
              <div className="customize-preview-type-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <span className="customize-preview-type-badge">Private Transfers</span>
            </div>
            {selectedTransfers.map((transfer) => (
              <div key={transfer.id} className="customize-preview-cart-item">
                <div className="customize-preview-cart-item-header">
                  <div className="customize-preview-cart-item-name">{transfer.name}</div>
                  {(transfer.fixed_pax != null || (transfer.min_pax != null && transfer.max_pax != null)) && (
                    <span className="customize-preview-cart-item-meta">
                      {transfer.fixed_pax != null
                        ? `${transfer.fixed_pax} pax`
                        : `${transfer.min_pax}-${transfer.max_pax} pax`}
                    </span>
                  )}
                </div>
                <div className="customize-preview-cart-item-details">
                  <div className="customize-preview-cart-detail-row">
                    <span className="customize-preview-detail-label">Price</span>
                    <span className="customize-preview-detail-value">AED {transfer.adult_price?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <div
          className="customize-preview-total-row"
          style={{ marginTop: hasAddons ? 24 : 16 }}
        >
          <span className="customize-preview-total-label">Final Amount</span>
          <span className="customize-preview-total-value">AED {total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
