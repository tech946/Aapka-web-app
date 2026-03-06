'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { format } from 'date-fns';
import { useSliderDrag } from '@/lib/use-slider-drag';
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

  const totalSlides = Math.max(1, Math.ceil(blogs.length / cardsPerView));
  const currentSlide =
    totalSlides <= 1 ? 0 : Math.floor(currentIndex / cardsPerView);

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(Math.min(slideIndex * cardsPerView, maxIndex));
  };

  const sliderDrag = useSliderDrag({
    onSwipeLeft: () =>
      setCurrentIndex((p) => Math.min(maxIndex, p + cardsPerView)),
    onSwipeRight: () =>
      setCurrentIndex((p) => Math.max(0, p - cardsPerView)),
  });

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
        <header className="blogs-header">
          <div className="blogs-badge-pill">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              viewBox="0 0 16 16"
              fill="none"
              className="blogs-badge-icon"
            >
              <path
                d="M8 0L9.81019 6.18981L16 8L9.81019 9.81019L8 16L6.18981 9.81019L0 8L6.18981 6.18981L8 0Z"
                fill="currentColor"
              />
            </svg>
            <span>Travel Blog</span>
          </div>
          <h2 className="blogs-heading">
            Discover tips, guides, and inspiration for your next adventure.
          </h2>
        </header>

        <div className="blogs-slider-container">
          <div
            className="blogs-slider-wrapper"
            ref={sliderRef}
            onTouchStart={sliderDrag.onTouchStart}
            onTouchEnd={sliderDrag.onTouchEnd}
          >
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
                      <div className="blogs-card-meta">
                        {(blog.published_at || blog.created_at) && (
                          <span className="blogs-card-date">
                            {format(
                              new Date(blog.published_at || blog.created_at || ''),
                              'MMMM d, yyyy'
                            )}
                          </span>
                        )}
                        <span className="blogs-card-read-time">5 min read</span>
                      </div>
                      <h3 className="blogs-card-title">{blog.title}</h3>
                      {blog.excerpt && (
                        <p className="blogs-card-excerpt">
                          {blog.excerpt.slice(0, 120)}
                          {blog.excerpt.length > 120 ? '...' : ''}
                        </p>
                      )}
                      <span className="blogs-read-article-btn">Read Article</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {totalSlides > 1 && (
          <div className="blogs-slider-dots">
            {Array.from({ length: totalSlides }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`blogs-slider-dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        <div className="blogs-view-all">
          <Link href="/blogs" className="blogs-view-all-link">
            View all blogs
            <ArrowRight size={20} className="blogs-view-all-icon" />
          </Link>
        </div>
      </div>
    </section>
  );
}
