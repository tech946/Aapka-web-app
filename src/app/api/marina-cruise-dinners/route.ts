import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizePackageGallery } from '@/lib/package-gallery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SELECT_FIELDS =
  'package_id, package_name, package_description, category, timing, package_price, adult_price, child_price, registration_only, registration_adult_price, registration_child_price, bookable_dates, booking_days, excluded_dates, pickup_location, addons, status, show_listing_page, terms_html, inclusion_html, exclusion_html, overview, holiday_description_html, thumbnail_image, gallery, crm_package_id, created_at';

function parseBookableDates(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const dates = value
    .map(d => String(d).trim())
    .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
  return dates;
}

function parseBookingDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (d: unknown) =>
      Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6
  );
}

function validateMarinaBookingAvailability(
  bookingDays: number[],
  bookableDates: string[]
): string | null {
  if (bookingDays.length === 0 && bookableDates.length === 0) {
    return 'Select at least one booking day or add at least one specific date';
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const q = (searchParams.get('q') || '').trim();
    const sortBy = (searchParams.get('sort_by') || '').trim();

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('marina_cruise_dinners')
      .select(SELECT_FIELDS, { count: 'exact' })
      .range(from, to);

    if (sortBy === 'created_at_asc') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'title_asc') {
      query = query.order('package_name', { ascending: true });
    } else if (sortBy === 'price_asc') {
      query = query.order('adult_price', { ascending: true });
    } else if (sortBy === 'price_desc') {
      query = query.order('adult_price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (q) {
      query = query.or(
        `package_name.ilike.%${q}%,package_description.ilike.%${q}%`
      );
    }

    const statusParam = (searchParams.get('status') || '').trim();
    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    } else if (!statusParam) {
      query = query.eq('status', 'active');
    }

    if (searchParams.get('listing_page_only') === 'true') {
      query = query.eq('show_listing_page', true);
    }

    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
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

function parseOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name: string = (body?.name || '').trim();
    const description: string | null =
      (body?.description || '').trim() || null;
    const adultPrice = parseOptionalNumber(body?.adult_price);
    const childPrice = parseOptionalNumber(body?.child_price);

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (adultPrice === null) {
      return NextResponse.json(
        { error: 'adult_price is required' },
        { status: 400 }
      );
    }

    let bookableDates: string[] = [];
    if (body?.bookable_dates !== undefined) {
      bookableDates = parseBookableDates(body.bookable_dates) ?? [];
    }

    const excludedDates: string[] =
      body?.excluded_dates !== undefined
        ? (parseBookableDates(body.excluded_dates) ?? [])
        : [];

    const bookingDays = parseBookingDays(body?.booking_days);

    const bookingError = validateMarinaBookingAvailability(
      bookingDays,
      bookableDates
    );
    if (bookingError) {
      return NextResponse.json({ error: bookingError }, { status: 400 });
    }

    const insertData: Record<string, unknown> = {
      package_name: name,
      package_description: description,
      category:
        body?.category !== undefined
          ? String(body.category).trim() || null
          : null,
      timing:
        body?.timing !== undefined ? String(body.timing).trim() || null : null,
      adult_price: adultPrice,
      child_price: childPrice,
      package_price: adultPrice,
      status: (body?.status || 'active').trim() || 'active',
      show_listing_page:
        body?.show_listing_page !== undefined
          ? Boolean(body.show_listing_page)
          : true,
      terms_html:
        body?.terms_html !== undefined ? String(body.terms_html) : null,
      inclusion_html:
        body?.inclusion_html !== undefined ? String(body.inclusion_html) : null,
      exclusion_html:
        body?.exclusion_html !== undefined ? String(body.exclusion_html) : null,
      overview: body?.overview !== undefined ? String(body.overview) : null,
      holiday_description_html:
        body?.holiday_description_html !== undefined
          ? String(body.holiday_description_html)
          : null,
      thumbnail_image:
        body?.thumbnail_image !== undefined
          ? String(body.thumbnail_image).trim() || null
          : null,
      gallery:
        body?.gallery !== undefined
          ? (() => {
              const normalized = normalizePackageGallery(body.gallery);
              return normalized.length > 0 ? normalized : null;
            })()
          : null,
      pickup_location:
        body?.pickup_location !== undefined
          ? String(body.pickup_location).trim() || null
          : null,
    };

    if (bookableDates.length > 0) {
      insertData.bookable_dates = bookableDates;
    } else {
      insertData.bookable_dates = null;
    }

    insertData.excluded_dates = excludedDates.length > 0 ? excludedDates : null;

    if (body?.addons !== undefined) {
      insertData.addons = Array.isArray(body.addons) && body.addons.length > 0
        ? body.addons
        : null;
    }
    if (body?.registration_only !== undefined) {
      insertData.registration_only = Boolean(body.registration_only);
    }
    if (body?.registration_adult_price !== undefined) {
      insertData.registration_adult_price = parseOptionalNumber(
        body.registration_adult_price
      );
    }
    if (body?.registration_child_price !== undefined) {
      insertData.registration_child_price = parseOptionalNumber(
        body.registration_child_price
      );
    }
    insertData.booking_days = bookingDays.length > 0 ? bookingDays : null;

    const { data, error } = await supabaseAdmin
      .from('marina_cruise_dinners')
      .insert([insertData])
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
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

    if (!id) {
      return NextResponse.json(
        { error: 'id (package_id) is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body?.name !== undefined) updates.package_name = String(body.name).trim();
    if (body?.description !== undefined) {
      updates.package_description = String(body.description).trim() || null;
    }
    if (body?.category !== undefined) {
      updates.category = String(body.category).trim() || null;
    }
    if (body?.timing !== undefined) {
      updates.timing = String(body.timing).trim() || null;
    }
    if (body?.adult_price !== undefined) {
      const adultPrice = parseOptionalNumber(body.adult_price);
      if (adultPrice === null) {
        return NextResponse.json(
          { error: 'Invalid adult_price' },
          { status: 400 }
        );
      }
      updates.adult_price = adultPrice;
      updates.package_price = adultPrice;
    }
    if (body?.child_price !== undefined) {
      updates.child_price = parseOptionalNumber(body.child_price);
    }
    if (body?.status !== undefined) {
      updates.status = String(body.status).trim() || null;
    }
    if (body?.show_listing_page !== undefined) {
      updates.show_listing_page = Boolean(body.show_listing_page);
    }
    if (body?.bookable_dates !== undefined) {
      const dates = parseBookableDates(body.bookable_dates) ?? [];
      updates.bookable_dates = dates.length > 0 ? dates : null;
    }
    if (body?.excluded_dates !== undefined) {
      const exDates = parseBookableDates(body.excluded_dates) ?? [];
      updates.excluded_dates = exDates.length > 0 ? exDates : null;
    }
    if (body?.booking_days !== undefined) {
      const days = parseBookingDays(body.booking_days);
      updates.booking_days = days.length > 0 ? days : null;
    }
    if (body?.booking_days !== undefined && body?.bookable_dates !== undefined) {
      const days = parseBookingDays(body.booking_days);
      const dates = parseBookableDates(body.bookable_dates) ?? [];
      const bookingError = validateMarinaBookingAvailability(days, dates);
      if (bookingError) {
        return NextResponse.json({ error: bookingError }, { status: 400 });
      }
    }
    if (body?.pickup_location !== undefined) {
      updates.pickup_location = String(body.pickup_location).trim() || null;
    }
    if (body?.terms_html !== undefined) updates.terms_html = String(body.terms_html);
    if (body?.inclusion_html !== undefined) {
      updates.inclusion_html = String(body.inclusion_html);
    }
    if (body?.exclusion_html !== undefined) {
      updates.exclusion_html = String(body.exclusion_html);
    }
    if (body?.overview !== undefined) updates.overview = String(body.overview);
    if (body?.holiday_description_html !== undefined) {
      updates.holiday_description_html = String(body.holiday_description_html);
    }
    if (body?.thumbnail_image !== undefined) {
      updates.thumbnail_image = String(body.thumbnail_image).trim() || null;
    }
    if (body?.gallery !== undefined) {
      updates.gallery = normalizePackageGallery(body.gallery);
    }
    if (body?.crm_package_id !== undefined) {
      updates.crm_package_id =
        body.crm_package_id === null || body.crm_package_id === ''
          ? null
          : String(body.crm_package_id).trim();
    }
    if (body?.addons !== undefined) {
      updates.addons = Array.isArray(body.addons) && body.addons.length > 0
        ? body.addons
        : null;
    }
    if (body?.registration_only !== undefined) {
      updates.registration_only = Boolean(body.registration_only);
      if (!body.registration_only) {
        updates.registration_adult_price = null;
        updates.registration_child_price = null;
      }
    }
    if (body?.registration_adult_price !== undefined) {
      updates.registration_adult_price = parseOptionalNumber(
        body.registration_adult_price
      );
    }
    if (body?.registration_child_price !== undefined) {
      updates.registration_child_price = parseOptionalNumber(
        body.registration_child_price
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('marina_cruise_dinners')
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
