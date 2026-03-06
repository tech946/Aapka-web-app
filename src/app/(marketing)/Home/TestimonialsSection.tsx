'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Star, Plus } from 'lucide-react';
import { gsap } from 'gsap';
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
    text: 'Aapka Tourism Dubai provided us with one of the best, affordable, and most enjoyable tour packages. The hospitality was excellent, including comfortable hotel stays and delicious food throughout the tour. Special mention to Mr. Mukesh, Mr. Chetan, our tour guide Mr. Khalfan Rashid, and the pilot Mr. Bilal for their outstanding support and professionalism. We truly enjoyed the company of all the tour members and would love to return and travel with them again.',
    date: 'Jan 15, 2025',
  },
  {
    id: 2,
    name: 'Pranali Patel',
    location: 'India',
    rating: 5.0,
    text: "We booked our tour from Aapka Tourism which was 4 days Dubai and 1 day Abu Dhabi. Kamal Pandey Sir, I would like to give his tour five stars. The hotel and the Indian food were the best. Their service and food were simply amazing. Our guide, Aziz Sir, guided us around Dubai and told us about every place we didn't know about. I would recommend everyone to go on your tourism tour.",
    date: 'Dec 20, 2024',
  },
  {
    id: 3,
    name: 'Priya P',
    location: 'India',
    rating: 5.0,
    text: 'We booked our Dubai package through Appka Tourism, and it was a wonderful experience. They covered all the sightseeing in a very reasonable package. The four-star hotels were excellent, with clean rooms and yummy food. The team members were very supportive throughout the trip. I highly recommend going with them—think twice before booking anywhere else.',
    date: 'Jan 10, 2025',
  },
  {
    id: 4,
    name: 'Ishu Dhiman',
    location: 'India',
    rating: 5.0,
    text: 'I had an absolutely fantastic tourism experience. Aapka tourism offers the best tourism service available, and the overall experience I enjoyed was truly unbeatable. I highly recommend it! Shoutout to Kamal Pandey and his marvellous team!! KUDOS to all.',
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
    text: "It's awesome experience with Aapka tourism with Kamal jee, mukesh jee, khalfan Rashid & Bilal (Bus Driver) all are very cooperative Soft spoken and well behaved during the dubai Tour. Our journey experience with them are awesome and remarkable.",
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
    text: "Loved the Dubai tour—every moment felt like a page out of a glossy magazine. The itinerary was spot‑on: sunset over the desert, a smooth city drive past the Burj Khalifa, and evenings spent at the dhow Cruise with live Drone show. The team was so prompt and active. Can't wait to book the next adventure with the same team!",
    date: 'Jan 08, 2025',
  },
];

// Pair testimonials for slider: each slide shows 2 testimonials
const testimonialPairs: [Review, Review][] = [];
for (let i = 0; i < reviews.length; i += 2) {
  if (i + 1 < reviews.length) {
    testimonialPairs.push([reviews[i], reviews[i + 1]]);
  } else {
    testimonialPairs.push([reviews[i], reviews[0]]); // Pair last with first
  }
}

