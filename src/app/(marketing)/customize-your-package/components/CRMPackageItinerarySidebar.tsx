'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { PersonCounts, SelectedHotelService } from '../types';
import type { AddonDeal, AddonHotelService, AddonPrivateTransfer } from '../types';
import type { GroupDatesBreakdown } from '../types';
import { HotelEditModal } from './HotelEditModal';
import './CRMPackageItinerarySidebar.css';

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

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

function calcAddonServicesPrice(
  selectedServices: SelectedHotelService[],
  addonServices: AddonHotelService[],
  persons: PersonCounts
): number {
  return selectedServices.reduce((sum, sel) => {
    const svc = addonServices.find((s) => s.id === sel.serviceId);
    if (!svc) return sum;
    const unitPrice =
      persons.adults * (svc.adult_price ?? 0) +
      persons.children * (svc.child_price ?? 0) +
      persons.infants * (svc.infant_price ?? 0);
    return sum + unitPrice * sel.quantity;
  }, 0);
}

interface CRMPackageItinerarySidebarProps {
  packageName?: string;
  packageNights?: number | null;
  packageDays?: number | null;
  packageBasePrice: number;
  persons: PersonCounts;
  selectedDealIds: string[];
  selectedServices: SelectedHotelService[];
  selectedTransferIds: string[];
  addonDeals: AddonDeal[];
  addonServices: AddonHotelService[];
  addonTransfers: AddonPrivateTransfer[];
  checkInDate?: string;
  crmPackageId?: string;
  hotelSurchargeTotal?: number;
  groupDatesBreakdown?: GroupDatesBreakdown | null;
  crmPackageData?: unknown;
  hotelOverrides?: Record<string, { rooms: number; extraBedCount: number; childNoBedCount: number }>;
  onHotelOverrideChange?: (overrides: Record<string, { rooms: number; extraBedCount: number; childNoBedCount: number }>) => void;
  effectiveNights?: number;
  extraBedChildNoBedTotal?: number;
}

