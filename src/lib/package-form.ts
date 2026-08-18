import { normalizeTourBookingDays } from '@/lib/tour-booking-days';
import { normalizePackageGallery, normalizePdfUrl } from '@/lib/package-gallery';

type PackageFormSource = {
  package_name?: string | null;
  package_description?: string | null;
  package_price?: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  end_date?: string | null;
  adult_price?: number | null;
  child_price?: number | null;
  infant_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  solo_traveller_price?: number | null;
  solo_traveller_only?: boolean | null;
  with_visa?: boolean | null;
  show_listing_page?: boolean | null;
  adult_visa_price?: number | null;
  child_visa_price?: number | null;
  infant_visa_price?: number | null;
  adult_discount_amount?: number | null;
  child_discount_amount?: number | null;
  infant_discount_amount?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  agent_discount?: number | null;
  min_adults?: number | null;
  terms_html?: string | null;
  inclusion_html?: string | null;
  exclusion_html?: string | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  itinerary?: Array<{ id?: string; heading: string; desc: string }> | null;
  booking_slots?: Array<{ id: string; fromDate: string; toDate: string }> | null;
  booking_days?: number[] | null;
  date_ranges?: Array<{
    id?: string;
    fromDate: string;
    toDate: string;
    adultPrice?: number;
    childPrice?: number;
    infantPrice?: number;
    soloTravellerPrice?: number | null;
    isSoldOut?: boolean;
  }> | null;
  travel_dates?: Array<{ id: string; value: string } | string> | null;
  thumbnail_image?: string | null;
  gallery?: unknown;
  pdf_url?: string | null;
  pickup_location?: string | null;
};

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeDateRanges(
  dateRanges: PackageFormSource['date_ranges']
) {
  if (!Array.isArray(dateRanges)) return [];
  return dateRanges.map(d => ({
    id: d.id || crypto.randomUUID?.() || String(Date.now()),
    fromDate: d.fromDate,
    toDate: d.toDate,
    adultPrice: d.adultPrice || 0,
    childPrice: d.childPrice || 0,
    infantPrice: d.infantPrice || 0,
    soloTravellerPrice: d.soloTravellerPrice ?? null,
    isSoldOut: d.isSoldOut || false,
  }));
}

function normalizeTravelDates(
  travelDates: PackageFormSource['travel_dates']
) {
  if (!Array.isArray(travelDates)) return [];
  return travelDates.map(d =>
    typeof d === 'string'
      ? { id: crypto.randomUUID?.() || String(Date.now()) + d, value: d }
      : d
  );
}

function normalizeItinerary(
  itinerary: PackageFormSource['itinerary']
) {
  if (!Array.isArray(itinerary)) {
    return [
      {
        id: (crypto.randomUUID?.() || String(Date.now())) + '-0',
        heading: '',
        desc: '',
      },
    ];
  }

  return itinerary.map((it, idx) => ({
    id: it.id || crypto.randomUUID?.() || String(Date.now() + idx),
    heading: it.heading,
    desc: it.desc,
  }));
}

export function mapPackageToEditForm(
  pkg: PackageFormSource,
  options: {
    usesSlots: boolean;
    usesFlexibleDate: boolean;
  }
) {
  const galleryUrls = normalizePackageGallery(pkg.gallery);
  const pdf = normalizePdfUrl(pkg.pdf_url);

  return {
    name: pkg.package_name || '',
    description: pkg.package_description || '',
    price: pkg.package_price != null ? String(pkg.package_price) : '',
    days: pkg.package_days != null ? String(pkg.package_days) : '',
    nights: pkg.package_nights != null ? String(pkg.package_nights) : '',
    endDate: pkg.end_date || '',
    adultPrice: pkg.adult_price != null ? String(pkg.adult_price) : '',
    childPrice: pkg.child_price != null ? String(pkg.child_price) : '',
    infantPrice: pkg.infant_price != null ? String(pkg.infant_price) : '',
    soloTravellerEnabled: Boolean(pkg.solo_traveller_enabled),
    soloTravellerPrice:
      pkg.solo_traveller_price != null ? String(pkg.solo_traveller_price) : '',
    soloTravellerOnly: Boolean(pkg.solo_traveller_only),
    withVisa: Boolean(pkg.with_visa),
    showListingPage:
      pkg.show_listing_page != null ? Boolean(pkg.show_listing_page) : true,
    adultVisaPrice:
      pkg.adult_visa_price != null ? String(pkg.adult_visa_price) : '',
    childVisaPrice:
      pkg.child_visa_price != null ? String(pkg.child_visa_price) : '',
    infantVisaPrice:
      pkg.infant_visa_price != null ? String(pkg.infant_visa_price) : '',
    adultDiscountAmount:
      pkg.adult_discount_amount != null
        ? String(pkg.adult_discount_amount)
        : '',
    childDiscountAmount:
      pkg.child_discount_amount != null
        ? String(pkg.child_discount_amount)
        : '',
    infantDiscountAmount:
      pkg.infant_discount_amount != null
        ? String(pkg.infant_discount_amount)
        : '',
    discountStartDate: toDateTimeLocal(pkg.discount_start_date),
    discountEndDate: toDateTimeLocal(pkg.discount_end_date),
    agentDiscount: pkg.agent_discount != null ? String(pkg.agent_discount) : '',
    minAdults: pkg.min_adults != null ? String(pkg.min_adults) : '1',
    termsHtml: pkg.terms_html || '',
    inclusionHtml: pkg.inclusion_html || '',
    exclusionHtml: pkg.exclusion_html || '',
    overview: pkg.overview || '',
    holidayDescHtml: pkg.holiday_description_html || '',
    itinerary: normalizeItinerary(pkg.itinerary),
    bookingSlots: Array.isArray(pkg.booking_slots) ? pkg.booking_slots : [],
    bookingDays: normalizeTourBookingDays(pkg.booking_days),
    dateRanges: normalizeDateRanges(pkg.date_ranges),
    travelDates: normalizeTravelDates(pkg.travel_dates),
    pickupLocation: pkg.pickup_location || '',
    thumbnailImageUrl: pkg.thumbnail_image || '',
    galleryImages: galleryUrls,
    pdfUrl: pdf,
    pdfFileName: pdf ? pdf.split('/').pop() || '' : '',
  };
}
