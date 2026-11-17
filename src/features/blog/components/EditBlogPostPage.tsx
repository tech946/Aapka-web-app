'use client';

import { DashboardLoader } from '@/components/dashboard/DashboardLoader';
import { errorMessage } from '@/lib/api/client';
import { useBlogPost } from '../hooks';
import { BlogPostEditor } from './BlogPostEditor';

export function EditBlogPostPage({ id }: { id: string }) {
  const { data: post, isLoading, error } = useBlogPost(id);

  if (isLoading) return <DashboardLoader />;
  if (error || !post) {
    return (
      <div className='dashboard_page'>
        <div className='dk-notice'>{errorMessage(error, 'Post not found.')}</div>
      </div>
    );
  }
  return <BlogPostEditor key={`${post.id}-${post.updatedAt}`} post={post} />;
}
