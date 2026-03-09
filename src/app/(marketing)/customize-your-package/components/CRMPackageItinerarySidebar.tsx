'use client';

import type { PersonCounts } from '../types';
import type { AddonDeal, AddonHotelService, AddonPrivateTransfer } from '../types';
import './CRMPackageItinerarySidebar.css';

function calcAddonPrice(
  items: Array<{ adult_price: number; child_price: number; infant_price: number }>,
  persons: PersonCounts
): number {
  return items.reduce(
    (sum, item) =>
      sum +
      persons.adults * (item.adult_price ?? 0) +
      persons.children * (item.child_price ?? 0) +
      persons.infants * (item.infant_price ?? 0),
    0
  );
}

interface CRMPackageItinerarySidebarProps {
  packageName?: string;
  packageNights?: number | null;
  packageDays?: number | null;
  packageBasePrice: number;
  persons: PersonCounts;
  selectedDealIds: string[];
  selectedServiceIds: string[];
  selectedTransferIds: string[];
  addonDeals: AddonDeal[];
  addonServices: AddonHotelService[];
  addonTransfers: AddonPrivateTransfer[];
}

export function CRMPackageItinerarySidebar({
  packageName,
  packageNights,
  packageDays,
  packageBasePrice,
  persons,
  selectedDealIds,
  selectedServiceIds,
  selectedTransferIds,
  addonDeals,
  addonServices,
  addonTransfers,
}: CRMPackageItinerarySidebarProps) {
  const selectedDeals = addonDeals.filter((d) => selectedDealIds.includes(d.id));
  const selectedServices = addonServices.filter((s) => selectedServiceIds.includes(s.id));
  const selectedTransfers = addonTransfers.filter((t) => selectedTransferIds.includes(t.id));
  const addonDealsPrice = calcAddonPrice(selectedDeals, persons);
  const addonServicesPrice = calcAddonPrice(selectedServices, persons);
  const addonTransfersPrice = calcAddonPrice(selectedTransfers, persons);
  const grandTotal = packageBasePrice + addonDealsPrice + addonServicesPrice + addonTransfersPrice;

  const addonsCount = selectedDeals.length + selectedServices.length + selectedTransfers.length;

  return (
    <div className="quotation-sidebar quotation-sidebar-summary-only">
      {packageName && (
        <div className="quotation-sidebar-package-info">
          <div className="quotation-sidebar-package-name">{packageName}</div>
          {(packageNights != null && packageNights > 0) || (packageDays != null && packageDays > 0) ? (
            <div className="quotation-sidebar-package-duration">
              {packageNights ? `${packageNights} Night${packageNights !== 1 ? 's' : ''}` : ''}
              {packageNights && packageDays ? ' • ' : ''}
              {packageDays ? `${packageDays} Day${packageDays !== 1 ? 's' : ''}` : ''}
            </div>
          ) : null}
        </div>
      )}
      <div className="pb-travellers-section">
        <div className="pb-travellers-title">Travellers</div>
        <div className="pb-travellers-badges">
          {persons.adults > 0 && (
            <span className="pb-traveller-badge pb-traveller-badge-adult">
              {persons.adults} Adult{persons.adults !== 1 ? 's' : ''}
            </span>
          )}
          {persons.children > 0 && (
            <span className="pb-traveller-badge pb-traveller-badge-child">
              {persons.children} Child{persons.children !== 1 ? 'ren' : ''}
            </span>
          )}
          {persons.infants > 0 && (
            <span className="pb-traveller-badge pb-traveller-badge-infant">
              {persons.infants} Infant{persons.infants !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="quotation-summary-section">
        <div className="quotation-summary-title">Summary</div>
        <div className="quotation-summary-rows">
          {packageBasePrice > 0 && (
            <div className="quotation-summary-row">
              <span style={{ color: 'var(--text-muted)' }}>
                Package ({persons.adults}A{persons.children ? ` ${persons.children}C` : ''}
                {persons.infants ? ` ${persons.infants}I` : ''})
              </span>
              <span style={{ fontWeight: 600 }}>AED {packageBasePrice.toFixed(0)}</span>
            </div>
          )}
          {addonDealsPrice > 0 && (
            <div className="quotation-summary-row">
              <span style={{ color: 'var(--text-muted)' }}>Addon Deals</span>
              <span style={{ fontWeight: 600 }}>AED {addonDealsPrice.toFixed(0)}</span>
            </div>
          )}
          {addonTransfersPrice > 0 && (
            <div className="quotation-summary-row">
              <span style={{ color: 'var(--text-muted)' }}>Private Transfers</span>
              <span style={{ fontWeight: 600 }}>AED {addonTransfersPrice.toFixed(0)}</span>
            </div>
          )}
          {addonServicesPrice > 0 && (
            <div className="quotation-summary-row">
              <span style={{ color: 'var(--text-muted)' }}>Hotel Services</span>
              <span style={{ fontWeight: 600 }}>AED {addonServicesPrice.toFixed(0)}</span>
            </div>
          )}
        </div>
        {addonsCount > 0 && (
          <div className="quotation-sidebar-addons-info">
            <span className="quotation-sidebar-addons-label">Selected add-ons</span>
            <span className="quotation-sidebar-addons-count">
              {selectedDeals.length > 0 && `${selectedDeals.length} deal${selectedDeals.length !== 1 ? 's' : ''}`}
              {selectedDeals.length > 0 && (selectedServices.length > 0 || selectedTransfers.length > 0) ? ', ' : ''}
              {selectedServices.length > 0 && `${selectedServices.length} service${selectedServices.length !== 1 ? 's' : ''}`}
              {(selectedDeals.length > 0 || selectedServices.length > 0) && selectedTransfers.length > 0 ? ', ' : ''}
              {selectedTransfers.length > 0 && `${selectedTransfers.length} transfer${selectedTransfers.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        )}
        <div className="quotation-grand-total">
          <span className="quotation-grand-total-label">Grand Total</span>
          <span className="quotation-grand-total-amount">AED {grandTotal.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
