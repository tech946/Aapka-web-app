'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAddonDeals, useAddonHotelServices, useAddonPrivateTransfers, useCRMPackage } from '@/hooks/use-marketing-queries';
import { useHotelSurchargeTotal } from './hooks/useHotelSurchargeTotal';
import { ShoppingCart, ArrowLeft, FileDown, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCart } from '@/context/CartContext';
import { PackageSelector } from './components/PackageSelector';
import { PersonSelector } from './components/PersonSelector';
import { CheckInDateSelector } from './components/CheckInDateSelector';
import { AddonDealsSection } from './components/AddonDealsSection';
import { AddonHotelServicesSection } from './components/AddonHotelServicesSection';
import { AddonPrivateTransfersSection } from './components/AddonPrivateTransfersSection';
import { PriceSummary } from './components/PriceSummary';
import { CRMPackageItinerarySidebar } from './components/CRMPackageItinerarySidebar';
import { CustomizePackagePDFModal } from './components/CustomizePackagePDFModal';
import type {
  PackageOption,
  PersonCounts,
  AddonDeal,
  AddonHotelService,
  AddonPrivateTransfer,
  SelectedHotelService,
  GroupDatesBreakdown,
} from './types';
import './page.css';

/** Group dates logic: if checkIn in date range use range prices, else base + nonDatePrices */
function calcPackageBaseWithGroupDates(
  pkg: PackageOption,
  persons: PersonCounts,
  isSoloTraveller: boolean,
  crmData: {
    dateRanges?: Array<{ from_date: string; to_date: string; adult_price?: number; child_price?: number; infant_price?: number }>;
    nonDateAdultPrice?: number;
    nonDateChildPrice?: number;
    nonDateInfantPrice?: number;
    adult_amount?: number;
    child_amount?: number;
    infant_amount?: number;
    adult_price?: number;
    child_price?: number;
    infant_price?: number;
  } | null,
  checkInDate: string | null
): GroupDatesBreakdown {
  if (isSoloTraveller && pkg.solo_traveller_enabled) {
    const v = pkg.solo_traveller_price ?? pkg.adult_price ?? pkg.package_price ?? 0;
    return { basePackageTotal: v, extraTotal: 0, inDateRange: true, total: v };
  }
  const baseAdult = crmData?.adult_amount ?? crmData?.adult_price ?? pkg.adult_price ?? 0;
  const baseChild = crmData?.child_amount ?? crmData?.child_price ?? pkg.child_price ?? 0;
  const baseInfant = crmData?.infant_amount ?? crmData?.infant_price ?? pkg.infant_price ?? 0;
  const dateRanges = crmData?.dateRanges ?? [];
  const hasDateRanges = dateRanges.length > 0;

  if (!hasDateRanges || !checkInDate) {
    const hasPerPerson =
      (pkg.adult_price != null && pkg.adult_price > 0) ||
      (pkg.child_price != null && pkg.child_price > 0) ||
      (pkg.infant_price != null && pkg.infant_price > 0);
    const t = hasPerPerson
      ? (persons.adults ?? 0) * (pkg.adult_price ?? 0) +
        (persons.children ?? 0) * (pkg.child_price ?? 0) +
        (persons.infants ?? 0) * (pkg.infant_price ?? 0)
      : pkg.package_price ?? 0;
    return { basePackageTotal: t, extraTotal: 0, inDateRange: true, total: t };
  }

  const leadDate = new Date(checkInDate);
  const matchingRange = dateRanges.find((dr) => {
    const from = new Date(dr.from_date);
    const to = new Date(dr.to_date);
    return leadDate >= from && leadDate <= to;
  });

  let pkgAdult = 0;
  let pkgChild = 0;
  let pkgInfant = 0;
  let extraAdult = 0;
  let extraChild = 0;
  let extraInfant = 0;

  if (matchingRange) {
    pkgAdult = matchingRange.adult_price ?? 0;
    pkgChild = matchingRange.child_price ?? 0;
    pkgInfant = matchingRange.infant_price ?? 0;
  } else {
    pkgAdult = baseAdult;
    pkgChild = baseChild;
    pkgInfant = baseInfant;
    extraAdult = crmData?.nonDateAdultPrice ?? 0;
    extraChild = crmData?.nonDateChildPrice ?? 0;
    extraInfant = crmData?.nonDateInfantPrice ?? 0;
  }

  const basePackageTotal =
    (persons.adults ?? 0) * pkgAdult +
    (persons.children ?? 0) * pkgChild +
    (persons.infants ?? 0) * pkgInfant;
  const extraTotal =
    (persons.adults ?? 0) * extraAdult +
    (persons.children ?? 0) * extraChild +
    (persons.infants ?? 0) * extraInfant;
  return {
    basePackageTotal,
    extraTotal,
    inDateRange: !!matchingRange,
    total: basePackageTotal + extraTotal,
  };
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

export default function CustomizeYourPackagePage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(null);
  const [persons, setPersons] = useState<PersonCounts>({ adults: 2, children: 0, infants: 0 });
  const [isSoloTraveller, setIsSoloTraveller] = useState(false);
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedHotelService[]>([]);
  const [selectedTransferIds, setSelectedTransferIds] = useState<string[]>([]);
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [hotelOverrides, setHotelOverrides] = useState<
    Record<string, { rooms: number; extraBedCount: number; childNoBedCount: number }>
  >({});

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showMobileDetailsPanel, setShowMobileDetailsPanel] = useState(false);
  const isMobile = useIsMobile();

  const baseNights = selectedPackage?.package_nights ?? 0;
  const hotelServiceExtension = selectedServices.reduce((s, x) => s + x.quantity, 0);
  const effectiveNights = baseNights + hotelServiceExtension;
  const effectiveDays = effectiveNights + 1;

  const { data: crmPackageData } = useCRMPackage(selectedPackage?.crm_package_id ?? null, !!selectedPackage?.crm_package_id);
  const hotelSurchargeTotal = useHotelSurchargeTotal(
    crmPackageData,
    checkInDate,
    selectedPackage?.crm_package_id ? effectiveNights : 0,
    selectedPackage?.crm_package_id ? hotelOverrides : undefined
  );
  const { data: dealsRaw = [], isLoading: dealsLoading } = useAddonDeals(effectiveNights);
  const { data: servicesRaw = [], isLoading: servicesLoading } = useAddonHotelServices();
  const { data: transfersRaw = [], isLoading: transfersLoading } = useAddonPrivateTransfers();

  const dealsForNights = useMemo(
    () =>
      (Array.isArray(dealsRaw)
        ? (dealsRaw as any[]).map((d: any) => ({
            id: String(d.id ?? ''),
            name: d.name ?? '',
            adult_price: d.adult_price ?? 0,
            child_price: d.child_price ?? 0,
            infant_price: d.infant_price ?? 0,
            category_name: d.category_name ?? d.addon_category?.name ?? null,
            image_url: d.image_url ?? null,
            items: d.items ?? [],
          }))
        : []) as AddonDeal[],
    [dealsRaw]
  );
  const addonServices = useMemo(
    () =>
      (Array.isArray(servicesRaw)
        ? (servicesRaw as any[]).map((s: any) => ({
            id: String(s.id ?? ''),
            name: s.name ?? '',
            adult_price: s.adult_price ?? 0,
            child_price: s.child_price ?? 0,
            infant_price: s.infant_price ?? 0,
          }))
        : []) as AddonHotelService[],
    [servicesRaw]
  );
  const addonTransfers = useMemo(
    () =>
      (Array.isArray(transfersRaw)
        ? (transfersRaw as any[]).map((t: any) => ({
            id: String(t.id ?? ''),
            name: t.name ?? '',
            pax_type: t.pax_type ?? '',
            fixed_pax: t.fixed_pax ?? null,
            min_pax: t.min_pax ?? null,
            max_pax: t.max_pax ?? null,
            adult_price: t.adult_price ?? 0,
            child_price: t.child_price ?? 0,
            infant_price: t.infant_price ?? 0,
          }))
        : []) as AddonPrivateTransfer[],
    [transfersRaw]
  );

  useEffect(() => {
    if (!selectedPackage) return;
    if (isSoloTraveller) {
      setPersons({ adults: 1, children: 0, infants: 0 });
    } else {
      const minAdults = selectedPackage.min_adults ?? 1;
      setPersons((prev) => ({
        ...prev,
        adults: Math.max(prev.adults, minAdults),
      }));
    }
  }, [selectedPackage, isSoloTraveller]);

  useEffect(() => {
    if (!selectedPackage?.solo_traveller_enabled) setIsSoloTraveller(false);
  }, [selectedPackage]);

  useEffect(() => {
    if (!selectedPackage?.crm_package_id) {
      setCheckInDate('');
      setHotelOverrides({});
      return;
    }
    if (!checkInDate) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setCheckInDate(d.toISOString().split('T')[0]);
    }
  }, [selectedPackage?.crm_package_id]);

  const handleAddToCart = () => {
    if (!selectedPackage) return;
    const categorySlug = selectedPackage.category_slug ?? 'offer-packages';
    const serviceIds = selectedServices.length > 0
      ? selectedServices.map((s) => s.serviceId)
      : undefined;
    addToCart({
      packageId: selectedPackage.package_id,
      packageSlug: selectedPackage.package_id,
      categorySlug,
      adults: persons.adults,
      children: persons.children,
      infants: persons.infants,
      selectedDate: checkInDate || null,
      isSoloTraveller: isSoloTraveller && !!selectedPackage.solo_traveller_enabled,
      addonDeals: selectedDealIds.length > 0 ? selectedDealIds : undefined,
      addonHotelServices: serviceIds,
      addonPrivateTransfers: selectedTransferIds.length > 0 ? selectedTransferIds : undefined,
    });
    router.push('/cart');
  };

  const canAddToCart =
    !!selectedPackage &&
    (isSoloTraveller && selectedPackage.solo_traveller_enabled
      ? persons.adults === 1
      : persons.adults >= (selectedPackage.min_adults ?? 1));

  const selectedDeals = dealsForNights.filter((d) => selectedDealIds.includes(d.id));
  const selectedServicesWithQty = selectedServices.map((sel) => {
    const svc = addonServices.find((s) => s.id === sel.serviceId);
    return svc ? { ...svc, quantity: sel.quantity } : null;
  }).filter(Boolean) as (AddonHotelService & { quantity: number })[];
  const selectedTransfers = addonTransfers.filter((t) => selectedTransferIds.includes(t.id));

  const extraBedChildNoBedTotal = useMemo(() => {
    if (!crmPackageData || !selectedPackage?.crm_package_id) return 0;
    const addDays = (dateStr: string, days: number) => {
      const d = new Date(dateStr + 'T12:00:00');
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };
    const pkg = crmPackageData as { package_options?: Array<{ package_items?: any[] }> };
    const items = pkg?.package_options?.[0]?.package_items ?? [];
    const hotels = items.filter((i: any) => i.item_type === 'hotel' || i.hotel_id);
    let sum = 0;
    let runningCheckIn = checkInDate;
    const baseNightsFromHotels = hotels.slice(0, -1).reduce((s: number, x: any) => s + (x.nights ?? 1), 0);
    for (let i = 0; i < hotels.length; i++) {
      const h = hotels[i];
      const override = hotelOverrides[h.id] ?? {};
      const extraBedCount = override.extraBedCount ?? h.hotel_data?.extraBedCount ?? 0;
      const childNoBedCount = override.childNoBedCount ?? h.hotel_data?.childNoBedCount ?? 0;
      if (extraBedCount === 0 && childNoBedCount === 0) {
        runningCheckIn = addDays(runningCheckIn, h.nights ?? 1);
        continue;
      }
      const isLast = i === hotels.length - 1;
      const nights = isLast
        ? Math.max(1, effectiveNights - baseNightsFromHotels)
        : (h.nights ?? 1);
      const extraBedPrice = h.hotel_data?.extraBedPrice ?? 0;
      const childNoBedPrice = h.hotel_data?.childNoBedPrice ?? 0;
      sum += extraBedPrice * nights * extraBedCount + childNoBedPrice * nights * childNoBedCount;
      runningCheckIn = addDays(runningCheckIn, nights);
    }
    return sum;
  }, [crmPackageData, selectedPackage?.crm_package_id, checkInDate, hotelOverrides, effectiveNights]);

  const groupDatesBreakdown =
    selectedPackage?.crm_package_id && checkInDate && crmPackageData
      ? calcPackageBaseWithGroupDates(
          selectedPackage,
          persons,
          isSoloTraveller,
          crmPackageData as any,
          checkInDate
        )
      : null;

  const packageBasePrice = selectedPackage
    ? (groupDatesBreakdown
        ? groupDatesBreakdown.total
        : calcPackageBase(selectedPackage, persons, isSoloTraveller))
    : 0;

  return (
    <div className={`customize-page ${isMobile ? 'customize-page-mobile' : ''}`}>
      <div className="customize-page-container">
        <header className="customize-page-header">
          <div className="customize-page-badge">CUSTOMIZE</div>
          <h1 className="customize-page-title">Customize Your Package</h1>
          <p className="customize-page-subtitle">
            Select a package, choose travellers, and add deals, hotel services &amp;
            transfers. Your subtotal updates in real time.
          </p>
        </header>

        <div className="customize-page-layout">
          <div className="customize-page-main">
            <section className="customize-page-section">
              <PackageSelector value={selectedPackage} onChange={setSelectedPackage} />
            </section>

            {selectedPackage && (
              <>
                <section className="customize-page-section">
                  <PersonSelector
                    value={persons}
                    onChange={setPersons}
                    isSoloTraveller={isSoloTraveller}
                    onSoloTravellerChange={setIsSoloTraveller}
                    package={selectedPackage}
                  />
                </section>

                {selectedPackage.crm_package_id && (
                  <section className="customize-page-section">
                    <CheckInDateSelector
                      value={checkInDate}
                      onChange={setCheckInDate}
                      effectiveNights={effectiveNights}
                    />
                  </section>
                )}

                <section className="customize-page-section customize-addons-section">
                  <h3 className="customize-addons-header">Add-ons</h3>
                  <AddonDealsSection
                    selectedIds={selectedDealIds}
                    onChange={setSelectedDealIds}
                    deals={dealsForNights}
                    loading={dealsLoading}
                    nights={effectiveNights}
                    onFetch={() => {}}
                  />
                  <AddonHotelServicesSection
                    selectedServices={selectedServices}
                    onChange={setSelectedServices}
                    services={addonServices}
                    loading={servicesLoading}
                    onFetch={() => {}}
                    baseNights={baseNights}
                  />
                  <AddonPrivateTransfersSection
                    selectedIds={selectedTransferIds}
                    onChange={setSelectedTransferIds}
                    transfers={addonTransfers}
                    loading={transfersLoading}
                    onFetch={() => {}}
                  />
                </section>
              </>
            )}
          </div>

          <aside className={`customize-page-sidebar ${isMobile ? 'customize-page-sidebar-mobile-hidden' : ''}`}>
            {selectedPackage?.crm_package_id ? (
              <>
                <CRMPackageItinerarySidebar
                  packageName={selectedPackage.package_name}
                  packageNights={effectiveNights}
                  packageDays={effectiveDays}
                  packageBasePrice={packageBasePrice}
                  persons={persons}
                  selectedDealIds={selectedDealIds}
                  selectedServices={selectedServices}
                  selectedTransferIds={selectedTransferIds}
                  addonDeals={dealsForNights}
                  addonServices={addonServices}
                  addonTransfers={addonTransfers}
                  checkInDate={checkInDate}
                  crmPackageId={selectedPackage.crm_package_id ?? undefined}
                  hotelSurchargeTotal={hotelSurchargeTotal}
                  groupDatesBreakdown={groupDatesBreakdown}
                  crmPackageData={crmPackageData}
                  hotelOverrides={hotelOverrides}
                  onHotelOverrideChange={setHotelOverrides}
                  effectiveNights={effectiveNights}
                  extraBedChildNoBedTotal={extraBedChildNoBedTotal}
                />
                <button
                  type="button"
                  className="customize-page-download-pdf"
                  onClick={() => setShowPdfModal(true)}
                  title="PDF Preview"
                >
                  <FileDown size={18} />
                  PDF Preview
                </button>
              </>
            ) : (
              <PriceSummary
                package={selectedPackage}
                persons={persons}
                isSoloTraveller={isSoloTraveller}
                addonDeals={dealsForNights}
                addonHotelServices={addonServices}
                addonPrivateTransfers={addonTransfers}
                selectedDealIds={selectedDealIds}
                selectedServices={selectedServices}
                selectedTransferIds={selectedTransferIds}
              />
            )}
            {canAddToCart && (
              <button
                type="button"
                className="customize-page-add-to-cart"
                onClick={handleAddToCart}
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
            )}
            {selectedPackage && !selectedPackage.crm_package_id && (
              <button
                type="button"
                className="customize-page-download-pdf"
                onClick={() => setShowPdfModal(true)}
                title="PDF Preview"
              >
                <FileDown size={18} />
                PDF Preview
              </button>
            )}
          </aside>
        </div>
      </div>

      {isMobile && selectedPackage && (
        <>
          <div className="customize-page-mobile-bottom-bar">
            <button
              type="button"
              className="customize-page-mobile-btn customize-page-mobile-btn-pdf"
              onClick={() => setShowPdfModal(true)}
              title="PDF Preview"
            >
              <FileDown size={18} />
              Preview
            </button>
            {canAddToCart && (
              <button
                type="button"
                className="customize-page-mobile-btn customize-page-mobile-btn-cart"
                onClick={handleAddToCart}
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
            )}
            {selectedPackage && (
              <button
                type="button"
                className="customize-page-mobile-btn customize-page-mobile-btn-details"
                onClick={() => setShowMobileDetailsPanel(true)}
                title="Show Details"
              >
                <FileText size={18} />
                 Details
              </button>
            )}
          </div>

          {showMobileDetailsPanel && (
            <div className="customize-page-mobile-details-overlay" onClick={() => setShowMobileDetailsPanel(false)}>
              <div className="customize-page-mobile-details-panel" onClick={(e) => e.stopPropagation()}>
                <div className="customize-page-mobile-details-header">
                  <h3>Package Details</h3>
                  <button
                    type="button"
                    className="customize-page-mobile-details-close"
                    onClick={() => setShowMobileDetailsPanel(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="customize-page-mobile-details-content">
                  {selectedPackage?.crm_package_id ? (
                    <>
                      <CRMPackageItinerarySidebar
                        packageName={selectedPackage.package_name}
                        packageNights={effectiveNights}
                        packageDays={effectiveDays}
                        packageBasePrice={packageBasePrice}
                        persons={persons}
                        selectedDealIds={selectedDealIds}
                        selectedServices={selectedServices}
                        selectedTransferIds={selectedTransferIds}
                        addonDeals={dealsForNights}
                        addonServices={addonServices}
                        addonTransfers={addonTransfers}
                        checkInDate={checkInDate}
                        crmPackageId={selectedPackage.crm_package_id ?? undefined}
                        hotelSurchargeTotal={hotelSurchargeTotal}
                        groupDatesBreakdown={groupDatesBreakdown}
                        crmPackageData={crmPackageData}
                        hotelOverrides={hotelOverrides}
                        onHotelOverrideChange={setHotelOverrides}
                        effectiveNights={effectiveNights}
                        extraBedChildNoBedTotal={extraBedChildNoBedTotal}
                      />
                    </>
                  ) : (
                    <PriceSummary
                      package={selectedPackage}
                      persons={persons}
                      isSoloTraveller={isSoloTraveller}
                      addonDeals={dealsForNights}
                      addonHotelServices={addonServices}
                      addonPrivateTransfers={addonTransfers}
                      selectedDealIds={selectedDealIds}
                      selectedServices={selectedServices}
                      selectedTransferIds={selectedTransferIds}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showPdfModal && selectedPackage && (
        <CustomizePackagePDFModal
          onClose={() => setShowPdfModal(false)}
          package={selectedPackage}
          persons={persons}
          isSoloTraveller={isSoloTraveller}
          selectedDeals={selectedDeals}
          selectedServices={selectedServicesWithQty}
          selectedTransfers={selectedTransfers}
          packageBasePriceOverride={selectedPackage.crm_package_id ? packageBasePrice : undefined}
          hotelSurchargeTotal={selectedPackage.crm_package_id ? hotelSurchargeTotal : undefined}
          extraBedChildNoBedTotal={selectedPackage.crm_package_id ? extraBedChildNoBedTotal : undefined}
          effectiveNights={effectiveNights}
          effectiveDays={effectiveDays}
        />
      )}
    </div>
  );
}
