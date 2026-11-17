import { z } from 'zod';
import { PERMISSIONS } from '@/lib/access';
import { readBody, readQuery, withPermission } from '@/lib/api/route';
import { notFound } from '@/lib/api/errors';
import { deleteSeoEntry, getSeoEntry, listSeoCatalog, saveSeoEntry } from '@/features/seo/service';
import { pageSeoInputSchema } from '@/features/seo/schema';

export const dynamic = 'force-dynamic';

const keyQuery = z.object({ key: z.string().trim().min(1).max(300).optional() });

export const GET = withPermission(PERMISSIONS.CMS_READ, async (req) => {
  const { key } = readQuery(req, keyQuery);
  if (!key) return listSeoCatalog();
  return { entry: await getSeoEntry(key) };
});

export const PUT = withPermission(PERMISSIONS.CMS_WRITE, async (req, { user }) => {
  const input = await readBody(req, pageSeoInputSchema);
  return { entry: await saveSeoEntry(input, user.id) };
});

export const DELETE = withPermission(PERMISSIONS.CMS_WRITE, async (req) => {
  const { key } = readQuery(req, keyQuery);
  if (!key) throw notFound('Choose a page.');
  await deleteSeoEntry(key);
  return { ok: true };
});
