'use client';

import { useState, useRef, useEffect } from 'react';
import { Info, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import './home.css';

type CategoryId = string;

const categories: { id: CategoryId; label: string }[] = [
  { id: 'about', label: 'About Us' },
  { id: 'booking', label: 'Booking & Payments' },
  { id: 'travel', label: 'Travel & Packages' },
  { id: 'cancellation', label: 'Cancellation Policy' },
  { id: 'contact', label: 'Contact & Support' },
];

const faqItems: Array<{
  id: string;
  category: CategoryId;
  question: string;
  answer: string;
}> = [
  {
    id: '1',
    category: 'about',
    question: 'What is Aapka Tourism and what services do you offer?',
    answer:
      'Aapka Tourism is a travel agency specializing in Dubai and India tour packages. We offer customizable itineraries, group tours, honeymoon packages, and corporate travel solutions with end-to-end support.',
  },
  {
    id: '2',
    category: 'about',
    question: 'How many years of experience do you have in the travel industry?',
    answer:
      'We have over a decade of experience in organizing memorable travel experiences. Our team includes certified guides and travel experts dedicated to making your journey unforgettable.',
  },
  {
    id: '3',
    category: 'booking',
    question: 'How do I book a tour package?',
    answer:
      'You can book through our website by selecting a package, choosing your dates, and completing the payment. You can also call or WhatsApp us for personal assistance with your booking.',
  },
  {
    id: '4',
    category: 'booking',
    question: 'What payment methods do you accept?',
    answer:
      'We accept credit/debit cards, UPI, net banking, and bank transfers. For international bookings, we also accept major payment gateways. EMI options are available on selected packages.',
  },
  {
    id: '5',
    category: 'travel',
    question: 'What is included in the tour package?',
    answer:
      'Our packages typically include accommodation, breakfast, transportation, sightseeing as per itinerary, and the services of an experienced guide. Inclusions vary by package—please check the specific package details.',
  },
  {
    id: '6',
    category: 'travel',
    question: 'Do you offer visa assistance for Dubai and other destinations?',
    answer:
      'Yes, we provide visa assistance for Dubai, UAE, and other destinations. Our team will guide you through the documentation process and help with visa applications.',
  },
  {
    id: '7',
    category: 'cancellation',
    question: 'What is your cancellation policy?',
    answer:
      'Cancellation terms vary by package and timing. Generally, cancellations made 30+ days before departure may receive a partial refund. Please refer to the cancellation policy on your booking confirmation.',
  },
  {
    id: '8',
    category: 'cancellation',
    question: 'Can I reschedule my tour dates?',
    answer:
      'Yes, subject to availability and any applicable rescheduling fees. Please contact us as early as possible to discuss your options.',
  },
  {
    id: '9',
    category: 'contact',
    question: 'How can I reach your support team?',
    answer:
      'You can reach us via WhatsApp, phone, or email. Our support team is available during business hours to assist with bookings, queries, and travel assistance.',
  },
  {
    id: '10',
    category: 'contact',
    question: 'Do you provide 24/7 support during the trip?',
    answer:
      'Yes, we provide round-the-clock support during your trip. You will receive a dedicated contact number for emergencies and day-to-day assistance.',
  },
];

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabsTrackRef = useRef<HTMLDivElement>(null);

  const updateScrollButtons = () => {
    const scrollEl = tabsScrollRef.current;
    const trackEl = tabsTrackRef.current;
    if (!scrollEl || !trackEl) return;
    const overflow = trackEl.scrollWidth > scrollEl.clientWidth;
    setCanScrollLeft(overflow && scrollEl.scrollLeft > 0);
    setCanScrollRight(
      overflow && scrollEl.scrollLeft < trackEl.scrollWidth - scrollEl.clientWidth - 2
    );
  };

  useEffect(() => {
    const run = () => {
      requestAnimationFrame(updateScrollButtons);
    };
    run();
    const scrollEl = tabsScrollRef.current;
    if (!scrollEl) return;
    const ro = new ResizeObserver(run);
    ro.observe(scrollEl);
    scrollEl.addEventListener('scroll', run);
    window.addEventListener('resize', run);
    const t = setTimeout(run, 100);
    return () => {
      clearTimeout(t);
      ro.disconnect();
      scrollEl.removeEventListener('scroll', run);
      window.removeEventListener('resize', run);
    };
  }, []);

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const filteredItems =
    activeCategory === 'all'
      ? faqItems
      : faqItems.filter((item) => item.category === activeCategory);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        {/* Centered header - tour activities pill style */}
        <div className="faq-header">
          <div className="faq-badge-pill">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              viewBox="0 0 16 16"
              fill="none"
              className="faq-badge-icon"
            >
              <path
                d="M8 0L9.81019 6.18981L16 8L9.81019 9.81019L8 16L6.18981 9.81019L0 8L6.18981 6.18981L8 0Z"
                fill="currentColor"
              />
            </svg>
            <span>FAQ Support Guide</span>
          </div>
          <h2 className="faq-title">
            <span className="faq-title-highlight">Helpful Answers</span>
            <span className="faq-title-rest"> to Your Common Questions</span>
          </h2>
        </div>

        {/* Right-aligned content: tabs + faqs */}
        <div className="faq-content-right">
          <div className="faq-tabs-slider">
            {canScrollLeft && (
              <button
                type="button"
                className="faq-tabs-nav faq-tabs-nav-prev"
                onClick={() => scrollTabs('left')}
                aria-label="Scroll tabs left"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div
              ref={tabsScrollRef}
              className="faq-tabs-scroll"
              role="tablist"
            >
              <div ref={tabsTrackRef} className="faq-tabs-row">
                <button
                  type="button"
                  role="tab"
                  className={`faq-nav-tab ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  <Info size={16} />
                  All FAQs
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    className={`faq-nav-tab ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            {canScrollRight && (
              <button
                type="button"
                className="faq-tabs-nav faq-tabs-nav-next"
                onClick={() => scrollTabs('right')}
                aria-label="Scroll tabs right"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          <div className="faq-accordion">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`faq-item ${expandedId === item.id ? 'expanded' : ''}`}
              >
                <button
                  type="button"
                  className="faq-item-question"
                  onClick={() => toggleExpand(item.id)}
                  aria-expanded={expandedId === item.id}
                >
                  <span>{item.question}</span>
                  <span className="faq-item-icon">
                    {expandedId === item.id ? (
                      <Minus size={20} strokeWidth={2} />
                    ) : (
                      <Plus size={20} strokeWidth={2} />
                    )}
                  </span>
                </button>
                {expandedId === item.id && (
                  <div className="faq-item-answer">{item.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
