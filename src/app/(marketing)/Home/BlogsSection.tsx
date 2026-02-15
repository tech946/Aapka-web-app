'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { gsap } from 'gsap';
import { format } from 'date-fns';
import './home.css';

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

export default function BlogsSection() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch('/api/blogs?status=active&limit=10');
        if (!res.ok) throw new Error('Failed to fetch blogs');
        const json = await res.json();
        setBlogs(json.data || []);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  const maxIndex = Math.max(0, blogs.length - cardsPerView);

  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(maxIndex);
  }, [maxIndex, currentIndex]);

  useEffect(() => {
    if (blogs.length === 0 || !cardsRef.current) return;
    const totalCards = blogs.length;
    const cardWidthPercent = 100 / totalCards;
    const offset = -currentIndex * cardWidthPercent;
    gsap.to(cardsRef.current, {
      x: `${offset}%`,
      duration: 0.6,
      ease: 'power2.out',
    });
  }, [currentIndex, blogs.length, cardsPerView]);

  const nextSlide = () => {
    if (currentIndex < maxIndex) setCurrentIndex((p) => Math.min(p + 1, maxIndex));
  };

  const prevSlide = () => {
    if (currentIndex > 0) setCurrentIndex((p) => Math.max(p - 1, 0));
  };

  if (loading) {
    return (
      <section className="blogs-section">
        <div className="container">
          <div className="blogs-loading">Loading blogs...</div>
        </div>
      </section>
    );
  }

  if (blogs.length === 0) {
    return null;
  }

  return (
    <section className="blogs-section">
      <div className="container">
        <header className="blogs-section-header">
          <h2 className="blogs-section-title">Latest Travel Blogs</h2>
          <p className="blogs-section-subtitle">
          Discover tips, guides, and inspiration for your next adventure
          </p>
        </header>

        <div className="blogs-slider-container">
          {blogs.length > cardsPerView && (
            <button
              className={`blogs-nav-btn blogs-nav-prev ${currentIndex === 0 ? 'disabled' : ''}`}
              onClick={prevSlide}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div className="blogs-slider-wrapper" ref={sliderRef}>
            <div
              className={`blogs-cards-track ${blogs.length < cardsPerView ? 'centered' : ''}`}
              ref={cardsRef}
              style={{
                width: blogs.length < cardsPerView ? '100%' : `${(blogs.length / cardsPerView) * 100}%`,
                justifyContent: blogs.length < cardsPerView ? 'center' : 'flex-start',
              }}
            >
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="blogs-card-wrapper"
                  style={{
                    flex: blogs.length < cardsPerView ? `0 0 ${100 / cardsPerView}%` : `0 0 ${100 / blogs.length}%`,
                    maxWidth: blogs.length < cardsPerView ? `${100 / cardsPerView}%` : 'none',
                  }}
                >
                  <Link href={`/blogs/${blog.slug}`} className="blogs-card">
                    <div className="blogs-card-image">
                      <div className="blogs-image-inner">
                        <Image
                          src={blog.featured_image || '/images/package-1.png'}
                          alt={blog.title}
                          fill
                          className="blogs-img"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    </div>
                    <div className="blogs-card-content">
                      {blog.blog_categories && (
                        <span className="blogs-card-category">
                          {blog.blog_categories.name}
                        </span>
                      )}
                      <h3 className="blogs-card-title">{blog.title}</h3>
                      {blog.excerpt && (
                        <p className="blogs-card-excerpt">
                          {blog.excerpt.slice(0, 100)}
                          {blog.excerpt.length > 100 ? '...' : ''}
                        </p>
                      )}
                      {(blog.published_at || blog.created_at) && (
                        <span className="blogs-card-date">
                          <Calendar size={14} />
                          {format(
                            new Date(blog.published_at || blog.created_at || ''),
                            'MMM d, yyyy'
                          )}
                        </span>
                      )}
                      <span className="blogs-read-more">Read more →</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {blogs.length > cardsPerView && (
            <button
              className={`blogs-nav-btn blogs-nav-next ${currentIndex >= maxIndex ? 'disabled' : ''}`}
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        <div className="blogs-view-all">
          <Link href="/blogs" className="blogs-view-all-link">
            View all blogs
          </Link>
        </div>
      </div>
    </section>
  );
}
