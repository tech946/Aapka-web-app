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

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('package_categories')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (q) {
      query = query.ilike('name', `%${q}%`);
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
    const packagetypeid: number | null =
      body?.packagetypeid !== undefined
        ? Number.isNaN(Number(body.packagetypeid))
          ? null
          : Number(body.packagetypeid)
        : null;
    const packagetypename: string | null =
      body?.packagetypename !== undefined
        ? String(body.packagetypename).trim() || null
        : null;
    const image: string | null =
      body?.image !== undefined
        ? String(body.image).trim() || null
        : null;
    const description: string | null =
      body?.description !== undefined
        ? String(body.description).trim() || null
        : null;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('package_categories')
      .insert([
        {
          name,
          packagetypeid,
          packagetypename,
          image,
          description,
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
    const id: string = (body?.id || '').trim();
    const name: string | undefined =
      body?.name !== undefined ? String(body.name).trim() : undefined;
    const packagetypeid: number | null | undefined =
      body?.packagetypeid !== undefined
        ? Number.isNaN(Number(body.packagetypeid))
          ? null
          : Number(body.packagetypeid)
        : undefined;
    const packagetypename: string | null | undefined =
      body?.packagetypename !== undefined
        ? String(body.packagetypename).trim() || null
        : undefined;
    const image: string | null | undefined =
      body?.image !== undefined
        ? String(body.image).trim() || null
        : undefined;
    const description: string | null | undefined =
      body?.description !== undefined
        ? String(body.description).trim() || null
        : undefined;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (packagetypeid !== undefined) updates.packagetypeid = packagetypeid;
    if (packagetypename !== undefined)
      updates.packagetypename = packagetypename;
    if (image !== undefined) updates.image = image;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('package_categories')
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
