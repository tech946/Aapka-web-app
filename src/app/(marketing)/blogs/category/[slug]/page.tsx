import type { Metadata } from 'next';
import { getBlogTerm } from '@/lib/blog-source';
import { BlogListingView, pageFrom } from '@/components/blog/BlogListingView';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getBlogTerm('categories', slug);
  return { title: `${category?.name || slug.replace(/-/g, ' ')} blogs | Aapka Tourism` };
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const category = await getBlogTerm('categories', slug);
  const name = category?.name ?? slug.replace(/-/g, ' ');

  return (
    <BlogListingView
      title={name}
      crumbs={[{ label: 'Blog', href: '/blogs' }, { label: name }]}
      active={{ kind: 'category', slug }}
      query={{ categorySlug: slug, page: pageFrom(page) }}
      basePath={`/blogs/category/${slug}`}
      emptyMessage='No posts in this category yet.'
    />
  );
}
