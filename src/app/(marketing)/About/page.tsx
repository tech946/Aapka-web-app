'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import './about.css';

interface Testimonial {
  id: number;
  image: string;
  text: string;
  name: string;
  location: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    image: '/images/testimonial-1.jpg',
    text: 'Our Dubai trip with Aapka Tourism was absolutely fantastic! Every detail was perfectly planned, from the airport pickup to the desert safari. The team was professional and the experiences were unforgettable.',
    name: 'Priya & Rahul Sharma',
    location: 'Mumbai',
  },
  {
    id: 2,
    image: '/images/testimonial-1.jpg',
    text: 'Our honeymoon in Dubai was an unforgettable experience! The stunning skyline, luxurious hotel stay, exciting desert safari, and magical Dhow Cruise dinner made every moment truly special. Thank you Aapka Tourism for creating such beautiful memories for us!!',
    name: 'Anjali Gupta',
    location: 'Delhi',
  },
  {
    id: 3,
    image: '/images/testimonial-1.jpg',
    text: 'I traveled solo to Dubai and felt completely safe and well-taken care of. The itinerary was perfectly balanced with adventure and relaxation. Highly recommend Aapka Tourism!',
    name: 'Vikram & Kavitha',
    location: 'Bangalore',
  },
  {
    id: 3,
    image: '/images/testimonial-1.jpg',
    text: 'Traveling with kids can be challenging, but Aapka Tourism made it seamless. The Dubai package was family-friendly with activities for everyone. Our children still talk about the desert safari!',
    name: 'Rajesh Family',
    location: 'Chennai',
  },
];

const travelPhotos = [
  '/images/travel-photo-1.jpg',
  '/images/travel-photo-2.jpg',
  '/images/travel-photo-3.jpg',
  '/images/travel-photo-4.jpg',
  '/images/travel-photo-5.jpg',
];

export default function AboutPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  return (
    <div className='about-page'>
      <div className='container'>
        <div className='first-section'>
          <div className='grid_row'>
            <div className='content'>
              <h1 className='about-page__title'>
                <span>Explore the world with us, one adventure at a time.</span>
                The perfect
                <span className='color'>
                  <span className='vacation-shape'></span>
                  vacation
                </span>
                come true with our Travel Agency
              </h1>
              <p className='about-page__description'>
                We are a team of experienced travel experts who specialize in
                planning and organizing unforgettable travel experiences for our
                clients with a wide range of travel services, including flight
                bookings, hotel reservations and more.
              </p>
              <Link href='/' className='explore-packages-button'>
                Explore Packages
              </Link>
            </div>
            <div className='images_container'>
              <Image
                className='image-1'
                src='/images/about-section-1.jpg'
                alt='About'
                width={600}
                height={600}
                priority
              />
              <Image
                className='image-2'
                src='/images/about-section-2.jpg'
                alt='About'
                width={150}
                height={150}
              />
              <Image
                className='image-3'
                src='/images/about-section-3.jpg'
                alt='About'
                width={200}
                height={130}
              />
              <Image
                className='image-4'
                src='/images/about-section-4.jpg'
                alt='About'
                width={150}
                height={100}
              />
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className='testimonials-section'>
          <div className='testimonials-header'>
            <p className='testimonials-subtitle'>
              Happy Travelers Share Their Experiences
            </p>
            <h2 className='testimonials-title'>
              Stories from
              <span className='testimonials-highlight'>Satisfied</span>
              Customers
            </h2>
          </div>

          <div className='testimonials-content'>
            <div className='testimonial-main'>
              <div className='testimonial-image'>
                <Image
                  src='/images/testimonials-main.jpg'
                  alt='Testimonial'
                  width={600}
                  height={500}
                  priority
                />
              </div>
              <div className='testimonial-text-content'>
                <p className='testimonial-text'>
                  {testimonials[currentTestimonial].text}
                </p>
                <div className='testimonial-rating'>
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className='star-icon-filled'
                      size={20}
                      fill='#fd6b06'
                      color='#fd6b06'
                    />
                  ))}
                </div>
                <div className='testimonial-reviewer'>
                  <div className='reviewer-info'>
                    <p className='reviewer-name'>
                      {testimonials[currentTestimonial].name}
                    </p>
                    <p className='reviewer-location'>
                      {testimonials[currentTestimonial].location}
                    </p>
                  </div>
                </div>
                <div className='testimonial-dots'>
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                      onClick={() => setCurrentTestimonial(index)}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
