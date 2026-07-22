import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use 'packages' bucket - accepts Any MIME type including PDF
const BUCKET_NAME = 'packages';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'pdf';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type - PDF only
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Max 25MB for PDFs (client-side direct upload preferred for files > 5MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'PDF size should be less than 25MB' },
        { status: 400 }
      );
    }

    // Generate unique filename: folder/timestamp-random.pdf
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const path = `${folder}/${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage PDF upload error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e: unknown) {
    console.error('Storage PDF upload error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to upload PDF' },
      { status: 500 }
    );
  }
}