export default function TestimonialsSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const totalSlides = testimonialPairs.length;

  // GSAP slider animation - horizontal slide
  useEffect(() => {
    if (totalSlides === 0 || !trackRef.current) return;

    // xPercent: each slide = 100/totalSlides of track width
    const xPercent = -currentSlide * (100 / totalSlides);

    gsap.to(trackRef.current, {
      xPercent,
      duration: 0.6,
      ease: 'power2.inOut',
    });
  }, [currentSlide, totalSlides]);

  // GSAP progress bar animation
  useEffect(() => {
    if (!progressRef.current || totalSlides === 0) return;

    const progress = ((currentSlide + 1) / totalSlides) * 100;

    gsap.to(progressRef.current, {
      width: `${progress}%`,
      duration: 0.5,
      ease: 'power2.out',
    });
  }, [currentSlide, totalSlides]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <section className='travelers-review-section'>
      <div className='travelers-review-container'>
        {/* Header */}
        <div className='travelers-review-header'>
          <h2 className='travelers-review-title'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              viewBox='0 0 16 16'
              fill='none'
              className='travelers-review-plus'
            >
              <path
                d='M8 0L9.81019 6.18981L16 8L9.81019 9.81019L8 16L6.18981 9.81019L0 8L6.18981 6.18981L8 0Z'
                fill='currentColor'
              ></path>
            </svg>
            Travelers Review
          </h2>
          <p className='travelers-review-subtitle'>
            Reviews from the adventures how we&apos;ve made journeys
            unforgettable.
          </p>
        </div>

        {/* Slider Cards - all 3 cards same height */}
        <div className='travelers-review-slider'>
          {/* Left: Summary / CTA Card */}
          <div className='travelers-review-card travelers-review-summary-card'>
            <div className='travelers-review-rating-big'>5.0</div>
            <p className='travelers-review-summary-text'>
              Discover how we&apos;ve helped travelers create memories that last
              a lifetime.
            </p>
            <div className='travelers-review-trusted'>
              <div className='travelers-review-google'>Google</div>
              <div className='travelers-review-avatars'>
                {reviews.slice(0, 4).map((r, i) => (
                  <span
                    key={r.id}
                    className='travelers-review-avatar-circle'
                    title={r.name}
                  >
                    {r.name.charAt(0).toUpperCase()}
                  </span>
                ))}
                <span className='travelers-review-avatar-count'>+55</span>
              </div>
              <div className='travelers-review-trusted-label'>
                <Star size={14} fill='currentColor' stroke='none' />
                <span>Trusted by Google</span>
              </div>
            </div>
            <Link
              href='https://www.google.com/maps/search/Aapka+Tourism+Dubai'
              target='_blank'
              rel='noopener noreferrer'
              className='travelers-review-cta-btn'
            >
              Leave a Review
            </Link>
          </div>

          {/* Middle & Right: Testimonial Cards (slide track) */}
          <div className='travelers-review-testimonials-wrap'>
            <div
              ref={trackRef}
              className='travelers-review-testimonials-track'
              style={{ width: `${totalSlides * 100}%` }}
            >
              {testimonialPairs.map(([leftReview, rightReview], idx) => (
                <div
                  key={idx}
                  className='travelers-review-testimonials-slide'
                  style={{ flex: `0 0 ${100 / totalSlides}%` }}
                >
                  <div className='travelers-review-card travelers-review-testimonial-card'>
                    <div className='travelers-review-stars'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill='currentColor'
                          stroke='none'
                        />
                      ))}
                    </div>
                    <p className='travelers-review-testimonial-text'>
                      {leftReview.text}
                    </p>
                    <div className='travelers-review-testimonial-author'>
                      <span className='travelers-review-testimonial-initial'>
                        {leftReview.name.charAt(0).toUpperCase()}
                      </span>
                      <span className='travelers-review-testimonial-name'>
                        {leftReview.name}
                      </span>
                    </div>
                  </div>
                  <div className='travelers-review-card travelers-review-testimonial-card'>
                    <div className='travelers-review-stars'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill='currentColor'
                          stroke='none'
                        />
                      ))}
                    </div>
                    <p className='travelers-review-testimonial-text'>
                      {rightReview.text}
                    </p>
                    <div className='travelers-review-testimonial-author'>
                      <span className='travelers-review-testimonial-initial'>
                        {rightReview.name.charAt(0).toUpperCase()}
                      </span>
                      <span className='travelers-review-testimonial-name'>
                        {rightReview.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: Progress bar (left) + Nav arrows (right) */}
        <div className='travelers-review-footer'>
          <div className='travelers-review-progress-wrap travelers-review-progress-left'>
            <div className='travelers-review-progress-track'>
              <div
                ref={progressRef}
                className='travelers-review-progress-fill'
                style={{
                  width: `${((currentSlide + 1) / totalSlides) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className='travelers-review-nav'>
            <button
              className='travelers-review-nav-btn travelers-review-nav-prev'
              onClick={prevSlide}
              aria-label='Previous'
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M3.24951 11.25H20.7493V12.75H3.24951V11.25Z'
                  fill='currentColor'
                />
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M3.9996 12.75C7.5272 12.75 10.4097 9.64786 10.4097 6.33995V5.58995H8.9097V6.33995C8.9097 8.85153 6.667 11.25 3.9996 11.25H3.24951V12.75H3.9996Z'
                  fill='currentColor'
                />
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M3.9996 11.25C7.5272 11.25 10.4097 14.3521 10.4097 17.66V18.41H8.9097V17.66C8.9097 15.1485 6.667 12.75 3.9996 12.75H3.24951V11.25H3.9996Z'
                  fill='currentColor'
                />
              </svg>
            </button>
            <button
              className='travelers-review-nav-btn travelers-review-nav-next'
              onClick={nextSlide}
              aria-label='Next'
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M20.7505 11.25H3.2507V12.75H20.7505V11.25Z'
                  fill='currentColor'
                />
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M20.0004 12.75C16.4728 12.75 13.5903 9.64786 13.5903 6.33995V5.58995H15.0903V6.33995C15.0903 8.85153 17.333 11.25 20.0004 11.25H20.7505V12.75H20.0004Z'
                  fill='currentColor'
                />
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M20.0004 11.25C16.4728 11.25 13.5903 14.3521 13.5903 17.66V18.41H15.0903V17.66C15.0903 15.1485 17.333 12.75 20.0004 12.75H20.7505V11.25H20.0004Z'
                  fill='currentColor'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
