import type { Metadata } from 'next';
import { getBlogTerm } from '@/lib/blog-source';
import { BlogListingView, pageFrom } from '@/components/blog/BlogListingView';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getBlogTerm('tags', slug);
  return { title: `${tag?.name || slug.replace(/-/g, ' ')} | Aapka Tourism Blog` };
}

export default async function BlogTagPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const tag = await getBlogTerm('tags', slug);
  const name = tag?.name ?? slug.replace(/-/g, ' ');

  return (
    <BlogListingView
      title={`Topic: ${name}`}
      crumbs={[{ label: 'Blog', href: '/blogs' }, { label: name }]}
      active={{ kind: 'tag', slug }}
      query={{ tagSlug: slug, page: pageFrom(page) }}
      basePath={`/blogs/tag/${slug}`}
      emptyMessage='No posts on this topic yet.'
    />
  );
}
