import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, ChevronLeft, Clock } from 'lucide-react';
import { getBlog, getRelatedBlogs } from '@/lib/blog-source';
import { BlogShell } from '@/components/blog/BlogShell';
import { BlogBody } from '@/components/blog/BlogBody';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { postDate, readTime } from '@/components/blog/format';
import { BlogJsonLd } from '@/components/blog/BlogJsonLd';
import { responsiveImage } from '@/lib/image-url';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) return { title: 'Blog not found | Aapka Tourism' };
  const description = blog.seo_description || blog.excerpt || undefined;
  const title = blog.seo_title || blog.title;
  return {
    title: `${title} | Aapka Tourism`,
    description,
    openGraph: { title, description, type: 'article', images: blog.featured_image ? [blog.featured_image] : undefined },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) notFound();

  const related = await getRelatedBlogs(blog);
  const category = blog.blog_categories;
  const author = blog.authorName || 'Aapka Tourism';
  const date = postDate(blog);

  return (
    <BlogShell
      crumbs={[
        { label: 'Blog', href: '/blogs' },
        ...(category ? [{ label: category.name, href: `/blogs/category/${category.slug}` }] : []),
        { label: blog.title },
      ]}
      active={category ? { kind: 'category', slug: category.slug } : { kind: 'none' }}
      asidePosts={related}
      aside='related'
    >
      <BlogJsonLd blog={blog} />
      <Link href='/blogs' className='bl-back'>
        <ChevronLeft size={16} aria-hidden />
        Back to Blogs
      </Link>

      <article className='bl-article'>
        <div className='bl-article__top'>
          {category ? (
            <Link href={`/blogs/category/${category.slug}`} className='bl-card__category'>
              {category.name}
            </Link>
          ) : (
            <span />
          )}
          <ShareButtons title={blog.title} path={`/blogs/${blog.slug}`} />
        </div>

        <h1 className='bl-article__title'>{blog.title}</h1>
        <p className='bl-article__time'>
          <Clock size={14} aria-hidden />
          {readTime(blog.reading_minutes)}
        </p>

        {blog.featured_image && (
          <figure className='bl-article__cover'>
            <img {...responsiveImage(blog.featured_image, '(max-width: 767px) 100vw, 900px', 1920)} alt={blog.coverAlt || blog.title} fetchPriority='high' />
          </figure>
        )}

        <div className='bl-article__byline'>
          <span className='bl-article__avatar'>
            <img src='/brand/aapka-sun-mark.png' alt='' />
          </span>
          <span className='bl-article__author'>{author}</span>
          <span className='bl-article__dot' aria-hidden>
            •
          </span>
          <span className='bl-article__muted'>{readTime(blog.reading_minutes)}</span>
          {date && (
            <span className='bl-article__date'>
              <CalendarDays size={15} aria-hidden />
              {date}
            </span>
          )}
        </div>

        {blog.excerpt && (
          <section className='bl-summary'>
            <h2>Quick Summary</h2>
            <p>{blog.excerpt}</p>
          </section>
        )}

        <BlogBody html={blog.html} className='bl-prose' />

        {blog.tags.length > 0 && (
          <div className='bl-article__tags'>
            {blog.tags.map((tag) => (
              <Link key={tag.slug} href={`/blogs/tag/${tag.slug}`}>
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </article>
    </BlogShell>
  );
}
