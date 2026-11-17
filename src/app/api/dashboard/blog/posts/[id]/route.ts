import { PERMISSIONS } from '@/lib/access';
import { readBody, withPermission } from '@/lib/api/route';
import { blogPostInputSchema } from '@/features/blog/schemas';
import { deletePost, getPost, updatePost } from '@/features/blog/service';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export const GET = withPermission<Params>(PERMISSIONS.BLOG_READ, async (_req, { params }) => ({
  post: await getPost(params.id),
}));

export const PUT = withPermission<Params>(PERMISSIONS.BLOG_WRITE, async (req, { params, user }) => ({
  post: await updatePost(params.id, await readBody(req, blogPostInputSchema), user),
}));

export const DELETE = withPermission<Params>(PERMISSIONS.BLOG_DELETE, async (_req, { params }) => {
  await deletePost(params.id);
  return { ok: true };
});
