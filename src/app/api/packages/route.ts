import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const q = (searchParams.get('q') || '').trim();
    const categoryId = (searchParams.get('category_id') || '').trim();
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
        'package_id, package_name, package_description, package_price, package_category_id, package_days, package_nights, travel_dates, adult_price, child_price, terms_html, inclusion_html, exclusion_html, overview, holiday_description_html, itinerary, thumbnail_image, created_at',
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

    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
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

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (price === null || Number.isNaN(price)) {
      return NextResponse.json({ error: 'price is required' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json(
        { error: 'category_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('packages')
      .insert([
        {
          package_name: name,
          package_description: description,
          package_price: price,
          package_category_id: categoryId,
          package_days: days,
          package_nights: nights,
          travel_dates: travelDates,
          adult_price: adultPrice,
          child_price: childPrice,
          terms_html: termsHtml,
          inclusion_html: inclusionHtml,
          exclusion_html: exclusionHtml,
          overview: overviewText,
          holiday_description_html: holidayDescriptionHtml,
          itinerary: itineraryJson,
          thumbnail_image: thumbnailImage,
        },
      ])
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
    if (travelDatesUpdate !== undefined)
      updates.travel_dates = travelDatesUpdate;
    if (adultPrice !== undefined) updates.adult_price = adultPrice;
    if (childPrice !== undefined) updates.child_price = childPrice;
    if (termsHtml !== undefined) updates.terms_html = termsHtml;
    if (inclusionHtml !== undefined) updates.inclusion_html = inclusionHtml;
    if (exclusionHtml !== undefined) updates.exclusion_html = exclusionHtml;
    if (overviewText !== undefined) updates.overview = overviewText;
    if (holidayDescriptionHtml !== undefined)
      updates.holiday_description_html = holidayDescriptionHtml;
    if (itineraryJson !== undefined) updates.itinerary = itineraryJson;
    if (thumbnailImage !== undefined) updates.thumbnail_image = thumbnailImage;

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
