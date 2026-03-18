'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Building2, Plane, ArrowUpDown } from 'lucide-react';
import type { PackageOption, PersonCounts, AddonDeal, AddonHotelService, AddonPrivateTransfer } from '../types';
import { useCRMPackage } from '@/hooks/use-marketing-queries';
import { PDF_PAGINATION, AVAILABLE_PAGE_HEIGHT } from '../lib/pdf-pagination-constants';
import './CRMPackageItinerarySidebar.css';
import './CRMPackageItineraryPreview.css';

interface AddonDealForPreview {
  id: string;
  name: string;
  adult_price?: number;
  child_price?: number;
  infant_price?: number;
  image_url?: string | null;
  category_name?: string;
  items?: Array<{ activity_option?: { title?: string } }>;
}

interface AddonTransferForPreview {
  id: string;
  name: string;
  adult_price?: number;
  child_price?: number;
  infant_price?: number;
  pax_type?: string;
  min_pax?: number;
  max_pax?: number;
}

interface AddonHotelServiceForPreview {
  id: string;
  name: string;
  adult_price?: number;
  child_price?: number;
  infant_price?: number;
  quantity?: number;
}

type ContentBlock =
  | { type: 'airport_pickup' }
  | { type: 'accommodation_header' }
  | { type: 'hotel'; hotel: PackageItem }
  | { type: 'visa_header' }
  | { type: 'visa'; visa: PackageItem }
  | { type: 'itinerary_day_header'; day: number; date: string; isContinuation?: boolean }
  | { type: 'itinerary_activity'; activity: PackageItem; day: number; date: string }
  | { type: 'airport_dropoff' }
  | { type: 'addon_deal_header' }
  | { type: 'addon_deal'; deal: AddonDealForPreview }
  | { type: 'addon_transfer_header' }
  | { type: 'addon_transfer'; transfer: AddonTransferForPreview }
  | { type: 'addon_hotel_service_header' }
  | { type: 'addon_hotel_service'; service: AddonHotelServiceForPreview }
  | { type: 'total' };

function getBlockHeight(block: ContentBlock): number {
  switch (block.type) {
    case 'airport_pickup': return PDF_PAGINATION.AIRPORT_PICKUP_HEIGHT;
    case 'airport_dropoff': return PDF_PAGINATION.AIRPORT_DROPOFF_HEIGHT;
    case 'accommodation_header': return PDF_PAGINATION.ACCOMMODATION_HEADER_HEIGHT;
    case 'hotel': return PDF_PAGINATION.HOTEL_ITEM_HEIGHT;
    case 'visa_header': return PDF_PAGINATION.VISA_HEADER_HEIGHT;
    case 'visa': return PDF_PAGINATION.VISA_ITEM_HEIGHT;
    case 'itinerary_day_header': return block.isContinuation ? PDF_PAGINATION.ITINERARY_DAY_CONTINUATION_HEIGHT : PDF_PAGINATION.ITINERARY_DAY_HEADER_HEIGHT;
    case 'itinerary_activity': return PDF_PAGINATION.ITINERARY_ACTIVITY_HEIGHT;
    case 'addon_deal_header': return PDF_PAGINATION.ADDON_DEAL_HEADER_HEIGHT;
    case 'addon_deal': return PDF_PAGINATION.ADDON_DEAL_CARD_HEIGHT;
    case 'addon_transfer_header': return PDF_PAGINATION.ADDON_TRANSFER_HEADER_HEIGHT;
    case 'addon_transfer': return PDF_PAGINATION.ADDON_TRANSFER_CARD_HEIGHT;
    case 'addon_hotel_service_header': return PDF_PAGINATION.ADDON_HOTEL_SERVICE_HEADER_HEIGHT;
    case 'addon_hotel_service': return PDF_PAGINATION.ADDON_HOTEL_SERVICE_CARD_HEIGHT;
    case 'total': return PDF_PAGINATION.TOTAL_ROW_HEIGHT;
    default: return 0;
  }
}

