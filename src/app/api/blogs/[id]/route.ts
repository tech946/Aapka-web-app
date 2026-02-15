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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select(
        '*, blog_categories(id,name,slug), blog_sub_categories(id,name,slug), blog_post_tags(tag_id, blog_tags(id,name,slug))'
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Blog not found' },
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const body = await req.json();
    const title: string | undefined =
      body?.title !== undefined ? String(body.title).trim() : undefined;
    const content: string | null | undefined =
      body?.content !== undefined ? String(body.content) : undefined;
    const excerpt: string | null | undefined =
      body?.excerpt !== undefined
        ? String(body.excerpt).trim() || null
        : undefined;
    const categoryId: string | null | undefined =
      body?.category_id !== undefined ? toUuidOrNull(body.category_id) : undefined;
    const subCategoryId: string | null | undefined =
      body?.sub_category_id !== undefined ? toUuidOrNull(body.sub_category_id) : undefined;
    const tagIds: string[] | undefined = Array.isArray(body?.tag_ids)
      ? body.tag_ids
          .filter((tid: unknown) => typeof tid === 'string' && tid !== 'null' && tid !== '')
          .map((tid) => String(tid).trim())
          .filter((tid) => tid)
      : undefined;
    const status: string | undefined =
      body?.status && ['active', 'inactive'].includes(body.status)
        ? body.status
        : undefined;
    const featuredImage: string | null | undefined =
      body?.featured_image !== undefined
        ? String(body.featured_image).trim() || null
        : undefined;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) {
      updates.title = title;
      updates.slug = toSlug(title);
    }
    if (content !== undefined) updates.content = content;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (categoryId !== undefined) updates.category_id = categoryId;
    if (subCategoryId !== undefined) updates.sub_category_id = subCategoryId;
    if (status !== undefined) {
      updates.status = status;
      if (status === 'active') {
        updates.published_at = new Date().toISOString();
      }
    }
    if (featuredImage !== undefined) updates.featured_image = featuredImage;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();

      const { data: post, error: updateError } = await supabaseAdmin
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
    }

    if (tagIds !== undefined) {
      await supabaseAdmin
        .from('blog_post_tags')
        .delete()
        .eq('blog_post_id', id);

      if (tagIds.length > 0) {
        await supabaseAdmin.from('blog_post_tags').insert(
          tagIds.map((tag_id: string) => ({
            blog_post_id: id,
            tag_id,
          }))
        );
      }
    }

    const { data: fullPost } = await supabaseAdmin
      .from('blog_posts')
      .select(
        '*, blog_categories(id,name,slug), blog_sub_categories(id,name,slug), blog_post_tags(tag_id, blog_tags(id,name,slug))'
      )
      .eq('id', id)
      .single();

    return NextResponse.json({ data: fullPost });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
