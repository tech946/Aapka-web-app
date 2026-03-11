'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAddonDeals, useAddonHotelServices, useAddonPrivateTransfers } from '@/hooks/use-marketing-queries';
import { ShoppingCart, ArrowLeft, FileDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { PackageSelector } from './components/PackageSelector';
import { PersonSelector } from './components/PersonSelector';
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
} from './types';
import './page.css';

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
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedTransferIds, setSelectedTransferIds] = useState<string[]>([]);

  const [showPdfModal, setShowPdfModal] = useState(false);

  const nights = selectedPackage?.package_nights ?? 0;

  const { data: dealsRaw = [], isLoading: dealsLoading } = useAddonDeals(nights);
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

  const handleAddToCart = () => {
    if (!selectedPackage) return;
    const categorySlug = selectedPackage.category_slug ?? 'offer-packages';
    addToCart({
      packageId: selectedPackage.package_id,
      packageSlug: selectedPackage.package_id,
      categorySlug,
      adults: persons.adults,
      children: persons.children,
      infants: persons.infants,
      selectedDate: null,
      isSoloTraveller: isSoloTraveller && !!selectedPackage.solo_traveller_enabled,
      addonDeals: selectedDealIds.length > 0 ? selectedDealIds : undefined,
      addonHotelServices: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
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
  const selectedServices = addonServices.filter((s) => selectedServiceIds.includes(s.id));
  const selectedTransfers = addonTransfers.filter((t) => selectedTransferIds.includes(t.id));

  return (
    <div className="customize-page">
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

                <section className="customize-page-section customize-addons-section">
                  <h3 className="customize-addons-header">Add-ons</h3>
                  <AddonDealsSection
                    selectedIds={selectedDealIds}
                    onChange={setSelectedDealIds}
                    deals={dealsForNights}
                    loading={dealsLoading}
                    nights={nights}
                    onFetch={() => {}}
                  />
                  <AddonHotelServicesSection
                    selectedIds={selectedServiceIds}
                    onChange={setSelectedServiceIds}
                    services={addonServices}
                    loading={servicesLoading}
                    onFetch={() => {}}
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

          <aside className="customize-page-sidebar">
            {selectedPackage?.crm_package_id ? (
              <>
                <CRMPackageItinerarySidebar
                  packageName={selectedPackage.package_name}
                  packageNights={selectedPackage.package_nights ?? undefined}
                  packageDays={selectedPackage.package_days ?? undefined}
                  packageBasePrice={calcPackageBase(selectedPackage, persons, isSoloTraveller)}
                  persons={persons}
                  selectedDealIds={selectedDealIds}
                  selectedServiceIds={selectedServiceIds}
                  selectedTransferIds={selectedTransferIds}
                  addonDeals={dealsForNights}
                  addonServices={addonServices}
                  addonTransfers={addonTransfers}
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
                selectedServiceIds={selectedServiceIds}
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

      {showPdfModal && selectedPackage && (
        <CustomizePackagePDFModal
          onClose={() => setShowPdfModal(false)}
          package={selectedPackage}
          persons={persons}
          isSoloTraveller={isSoloTraveller}
          selectedDeals={selectedDeals}
          selectedServices={selectedServices}
          selectedTransfers={selectedTransfers}
        />
      )}
    </div>
  );
}