function buildContentPages(
  hasPickup: boolean,
  hotels: PackageItem[],
  visas: PackageItem[],
  activitiesByDay: Array<{ day: number; date: string; activities: PackageItem[] }>,
  hasDropoff: boolean,
  addonDeals: AddonDealForPreview[],
  addonTransfers: AddonTransferForPreview[],
  addonHotelServices: AddonHotelServiceForPreview[]
): ContentBlock[][] {
  const blocks: ContentBlock[] = [];
  if (hasPickup) blocks.push({ type: 'airport_pickup' });
  if (hotels.length > 0) {
    blocks.push({ type: 'accommodation_header' });
    hotels.forEach((h) => blocks.push({ type: 'hotel', hotel: h }));
  }
  if (visas.length > 0) {
    blocks.push({ type: 'visa_header' });
    visas.forEach((v) => blocks.push({ type: 'visa', visa: v }));
  }
  if (activitiesByDay.length > 0) {
    const activityH = PDF_PAGINATION.ITINERARY_ACTIVITY_HEIGHT;
    const dayHeaderH = PDF_PAGINATION.ITINERARY_DAY_HEADER_HEIGHT;
    const dayContH = PDF_PAGINATION.ITINERARY_DAY_CONTINUATION_HEIGHT;
    const maxH = AVAILABLE_PAGE_HEIGHT - PDF_PAGINATION.HEIGHT_BUFFER;
    const firstChunkSize = Math.max(1, Math.floor((maxH - dayHeaderH) / activityH));
    const contChunkSize = Math.max(1, Math.floor((maxH - dayContH) / activityH));
    activitiesByDay.forEach((dayGroup) => {
      const acts = dayGroup.activities;
      let offset = 0;
      let isFirst = true;
      while (offset < acts.length) {
        const limit = isFirst ? firstChunkSize : contChunkSize;
        const slice = acts.slice(offset, offset + limit);
        blocks.push({ type: 'itinerary_day_header', day: dayGroup.day, date: dayGroup.date, isContinuation: !isFirst });
        slice.forEach((a) => blocks.push({ type: 'itinerary_activity', activity: a, day: dayGroup.day, date: dayGroup.date }));
        offset += limit;
        isFirst = false;
      }
    });
  }
  if (hasDropoff) blocks.push({ type: 'airport_dropoff' });
  if (addonDeals.length > 0) {
    blocks.push({ type: 'addon_deal_header' });
    addonDeals.forEach((d) => blocks.push({ type: 'addon_deal', deal: d }));
  }
  if (addonTransfers.length > 0) {
    blocks.push({ type: 'addon_transfer_header' });
    addonTransfers.forEach((t) => blocks.push({ type: 'addon_transfer', transfer: t }));
  }
  if (addonHotelServices.length > 0) {
    blocks.push({ type: 'addon_hotel_service_header' });
    addonHotelServices.forEach((s) => blocks.push({ type: 'addon_hotel_service', service: s }));
  }
  blocks.push({ type: 'total' });

  const maxHeight = AVAILABLE_PAGE_HEIGHT - PDF_PAGINATION.HEIGHT_BUFFER;
  const pages: ContentBlock[][] = [];
  let currentPage: ContentBlock[] = [];
  let currentHeight = 0;
  for (const block of blocks) {
    const h = getBlockHeight(block);
    if (currentHeight + h > maxHeight && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      currentHeight = 0;
      if (block.type === 'itinerary_activity') {
        const contHeader: ContentBlock = { type: 'itinerary_day_header', day: block.day, date: block.date, isContinuation: true };
        currentPage.push(contHeader);
        currentHeight += getBlockHeight(contHeader);
      }
    }
    currentPage.push(block);
    currentHeight += h;
  }
  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

interface PackageItem {
  id: string;
  item_type: string;
  name: string;
  tour_date?: string;
  check_in?: string;
  check_out?: string;
  adults?: number;
  children?: number;
  infants?: number;
  total?: number;
  transfer_option?: string;
  image_url?: string;
  duration_minutes?: number;
  hotel_data?: { starRating?: number; rooms?: number; extraBedCount?: number; childNoBedCount?: number };
  option_title?: string;
  rooms?: number;
  nights?: number;
  cancellation_policy?: string;
  day?: number;
  quantity?: number;
}

interface CRMPackageData {
  id: string;
  name?: string;
  package_number?: string;
  total_amount?: number;
  package_options?: Array<{
    option_number?: number;
    package_items?: PackageItem[];
  }>;
  airportTransfer?: {
    pickupAreaName?: string;
    pickupDestinationAreaName?: string;
    pickupDate?: string;
    dropoffAreaName?: string;
    dropoffOriginAreaName?: string;
    dropoffDate?: string;
  } | null;
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
  services: Array<AddonHotelService & { quantity?: number }>,
  persons: PersonCounts
): number {
  return services.reduce((sum, s) => {
    const qty = s.quantity ?? 1;
    const unitPrice =
      (persons.adults ?? 0) * (s.adult_price ?? 0) +
      (persons.children ?? 0) * (s.child_price ?? 0) +
      (persons.infants ?? 0) * (s.infant_price ?? 0);
    return sum + unitPrice * qty;
  }, 0);
}

function getDisplayImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return url;
  return url;
}

