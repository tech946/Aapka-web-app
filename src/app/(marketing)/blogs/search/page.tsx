import type { Metadata } from 'next';
import { BlogListingView, pageFrom } from '@/components/blog/BlogListingView';

export const metadata: Metadata = { title: 'Search blogs | Aapka Tourism', robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function BlogSearchPage({ searchParams }: Props) {
  const { q = '', page } = await searchParams;
  const search = q.trim().slice(0, 100);

  return (
    <BlogListingView
      title={search ? `Results for “${search}”` : 'Search blogs'}
      crumbs={[{ label: 'Blog', href: '/blogs' }, { label: 'Search' }]}
      active={{ kind: 'none' }}
      query={{ search, page: pageFrom(page) }}
      basePath='/blogs/search'
      extraParams={search ? { q: search } : {}}
      emptyMessage={search ? 'No posts match your search. Try another word.' : 'Type something in the search box above.'}
    />
  );
}
