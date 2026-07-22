import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch platform fee
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('platform_fee')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // If table doesn't exist or no data, return default
      return NextResponse.json({
        data: {
          id: 'default',
          fee_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ data: data ?? { fee_percentage: 0 } });
  } catch (e: any) {
    // Return default on error
    return NextResponse.json({
      data: {
        id: 'default',
        fee_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }
}

// POST - Update platform fee
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const feePercentage: number =
      body?.fee_percentage !== undefined
        ? Number.isNaN(Number(body.fee_percentage))
          ? 0
          : Number(body.fee_percentage)
        : 0;

    // Validate: must be between 0 and 10
    if (feePercentage < 0 || feePercentage > 10) {
      return NextResponse.json(
        { error: 'Platform fee must be between 0 and 10 percent' },
        { status: 400 }
      );
    }

    // Check if entry exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('platform_fee')
      .select('*')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is okay
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    if (existing) {
      // Update existing entry - need WHERE clause
      const { data, error } = await supabaseAdmin
        .from('platform_fee')
        .update({
          fee_percentage: feePercentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ data }, { status: 200 });
    } else {
      // Create new entry if none exists
      const { data, error } = await supabaseAdmin
        .from('platform_fee')
        .insert([
          {
            fee_percentage: feePercentage,
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
