'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Star, X } from 'lucide-react';
import './home.css';

interface Review {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
}

const reviews: Review[] = [
  {
    id: 1,
    name: 'Anil Joshi',
    location: 'India',
    rating: 5.0,
    text: 'Aapka Tourism Dubai provided us with one of the best, affordable, and most enjoyable tour packages. The hospitality was excellent, including comfortable hotel stays and delicious food throughout the tour. Special mention to Mr. Mukesh, Mr. Chetan, our tour guide Mr. Khalfan Rashid, and the pilot Mr. Bilal for their outstanding support and professionalism. We truly enjoyed the company of all the tour members and would love to return and travel with them again. Wishing Aapka Tourism great success and hoping to see it go global soon. All the Best to team Aapka Tourism.',
    date: 'Jan 15, 2025',
  },
  {
    id: 2,
    name: 'Pranali Patel',
    location: 'India',
    rating: 5.0,
    text: 'We booked our tour from Aapka Tourism which was 4 days Dubai and 1 day Abu Dhabi. Kamal Pandey Sir, I would like to give his tour five stars. The hotel and the Indian food were the best. It was very good. Their service and food were simply amazing. Our guide, Aziz Sir, guided us around Dubai and told us about every place we didn\'t know about. I would recommend everyone to go on your tourism tour. If we get a chance to visit Dubai again, we will definitely go on a tour by Aapka Tourism Pvt Ltd because everything from their service to everything else was the best. Kamal Sir and his team are the best. They guided us extensively and took us to many wonderful places. His team is the best. Thank you so much kamal sir and your team.',
    date: 'Dec 20, 2024',
  },
  {
    id: 3,
    name: 'Priya P',
    location: 'India',
    rating: 5.0,
    text: 'We booked our Dubai package through Appka Tourism, and it was a wonderful experience. They covered all the sightseeing in a very reasonable package. Even if you plan the trip on your own, you would end up spending almost the same amount. The four-star hotels were excellent, with clean rooms and yummy food. The team members were very supportive throughout the trip. A special thanks to Kamal Sir, who stayed with us and guided us, and to Mukesh Bhai and Chetan Bhai. Chetan Bhai is an amazing person and clicked some really beautiful photos for us. I highly recommend going with them—think twice before booking anywhere else.',
    date: 'Jan 10, 2025',
  },
  {
    id: 4,
    name: 'Ishu Dhiman',
    location: 'India',
    rating: 5.0,
    text: 'I had an absolutely fantastic tourism experience. AApka tourism offers the best tourism service available, and the overall experience I enjoyed was truly unbeatable. I highly recommend it! Shoutout to Kamal Pandey and his marvellous team!! KUDOS to all',
    date: 'Dec 28, 2024',
  },
  {
    id: 5,
    name: 'Ganesh Kumar',
    location: 'India',
    rating: 5.0,
    text: 'Cheapest dubai tour package. You can visit most tourist attractions in dubai and abudhabi for short time, strictly follow the timing and informations given by tour guides. You can enjoy good hotels stay and good food in your whole trip.',
    date: 'Jan 05, 2025',
  },
  {
    id: 6,
    name: 'Sanjeev Kumar',
    location: 'India',
    rating: 5.0,
    text: 'It\'s awesome experience with Aapka tourism with Kamal jee, mukesh jee, khalfan Rashid & Bilal (Bus Driver) all are very cooperative Soft spoken and well behaved during the dubai Tour..😊 Our journey experience with them are awesome and remarkable..',
    date: 'Dec 15, 2024',
  },
  {
    id: 7,
    name: 'Paresh Mistry',
    location: 'India',
    rating: 5.0,
    text: 'Thank you for an amazing tour! I truly enjoyed the entire experience. The itinerary was well-planned, the information provided was interesting and easy to follow, and the guide was knowledgeable, friendly, and very professional.',
    date: 'Jan 20, 2025',
  },
  {
    id: 8,
    name: 'Priya Pisat',
    location: 'India',
    rating: 5.0,
    text: 'Loved the Dubai tour—every moment felt like a page out of a glossy magazine. The itinerary was spot‑on: sunset over the desert, a smooth city drive past the Burj Khalifa, and evenings spent at the dhow Cruise with live Drone show. The team, right from the drivers to the office staff, was so prompt and active. All details were shared beforehand. The hotel was a perfect blend of luxury and comfort. Can\'t wait to book the next adventure with the same team!',
    date: 'Jan 08, 2025',
  },
];

