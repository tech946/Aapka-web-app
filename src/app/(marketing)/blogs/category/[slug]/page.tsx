'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import './blog-category.css';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  blog_categories?: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BlogCategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    async function fetchData() {
      try {
        const [blogsRes, catsRes] = await Promise.all([
          fetch(`/api/blogs?status=active&limit=50&category_slug=${encodeURIComponent(slug)}`),
          fetch('/api/blog-categories?limit=100'),
        ]);

        if (!blogsRes.ok) throw new Error('Failed to load blogs');
        const blogsJson = await blogsRes.json();
        setBlogs(blogsJson.data || []);

        if (catsRes.ok) {
          const catsJson = await catsRes.json();
          const cat = (catsJson.data || []).find((c: Category) => c.slug === slug);
          setCategory(cat || null);
        }
      } catch (e) {
        setError('Failed to load blog');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="blog-category-page">
        <div className="container blog-category-container">
          <div className="blog-category-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-category-page">
      <div className="container blog-category-container">
        <Link href="/" className="blog-back-link">
          <ArrowLeft size={18} /> Back to Home
        </Link>

        <header className="blog-category-header">
          <h1 className="blog-category-title">
            {category?.name || slug.replace(/-/g, ' ')}
          </h1>
          <p className="blog-category-count">
            {blogs.length} {blogs.length === 1 ? 'blog' : 'blogs'}
          </p>
        </header>

        {error && (
          <div className="blog-category-error">{error}</div>
        )}

        {blogs.length === 0 && !error && (
          <div className="blog-category-empty">
            <p>No blogs found in this category.</p>
            <Link href="/" className="blog-category-empty-link">Back to Home</Link>
          </div>
        )}

        <div className="blog-category-grid">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blogs/${blog.slug}`}
              className="blog-category-card"
            >
              <div className="blog-category-card-image">
                <Image
                  src={blog.featured_image || '/images/package-1.png'}
                  alt={blog.title}
                  fill
                  className="blog-category-card-img"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="blog-category-card-content">
                <h3 className="blog-category-card-title">{blog.title}</h3>
                {blog.excerpt && (
                  <p className="blog-category-card-excerpt">
                    {blog.excerpt.slice(0, 120)}
                    {blog.excerpt.length > 120 ? '...' : ''}
                  </p>
                )}
                {(blog.published_at || blog.created_at) && (
                  <span className="blog-category-card-date">
                    <Calendar size={14} />
                    {format(
                      new Date(blog.published_at || blog.created_at || ''),
                      'MMM d, yyyy'
                    )}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
