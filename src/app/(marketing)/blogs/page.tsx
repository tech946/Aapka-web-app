'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import './blogs-index.css';

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

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch('/api/blogs?status=active&limit=50');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setBlogs(json.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  return (
    <div className="blogs-index-page">
      <div className="container blogs-index-container">
        <header className="blogs-index-header">
          <h1 className="blogs-index-title">Travel Blogs</h1>
          <p className="blogs-index-subtitle">
            Tips, guides, and inspiration for your next adventure
          </p>
        </header>

        {loading ? (
          <div className="blogs-index-loading">Loading blogs...</div>
        ) : blogs.length === 0 ? (
          <div className="blogs-index-empty">
            <p>No blogs yet. Check back soon!</p>
          </div>
        ) : (
          <div className="blogs-index-grid">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blogs/${blog.slug}`}
                className="blogs-index-card"
              >
                <div className="blogs-index-card-image">
                  <Image
                    src={blog.featured_image || '/images/package-1.png'}
                    alt={blog.title}
                    fill
                    className="blogs-index-card-img"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="blogs-index-card-content">
                  {blog.blog_categories && (
                    <Link
                      href={`/blogs/category/${blog.blog_categories.slug}`}
                      className="blogs-index-card-category"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {blog.blog_categories.name}
                    </Link>
                  )}
                  <h3 className="blogs-index-card-title">{blog.title}</h3>
                  {blog.excerpt && (
                    <p className="blogs-index-card-excerpt">
                      {blog.excerpt.slice(0, 120)}
                      {blog.excerpt.length > 120 ? '...' : ''}
                    </p>
                  )}
                  {(blog.published_at || blog.created_at) && (
                    <span className="blogs-index-card-date">
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
        )}
      </div>
    </div>
  );
}
