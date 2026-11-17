import Link from 'next/link';
import type { BlogCard } from '@/lib/blog-source';
import { POST_IMAGE_FALLBACK, readTime } from './format';

export function BlogPostCard({ post, variant = 'grid' }: { post: BlogCard; variant?: 'grid' | 'featured' }) {
  const href = `/blogs/${post.slug}`;
  const category = post.blog_categories;

  return (
    <article className={`bl-card bl-card--${variant}`}>
      <Link href={href} className='bl-card__media' tabIndex={-1} aria-hidden>
        <img src={post.featured_image || POST_IMAGE_FALLBACK} alt='' loading={variant === 'featured' ? 'eager' : 'lazy'} />
      </Link>
      <div className='bl-card__body'>
        {category && (
          <Link href={`/blogs/category/${category.slug}`} className='bl-card__category'>
            {category.name}
          </Link>
        )}
        <h3 className='bl-card__title'>
          <Link href={href}>{post.title}</Link>
        </h3>
        <p className='bl-card__time'>{readTime(post.reading_minutes)}</p>
        {post.excerpt && <p className='bl-card__excerpt'>{post.excerpt}</p>}
      </div>
    </article>
  );
}
