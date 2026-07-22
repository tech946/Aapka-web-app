import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabaseAdmin
      .from('surcharge_master')
      .select('*', { count: 'exact' })
      .order('from_date', { ascending: false })
      .range(from, to);

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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const price =
      body?.price !== undefined && body?.price !== null && body?.price !== ''
        ? Number(body.price)
        : NaN;
    const fromDate = (body?.from_date || '').trim();
    const toDate = (body?.to_date || '').trim();

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'From date and to date are required' },
        { status: 400 }
      );
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }

    if (new Date(toDate) < new Date(fromDate)) {
      return NextResponse.json(
        { error: 'To date must be on or after from date' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('surcharge_master')
      .insert([
        {
          price,
          from_date: fromDate,
          to_date: toDate,
        },
      ])
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = (body?.id || '').trim();
    const price =
      body?.price !== undefined && body?.price !== null && body?.price !== ''
        ? Number(body.price)
        : undefined;
    const fromDate =
      body?.from_date !== undefined ? String(body.from_date).trim() : undefined;
    const toDate =
      body?.to_date !== undefined ? String(body.to_date).trim() : undefined;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (price !== undefined) {
      if (Number.isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: 'Valid price is required' },
          { status: 400 }
        );
      }
      updates.price = price;
    }
    if (fromDate !== undefined) updates.from_date = fromDate;
    if (toDate !== undefined) updates.to_date = toDate;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('surcharge_master')
      .select('from_date, to_date')
      .eq('id', id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Surcharge not found' }, { status: 404 });
    }

    const effectiveFrom = String(updates.from_date ?? existing.from_date).split('T')[0];
    const effectiveTo = String(updates.to_date ?? existing.to_date).split('T')[0];

    if (new Date(effectiveTo) < new Date(effectiveFrom)) {
      return NextResponse.json(
        { error: 'To date must be on or after from date' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('surcharge_master')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
