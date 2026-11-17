import { NextRequest, NextResponse } from 'next/server';
import { listBlogs } from '@/lib/blog-source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const categorySlug = (searchParams.get('category') || '').trim();
  const data = await listBlogs({ limit: Number.isFinite(limit) ? limit : 10, categorySlug });
  return NextResponse.json({ data });
}
