import { PERMISSIONS } from '@/lib/access';
import { readBody, withPermission } from '@/lib/api/route';
import { blogTermInputSchema } from '@/features/blog/schemas';
import { createTerm, listTerms } from '@/features/blog/service';
import { parseTaxonomyKind } from '@/features/blog/taxonomy';

export const dynamic = 'force-dynamic';

type Params = { kind: string };

export const GET = withPermission<Params>(PERMISSIONS.BLOG_READ, async (_req, { params }) => ({
  terms: await listTerms(parseTaxonomyKind(params.kind)),
}));

export const POST = withPermission<Params>(PERMISSIONS.BLOG_TAXONOMY, async (req, { params }) => ({
  term: await createTerm(parseTaxonomyKind(params.kind), await readBody(req, blogTermInputSchema)),
}));
