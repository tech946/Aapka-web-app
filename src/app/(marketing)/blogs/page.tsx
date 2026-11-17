import type { Metadata } from 'next';
import { getBlogHome, getRelatedBlogs } from '@/lib/blog-source';
import { BlogShell } from '@/components/blog/BlogShell';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { BlogSectionTitle } from '@/components/blog/BlogSectionTitle';
import { FeaturedSlider } from '@/components/blog/PostSlider';
import { getCmsContent } from '@/features/cms/content';
import { blogsCms } from '@/features/cms/pages/blogs';
import { cmsSection } from '@/features/cms/preview/markers';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Travel Blogs | Aapka Tourism',
  description: 'Travel inspiration, destination guides and travel tips from Aapka Tourism.',
};

export default async function BlogsPage() {
  const [{ featured, recent }, popular, { home }] = await Promise.all([getBlogHome(), getRelatedBlogs(null), getCmsContent(blogsCms)]);

  return (
    <BlogShell crumbs={[{ label: 'Blog' }]} active={{ kind: 'home' }} asidePosts={popular} aside='popular'>
      {featured.length > 0 && (
        <section className='bl-block' {...cmsSection('home', 'Blog home headings')}>
          <BlogSectionTitle title={home.featuredTitle} field='home.featuredTitle' />
          <FeaturedSlider posts={featured} />
        </section>
      )}

      {recent.length > 0 && (
        <section className='bl-block'>
          <BlogSectionTitle title={home.recentTitle} action={{ label: home.readAll, href: '/blogs/all' }} field='home.recentTitle' actionField='home.readAll' />
          <BlogGrid posts={recent} />
        </section>
      )}
    </BlogShell>
  );
}