export function CRMPackageItinerarySidebar({
  packageName,
  packageNights,
  packageDays,
  packageBasePrice,
  persons,
  selectedDealIds,
  selectedServices,
  selectedTransferIds,
  addonDeals,
  addonServices,
  addonTransfers,
  checkInDate,
  hotelSurchargeTotal = 0,
  groupDatesBreakdown,
  crmPackageData,
  hotelOverrides = {},
  onHotelOverrideChange,
  effectiveNights = 0,
  extraBedChildNoBedTotal = 0,
}: CRMPackageItinerarySidebarProps) {
  const [hotelEditModalHotel, setHotelEditModalHotel] = useState<any>(null);

  const selectedDeals = addonDeals.filter((d) => selectedDealIds.includes(d.id));
  const selectedTransfers = addonTransfers.filter((t) => selectedTransferIds.includes(t.id));
  const addonDealsPrice = calcAddonPrice(selectedDeals, persons);
  const addonServicesPrice = calcAddonServicesPrice(selectedServices, addonServices, persons);
  const addonTransfersPrice = calcAddonPrice(selectedTransfers, persons);
  const grandTotal =
    packageBasePrice +
    addonDealsPrice +
    addonServicesPrice +
    addonTransfersPrice +
    hotelSurchargeTotal +
    extraBedChildNoBedTotal;

  const pkg = crmPackageData as { package_options?: Array<{ package_items?: any[] }> } | undefined;
  const hotels = (pkg?.package_options?.[0]?.package_items ?? []).filter(
    (i: any) => i.item_type === 'hotel' || i.hotel_id
  );
  const baseNightsFromHotels = hotels.slice(0, -1).reduce((s: number, x: any) => s + (x.nights ?? 1), 0);

  const addonsCount =
    selectedDeals.length +
    selectedServices.reduce((s, x) => s + (x.quantity > 0 ? 1 : 0), 0) +
    selectedTransfers.length;

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

      {checkInDate && (
        <div className="quotation-sidebar-dates">
          <div className="quotation-sidebar-dates-label">Travel Dates</div>
          <div className="quotation-sidebar-dates-value">
            {formatDate(checkInDate)} to {formatDate(addDays(checkInDate, effectiveNights))}
          </div>
        </div>
      )}

      {(() => {
        const pkgData = crmPackageData as { dateRanges?: Array<{ from_date: string; to_date: string }> } | undefined;
        const ranges = pkgData?.dateRanges ?? [];
        if (ranges.length === 0) return null;
        return (
          <div className="quotation-sidebar-group-dates">
            <div className="quotation-sidebar-group-dates-label">Group Dates</div>
            <div className="quotation-sidebar-group-dates-badges">
              {ranges.map((r, idx) => (
                <span key={idx} className="quotation-sidebar-group-dates-badge">
                  {formatDate(r.from_date)} – {formatDate(r.to_date)}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {hotels.length > 0 && onHotelOverrideChange && (
        <div className="quotation-sidebar-hotels">
          <div className="quotation-sidebar-hotels-title">Accommodation</div>
          {hotels.map((h: any) => {
            const override = hotelOverrides[h.id] ?? {};
            const extraBedCount = override.extraBedCount ?? h.hotel_data?.extraBedCount ?? 0;
            const childNoBedCount = override.childNoBedCount ?? h.hotel_data?.childNoBedCount ?? 0;
            const isLast = hotels.indexOf(h) === hotels.length - 1;
            const nights = isLast
              ? Math.max(1, effectiveNights - baseNightsFromHotels)
              : (h.nights ?? 1);
            const hasExtraBeds = (h.hotel_data?.extraBedPrice ?? 0) > 0 || (h.hotel_data?.childNoBedPrice ?? 0) > 0;
            return (
              <div key={h.id} className="quotation-sidebar-hotel-card">
                <div className="quotation-sidebar-hotel-card-header">
                  <div className="quotation-sidebar-hotel-name">{h.name}</div>
                  <button
                    type="button"
                    className="quotation-sidebar-hotel-edit-btn"
                    onClick={() => setHotelEditModalHotel({
                        ...h,
                        nights,
                        extraBedCount,
                        childNoBedCount,
                        rooms: override.rooms ?? h.rooms ?? 1,
                        extraBedPrice: h.hotel_data?.extraBedPrice ?? 0,
                        childNoBedPrice: h.hotel_data?.childNoBedPrice ?? 0,
                      })}
                    title="Edit rooms & extra beds"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                <div className="quotation-sidebar-hotel-meta">
                  {h.hotel_data?.roomType && (
                    <span>{h.hotel_data.roomType}</span>
                  )}
                  {(override.rooms ?? h.rooms ?? 1) > 0 && (
                    <span>{(override.rooms ?? h.rooms ?? 1)} room{(override.rooms ?? h.rooms ?? 1) !== 1 ? 's' : ''}</span>
                  )}
                  {extraBedCount > 0 && (
                    <span>{extraBedCount} extra bed{extraBedCount !== 1 ? 's' : ''}</span>
                  )}
                  {childNoBedCount > 0 && (
                    <span>{childNoBedCount} child no bed{childNoBedCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="quotation-summary-section">
        <div className="quotation-summary-title">Summary</div>
        <div className="quotation-summary-rows">
          {groupDatesBreakdown ? (
            <>
              {groupDatesBreakdown.basePackageTotal > 0 && (
                <div className="quotation-summary-row">
                  <span style={{ color: 'var(--text-muted)' }}>
                    {groupDatesBreakdown.inDateRange ? 'Package (Group Rate)' : 'Package Price'}
                    <span style={{ marginLeft: '4px', fontSize: '11px' }}>
                      {[persons.adults > 0 ? `${persons.adults}A` : '', persons.children > 0 ? `${persons.children}C` : '', persons.infants > 0 ? `${persons.infants}I` : ''].filter(Boolean).join('+')}
                    </span>
                  </span>
                  <span style={{ fontWeight: 600 }}>AED {groupDatesBreakdown.basePackageTotal.toFixed(0)}</span>
                </div>
              )}
              {groupDatesBreakdown.extraTotal > 0 && (
                <div className="quotation-summary-row">
                  <span style={{ color: '#92400e' }}>
                    Extra (Outside Group Dates)
                  </span>
                  <span style={{ fontWeight: 600, color: '#d97706' }}>AED {groupDatesBreakdown.extraTotal.toFixed(0)}</span>
                </div>
              )}
            </>
          ) : (
            packageBasePrice > 0 && (
              <div className="quotation-summary-row">
                <span style={{ color: 'var(--text-muted)' }}>
                  Package ({persons.adults}A{persons.children ? ` ${persons.children}C` : ''}
                  {persons.infants ? ` ${persons.infants}I` : ''})
                </span>
                <span style={{ fontWeight: 600 }}>AED {packageBasePrice.toFixed(0)}</span>
              </div>
            )
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
          {hotelSurchargeTotal > 0 && (
            <div className="quotation-summary-row">
              <span style={{ color: 'var(--text-muted)' }}>Hotel Surcharges</span>
              <span style={{ fontWeight: 600 }}>AED {hotelSurchargeTotal.toFixed(0)}</span>
            </div>
          )}
          {extraBedChildNoBedTotal > 0 && (
            <div className="quotation-summary-row">
              <span style={{ color: 'var(--text-muted)' }}>Extra Beds / Child No Bed</span>
              <span style={{ fontWeight: 600 }}>AED {extraBedChildNoBedTotal.toFixed(0)}</span>
            </div>
          )}
        </div>
        {addonsCount > 0 && (
          <div className="quotation-sidebar-addons-info">
            <span className="quotation-sidebar-addons-label">Selected add-ons</span>
            <span className="quotation-sidebar-addons-count">
              {selectedDeals.length > 0 && `${selectedDeals.length} deal${selectedDeals.length !== 1 ? 's' : ''}`}
              {selectedDeals.length > 0 && (selectedServices.length > 0 || selectedTransfers.length > 0) ? ', ' : ''}
              {selectedServices.length > 0 &&
                `${selectedServices.reduce((s, x) => s + x.quantity, 0)} service night${selectedServices.reduce((s, x) => s + x.quantity, 0) !== 1 ? 's' : ''}`}
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

      {hotelEditModalHotel && onHotelOverrideChange && (
        <HotelEditModal
          isOpen={!!hotelEditModalHotel}
          onClose={() => setHotelEditModalHotel(null)}
          onSave={({ rooms, extraBedCount, childNoBedCount }) => {
            const id = hotelEditModalHotel.id;
            onHotelOverrideChange({
              ...hotelOverrides,
              [id]: { rooms, extraBedCount, childNoBedCount },
            });
            setHotelEditModalHotel(null);
          }}
          hotelName={hotelEditModalHotel.name}
          roomType={hotelEditModalHotel.hotel_data?.roomType || hotelEditModalHotel.option_title}
          nights={hotelEditModalHotel.nights ?? 0}
          extraBedPrice={hotelEditModalHotel.extraBedPrice ?? 0}
          childNoBedPrice={hotelEditModalHotel.childNoBedPrice ?? 0}
          initialRooms={hotelEditModalHotel.rooms ?? 1}
          initialExtraBedCount={hotelEditModalHotel.extraBedCount ?? 0}
          initialChildNoBedCount={hotelEditModalHotel.childNoBedCount ?? 0}
          adults={persons.adults}
          children={persons.children}
          infants={persons.infants}
        />
      )}
    </div>
  );
}
