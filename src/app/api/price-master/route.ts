import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch price master data
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('price_master')
      .select('*')
      .order('created_at', { ascending: false });

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

// POST - Create or update price master entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name: string = (body?.name || '').trim().toUpperCase();
    const equivalent: number =
      body?.equivalent !== undefined
        ? Number.isNaN(Number(body.equivalent))
          ? 0
          : Number(body.equivalent)
        : 0;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (equivalent <= 0) {
      return NextResponse.json(
        { error: 'Equivalent must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if entry exists
    const { data: existing } = await supabaseAdmin
      .from('price_master')
      .select('*')
      .eq('name', name)
      .single();

    if (existing) {
      // Update existing entry
      const { data, error } = await supabaseAdmin
        .from('price_master')
        .update({
          equivalent,
          updated_at: new Date().toISOString(),
        })
        .eq('name', name)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ data }, { status: 200 });
    } else {
      // Create new entry
      const { data, error } = await supabaseAdmin
        .from('price_master')
        .insert([
          {
            name,
            equivalent,
          },
        ])
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ data }, { status: 201 });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

// PUT - Update price master entry
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const name: string = (body?.name || '').trim().toUpperCase();
    const equivalent: number =
      body?.equivalent !== undefined
        ? Number.isNaN(Number(body.equivalent))
          ? 0
          : Number(body.equivalent)
        : 0;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (equivalent <= 0) {
      return NextResponse.json(
        { error: 'Equivalent must be greater than 0' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('price_master')
      .update({
        equivalent,
        updated_at: new Date().toISOString(),
      })
      .eq('name', name)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Price master entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
