'use client';

import type {
  PackageOption,
  PersonCounts,
  AddonDeal,
  AddonHotelService,
  AddonPrivateTransfer,
} from '../types';
import './PriceSummary.css';

interface PriceSummaryProps {
  package: PackageOption | null;
  persons: PersonCounts;
  isSoloTraveller: boolean;
  addonDeals: AddonDeal[];
  addonHotelServices: AddonHotelService[];
  addonPrivateTransfers: AddonPrivateTransfer[];
  selectedDealIds: string[];
  selectedServiceIds: string[];
  selectedTransferIds: string[];
}

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

export function PriceSummary({
  package: pkg,
  persons,
  isSoloTraveller,
  addonDeals,
  addonHotelServices,
  addonPrivateTransfers,
  selectedDealIds,
  selectedServiceIds,
  selectedTransferIds,
}: PriceSummaryProps) {
  if (!pkg) {
    return (
      <div className="customize-price-summary">
        <h3 className="customize-price-title">Price Summary</h3>
        <p className="customize-price-empty">Select a package to see pricing</p>
      </div>
    );
  }

  const packageBase = calcPackageBase(pkg, persons, isSoloTraveller);

  const selectedDeals = addonDeals.filter((d) => selectedDealIds.includes(d.id));
  const selectedServices = addonHotelServices.filter((s) =>
    selectedServiceIds.includes(s.id)
  );
  const selectedTransfers = addonPrivateTransfers.filter((t) =>
    selectedTransferIds.includes(t.id)
  );

  const addonPersons: PersonCounts = isSoloTraveller
    ? { adults: 1, children: 0, infants: 0 }
    : persons;
  const addonDealsPrice = calcAddonPrice(selectedDeals, addonPersons);
  const addonServicesPrice = calcAddonPrice(selectedServices, addonPersons);
  const addonTransfersPrice = calcAddonPrice(selectedTransfers, addonPersons);
  const addonsTotal = addonDealsPrice + addonServicesPrice + addonTransfersPrice;

  const subtotal = packageBase + addonsTotal;

  const hasAddons =
    selectedDeals.length > 0 ||
    selectedServices.length > 0 ||
    selectedTransfers.length > 0;

  return (
    <div className="customize-price-summary">
      <h3 className="customize-price-title">Price Summary</h3>
      <div className="customize-price-rows">
        <div className="customize-price-row">
          <span className="customize-price-label">Package</span>
          <span className="customize-price-value">AED {packageBase.toLocaleString()}</span>
        </div>
        {hasAddons && (
          <>
            {selectedDeals.length > 0 && (
              <div className="customize-price-row">
                <span className="customize-price-label">Addon Deals</span>
                <span className="customize-price-value">
                  AED {addonDealsPrice.toLocaleString()}
                </span>
              </div>
            )}
            {selectedServices.length > 0 && (
              <div className="customize-price-row">
                <span className="customize-price-label">Hotel Services</span>
                <span className="customize-price-value">
                  AED {addonServicesPrice.toLocaleString()}
                </span>
              </div>
            )}
            {selectedTransfers.length > 0 && (
              <div className="customize-price-row">
                <span className="customize-price-label">Private Transfers</span>
                <span className="customize-price-value">
                  AED {addonTransfersPrice.toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}
        <div className="customize-price-row customize-price-subtotal">
          <span className="customize-price-label">Subtotal</span>
          <span className="customize-price-value">AED {subtotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