interface CRMPackageItineraryPreviewProps {
  crmPackageId: string;
  package: PackageOption;
  persons: PersonCounts;
  isSoloTraveller: boolean;
  selectedDeals: AddonDeal[];
  selectedServices: AddonHotelService[];
  selectedTransfers: AddonPrivateTransfer[];
  /** Override package base when group dates apply (from parent) */
  packageBasePriceOverride?: number;
  /** Hotel surcharge total to add to grand total */
  hotelSurchargeTotal?: number;
  /** Extra bed / child no bed total */
  extraBedChildNoBedTotal?: number;
  /** Effective nights (base + hotel service extension) - matches sidebar */
  effectiveNightsOverride?: number;
  /** Effective days (nights + 1) - matches sidebar */
  effectiveDaysOverride?: number;
}

export function CRMPackageItineraryPreview({
  crmPackageId,
  package: pkg,
  persons,
  isSoloTraveller,
  selectedDeals,
  selectedServices,
  selectedTransfers,
  packageBasePriceOverride,
  hotelSurchargeTotal = 0,
  extraBedChildNoBedTotal = 0,
  effectiveNightsOverride,
  effectiveDaysOverride,
}: CRMPackageItineraryPreviewProps) {
  const { data, isLoading: loading, error: queryError, isError } = useCRMPackage(crmPackageId);
  const error = isError || queryError ? 'Failed to load itinerary' : null;

  const packageData = data as CRMPackageData | null | undefined;
  const hasData = !loading && !error && packageData;

  const opt = hasData ? packageData?.package_options?.[0] : undefined;
  const items: PackageItem[] = opt?.package_items ?? [];
  const hotels = items.filter((i) => i.item_type === 'hotel');
  const activities = items.filter((i) => i.item_type === 'activity');
  const visas = items.filter((i) => i.item_type === 'visa');

  const days = Array.from(new Set(activities.map((a) => a.day ?? 1))).sort((a, b) => a - b);
  const activitiesByDay = days.map((day) => {
    const dayActivities = activities.filter((a) => (a.day ?? 1) === day);
    return {
      day,
      date: dayActivities[0]?.tour_date || '',
      activities: dayActivities,
    };
  });

  const at = hasData ? packageData?.airportTransfer : undefined;
  const hasPickup = !!(at && at.pickupDestinationAreaName);
  const hasDropoff = !!(at && at.dropoffOriginAreaName);

  const addonDealsForPreview: AddonDealForPreview[] = selectedDeals.map((d) => ({
    id: d.id,
    name: d.name,
    adult_price: d.adult_price,
    child_price: d.child_price,
    infant_price: d.infant_price,
    image_url: d.image_url ?? null,
    category_name: d.category_name ?? undefined,
    items: d.items ?? [],
  }));

  const addonTransfersForPreview: AddonTransferForPreview[] = selectedTransfers.map((t) => ({
    id: t.id,
    name: t.name,
    adult_price: t.adult_price,
    child_price: t.child_price,
    infant_price: t.infant_price,
    pax_type: t.pax_type,
    min_pax: t.min_pax ?? undefined,
    max_pax: t.max_pax ?? undefined,
  }));

  const addonServicesForPreview: AddonHotelServiceForPreview[] = selectedServices.map((s) => ({
    id: s.id,
    name: s.name,
    adult_price: s.adult_price,
    child_price: s.child_price,
    infant_price: s.infant_price,
    quantity: s.quantity ?? 1,
  }));

  const contentPages = useMemo(
    () =>
      buildContentPages(
        hasPickup,
        hotels,
        visas,
        activitiesByDay,
        hasDropoff,
        addonDealsForPreview,
        addonTransfersForPreview,
        addonServicesForPreview
      ),
    [
      hasPickup,
      hasDropoff,
      hotels,
      visas,
      activitiesByDay,
      addonDealsForPreview,
      addonTransfersForPreview,
      addonServicesForPreview,
    ]
  );

  const packageBase =
    packageBasePriceOverride ??
    (isSoloTraveller && pkg.solo_traveller_enabled
      ? (pkg.solo_traveller_price ?? pkg.adult_price ?? pkg.package_price ?? 0)
      : (pkg.adult_price != null && pkg.adult_price > 0) ||
          (pkg.child_price != null && pkg.child_price > 0) ||
          (pkg.infant_price != null && pkg.infant_price > 0)
        ? (persons.adults ?? 0) * (pkg.adult_price ?? 0) +
          (persons.children ?? 0) * (pkg.child_price ?? 0) +
          (persons.infants ?? 0) * (pkg.infant_price ?? 0)
        : pkg.package_price ?? 0);

  const addonDealsPrice = calcAddonPrice(selectedDeals, persons);
  const addonServicesPrice = calcAddonServicesPrice(selectedServices, persons);
  const addonTransfersPrice = calcAddonPrice(selectedTransfers, persons);
  const total = packageBase + addonDealsPrice + addonServicesPrice + addonTransfersPrice + hotelSurchargeTotal + extraBedChildNoBedTotal;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTransferOption = (option?: string): string => {
    if (!option) return 'Without Transfers';
    const map: Record<string, string> = {
      without_transfers: 'Without Transfers',
      with_shared_transfer: 'With Shared Transfer',
      with_private_transfer: 'With Private Transfer',
    };
    return map[option] || option;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}:${mins.toString().padStart(2, '0')} hours (Approx)`;
    if (hours > 0) return `${hours}:00 hours (Approx)`;
    return `${mins} minutes (Approx)`;
  };

  if (loading) {
    return (
      <div className="crm-itinerary-preview-loading">
        <p>Loading itinerary...</p>
      </div>
    );
  }
  if (error || !packageData) {
    return (
      <div className="crm-itinerary-preview-error">
        <p>{error || 'Could not load package itinerary'}</p>
      </div>
    );
  }

  const firstCheckIn = hotels[0]?.check_in;
  const lastCheckOut = hotels.length > 0 ? (hotels[hotels.length - 1]?.check_out ?? hotels[0]?.check_out) : undefined;
  const baseNightsFromHotels = hotels.reduce((sum, h) => sum + (h.nights ?? 0), 0);
  const totalNights = effectiveNightsOverride ?? baseNightsFromHotels;
  const totalDays = effectiveDaysOverride ?? (totalNights > 0 ? totalNights + 1 : 0);

  const paxLabel = [
    persons.adults > 0 ? `${persons.adults} Adult${persons.adults !== 1 ? 's' : ''}` : '',
    persons.children > 0 ? `${persons.children} Child${persons.children !== 1 ? 'ren' : ''}` : '',
    persons.infants > 0 ? `${persons.infants} Infant${persons.infants !== 1 ? 's' : ''}` : '',
  ]
    .filter(Boolean)
    .join(', ') || '0 Guests';

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'airport_pickup':
        return at ? (
          <React.Fragment key="pickup">
            <div className="quotation-timeline" />
            <div className="quotation-type-badge-header">
              <div className="quotation-type-badge-icon"><Plane size={16} /></div>
              <span className="quotation-type-badge">Airport Pickup{at.pickupDate ? ` (${formatDate(at.pickupDate)})` : ''}</span>
            </div>
            <div className="quotation-airport-transfer-item">
              <div className="quotation-airport-transfer-header">
                <div className="quotation-airport-transfer-label"><Plane size={14} /><span>Airport Pickup</span></div>
              </div>
              <div className="quotation-airport-transfer-details">
                <div className="quotation-transfer-locations">
                  <div className="quotation-transfer-location-box quotation-transfer-pickup">
                    <div className="quotation-transfer-location-label">From</div>
                    <div className="quotation-transfer-location-primary">Airport</div>
                  </div>
                  <div className="quotation-transfer-swap-icon"><ArrowUpDown size={20} /></div>
                  <div className="quotation-transfer-location-box quotation-transfer-dropoff">
                    <div className="quotation-transfer-location-label">To</div>
                    <div className="quotation-transfer-location-primary">{(at.pickupDestinationAreaName || '').split(' - ')[1] || at.pickupDestinationAreaName || 'Hotel'}</div>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ) : null;
      case 'airport_dropoff':
        return at ? (
          <React.Fragment key="dropoff">
            <div className="quotation-timeline" />
            <div className="quotation-type-badge-header">
              <div className="quotation-type-badge-icon"><Plane size={16} /></div>
              <span className="quotation-type-badge">Airport Dropoff{at.dropoffDate ? ` (${formatDate(at.dropoffDate)})` : ''}</span>
            </div>
            <div className="quotation-airport-transfer-item">
              <div className="quotation-airport-transfer-header">
                <div className="quotation-airport-transfer-label"><Plane size={14} /><span>Airport Dropoff</span></div>
              </div>
              <div className="quotation-airport-transfer-details">
                <div className="quotation-transfer-locations">
                  <div className="quotation-transfer-location-box quotation-transfer-pickup">
                    <div className="quotation-transfer-location-label">From</div>
                    <div className="quotation-transfer-location-primary">{(at.dropoffOriginAreaName || '').split(' - ')[1] || at.dropoffOriginAreaName || 'Hotel'}</div>
                  </div>
                  <div className="quotation-transfer-swap-icon"><ArrowUpDown size={20} /></div>
                  <div className="quotation-transfer-location-box quotation-transfer-dropoff">
                    <div className="quotation-transfer-location-label">To</div>
                    <div className="quotation-transfer-location-primary">Airport</div>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ) : null;
      case 'accommodation_header':
      case 'visa_header':
      case 'addon_deal_header':
      case 'addon_transfer_header':
      case 'addon_hotel_service_header':
        return null;
      case 'hotel': {
        const h = block.hotel;
        const hd = h.hotel_data;
        return (
          <div key={h.id} className="quotation-cart-item">
            <div className="quotation-cart-item-header">
              <div className="quotation-cart-item-name">
                {h.name}
                {hd?.starRating && <span className="quotation-hotel-rating">{hd.starRating} star</span>}
              </div>
            </div>
            <div className="quotation-cart-item-details">
              {h.check_in && h.check_out && (
                <div className="quotation-cart-detail-row">
                  <span className="quotation-detail-value">{formatDate(h.check_in)} to {formatDate(h.check_out)}</span>
                </div>
              )}
              <div className="quotation-cart-detail-row">
                <span className="quotation-detail-value">
                  👥 {paxLabel}
                </span>
              </div>
              <div style={{ borderTop: '1px dashed var(--border)', margin: '8px 0', paddingTop: '8px' }} />
              {(() => {
                const rooms = h.rooms ?? hd?.rooms ?? 1;
                const roomLabel = h.option_title
                  ? String(h.option_title).toLowerCase()
                  : 'room';
                const roomParts = [
                  rooms > 1 ? `${rooms} ${roomLabel}s` : roomLabel,
                  (hd?.extraBedCount ?? 0) > 0
                    ? `${hd?.extraBedCount ?? 0} extra bed${(hd?.extraBedCount ?? 0) !== 1 ? 's' : ''}`
                    : null,
                  (hd?.childNoBedCount ?? 0) > 0
                    ? `${hd?.childNoBedCount ?? 0} child no bed${(hd?.childNoBedCount ?? 0) !== 1 ? 's' : ''}`
                    : null,
                ].filter(Boolean);
                const roomDetail = roomParts.join(', ');
                return roomDetail ? (
                  <div className="quotation-cart-detail-row">
                    <span className="quotation-detail-value">{roomDetail}</span>
                  </div>
                ) : null;
              })()}
            </div>
            {h.cancellation_policy && <div className="quotation-cart-policy" style={{ marginTop: '8px' }}>{h.cancellation_policy}</div>}
          </div>
        );
      }
      case 'visa': {
        const v = block.visa;
        return (
          <div key={v.id} className="quotation-cart-item">
            <div className="quotation-cart-item-header">
              <div className="quotation-cart-item-name">{v.name || 'Visa'}</div>
            </div>
            <div className="quotation-cart-item-details">
              <div className="quotation-cart-detail-row">
                <span className="quotation-detail-value">
                  {paxLabel}
                </span>
              </div>
            </div>
          </div>
        );
      }
      case 'itinerary_day_header':
        return (
          <div key={`day-h-${block.day}-${block.isContinuation ? 'cont' : ''}`} className="quotation-day-header">
            <div className="quotation-day-title">
              <span>{block.isContinuation ? `Day ${block.day} (continued)` : `Day ${block.day} : ${block.date ? formatDate(block.date) : ''}`}</span>
            </div>
          </div>
        );
      case 'itinerary_activity': {
        const act = block.activity;
        return (
          <div key={act.id} className="quotation-cart-item quotation-cart-item-with-image">
            {act.image_url && (
              <div className="quotation-cart-item-image">
                <img src={getDisplayImageUrl(act.image_url) || act.image_url} alt={act.name} />
              </div>
            )}
            <div className="quotation-cart-item-content">
              <div className="quotation-cart-item-header">
                <div className="quotation-cart-item-name">{act.name}</div>
              </div>
              <div className="quotation-cart-item-details">
                {act.tour_date && (
                  <div className="quotation-cart-detail-row">
                    <span className="quotation-detail-label">Tour Date:</span>
                    <span className="quotation-detail-value">{formatDate(act.tour_date)}</span>
                  </div>
                )}
                {act.option_title && (
                  <div className="quotation-cart-detail-row">
                    <span className="quotation-detail-label">Tour Option:</span>
                    <span className="quotation-detail-value">{act.option_title}</span>
                  </div>
                )}
                <div className="quotation-cart-detail-row">
                  <span className="quotation-detail-label">Transfer Option:</span>
                  <span className="quotation-detail-value">{formatTransferOption(act.transfer_option)}</span>
                </div>
                {act.duration_minutes && (
                  <div className="quotation-cart-detail-row">
                    <span className="quotation-detail-label">Duration:</span>
                    <span className="quotation-detail-value">{formatDuration(act.duration_minutes)}</span>
                  </div>
                )}
                <div className="quotation-cart-detail-row">
                  <span className="quotation-detail-label">No. of Pax:</span>
                  <span className="quotation-detail-value">
                    {paxLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'addon_deal': {
        const deal = block.deal;
        return (
          <div key={deal.id} className="quotation-cart-item quotation-cart-item-with-image">
            {deal.image_url && (
              <div className="quotation-cart-item-image">
                <img src={deal.image_url} alt={deal.name} />
              </div>
            )}
            <div className="quotation-cart-item-content">
              <div className="quotation-cart-item-header">
                <div className="quotation-cart-item-name" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.35' }}>{deal.name}</div>
                {deal.category_name && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{deal.category_name}</span>}
              </div>
              {deal.items && deal.items.length > 0 && (
                <div className="quotation-cart-item-details">
                  {deal.items.map((item, idx) =>
                    item.activity_option?.title ? (
                      <div key={idx} className="quotation-cart-detail-row">
                        <span className="quotation-detail-label">Activity:</span>
                        <span className="quotation-detail-value">{item.activity_option.title}</span>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'addon_transfer': {
        const t = block.transfer;
        return (
          <div key={t.id} className="quotation-cart-item" style={{ overflow: 'hidden' }}>
            <div className="quotation-cart-item-header">
              <div className="quotation-cart-item-name" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.35' }}>{t.name}</div>
            </div>
            {(t.pax_type || t.min_pax || t.max_pax) && (
              <div className="quotation-cart-item-details">
                {t.pax_type && (
                  <div className="quotation-cart-detail-row">
                    <span className="quotation-detail-label">Pax Type:</span>
                    <span className="quotation-detail-value" style={{ textTransform: 'capitalize' }}>{(t.pax_type || '').replace('_', ' ')}</span>
                  </div>
                )}
                {(t.min_pax || t.max_pax) && (
                  <div className="quotation-cart-detail-row">
                    <span className="quotation-detail-label">Pax Range:</span>
                    <span className="quotation-detail-value">{t.min_pax ?? '-'} – {t.max_pax ?? '-'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      case 'addon_hotel_service': {
        const s = block.service;
        const qty = s.quantity ?? 1;
        return (
          <div key={s.id} className="quotation-cart-item" style={{ overflow: 'hidden' }}>
            <div className="quotation-cart-item-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <div className="quotation-cart-item-name" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.35' }}>
                {qty > 1 ? `${qty} × ` : ''}{s.name}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                +{qty} Night{qty !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        );
      }
      case 'total':
        return null;
      default:
        return null;
    }
  };

  const renderPage = (pageBlocks: ContentBlock[], pageIndex: number) => {
    const hotelBlocks = pageBlocks.filter((b): b is ContentBlock & { type: 'hotel' } => b.type === 'hotel');
    const visaBlocks = pageBlocks.filter((b): b is ContentBlock & { type: 'visa' } => b.type === 'visa');
    const addonDealBlocks = pageBlocks.filter((b): b is ContentBlock & { type: 'addon_deal' } => b.type === 'addon_deal');
    const addonTransferBlocks = pageBlocks.filter((b): b is ContentBlock & { type: 'addon_transfer' } => b.type === 'addon_transfer');
    const addonHotelServiceBlocks = pageBlocks.filter((b): b is ContentBlock & { type: 'addon_hotel_service' } => b.type === 'addon_hotel_service');
    const hasTotalBlock = pageBlocks.some((b) => b.type === 'total');

    const elements: React.ReactNode[] = [];
    for (let i = 0; i < pageBlocks.length; i++) {
      const block = pageBlocks[i];
      if (block.type === 'total') continue;
      if (block.type === 'airport_pickup' || block.type === 'airport_dropoff') {
        elements.push(<React.Fragment key={i}>{renderBlock(block)}</React.Fragment>);
        continue;
      }
      if (hotelBlocks.length > 0 && (block.type === 'accommodation_header' || (block.type === 'hotel' && block === hotelBlocks[0]))) {
        const hasAccHeader = pageBlocks.some((b) => b.type === 'accommodation_header');
        const shouldRenderAcc = (hasAccHeader && block.type === 'accommodation_header') || (!hasAccHeader && block.type === 'hotel' && block === hotelBlocks[0]);
        if (shouldRenderAcc) {
          elements.push(
            <React.Fragment key={`acc-${pageIndex}`}>
              <div className="quotation-timeline" />
              {hasAccHeader && (
                <div className="quotation-type-badge-header">
                  <div className="quotation-type-badge-icon"><Building2 size={16} /></div>
                  <span className="quotation-type-badge">Accommodation</span>
                </div>
              )}
              {hotelBlocks.map((hb) => renderBlock(hb))}
            </React.Fragment>
          );
          continue;
        }
      }
      if (visaBlocks.length > 0 && (block.type === 'visa_header' || (block.type === 'visa' && block === visaBlocks[0]))) {
        const hasVisaHeader = pageBlocks.some((b) => b.type === 'visa_header');
        const shouldRenderVisa = (hasVisaHeader && block.type === 'visa_header') || (!hasVisaHeader && block.type === 'visa' && block === visaBlocks[0]);
        if (shouldRenderVisa) {
          elements.push(
            <React.Fragment key={`visa-${pageIndex}`}>
              <div className="quotation-timeline" />
              {hasVisaHeader && (
                <div className="quotation-type-badge-header">
                  <div className="quotation-type-badge-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <span className="quotation-type-badge">Visa</span>
                </div>
              )}
              {visaBlocks.map((vb) => renderBlock(vb))}
            </React.Fragment>
          );
          continue;
        }
      }
      if (block.type === 'itinerary_day_header') {
        const itBlocks = pageBlocks.slice(i).filter((b) => b.type === 'itinerary_day_header' || b.type === 'itinerary_activity');
        const daySections: React.ReactNode[] = [];
        let j = 0;
        while (j < itBlocks.length) {
          const b = itBlocks[j];
          if (b.type === 'itinerary_day_header') {
            const dayActivities: React.ReactNode[] = [];
            j++;
            while (j < itBlocks.length && itBlocks[j].type === 'itinerary_activity') {
              dayActivities.push(renderBlock(itBlocks[j]));
              j++;
            }
            daySections.push(
              <React.Fragment key={`day-${i}-${j}`}>
                {renderBlock(b)}
                {dayActivities}
              </React.Fragment>
            );
          } else {
            j++;
          }
        }
        elements.push(
          <React.Fragment key={`it-${pageIndex}`}>
            <div className="quotation-timeline" />
            <>{daySections}</>
          </React.Fragment>
        );
        i += itBlocks.length - 1;
        continue;
      }
      if (block.type === 'itinerary_activity') continue;
      if (addonDealBlocks.length > 0 && (block.type === 'addon_deal_header' || (block.type === 'addon_deal' && block === addonDealBlocks[0]))) {
        const hasHeader = pageBlocks.some((b) => b.type === 'addon_deal_header');
        const shouldRender = (hasHeader && block.type === 'addon_deal_header') || (!hasHeader && block.type === 'addon_deal' && block === addonDealBlocks[0]);
        if (shouldRender) {
          elements.push(
            <React.Fragment key={`addon-deals-${pageIndex}`}>
              <div className="quotation-timeline" />
              <div className="quotation-type-badge-header">
                <div className="quotation-type-badge-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <span className="quotation-type-badge">Add-on Deals</span>
              </div>
              {addonDealBlocks.map((db) => renderBlock(db))}
            </React.Fragment>
          );
          continue;
        }
      }
      if (block.type === 'addon_deal') continue;
      if (addonTransferBlocks.length > 0 && (block.type === 'addon_transfer_header' || (block.type === 'addon_transfer' && block === addonTransferBlocks[0]))) {
        const hasHeader = pageBlocks.some((b) => b.type === 'addon_transfer_header');
        const shouldRender = (hasHeader && block.type === 'addon_transfer_header') || (!hasHeader && block.type === 'addon_transfer' && block === addonTransferBlocks[0]);
        if (shouldRender) {
          elements.push(
            <React.Fragment key={`addon-transfers-${pageIndex}`}>
              <div className="quotation-timeline" />
              <div className="quotation-type-badge-header">
                <div className="quotation-type-badge-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <path d="M16 8h4l3 3v5h-7V8z" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <span className="quotation-type-badge">Private Transfers</span>
              </div>
              {addonTransferBlocks.map((tb) => renderBlock(tb))}
            </React.Fragment>
          );
          continue;
        }
      }
      if (block.type === 'addon_transfer') continue;
      if (addonHotelServiceBlocks.length > 0 && (block.type === 'addon_hotel_service_header' || (block.type === 'addon_hotel_service' && block === addonHotelServiceBlocks[0]))) {
        const hasHeader = pageBlocks.some((b) => b.type === 'addon_hotel_service_header');
        const shouldRender = (hasHeader && block.type === 'addon_hotel_service_header') || (!hasHeader && block.type === 'addon_hotel_service' && block === addonHotelServiceBlocks[0]);
        if (shouldRender) {
          elements.push(
            <React.Fragment key={`addon-hotel-services-${pageIndex}`}>
              <div className="quotation-timeline" />
              <div className="quotation-type-badge-header">
                <div className="quotation-type-badge-icon"><Building2 size={16} /></div>
                <span className="quotation-type-badge">Hotel Services</span>
              </div>
              {addonHotelServiceBlocks.map((sb) => renderBlock(sb))}
            </React.Fragment>
          );
          continue;
        }
      }
      if (block.type === 'addon_hotel_service') continue;
    }

    return (
      <div key={pageIndex} className="crm-itinerary-preview-page crm-itinerary-preview-page-content">
        {elements}
        {hasTotalBlock && (
          <div className="crm-itinerary-preview-total-row">
            <span className="crm-itinerary-preview-total-label">Final Amount</span>
            <span className="crm-itinerary-preview-total-value">AED {total.toFixed(2)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="customize-package-preview" className="crm-itinerary-preview-container" data-package-id={pkg.package_id}>
      {/* Cover page - same design as CRM */}
      <div className="crm-itinerary-preview-page crm-itinerary-preview-page-first">
        <div className="crm-itinerary-preview-top-section">
          <div className="crm-itinerary-preview-logo-container">
            <img src="/aapka-tourism-logo.png" alt="Aapka Tourism" className="crm-itinerary-preview-logo-img" />
          </div>
          <h1 className="crm-itinerary-preview-itinerary-title">{pkg.package_name}</h1>
        </div>
        <div className="crm-itinerary-preview-itinerary-details">
          {(firstCheckIn || lastCheckOut) && (
            <div className="crm-itinerary-preview-dates-text">
              Start Date : {firstCheckIn ? formatDate(firstCheckIn) : 'N/A'}{' '}
              End Date : {lastCheckOut ? formatDate(lastCheckOut) : 'N/A'}
            </div>
          )}
          {totalNights > 0 && (
            <div className="crm-itinerary-preview-nights-text">
              Duration: {totalNights} Night{totalNights !== 1 ? 's' : ''} {totalDays} Day{totalDays !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="crm-itinerary-preview-illustration-section">
          <div className="crm-itinerary-preview-illustration-image">
            <img src="/images/pdf-globe.webp" alt="Travel Globe" />
          </div>
        </div>
        <div className="crm-itinerary-preview-footer-section">
          <div className="crm-itinerary-preview-footer-company">Crafted by: A A P K A TOURISM LLC</div>
          <div className="crm-itinerary-preview-footer-contact">info@aapkatourism.com, +91 7042857575</div>
          <div className="crm-itinerary-preview-footer-address">1522 B, 15th Floor, Hemkunt Chambers 89, Nehru Place, New Delhi, 110019</div>
          <div className="crm-itinerary-preview-footer-gst">GST Number: 07ABDCA8821C1ZY</div>
        </div>
      </div>

      {contentPages.map((pageBlocks, pageIndex) => renderPage(pageBlocks, pageIndex))}
    </div>
  );
}
