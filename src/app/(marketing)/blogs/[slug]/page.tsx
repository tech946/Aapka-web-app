'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import './blog-detail.css';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt?: string | null;
  featured_image?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  blog_categories?: { name: string; slug: string } | null;
  blog_sub_categories?: { name: string; slug: string } | null;
  blog_post_tags?: Array<{ blog_tags?: { name: string; slug: string } }> | null;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [recentBlogs, setRecentBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    async function fetchBlog() {
      try {
        const res = await fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (res.status === 404) setError('Blog not found');
          else throw new Error('Failed to load');
          return;
        }
        const json = await res.json();
        setBlog(json.data);
      } catch (e) {
        setError('Failed to load blog');
      } finally {
        setLoading(false);
      }
    }
    fetchBlog();
  }, [slug]);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch('/api/blogs?status=active&limit=6');
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          setRecentBlogs(list.filter((b: BlogPost) => b.slug !== slug).slice(0, 5));
        }
      } catch {
        // ignore
      }
    }
    fetchRecent();
  }, [slug]);

  if (loading) {
    return (
      <div className="blog-detail-page">
        <div className="container blog-detail-container">
          <div className="blog-detail-loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="blog-detail-page">
        <div className="container blog-detail-container">
          <div className="blog-detail-error">
            <h2>{error || 'Blog not found'}</h2>
            <Link href="/" className="blog-back-link">
              <ArrowLeft size={18} /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const category = blog.blog_categories;
  const tags = blog.blog_post_tags
    ?.map((t) => t.blog_tags?.name)
    .filter(Boolean) || [];

  return (
    <div className="blog-detail-page">
      <div className="container blog-detail-container">
        <div className="blog-detail-layout">
          <article className="blog-detail-main">
            <Link href="/" className="blog-back-link">
              <ArrowLeft size={18} /> Back to Home
            </Link>

            {blog.featured_image && (
              <div className="blog-detail-hero">
                <Image
                  src={blog.featured_image}
                  alt={blog.title}
                  fill
                  className="blog-detail-hero-img"
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            )}

            <header className="blog-detail-header">
              {category && (
                <Link
                  href={`/blogs/category/${category.slug}`}
                  className="blog-detail-category"
                >
                  {category.name}
                </Link>
              )}
              <h1 className="blog-detail-title">{blog.title}</h1>
              <div className="blog-detail-meta">
                {(blog.published_at || blog.created_at) && (
                  <span className="blog-detail-date">
                    <Calendar size={16} />
                    {format(
                      new Date(blog.published_at || blog.created_at || ''),
                      'MMMM d, yyyy'
                    )}
                  </span>
                )}
              </div>
              {tags.length > 0 && (
                <div className="blog-detail-tags">
                  {tags.map((name) => (
                    <span key={name} className="blog-detail-tag">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div
              className="blog-detail-content prose"
              dangerouslySetInnerHTML={{ __html: blog.content || '' }}
            />
          </article>

          <aside className="blog-detail-sidebar">
            <div className="blog-sidebar-block">
              <h3 className="blog-sidebar-title">Recent Blogs</h3>
              <ul className="blog-sidebar-list">
                {recentBlogs.slice(0, 5).map((b) => (
                  <li key={b.id}>
                    <Link href={`/blogs/${b.slug}`} className="blog-sidebar-item">
                      <div className="blog-sidebar-item-image">
                        <Image
                          src={b.featured_image || '/images/package-1.png'}
                          alt=""
                          fill
                          sizes="80px"
                        />
                      </div>
                      <div className="blog-sidebar-item-content">
                        <span className="blog-sidebar-item-title">{b.title}</span>
                        {(b.published_at || b.created_at) && (
                          <span className="blog-sidebar-item-date">
                            {format(
                              new Date(b.published_at || b.created_at || ''),
                              'MMM d, yyyy'
                            )}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {recentBlogs.length === 0 && (
                <p className="blog-sidebar-empty">No recent blogs</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
