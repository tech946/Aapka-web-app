import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  normalizePackageGallery,
  normalizePdfUrl,
} from '@/lib/package-gallery';
import { normalizeAcceptPayment } from '@/lib/package-payment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const q = (searchParams.get('q') || '').trim();
    const categoryId = (searchParams.get('category_id') || '').trim();
    const categorySlug = (searchParams.get('categorySlug') || '').trim();
    const sortBy = (searchParams.get('sort_by') || '').trim();

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('packages')
      .select(
        'package_id, package_name, package_description, package_price, package_category_id, package_days, package_nights, end_date, travel_dates, booking_slots, booking_days, date_ranges, pickup_location, adult_price, child_price, infant_price, solo_traveller_enabled, solo_traveller_price, solo_traveller_only, with_visa, adult_visa_price, child_visa_price, infant_visa_price, adult_discount_amount, child_discount_amount, infant_discount_amount, discount_start_date, discount_end_date, agent_discount, accept_payment, min_adults, status, show_listing_page, terms_html, inclusion_html, exclusion_html, overview, holiday_description_html, itinerary, thumbnail_image, gallery, pdf_url, crm_package_id, created_at, package_categories!inner(name)',
        { count: 'exact' }
      )
      .range(from, to);

    // Handle sorting
    if (sortBy) {
      if (sortBy === 'created_at_asc') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'created_at_desc') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'title_asc') {
        query = query.order('package_name', { ascending: true });
      } else if (sortBy === 'price_asc') {
        query = query.order('package_price', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('package_price', { ascending: false });
      } else {
        // Default fallback for unknown sort values
        query = query.order('created_at', { ascending: false });
      }
    } else {
      // Default sorting if no sort_by parameter
      query = query.order('created_at', { ascending: false });
    }

    if (q) {
      // Search by name or description
      query = query.or(
        `package_name.ilike.%${q}%,package_description.ilike.%${q}%`
      );
    }

    if (categoryId) {
      query = query.eq('package_category_id', categoryId);
    }

    // Filter by category name (converted from slug for footer links)
    if (categorySlug) {
      // Convert slug back to name for matching (e.g., 'offer-packages' -> 'Offer Packages')
      const categoryName = categorySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      query = query.ilike('package_categories.name', categoryName);
    }

    // Filter by status
    // Dashboard can pass status=all to see all packages, or status=active/inactive for specific status
    // Marketing pages (no status param) will only see active packages
    const statusParam = (searchParams.get('status') || '').trim();
    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    } else if (!statusParam) {
      // Default to active packages for marketing/public pages
      query = query.eq('status', 'active');
    }
    // If statusParam is 'all', don't filter by status (show all packages for dashboard)

    // Category listing pages: only show packages with show_listing_page=true
    const listingPageOnly = searchParams.get('listing_page_only') === 'true';
    if (listingPageOnly) {
      query = query.eq('show_listing_page', true);
    }

    // Filter by hasAgentDiscount - only return packages with agent_discount > 0
    const hasAgentDiscount = searchParams.get('hasAgentDiscount');
    if (hasAgentDiscount === 'true') {
      query = query.gt('agent_discount', 0);
    }

    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch active deals for all packages
    const packageIds = data?.map((pkg: any) => pkg.package_id) || [];
    let activeDealsMap = new Map();
    
    if (packageIds.length > 0) {
      const now = new Date().toISOString();
      const { data: dealsData } = await supabaseAdmin
        .from('package_deals')
        .select('*')
        .in('package_id', packageIds)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      if (dealsData) {
        dealsData.forEach((deal: any) => {
          activeDealsMap.set(deal.package_id, deal);
        });
      }
    }

    // Map the data to flatten category information and include active deals
    const mappedData = data?.map((pkg: any) => {
      const activeDeal = activeDealsMap.get(pkg.package_id);
      const categoryName = pkg.package_categories?.name || null;
      // Generate category slug from name (e.g., "Offer Packages" -> "offer-packages")
      const categorySlugGenerated = categoryName 
        ? categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : null;
      return {
        ...pkg,
        category_name: categoryName,
        category_slug: categorySlugGenerated,
        package_categories: undefined, // Remove the nested object
        active_deal: activeDeal || null, // Include active deal if exists
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedData ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name: string = (body?.name || '').trim();
    const description: string | null = (body?.description || '').trim() || null;
    const price: number | null =
      typeof body?.price === 'number'
        ? body.price
        : body?.price
          ? Number(body.price)
          : null;
    const status: string | null = (body?.status || '').trim() || 'active';
    const categoryId: string = (body?.category_id || '').trim();

    // optional new fields
    const days =
      body?.days !== undefined
        ? Number.isNaN(Number(body.days))
          ? null
          : Number(body.days)
        : null;
    const nights =
      body?.nights !== undefined
        ? Number.isNaN(Number(body.nights))
          ? null
          : Number(body.nights)
        : null;
    // travel dates array support (expects array of objects { id, value })
    let travelDates: any[] | null = null;
    if (Array.isArray(body?.travel_dates)) {
      travelDates = body.travel_dates;
    } else if (body?.travel_date) {
      // legacy single date -> wrap in object
      travelDates = [
        { id: String(Date.now()), value: String(body.travel_date) },
      ];
    }
    // booking slots array support (expects array of objects { id, fromDate, toDate })
    let bookingSlots: any[] | null = null;
    if (Array.isArray(body?.booking_slots)) {
      bookingSlots = body.booking_slots;
    }
    let bookingDays: number[] | null = null;
    if (Array.isArray(body?.booking_days)) {
      bookingDays = body.booking_days.filter(
        (d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6
      );
    }
    // date_ranges array support (expects array of objects { id, fromDate, toDate, adultPrice, childPrice, infantPrice, soloTravellerPrice, isSoldOut })
    let dateRanges: any[] | null = null;
    if (Array.isArray(body?.date_ranges)) {
      dateRanges = body.date_ranges;
      console.log('POST: Received date_ranges:', JSON.stringify(dateRanges, null, 2));
    }
    const endDate = body?.end_date !== undefined ? String(body.end_date).trim() || null : null;
    const adultPrice =
      body?.adult_price !== undefined
        ? Number.isNaN(Number(body.adult_price))
          ? null
          : Number(body.adult_price)
        : null;
    const childPrice =
      body?.child_price !== undefined
        ? Number.isNaN(Number(body.child_price))
          ? null
          : Number(body.child_price)
        : null;
    const infantPrice =
      body?.infant_price !== undefined
        ? Number.isNaN(Number(body.infant_price))
          ? null
          : Number(body.infant_price)
        : null;
    const soloTravellerEnabled =
      body?.solo_traveller_enabled !== undefined
        ? Boolean(body.solo_traveller_enabled)
        : false;
    const soloTravellerPrice =
      body?.solo_traveller_price !== undefined
        ? Number.isNaN(Number(body.solo_traveller_price))
          ? null
          : Number(body.solo_traveller_price)
        : null;
    /* Solo-only packages are sold to a single traveller. The flag only makes
       sense alongside the solo traveller option, so the two are kept consistent. */
    const soloTravellerOnly =
      body?.solo_traveller_only !== undefined
        ? Boolean(body.solo_traveller_only) && soloTravellerEnabled
        : false;
    const withVisa =
      body?.with_visa !== undefined
        ? Boolean(body.with_visa)
        : false;
    const adultVisaPrice =
      body?.adult_visa_price !== undefined
        ? Number.isNaN(Number(body.adult_visa_price))
          ? null
          : Number(body.adult_visa_price)
        : null;
    const childVisaPrice =
      body?.child_visa_price !== undefined
        ? Number.isNaN(Number(body.child_visa_price))
          ? null
          : Number(body.child_visa_price)
        : null;
    const infantVisaPrice =
      body?.infant_visa_price !== undefined
        ? Number.isNaN(Number(body.infant_visa_price))
          ? null
          : Number(body.infant_visa_price)
        : null;
    // rich content
    const termsHtml: string | null =
      body?.terms_html !== undefined ? String(body.terms_html) : null;
    const inclusionHtml: string | null =
      body?.inclusion_html !== undefined ? String(body.inclusion_html) : null;
    const exclusionHtml: string | null =
      body?.exclusion_html !== undefined ? String(body.exclusion_html) : null;
    const overviewText: string | null =
      body?.overview !== undefined ? String(body.overview) : null;
    const holidayDescriptionHtml: string | null =
      body?.holiday_description_html !== undefined
        ? String(body.holiday_description_html)
        : null;
    const itineraryJson: any =
      body?.itinerary !== undefined ? body.itinerary : null;
    const thumbnailImage: string | null =
      body?.thumbnail_image !== undefined
        ? String(body.thumbnail_image).trim() || null
        : null;
    const pdfUrl: string | null =
      body?.pdf_url !== undefined
        ? normalizePdfUrl(body.pdf_url) || null
        : null;
    const galleryImages: string[] | null =
      body?.gallery !== undefined
        ? (() => {
            const normalized = normalizePackageGallery(body.gallery);
            return normalized.length > 0 ? normalized : null;
          })()
        : null;
    const pickupLocation =
      body?.pickup_location !== undefined
        ? String(body.pickup_location).trim() || null
        : undefined;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // For flexible date packages, validate that date_ranges is provided and not empty
    const isFlexibleDatePackage = dateRanges !== null && Array.isArray(dateRanges) && dateRanges.length > 0;
    if (isFlexibleDatePackage && (!dateRanges || dateRanges.length === 0)) {
      return NextResponse.json(
        { error: 'At least one date range is required for flexible date packages' },
        { status: 400 }
      );
    }
    
    // For non-flexible date packages, price is required
    if (!isFlexibleDatePackage && (price === null || Number.isNaN(price))) {
      return NextResponse.json({ error: 'price is required' }, { status: 400 });
    }
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'category_id is required' },
        { status: 400 }
      );
    }

    // Extract discount fields from body
    const adultDiscountAmount = body?.adult_discount_amount !== undefined && body?.adult_discount_amount !== null && body?.adult_discount_amount !== '' && !Number.isNaN(Number(body.adult_discount_amount)) ? Number(body.adult_discount_amount) : null;
    const childDiscountAmount = body?.child_discount_amount !== undefined && body?.child_discount_amount !== null && body?.child_discount_amount !== '' && !Number.isNaN(Number(body.child_discount_amount)) ? Number(body.child_discount_amount) : null;
    const infantDiscountAmount = body?.infant_discount_amount !== undefined && body?.infant_discount_amount !== null && body?.infant_discount_amount !== '' && !Number.isNaN(Number(body.infant_discount_amount)) ? Number(body.infant_discount_amount) : null;
    const discountStartDate = body?.discount_start_date && String(body.discount_start_date).trim() !== '' ? String(body.discount_start_date).trim() : null;
    const discountEndDate = body?.discount_end_date && String(body.discount_end_date).trim() !== '' ? String(body.discount_end_date).trim() : null;
    const agentDiscount = body?.agent_discount !== undefined && body?.agent_discount !== null && body?.agent_discount !== '' && !Number.isNaN(Number(body.agent_discount)) ? Number(body.agent_discount) : null;
    const minAdults = body?.min_adults !== undefined && body?.min_adults !== null && body?.min_adults !== '' && !Number.isNaN(Number(body.min_adults)) ? Math.max(1, Number(body.min_adults)) : 1;
    // Defaults to 'half' when the client omits it
    const acceptPayment = normalizeAcceptPayment(body?.accept_payment);
    const showListingPage =
      body?.show_listing_page !== undefined
        ? Boolean(body.show_listing_page)
        : true;

    console.log('POST - Discount fields received:', {
      adult_discount_amount: adultDiscountAmount,
      child_discount_amount: childDiscountAmount,
      infant_discount_amount: infantDiscountAmount,
      discount_start_date: discountStartDate,
      discount_end_date: discountEndDate,
      raw_body: {
        adult_discount_amount: body?.adult_discount_amount,
        child_discount_amount: body?.child_discount_amount,
        infant_discount_amount: body?.infant_discount_amount,
        discount_start_date: body?.discount_start_date,
        discount_end_date: body?.discount_end_date,
      }
    });

    const insertData: Record<string, any> = {
      package_name: name,
      package_description: description,
      // For flexible date packages, use 0 as default price (prices come from date_ranges)
      // Database requires NOT NULL, so we use 0 instead of null
      package_price: isFlexibleDatePackage && (price === null || Number.isNaN(price)) ? 0 : price,
      package_category_id: categoryId,
      package_days: days,
      package_nights: nights,
      end_date: endDate,
      adult_price: adultPrice,
      child_price: childPrice,
      infant_price: infantPrice,
      solo_traveller_enabled: soloTravellerEnabled,
      solo_traveller_price: soloTravellerPrice,
      solo_traveller_only: soloTravellerOnly,
      with_visa: withVisa,
      adult_visa_price: adultVisaPrice,
      child_visa_price: childVisaPrice,
      infant_visa_price: infantVisaPrice,
      adult_discount_amount: adultDiscountAmount,
      child_discount_amount: childDiscountAmount,
      infant_discount_amount: infantDiscountAmount,
      discount_start_date: discountStartDate,
      discount_end_date: discountEndDate,
      agent_discount: agentDiscount,
      accept_payment: acceptPayment,
      min_adults: minAdults,
      show_listing_page: showListingPage,
      terms_html: termsHtml,
      inclusion_html: inclusionHtml,
      exclusion_html: exclusionHtml,
      overview: overviewText,
      holiday_description_html: holidayDescriptionHtml,
      itinerary: itineraryJson,
      thumbnail_image: thumbnailImage,
      gallery: galleryImages,
      pdf_url: pdfUrl,
    };

    // Add travel_dates, booking_slots, or date_ranges based on what's provided
    // Include arrays even if empty (database JSONB columns can handle empty arrays)
    if (bookingSlots !== null) {
      insertData.booking_slots = bookingSlots;
    }
    if (bookingDays !== null) {
      insertData.booking_days = bookingDays.length > 0 ? bookingDays : null;
    }
    if (dateRanges !== null) {
      // Store date ranges directly in packages table as JSONB
      insertData.date_ranges = dateRanges;
    }
    if (travelDates !== null) {
      insertData.travel_dates = travelDates;
    }
    if (pickupLocation !== undefined) {
      insertData.pickup_location = pickupLocation;
    }

    console.log('POST /api/packages: Inserting package with data:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabaseAdmin
      .from('packages')
      .insert([insertData])
      .select('*')
      .single();

    if (error) {
      console.error('POST /api/packages: Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      console.error('POST /api/packages: No data returned from insert');
      return NextResponse.json({ error: 'Package was not created. No data returned.' }, { status: 500 });
    }

    console.log('POST /api/packages: Package created successfully:', data.package_id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/packages: Unexpected error:', e);
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id: string = (body?.id || body?.package_id || '').trim();
    const name =
      body?.name !== undefined ? String(body.name).trim() : undefined;
    const description =
      body?.description !== undefined
        ? String(body.description).trim() || null
        : undefined;
    const price =
      body?.price !== undefined
        ? Number.isNaN(Number(body.price))
          ? null
          : Number(body.price)
        : undefined;
    const categoryId =
      body?.category_id !== undefined
        ? String(body.category_id).trim()
        : undefined;
    const days =
      body?.days !== undefined
        ? Number.isNaN(Number(body.days))
          ? null
          : Number(body.days)
        : undefined;
    const nights =
      body?.nights !== undefined
        ? Number.isNaN(Number(body.nights))
          ? null
          : Number(body.nights)
        : undefined;
    let travelDatesUpdate: any[] | undefined = undefined;
    if (body?.travel_dates !== undefined) {
      travelDatesUpdate = Array.isArray(body.travel_dates)
        ? body.travel_dates
        : undefined;
    } else if (body?.travel_date !== undefined) {
      travelDatesUpdate = [
        { id: String(Date.now()), value: String(body.travel_date) },
      ];
    }
    // booking slots array support (expects array of objects { id, fromDate, toDate })
    let bookingSlotsUpdate: any[] | undefined = undefined;
    if (body?.booking_slots !== undefined) {
      bookingSlotsUpdate = Array.isArray(body.booking_slots)
        ? body.booking_slots
        : undefined;
    }
    let bookingDaysUpdate: number[] | null | undefined = undefined;
    if (body?.booking_days !== undefined) {
      bookingDaysUpdate = Array.isArray(body.booking_days)
        ? body.booking_days.filter(
            (d: unknown) =>
              Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6
          )
        : null;
    }
    // date_ranges array support (expects array of objects { id, fromDate, toDate, adultPrice, childPrice, infantPrice, soloTravellerPrice, isSoldOut })
    let dateRangesUpdate: any[] | undefined = undefined;
    if (body?.date_ranges !== undefined) {
      dateRangesUpdate = Array.isArray(body.date_ranges)
        ? body.date_ranges
        : undefined;
      console.log('PUT: Received date_ranges:', JSON.stringify(dateRangesUpdate, null, 2));
    }
    const endDate =
      body?.end_date !== undefined ? String(body.end_date).trim() || null : undefined;
    const adultPrice =
      body?.adult_price !== undefined
        ? Number.isNaN(Number(body.adult_price))
          ? null
          : Number(body.adult_price)
        : undefined;
    const childPrice =
      body?.child_price !== undefined
        ? Number.isNaN(Number(body.child_price))
          ? null
          : Number(body.child_price)
        : undefined;
    const infantPrice =
      body?.infant_price !== undefined
        ? Number.isNaN(Number(body.infant_price))
          ? null
          : Number(body.infant_price)
        : undefined;
    const soloTravellerEnabled =
      body?.solo_traveller_enabled !== undefined
        ? Boolean(body.solo_traveller_enabled)
        : undefined;
    const soloTravellerPrice =
      body?.solo_traveller_price !== undefined
        ? Number.isNaN(Number(body.solo_traveller_price))
          ? null
          : Number(body.solo_traveller_price)
        : undefined;
    /* solo_traveller_only can never outlive solo_traveller_enabled: if this same
       request is turning the solo option off, force the flag off with it. */
    const soloTravellerOnly =
      body?.solo_traveller_only !== undefined
        ? Boolean(body.solo_traveller_only) && soloTravellerEnabled !== false
        : undefined;
    const withVisa =
      body?.with_visa !== undefined
        ? Boolean(body.with_visa)
        : undefined;
    const adultVisaPrice =
      body?.adult_visa_price !== undefined
        ? Number.isNaN(Number(body.adult_visa_price))
          ? null
          : Number(body.adult_visa_price)
        : undefined;
    const childVisaPrice =
      body?.child_visa_price !== undefined
        ? Number.isNaN(Number(body.child_visa_price))
          ? null
          : Number(body.child_visa_price)
        : undefined;
    const infantVisaPrice =
      body?.infant_visa_price !== undefined
        ? Number.isNaN(Number(body.infant_visa_price))
          ? null
          : Number(body.infant_visa_price)
        : undefined;
    const termsHtml =
      body?.terms_html !== undefined ? String(body.terms_html) : undefined;
    const inclusionHtml =
      body?.inclusion_html !== undefined
        ? String(body.inclusion_html)
        : undefined;
    const exclusionHtml =
      body?.exclusion_html !== undefined
        ? String(body.exclusion_html)
        : undefined;
    const overviewText =
      body?.overview !== undefined ? String(body.overview) : undefined;
    const holidayDescriptionHtml =
      body?.holiday_description_html !== undefined
        ? String(body.holiday_description_html)
        : undefined;
    const itineraryJson =
      body?.itinerary !== undefined ? body.itinerary : undefined;
    const thumbnailImage =
      body?.thumbnail_image !== undefined
        ? String(body.thumbnail_image).trim() || null
        : undefined;
    const pdfUrl =
      body?.pdf_url !== undefined
        ? normalizePdfUrl(body.pdf_url) || null
        : undefined;
    const galleryImages =
      body?.gallery !== undefined
        ? normalizePackageGallery(body.gallery)
        : undefined;
    const status =
      body?.status !== undefined
        ? String(body.status).trim() || null
        : undefined;
    const crmPackageId =
      body?.crm_package_id !== undefined
        ? (body.crm_package_id === null || body.crm_package_id === '' ? null : String(body.crm_package_id).trim())
        : undefined;
    const showListingPage =
      body?.show_listing_page !== undefined
        ? Boolean(body.show_listing_page)
        : undefined;
    const pickupLocationUpdate =
      body?.pickup_location !== undefined
        ? String(body.pickup_location).trim() || null
        : undefined;

    if (!id) {
      return NextResponse.json(
        { error: 'id (package_id) is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.package_name = name;
    if (description !== undefined) updates.package_description = description;
    if (price !== undefined) updates.package_price = price;
    if (categoryId !== undefined) updates.package_category_id = categoryId;
    if (days !== undefined) updates.package_days = days;
    if (nights !== undefined) updates.package_nights = nights;
    if (endDate !== undefined) updates.end_date = endDate;
    if (bookingDaysUpdate !== undefined) {
      updates.booking_days =
        bookingDaysUpdate && bookingDaysUpdate.length > 0
          ? bookingDaysUpdate
          : null;
    }
    if (bookingSlotsUpdate !== undefined) {
      updates.booking_slots = bookingSlotsUpdate;
      // Clear travel_dates and date_ranges if booking_slots is being set
      if (bookingSlotsUpdate.length > 0) {
        updates.travel_dates = null;
        updates.date_ranges = null;
      }
    } else if (dateRangesUpdate !== undefined) {
      // Store date_ranges directly in packages table
      updates.date_ranges = dateRangesUpdate;
      // Clear booking_slots and travel_dates if date_ranges is being set
      updates.travel_dates = null;
      updates.booking_slots = null;
    } else if (travelDatesUpdate !== undefined) {
      updates.travel_dates = travelDatesUpdate;
      // Clear booking_slots and date_ranges if travel_dates is being set
      if (travelDatesUpdate.length > 0) {
        updates.booking_slots = null;
        updates.date_ranges = null;
      }
    }
    if (adultPrice !== undefined) updates.adult_price = adultPrice;
    if (childPrice !== undefined) updates.child_price = childPrice;
    if (infantPrice !== undefined) updates.infant_price = infantPrice;
    if (soloTravellerEnabled !== undefined)
      updates.solo_traveller_enabled = soloTravellerEnabled;
    if (soloTravellerPrice !== undefined)
      updates.solo_traveller_price = soloTravellerPrice;
    if (soloTravellerOnly !== undefined)
      updates.solo_traveller_only = soloTravellerOnly;
    if (withVisa !== undefined) updates.with_visa = withVisa;
    if (adultVisaPrice !== undefined) updates.adult_visa_price = adultVisaPrice;
    if (childVisaPrice !== undefined) updates.child_visa_price = childVisaPrice;
    if (infantVisaPrice !== undefined) updates.infant_visa_price = infantVisaPrice;
    if (body?.adult_discount_amount !== undefined) {
      updates.adult_discount_amount = body.adult_discount_amount !== null && body.adult_discount_amount !== '' ? Number(body.adult_discount_amount) : null;
    }
    if (body?.child_discount_amount !== undefined) {
      updates.child_discount_amount = body.child_discount_amount !== null && body.child_discount_amount !== '' ? Number(body.child_discount_amount) : null;
    }
    if (body?.infant_discount_amount !== undefined) {
      updates.infant_discount_amount = body.infant_discount_amount !== null && body.infant_discount_amount !== '' ? Number(body.infant_discount_amount) : null;
    }
    if (body?.discount_start_date !== undefined) {
      updates.discount_start_date = body.discount_start_date && String(body.discount_start_date).trim() !== '' ? String(body.discount_start_date).trim() : null;
    }
    if (body?.discount_end_date !== undefined) {
      updates.discount_end_date = body.discount_end_date && String(body.discount_end_date).trim() !== '' ? String(body.discount_end_date).trim() : null;
    }
    if (body?.agent_discount !== undefined) {
      updates.agent_discount = body.agent_discount !== null && body.agent_discount !== '' && !Number.isNaN(Number(body.agent_discount)) ? Number(body.agent_discount) : null;
    }
    if (body?.min_adults !== undefined) {
      updates.min_adults = body.min_adults !== null && body.min_adults !== '' && !Number.isNaN(Number(body.min_adults)) ? Math.max(1, Number(body.min_adults)) : 1;
    }
    if (body?.accept_payment !== undefined) {
      updates.accept_payment = normalizeAcceptPayment(body.accept_payment);
    }
    if (termsHtml !== undefined) updates.terms_html = termsHtml;
    if (inclusionHtml !== undefined) updates.inclusion_html = inclusionHtml;
    if (exclusionHtml !== undefined) updates.exclusion_html = exclusionHtml;
    if (overviewText !== undefined) updates.overview = overviewText;
    if (holidayDescriptionHtml !== undefined)
      updates.holiday_description_html = holidayDescriptionHtml;
    if (itineraryJson !== undefined) updates.itinerary = itineraryJson;
    if (thumbnailImage !== undefined) updates.thumbnail_image = thumbnailImage;
    if (pdfUrl !== undefined) updates.pdf_url = pdfUrl;
    if (galleryImages !== undefined) updates.gallery = galleryImages;
    if (status !== undefined) updates.status = status;
    if (crmPackageId !== undefined) updates.crm_package_id = crmPackageId || null;
    if (showListingPage !== undefined) updates.show_listing_page = showListingPage;
    if (pickupLocationUpdate !== undefined)
      updates.pickup_location = pickupLocationUpdate;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('packages')
      .update(updates)
      .eq('package_id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
