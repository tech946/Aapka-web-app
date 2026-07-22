import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'packages';

/**
 * Returns a signed upload URL for client-side direct PDF upload.
 * Client uploads directly to Supabase, bypassing server body size limits.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const folder = (body?.folder as string) || 'packages';

    const ext = 'pdf';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const path = `${folder}/${safeName}`;

    const { data: signedData, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    if (error) {
      console.error('Create signed upload URL error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return NextResponse.json({
      path,
      token: signedData.token,
      publicUrl: urlData.publicUrl,
    });
  } catch (e: unknown) {
    console.error('Create PDF upload URL error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}
