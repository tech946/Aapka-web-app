import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getBlogNav, type BlogCard } from '@/lib/blog-source';
import { BlogNavBar, type BlogNavActive } from './BlogNavBar';
import { OverlayPostSlider } from './PostSlider';
import { RecommendedTours } from './aside/RecommendedTours';
import { CallbackForm } from './aside/CallbackForm';
import { getCmsContent } from '@/features/cms/content';
import { blogsCms } from '@/features/cms/pages/blogs';
import { cmsSection, cmsText } from '@/features/cms/preview/markers';
import './blog.css';

export interface Crumb {
  label: string;
  href?: string;
}

interface BlogShellProps {
  crumbs: Crumb[];
  active: BlogNavActive;
  asidePosts: BlogCard[];
  aside: 'popular' | 'related';
  query?: string;
  children: ReactNode;
}

export async function BlogShell({ crumbs, active, asidePosts, aside, query, children }: BlogShellProps) {
  const [nav, content] = await Promise.all([getBlogNav(), getCmsContent(blogsCms)]);
  const asideField = aside === 'popular' ? 'popularTitle' : 'relatedTitle';
  const asideTitle = content.aside[asideField];

  return (
    <div className='bl-page'>
      <header className='bl-hero'>
        <div className='bl-container'>
          <nav className='bl-crumbs' aria-label='Breadcrumb'>
            <Link href='/'>Home</Link>
            {crumbs.map((crumb) => (
              <span key={crumb.label}>
                <ChevronRight size={12} aria-hidden />
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current='page'>{crumb.label}</span>}
              </span>
            ))}
          </nav>
          <div {...cmsSection('hero', 'Blog banner')}>
            <p className='bl-hero__title' {...cmsText('hero.title')}>
              {content.hero.title}
            </p>
            <p className='bl-hero__subtitle'>
              {content.hero.tags.map((tag, i) => (
                <span key={tag.text + i} {...cmsText(`hero.tags.${i}.text`)}>
                  {tag.text}
                </span>
              ))}
            </p>
          </div>
          <BlogNavBar nav={nav} active={active} query={query} />
        </div>
      </header>

      <div className='bl-container bl-layout'>
        <main className='bl-main'>{children}</main>
        <aside className='bl-aside'>
          {asidePosts.length > 0 && (
            <section className='bl-widget bl-widget--flush'>
              <h2 className='bl-widget__title' {...cmsSection('aside', 'Side column headings')} {...cmsText(`aside.${asideField}`)}>
                {asideTitle}
              </h2>
              <OverlayPostSlider posts={asidePosts} label={asideTitle} />
            </section>
          )}
          <RecommendedTours title={content.aside.toursTitle} />
          <CallbackForm content={content.callback} />
        </aside>
      </div>
    </div>
  );
}
