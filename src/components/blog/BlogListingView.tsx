import Link from 'next/link';
import { getBlogListing, getRelatedBlogs, type BlogListingQuery } from '@/lib/blog-source';
import { BlogShell, type Crumb } from './BlogShell';
import type { BlogNavActive } from './BlogNavBar';
import { BlogGrid, BlogPager } from './BlogGrid';
import { BlogSectionTitle } from './BlogSectionTitle';

interface BlogListingViewProps {
  title: string;
  crumbs: Crumb[];
  active: BlogNavActive;
  query: BlogListingQuery;
  basePath: string;
  extraParams?: Record<string, string>;
  emptyMessage: string;
}

export async function BlogListingView({ title, crumbs, active, query, basePath, extraParams = {}, emptyMessage }: BlogListingViewProps) {
  const [listing, popular] = await Promise.all([getBlogListing(query), getRelatedBlogs(null)]);

  const hrefFor = (page: number) => {
    const params = new URLSearchParams({ ...extraParams, ...(page > 1 ? { page: String(page) } : {}) });
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <BlogShell crumbs={crumbs} active={active} asidePosts={popular} aside='popular' query={query.search}>
      <BlogSectionTitle title={title} />
      {listing.items.length > 0 ? (
        <>
          <BlogGrid posts={listing.items} />
          <BlogPager page={listing.page} pageSize={listing.pageSize} total={listing.total} hrefFor={hrefFor} />
        </>
      ) : (
        <div className='bl-empty'>
          <p>{emptyMessage}</p>
          <Link href='/blogs' className='bl-btn bl-btn--outline'>
            Back to Blog Home
          </Link>
        </div>
      )}
    </BlogShell>
  );
}

export function pageFrom(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}
