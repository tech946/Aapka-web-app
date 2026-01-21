import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Fetch date availability for a package
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('package_id') || '';
    const date = searchParams.get('date') || '';
    const fromDate = searchParams.get('from_date') || '';
    const toDate = searchParams.get('to_date') || '';

    let query = supabaseAdmin
      .from('package_date_availability')
      .select('*')
      .order('date', { ascending: true });

    if (packageId) {
      query = query.eq('package_id', packageId);
    }

    if (date) {
      query = query.eq('date', date);
    }

    if (fromDate && toDate) {
      query = query.gte('date', fromDate).lte('date', toDate);
    } else if (fromDate) {
      query = query.gte('date', fromDate);
    } else if (toDate) {
      query = query.lte('date', toDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

// POST: Create or update date availability for a package
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const packageId: string = (body?.package_id || '').trim();
    const date: string = (body?.date || '').trim();
    // Backward compatible: accept adult_price/child_price/infant_price or legacy price
    const adultPriceRaw =
      body?.adult_price ?? body?.adultPrice ?? body?.price ?? undefined;
    const childPriceRaw = body?.child_price ?? body?.childPrice ?? 0;
    const infantPriceRaw = body?.infant_price ?? body?.infantPrice ?? 0;

    const adultPrice: number = Number(adultPriceRaw);
    const childPrice: number = Number(childPriceRaw);
    const infantPrice: number = Number(infantPriceRaw);
    const availableSeats: number =
      body?.available_seats !== undefined
        ? Number(body.available_seats)
        : 45;
    const isSoldOut: boolean =
      body?.is_sold_out !== undefined ? Boolean(body.is_sold_out) : false;

    if (!packageId) {
      return NextResponse.json(
        { error: 'package_id is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    if (Number.isNaN(adultPrice) || adultPrice < 0) {
      return NextResponse.json(
        { error: 'Valid adult_price is required' },
        { status: 400 }
      );
    }

    // Use upsert to handle both insert and update
    const { data, error } = await supabaseAdmin
      .from('package_date_availability')
      .upsert(
        [
          {
            package_id: packageId,
            date,
            adult_price: adultPrice,
            child_price: Number.isNaN(childPrice) ? 0 : childPrice,
            infant_price: Number.isNaN(infantPrice) ? 0 : infantPrice,
            available_seats: availableSeats,
            is_sold_out: isSoldOut,
          },
        ],
        {
          onConflict: 'package_id,date',
        }
      )
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

// PUT: Update date availability
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id: string = (body?.id || '').trim();
    const packageId: string | undefined = body?.package_id
      ? String(body.package_id).trim()
      : undefined;
    const date: string | undefined = body?.date
      ? String(body.date).trim()
      : undefined;
    const adultPrice: number | undefined =
      body?.adult_price !== undefined || body?.adultPrice !== undefined || body?.price !== undefined
        ? Number.isNaN(
            Number(body?.adult_price ?? body?.adultPrice ?? body?.price)
          )
          ? undefined
          : Number(body?.adult_price ?? body?.adultPrice ?? body?.price)
        : undefined;
    const childPrice: number | undefined =
      body?.child_price !== undefined || body?.childPrice !== undefined
        ? Number.isNaN(Number(body?.child_price ?? body?.childPrice))
          ? undefined
          : Number(body?.child_price ?? body?.childPrice)
        : undefined;
    const infantPrice: number | undefined =
      body?.infant_price !== undefined || body?.infantPrice !== undefined
        ? Number.isNaN(Number(body?.infant_price ?? body?.infantPrice))
          ? undefined
          : Number(body?.infant_price ?? body?.infantPrice)
        : undefined;
    const availableSeats: number | undefined =
      body?.available_seats !== undefined
        ? Number.isNaN(Number(body.available_seats))
          ? undefined
          : Number(body.available_seats)
        : undefined;
    const isSoldOut: boolean | undefined =
      body?.is_sold_out !== undefined
        ? Boolean(body.is_sold_out)
        : undefined;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (packageId !== undefined) updates.package_id = packageId;
    if (date !== undefined) updates.date = date;
    if (adultPrice !== undefined) updates.adult_price = adultPrice;
    if (childPrice !== undefined) updates.child_price = childPrice;
    if (infantPrice !== undefined) updates.infant_price = infantPrice;
    if (availableSeats !== undefined) updates.available_seats = availableSeats;
    if (isSoldOut !== undefined) updates.is_sold_out = isSoldOut;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('package_date_availability')
      .update(updates)
      .eq('id', id)
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

// DELETE: Remove date availability
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    const packageId = searchParams.get('package_id') || '';
    const date = searchParams.get('date') || '';

    if (!id && !packageId) {
      return NextResponse.json(
        { error: 'Either id or package_id is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin.from('package_date_availability').delete();

    if (id) {
      query = query.eq('id', id);
    } else if (packageId) {
      query = query.eq('package_id', packageId);
      if (date) {
        query = query.eq('date', date);
      }
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
