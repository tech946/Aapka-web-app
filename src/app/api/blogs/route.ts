import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toUuidOrNull(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s && s !== 'null' && s !== 'undefined' ? s : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const q = (searchParams.get('q') || '').trim();
    const categoryId = (searchParams.get('category_id') || '').trim();
    const categorySlug = (searchParams.get('category_slug') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const slug = (searchParams.get('slug') || '').trim();

    // Fetch single blog by slug
    if (slug) {
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select(
          '*, blog_categories(id,name,slug), blog_sub_categories(id,name,slug), blog_post_tags(tag_id, blog_tags(id,name,slug))'
        )
        .eq('slug', slug)
        .eq('status', 'active')
        .single();
      if (error || !data) {
        return NextResponse.json(
          { error: error?.message ?? 'Blog not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data });
    }

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let resolvedCategoryId = categoryId;
    if (categorySlug && !categoryId) {
      const { data: cat } = await supabaseAdmin
        .from('blog_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      resolvedCategoryId = cat?.id ?? '';
    }

    let query = supabaseAdmin
      .from('blog_posts')
      .select(
        '*, blog_categories(id,name,slug), blog_sub_categories(id,name,slug), blog_post_tags(tag_id, blog_tags(id,name,slug))',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (q) {
      query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    }
    if (resolvedCategoryId) {
      query = query.eq('category_id', resolvedCategoryId);
    }
    if (status) {
      query = query.eq('status', status);
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
    const title: string = (body?.title || '').trim();
    const slug: string =
      (body?.slug || '').trim() || toSlug(title) || 'untitled';
    const content: string | null =
      body?.content !== undefined ? String(body.content) : null;
    const excerpt: string | null =
      body?.excerpt !== undefined
        ? String(body.excerpt).trim() || null
        : null;
    const categoryId = toUuidOrNull(body?.category_id);
    const subCategoryId = toUuidOrNull(body?.sub_category_id);
    const tagIds: string[] = Array.isArray(body?.tag_ids)
      ? body.tag_ids
          .filter((id: unknown) => typeof id === 'string' && id !== 'null' && id !== '')
          .map((id) => String(id).trim())
          .filter((id) => id)
      : [];
    const status: string =
      body?.status && ['active', 'inactive'].includes(body.status)
        ? body.status
        : 'inactive';
    const featuredImage: string | null =
      body?.featured_image !== undefined
        ? String(body.featured_image).trim() || null
        : null;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const finalSlug = slug || toSlug(title) || 'untitled-' + Date.now();

    const { data: post, error: postError } = await supabaseAdmin
      .from('blog_posts')
      .insert([
        {
          title,
          slug: finalSlug,
          content,
          excerpt,
          category_id: categoryId,
          sub_category_id: subCategoryId,
          featured_image: featuredImage,
          status,
          published_at: status === 'active' ? new Date().toISOString() : null,
        },
      ])
      .select('*')
      .single();

    if (postError) {
      return NextResponse.json(
        { error: postError.message },
        { status: 400 }
      );
    }

    if (tagIds.length > 0 && post) {
      await supabaseAdmin.from('blog_post_tags').insert(
        tagIds.map((tag_id: string) => ({
          blog_post_id: post.id,
          tag_id,
        }))
      );
    }

    const { data: fullPost } = await supabaseAdmin
      .from('blog_posts')
      .select(
        '*, blog_categories(id,name,slug), blog_sub_categories(id,name,slug), blog_post_tags(tag_id, blog_tags(id,name,slug))'
      )
      .eq('id', post.id)
      .single();

    return NextResponse.json(
      { data: fullPost ?? post },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
