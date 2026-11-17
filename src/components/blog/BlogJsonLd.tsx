import type { BlogDetail } from '@/lib/blog-source';
import { buildBlogJsonLd, serializeJsonLd } from '@/features/blog/structured-data/build';

export function BlogJsonLd({ blog }: { blog: BlogDetail }) {
  const documents = buildBlogJsonLd(blog.schema, {
    slug: blog.slug,
    title: blog.seo_title || blog.title,
    description: blog.seo_description || blog.excerpt || '',
    image: blog.featured_image,
    datePublished: blog.published_at,
    dateModified: blog.updated_at,
    authorName: blog.authorName,
    category: blog.blog_categories,
    tags: blog.tags.map((t) => t.name),
  });

  return (
    <>
      {documents.map((doc, i) => (
        <script key={i} type='application/ld+json' dangerouslySetInnerHTML={{ __html: serializeJsonLd(doc) }} />
      ))}
    </>
  );
}
