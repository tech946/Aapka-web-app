import type { BlogCard } from '@/lib/blog-source';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export function postDate(post: Pick<BlogCard, 'published_at' | 'created_at'>): string {
  const value = post.published_at || post.created_at;
  return value ? dateFormat.format(new Date(value)) : '';
}

export function readTime(minutes: number): string {
  return `${minutes} min${minutes === 1 ? '' : 's'}. read`;
}

export const POST_IMAGE_FALLBACK = '/images/package-1.png';
