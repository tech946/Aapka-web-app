import Link from 'next/link';
import type { BlogCard } from '@/lib/blog-source';
import { BlogPostCard } from './BlogPostCard';

export function BlogGrid({ posts }: { posts: BlogCard[] }) {
  return (
    <div className='bl-grid'>
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

interface BlogPagerProps {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}

export function BlogPager({ page, pageSize, total, hrefFor }: BlogPagerProps) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <nav className='bl-pager' aria-label='Pages'>
      {page > 1 ? <Link href={hrefFor(page - 1)}>Previous</Link> : <span />}
      <span>
        Page {page} of {pages}
      </span>
      {page < pages ? <Link href={hrefFor(page + 1)}>Next</Link> : <span />}
    </nav>
  );
}
