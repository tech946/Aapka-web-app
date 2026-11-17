import 'server-only';
import { revalidateTag, unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { fromDbError, notFound } from '@/lib/api/errors';
import { generateShortSlug } from '@/lib/utils';
import { categorySlug } from '@/components/site/site-config';
import { STATIC_SEO_PAGES, idSuffix, seoKeyForPath, type SeoPageRef } from './keys';
import { parseSchemas, type PageSeo, type PageSeoInput, type SeoCatalogItem } from './schema';

const TABLE = 'page_seo';
const CACHE_TAG = 'page-seo';

interface SeoRow {
  key: string;
  path: string;
  label: string;
  meta_title: string;
  meta_description: string;
  schema_blocks: unknown;
  updated_at: string | null;
  updated_by: string | null;
}

function toPageSeo(row: SeoRow): PageSeo {
  return {
    key: row.key,
    path: row.path,
    label: row.label,
    metaTitle: row.meta_title ?? '',
    metaDescription: row.meta_description ?? '',
    schemas: parseSchemas(row.schema_blocks),
    updatedAt: row.updated_at,
  };
}

async function readAllRows(): Promise<SeoRow[]> {
  const { data, error } = await supabaseAdmin.from(TABLE).select('key, path, label, meta_title, meta_description, schema_blocks, updated_at, updated_by');
  if (error) throw error;
  return (data ?? []) as SeoRow[];
}

const cachedRows = unstable_cache(readAllRows, ['page-seo-all'], { tags: [CACHE_TAG] });

export async function getSeoForPath(path: string): Promise<PageSeo | null> {
  const key = seoKeyForPath(path);
  if (!key) return null;
  try {
    const row = (await cachedRows()).find((r) => r.key === key);
    return row ? toPageSeo(row) : null;
  } catch (error) {
    console.error('[seo] read failed', key, error);
    return null;
  }
}

async function packagePages(): Promise<SeoPageRef[]> {
  const [packages, marina, deals] = await Promise.all([
    supabaseAdmin.from('packages').select('package_id, package_name, package_days, package_nights, package_categories(name)').eq('status', 'active'),
    supabaseAdmin.from('marina_cruise_dinners').select('package_id, package_name').eq('status', 'active'),
    supabaseAdmin.from('limited_time_deals').select('id, packages(package_id, package_name, package_days, package_nights)').eq('is_active', true),
  ]);

  const refs: SeoPageRef[] = [];

  for (const p of (packages.data ?? []) as Record<string, unknown>[]) {
    const id = String(p.package_id);
    const name = String(p.package_name ?? 'Package');
    const category = (p.package_categories as { name?: string } | null)?.name ?? '';
    const slug = categorySlug(category) || 'packages';
    refs.push({
      key: `package:${idSuffix(id)}`,
      path: `/category/${slug}/${generateShortSlug(name, id, p.package_days as number | null, p.package_nights as number | null)}`,
      label: name,
      group: 'Packages',
    });
  }

  for (const p of (marina.data ?? []) as Record<string, unknown>[]) {
    const id = String(p.package_id);
    const name = String(p.package_name ?? 'Marina cruise');
    refs.push({ key: `marina:${idSuffix(id)}`, path: `/marina-cruise-dinner/${generateShortSlug(name, id)}`, label: name, group: 'Marina cruises' });
  }

  for (const d of (deals.data ?? []) as Record<string, unknown>[]) {
    const pkg = d.packages as Record<string, unknown> | null;
    if (!pkg?.package_id) continue;
    const id = String(pkg.package_id);
    const name = String(pkg.package_name ?? 'Deal');
    refs.push({
      key: `deal:${idSuffix(id)}`,
      path: `/limited-time-deals/${generateShortSlug(name, id, pkg.package_days as number | null, pkg.package_nights as number | null)}`,
      label: name,
      group: 'Limited time deals',
    });
  }

  return refs;
}

async function editorNames(userIds: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((v): v is string => Boolean(v)))];
  if (ids.length === 0) return new Map();
  const { data } = await supabaseAdmin.from('profiles').select('id, full_name, email_address').in('id', ids);
  return new Map((data ?? []).map((p) => [p.id as string, (p.full_name || p.email_address || '') as string]));
}

export async function listSeoCatalog(): Promise<{ items: SeoCatalogItem[]; tableReady: boolean }> {
  const [rowsResult, dynamicPages] = await Promise.all([
    readAllRows().then(
      (rows) => ({ rows, ready: true }),
      () => ({ rows: [] as SeoRow[], ready: false }),
    ),
    packagePages().catch(() => [] as SeoPageRef[]),
  ]);

  const rows = new Map(rowsResult.rows.map((r) => [r.key, r]));
  const names = await editorNames(rowsResult.rows.map((r) => r.updated_by));
  const pages = [...STATIC_SEO_PAGES, ...dynamicPages];
  const seen = new Set(pages.map((p) => p.key));
  const orphans: SeoPageRef[] = rowsResult.rows
    .filter((r) => !seen.has(r.key))
    .map((r) => ({ key: r.key, path: r.path, label: r.label || r.path, group: 'Main pages' }));

  const items = [...pages, ...orphans].map((page) => {
    const row = rows.get(page.key);
    const schemas = row ? parseSchemas(row.schema_blocks) : [];
    return {
      key: page.key,
      path: page.path,
      label: page.label,
      group: page.group,
      customized: Boolean(row),
      blockCount: schemas.length,
      hasMeta: Boolean(row?.meta_title || row?.meta_description),
      updatedAt: row?.updated_at ?? null,
      updatedBy: row?.updated_by ? names.get(row.updated_by) || null : null,
    };
  });

  return { items, tableReady: rowsResult.ready };
}

export async function getSeoEntry(key: string): Promise<PageSeo | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('key, path, label, meta_title, meta_description, schema_blocks, updated_at, updated_by')
    .eq('key', key)
    .maybeSingle();
  if (error) throw fromDbError(error);
  return data ? toPageSeo(data as SeoRow) : null;
}

export async function saveSeoEntry(input: PageSeoInput, userId: string): Promise<PageSeo> {
  const { error } = await supabaseAdmin.from(TABLE).upsert(
    {
      key: input.key,
      path: input.path,
      label: input.label,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      schema_blocks: input.schemas,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  );
  if (error) throw fromDbError(error);
  revalidateTag(CACHE_TAG, { expire: 0 });
  const saved = await getSeoEntry(input.key);
  if (!saved) throw notFound('Saved entry could not be read back.');
  return saved;
}

export async function deleteSeoEntry(key: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('key', key);
  if (error) throw fromDbError(error);
  revalidateTag(CACHE_TAG, { expire: 0 });
}