export default function TestimonialsSection() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showMoreMap, setShowMoreMap] = useState<{ [key: number]: boolean }>({});
  const textRefs = useRef<{ [key: number]: HTMLParagraphElement | null }>({});

  // Check if text exceeds 4 lines after render
  useEffect(() => {
    const checkOverflows = () => {
      const newShowMoreMap: { [key: number]: boolean } = {};
      reviews.forEach((review) => {
        const textElement = textRefs.current[review.id];
        if (textElement) {
          const lineHeight = parseFloat(window.getComputedStyle(textElement).lineHeight);
          const maxHeight = lineHeight * 4;
          newShowMoreMap[review.id] = textElement.scrollHeight > maxHeight;
        }
      });
      setShowMoreMap(newShowMoreMap);
    };

    // Check after initial render
    checkOverflows();

    // Also check on window resize
    window.addEventListener('resize', checkOverflows);
    return () => window.removeEventListener('resize', checkOverflows);
  }, []);

  const handleShowMore = (review: Review) => {
    setSelectedReview(review);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedReview(null);
    document.body.style.overflow = '';
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedReview) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedReview]);

  return (
    <>
      <section className="testimonials-reviews-section">
        <div className="testimonials-reviews-container">
          <h2 className="testimonials-reviews-title">Reviews</h2>
          
          <div className="testimonials-rating-display">
            <Image
              src="/images/home/testi-left.svg"
              alt=""
              width={24}
              height={48}
              className="testimonials-rating-decoration testimonials-rating-decoration-left"
            />
            <div className="testimonials-rating-number">4.9</div>
            <Image
              src="/images/home/testi-right.svg"
              alt=""
              width={24}
              height={48}
              className="testimonials-rating-decoration testimonials-rating-decoration-right"
            />
          </div>

          <p className="testimonials-reviews-tagline">
            We're proud to deliver travel experiences that our customers consistently love.
          </p>

          <div className="testimonials-category-ratings">
            <div className="testimonial-category-rating">
              <span className="testimonial-category-value">4.9</span>
              <span className="testimonial-category-label">Hotel</span>
            </div>
            <div className="testimonial-category-rating">
              <span className="testimonial-category-value">5.0</span>
              <span className="testimonial-category-label">Team</span>
            </div>
            <div className="testimonial-category-rating">
              <span className="testimonial-category-value">5.0</span>
              <span className="testimonial-category-label">Cooperative</span>
            </div>
            <div className="testimonial-category-rating">
              <span className="testimonial-category-value">5.0</span>
              <span className="testimonial-category-label">Budget</span>
            </div>
          </div>

          <div className="testimonials-reviews-grid">
            {reviews.map((review) => {
              const showMore = showMoreMap[review.id] || false;
              return (
                <div key={review.id} className="testimonial-review-card">
                  <div className="testimonial-review-header">
                    <div className="testimonial-review-avatar">
                      {review.avatar ? (
                        <Image
                          src={review.avatar}
                          alt={review.name}
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="testimonial-review-avatar-placeholder">
                          {review.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="testimonial-review-info">
                      <div className="testimonial-review-name">{review.name}</div>
                      <div className="testimonial-review-location">{review.location}</div>
                    </div>
                    <div className="testimonial-review-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill="#ea580c" color="#ea580c" />
                      ))}
                    </div>
                  </div>
                  <div className="testimonial-review-text-wrapper">
                    <p 
                      ref={(el) => {
                        textRefs.current[review.id] = el;
                      }}
                      className="testimonial-review-text"
                    >
                      {review.text}
                    </p>
                    {showMore && (
                      <button
                        className="testimonial-show-more"
                        onClick={() => handleShowMore(review)}
                      >
                        Show more
                      </button>
                    )}
                  </div>
                  <div className="testimonial-review-date">{review.date}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial Modal */}
      {selectedReview && (
        <div className="testimonial-modal-overlay" onClick={handleCloseModal}>
          <div className="testimonial-modal" onClick={(e) => e.stopPropagation()}>
            <button className="testimonial-modal-close" onClick={handleCloseModal}>
              <X size={24} />
            </button>
            <div className="testimonial-modal-header">
              <div className="testimonial-modal-avatar">
                {selectedReview.avatar ? (
                  <Image
                    src={selectedReview.avatar}
                    alt={selectedReview.name}
                    width={60}
                    height={60}
                  />
                ) : (
                  <div className="testimonial-modal-avatar-placeholder">
                    {selectedReview.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="testimonial-modal-info">
                <div className="testimonial-modal-name">{selectedReview.name}</div>
                <div className="testimonial-modal-location">{selectedReview.location}</div>
                <div className="testimonial-modal-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} fill="#ea580c" color="#ea580c" />
                  ))}
                </div>
              </div>
            </div>
            <div className="testimonial-modal-text">{selectedReview.text}</div>
            <div className="testimonial-modal-date">{selectedReview.date}</div>
          </div>
        </div>
      )}
    </>
  );
}
