import { PERMISSIONS } from '@/lib/access';
import { readBody, readQuery, withPermission } from '@/lib/api/route';
import { blogListQuerySchema, blogPostInputSchema } from '@/features/blog/schemas';
import { createPost, listPosts } from '@/features/blog/service';

export const dynamic = 'force-dynamic';

export const GET = withPermission(PERMISSIONS.BLOG_READ, async (req) => listPosts(readQuery(req, blogListQuerySchema)));

export const POST = withPermission(PERMISSIONS.BLOG_WRITE, async (req, { user }) => ({
  post: await createPost(await readBody(req, blogPostInputSchema), user),
}));
