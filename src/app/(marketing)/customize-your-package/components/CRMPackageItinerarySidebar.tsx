'use client';

import { useState, useEffect } from 'react';
import { Building2, Plane, Users, Car, FileText } from 'lucide-react';
import type { PersonCounts } from '../types';
import type { AddonDeal, AddonHotelService, AddonPrivateTransfer } from '../types';
import './CRMPackageItinerarySidebar.css';

function calcAddonPrice(
  items: Array<{ adult_price: number; child_price: number; infant_price: number }>,
  persons: PersonCounts
): number {
  return items.reduce((sum, item) =>
    sum + persons.adults * (item.adult_price ?? 0) + persons.children * (item.child_price ?? 0) + persons.infants * (item.infant_price ?? 0),
  0);
}

interface CRMPackageItinerarySidebarProps {
  crmPackageId: string;
  packageBasePrice: number;
  persons: PersonCounts;
  selectedDealIds: string[];
  selectedServiceIds: string[];
  selectedTransferIds: string[];
  addonDeals: AddonDeal[];
  addonServices: AddonHotelService[];
  addonTransfers: AddonPrivateTransfer[];
  onDownloadPdf: () => void;
}

interface PackageDetail {
  id: string;
  name: string;
  adult_amount: number;
  child_amount: number;
  infant_amount: number;
  airportTransfer?: { pickupDestinationAreaName?: string; dropoffOriginAreaName?: string } | null;
  package_options?: Array<{
    id: string;
    package_items?: Array<{
      id: string;
      item_type: string;
      name: string;
      day?: number;
      tour_date?: string;
      check_in?: string;
      check_out?: string;
      nights?: number;
      rooms?: number;
      total?: number;
      option_title?: string;
      hotel_data?: { starRating?: number };
    }>;
  }>;
}

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function CRMPackageItinerarySidebar({
  crmPackageId,
  packageBasePrice,
  persons,
  selectedDealIds,
  selectedServiceIds,
  selectedTransferIds,
  addonDeals,
  addonServices,
  addonTransfers,
  onDownloadPdf,
}: CRMPackageItinerarySidebarProps) {
  const [detail, setDetail] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/website/crm/packages/${crmPackageId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setDetail(d.data); else setDetail(null); })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [crmPackageId]);

  const selectedDeals = addonDeals.filter((d) => selectedDealIds.includes(d.id));
  const selectedServices = addonServices.filter((s) => selectedServiceIds.includes(s.id));
  const selectedTransfers = addonTransfers.filter((t) => selectedTransferIds.includes(t.id));
  const addonDealsPrice = calcAddonPrice(selectedDeals, persons);
  const addonServicesPrice = calcAddonPrice(selectedServices, persons);
  const addonTransfersPrice = calcAddonPrice(selectedTransfers, persons);
  const grandTotal = packageBasePrice + addonDealsPrice + addonServicesPrice + addonTransfersPrice;

  const opt = detail?.package_options?.[0];
  const items = opt?.package_items ?? [];
  const hotels = items.filter((i) => i.item_type === 'hotel');
  const activities = items.filter((i) => i.item_type === 'activity');
  const visas = items.filter((i) => i.item_type === 'visa');
  const activitiesByDay = (() => {
    const byDay = new Map<number, typeof activities>();
    activities.forEach((a) => { const d = a.day ?? 1; if (!byDay.has(d)) byDay.set(d, []); byDay.get(d)!.push(a); });
    return Array.from(byDay.entries()).sort(([a], [b]) => a - b);
  })();
  const nights = hotels[0]?.check_in && hotels[0]?.check_out ? Math.ceil((new Date(hotels[0].check_out!).getTime() - new Date(hotels[0].check_in!).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const checkIn = hotels[0]?.check_in;
  const checkOut = hotels[0]?.check_out;

  return (
    <div className="quotation-sidebar">
      <div className="pb-travellers-section">
        <div className="pb-travellers-title">Travellers</div>
        <div className="pb-travellers-badges">
          {persons.adults > 0 && <span className="pb-traveller-badge pb-traveller-badge-adult">{persons.adults} Adult{persons.adults !== 1 ? 's' : ''}</span>}
          {persons.children > 0 && <span className="pb-traveller-badge pb-traveller-badge-child">{persons.children} Child{persons.children !== 1 ? 'ren' : ''}</span>}
          {persons.infants > 0 && <span className="pb-traveller-badge pb-traveller-badge-infant">{persons.infants} Infant{persons.infants !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      {loading ? (
        <p className="pb-itinerary-empty">Loading itinerary...</p>
      ) : (
        <div className="quotation-cart-content">
          {nights > 0 && checkIn && checkOut && (
            <div className="quotation-destination-info">
              <span className="quotation-destination-text">Dubai ({nights}N {nights + 1}D) {formatDate(checkIn)} to {formatDate(checkOut)}</span>
            </div>
          )}

          <div className="quotation-cart-items">
            <div className="quotation-timeline" />

            {detail?.airportTransfer && (detail.airportTransfer.pickupDestinationAreaName || detail.airportTransfer.dropoffOriginAreaName) && (
              <div className="quotation-type-section">
                <div className="quotation-type-badge-header">
                  <div className="quotation-type-badge-icon"><Plane size={16} /></div>
                  <span className="quotation-type-badge">Airport Transfers</span>
                </div>
                <div className="quotation-type-items">
                  <div className="quotation-airport-transfer-item">
                    <div className="quotation-cart-item-name">Included in package</div>
                    <div className="quotation-cart-item-details">
                      {detail.airportTransfer.pickupDestinationAreaName && <div className="quotation-cart-detail-row"><span className="quotation-detail-value">Pickup → {detail.airportTransfer.pickupDestinationAreaName.split(' - ')[1] || detail.airportTransfer.pickupDestinationAreaName}</span></div>}
                      {detail.airportTransfer.dropoffOriginAreaName && <div className="quotation-cart-detail-row"><span className="quotation-detail-value">Dropoff ← {detail.airportTransfer.dropoffOriginAreaName.split(' - ')[1] || detail.airportTransfer.dropoffOriginAreaName}</span></div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hotels.length > 0 && (
              <div className="quotation-type-section">
                <div className="quotation-type-badge-header">
                  <div className="quotation-type-badge-icon"><Building2 size={16} /></div>
                  <span className="quotation-type-badge">Hotel</span>
                </div>
                <div className="quotation-type-items">
                  {hotels.map((h) => (
                    <div key={h.id} className="quotation-cart-item">
                      <div className="quotation-cart-item-name">{h.name}{h.hotel_data?.starRating && <span className="quotation-hotel-rating">{h.hotel_data.starRating} star</span>}</div>
                      {(h.check_in && h.check_out) && <div className="quotation-cart-item-details"><div className="quotation-cart-detail-row"><span className="quotation-detail-value">{formatDate(h.check_in)} to {formatDate(h.check_out)}</span></div></div>}
                      <div className="quotation-cart-item-details"><div className="quotation-cart-detail-row"><span className="quotation-detail-value">{h.rooms ?? 1} Room(s) · {h.nights ?? 0} Night(s)</span></div></div>
                      {h.option_title && <div className="quotation-cart-item-details"><div className="quotation-cart-detail-row"><span className="quotation-detail-value">{h.option_title}</span></div></div>}
                      <div className="quotation-cart-item-total"><span>AED {parseFloat(String(h.total || 0)).toFixed(0)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activitiesByDay.length > 0 && (
              <div className="quotation-type-section">
                <div className="quotation-type-badge-header">
                  <div className="quotation-type-badge-icon"><Users size={16} /></div>
                  <span className="quotation-type-badge">Tour</span>
                </div>
                <div className="quotation-type-items">
                  {activitiesByDay.map(([day, dayActivities]) => (
                    <div key={day} className="quotation-day-section">
                      <div className="quotation-day-header">
                        <span>Day {day}{dayActivities[0]?.tour_date ? `: ${formatDate(dayActivities[0].tour_date)}` : ''}</span>
                        <span className="quotation-day-total">AED {dayActivities.reduce((s, a) => s + parseFloat(String(a.total || 0)), 0).toFixed(0)}</span>
                      </div>
                      <div className="quotation-day-items">
                        {dayActivities.map((a) => (
                          <div key={a.id} className="quotation-cart-item">
                            <div className="quotation-cart-item-name">{a.name}</div>
                            {a.option_title && <div className="quotation-cart-item-details"><div className="quotation-cart-detail-row"><span className="quotation-detail-value">Option: {a.option_title}</span></div></div>}
                            <div className="quotation-cart-item-total"><span>AED {parseFloat(String(a.total || 0)).toFixed(0)}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visas.length > 0 && (
              <div className="quotation-type-section">
                <div className="quotation-type-badge-header"><div className="quotation-type-badge-icon"><FileText size={16} /></div><span className="quotation-type-badge">Visa</span></div>
                <div className="quotation-type-items">
                  {visas.map((v) => (
                    <div key={v.id} className="quotation-cart-item">
                      <div className="quotation-cart-item-name">{v.name}</div>
                      <div className="quotation-cart-item-total"><span>AED {parseFloat(String(v.total || 0)).toFixed(0)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDeals.length > 0 && (
              <div className="quotation-type-section">
                <div className="quotation-type-badge-header"><div className="quotation-type-badge-icon"><Users size={16} /></div><span className="quotation-type-badge">Addon Deals</span></div>
                <div className="quotation-type-items">
                  {selectedDeals.map((d) => (
                    <div key={d.id} className="quotation-cart-item">
                      <div className="quotation-cart-item-name">{d.name}</div>
                      <div className="quotation-cart-item-total"><span>AED {(persons.adults * d.adult_price + persons.children * d.child_price + persons.infants * d.infant_price).toFixed(0)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTransfers.length > 0 && (
              <div className="quotation-type-section">
                <div className="quotation-type-badge-header"><div className="quotation-type-badge-icon"><Car size={16} /></div><span className="quotation-type-badge">Private Transfers</span></div>
                <div className="quotation-type-items">
                  {selectedTransfers.map((t) => (
                    <div key={t.id} className="quotation-cart-item">
                      <div className="quotation-cart-item-name">{t.name}</div>
                      <div className="quotation-cart-item-total"><span>AED {(persons.adults * t.adult_price + persons.children * t.child_price + persons.infants * t.infant_price).toFixed(0)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedServices.length > 0 && (
              <div className="quotation-type-section">
                <div className="quotation-type-badge-header"><div className="quotation-type-badge-icon"><Building2 size={16} /></div><span className="quotation-type-badge">Hotel Services</span></div>
                <div className="quotation-type-items">
                  {selectedServices.map((s) => (
                    <div key={s.id} className="quotation-cart-item">
                      <div className="quotation-cart-item-name">{s.name}</div>
                      <div className="quotation-cart-item-total"><span>AED {(persons.adults * s.adult_price + persons.children * s.child_price + persons.infants * s.infant_price).toFixed(0)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="quotation-summary-section">
        <div className="quotation-summary-title">Summary</div>
        <div className="quotation-summary-rows">
          {packageBasePrice > 0 && <div className="quotation-summary-row"><span style={{ color: 'var(--text-muted)' }}>Package ({persons.adults}A{persons.children ? ` ${persons.children}C` : ''}{persons.infants ? ` ${persons.infants}I` : ''})</span><span style={{ fontWeight: 600 }}>AED {packageBasePrice.toFixed(0)}</span></div>}
          {addonDealsPrice > 0 && <div className="quotation-summary-row"><span style={{ color: 'var(--text-muted)' }}>Addons</span><span style={{ fontWeight: 600 }}>AED {addonDealsPrice.toFixed(0)}</span></div>}
          {addonTransfersPrice > 0 && <div className="quotation-summary-row"><span style={{ color: 'var(--text-muted)' }}>Private Transfers</span><span style={{ fontWeight: 600 }}>AED {addonTransfersPrice.toFixed(0)}</span></div>}
          {addonServicesPrice > 0 && <div className="quotation-summary-row"><span style={{ color: 'var(--text-muted)' }}>Hotel Services</span><span style={{ fontWeight: 600 }}>AED {addonServicesPrice.toFixed(0)}</span></div>}
        </div>
        <div className="quotation-grand-total">
          <span className="quotation-grand-total-label">Grand Total</span>
          <span className="quotation-grand-total-amount">AED {grandTotal.toFixed(0)}</span>
        </div>
      </div>

      <button type="button" className="quotation-download-pdf-btn" onClick={onDownloadPdf}>Download PDF</button>
    </div>
  );
}
