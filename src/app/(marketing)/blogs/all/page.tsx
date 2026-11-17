import type { Metadata } from 'next';
import { BlogListingView, pageFrom } from '@/components/blog/BlogListingView';

export const metadata: Metadata = { title: 'All travel blogs | Aapka Tourism' };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AllBlogsPage({ searchParams }: Props) {
  const { page } = await searchParams;

  return (
    <BlogListingView
      title='All Posts'
      crumbs={[{ label: 'Blog', href: '/blogs' }, { label: 'All posts' }]}
      active={{ kind: 'none' }}
      query={{ page: pageFrom(page) }}
      basePath='/blogs/all'
      emptyMessage='No posts yet. Check back soon!'
    />
  );
}
