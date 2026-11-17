import Link from 'next/link';
import type { BlogCard } from '@/lib/blog-source';
import { BlogCarousel } from './BlogCarousel';
import { BlogPostCard } from './BlogPostCard';
import { POST_IMAGE_FALLBACK, readTime } from './format';
import { responsiveImage } from '@/lib/image-url';

export function FeaturedSlider({ posts }: { posts: BlogCard[] }) {
  if (posts.length === 0) return null;
  return (
    <BlogCarousel label='Featured blogs' className='bl-featured' autoPlayMs={6000} dots>
      {posts.map((post, i) => (
        <BlogPostCard key={post.id} post={post} variant='featured' priority={i === 0} />
      ))}
    </BlogCarousel>
  );
}

export function OverlayPostSlider({ posts, label }: { posts: BlogCard[]; label: string }) {
  if (posts.length === 0) return null;
  return (
    <BlogCarousel label={label} className='bl-overlay-slider' autoPlayMs={5000}>
      {posts.map((post) => (
        <Link key={post.id} href={`/blogs/${post.slug}`} className='bl-overlay'>
          <img {...responsiveImage(post.featured_image || POST_IMAGE_FALLBACK, '(max-width: 767px) 100vw, 400px', 828)} alt='' loading='lazy' />
          <span className='bl-overlay__time'>{readTime(post.reading_minutes)}</span>
          <span className='bl-overlay__text'>
            {post.blog_categories && <span className='bl-overlay__category'>{post.blog_categories.name}</span>}
            <span className='bl-overlay__title'>{post.title}</span>
          </span>
        </Link>
      ))}
    </BlogCarousel>
  );
}
