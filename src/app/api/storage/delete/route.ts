import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'images';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path } = body;

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { error: 'path is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Supabase storage delete error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error('Storage delete error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete image' },
      { status: 500 }
    );
  }
}
