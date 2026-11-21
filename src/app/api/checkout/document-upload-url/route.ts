import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'images';
const FOLDER = 'bookings/documents';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const contentType = String(body?.contentType || '').toLowerCase();
    const ext = EXTENSIONS[contentType];

    if (!ext) {
      return NextResponse.json(
        { error: 'Please upload documents as images (JPG, PNG or WEBP).' },
        { status: 400 }
      );
    }

    const path = `${FOLDER}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Failed to prepare document upload' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return NextResponse.json({
      bucket: BUCKET_NAME,
      path,
      token: data.token,
      publicUrl: urlData.publicUrl,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to prepare document upload' },
      { status: 500 }
    );
  }
}
