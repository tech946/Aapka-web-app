import { PERMISSIONS } from '@/lib/access';
import { readBody, withPermission } from '@/lib/api/route';
import { blogTermInputSchema } from '@/features/blog/schemas';
import { deleteTerm, updateTerm } from '@/features/blog/service';
import { parseTaxonomyKind } from '@/features/blog/taxonomy';

export const dynamic = 'force-dynamic';

type Params = { kind: string; id: string };

export const PUT = withPermission<Params>(PERMISSIONS.BLOG_TAXONOMY, async (req, { params }) => {
  await updateTerm(parseTaxonomyKind(params.kind), params.id, await readBody(req, blogTermInputSchema));
  return { ok: true };
});

export const DELETE = withPermission<Params>(PERMISSIONS.BLOG_TAXONOMY, async (_req, { params }) => {
  await deleteTerm(parseTaxonomyKind(params.kind), params.id);
  return { ok: true };
});
