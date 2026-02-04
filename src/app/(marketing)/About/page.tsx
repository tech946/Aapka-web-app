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
    image: '/images/testimonials-main.jpg',
    text: 'Aapka Tourism Dubai provided us with one of the best, affordable, and most enjoyable tour packages. The hospitality was excellent, including comfortable hotel stays and delicious food throughout the tour. Special mention to Mr. Mukesh, Mr. Chetan, our tour guide Mr. Khalfan Rashid, and the pilot Mr. Bilal for their outstanding support and professionalism. We truly enjoyed the company of all the tour members and would love to return and travel with them again. Wishing Aapka Tourism great success and hoping to see it go global soon. All the Best to team Aapka Tourism.',
    name: 'Anil Joshi',
    location: 'India',
  },
  {
    id: 2,
    image: '/images/testimonials-main.jpg',
    text: 'We booked our tour from Aapka Tourism which was 4 days Dubai and 1 day Abu Dhabi. Kamal Pandey Sir, I would like to give his tour five stars. The hotel and the Indian food were the best. It was very good. Their service and food were simply amazing. Our guide, Aziz Sir, guided us around Dubai and told us about every place we didn\'t know about. I would recommend everyone to go on your tourism tour. If we get a chance to visit Dubai again, we will definitely go on a tour by Aapka Tourism Pvt Ltd because everything from their service to everything else was the best. Kamal Sir and his team are the best. They guided us extensively and took us to many wonderful places. His team is the best. Thank you so much kamal sir and your team.',
    name: 'Pranali Patel',
    location: 'India',
  },
  {
    id: 3,
    image: '/images/testimonials-main.jpg',
    text: 'We booked our Dubai package through Appka Tourism, and it was a wonderful experience. They covered all the sightseeing in a very reasonable package. Even if you plan the trip on your own, you would end up spending almost the same amount. The four-star hotels were excellent, with clean rooms and yummy food. The team members were very supportive throughout the trip. A special thanks to Kamal Sir, who stayed with us and guided us, and to Mukesh Bhai and Chetan Bhai. Chetan Bhai is an amazing person and clicked some really beautiful photos for us. I highly recommend going with them—think twice before booking anywhere else.',
    name: 'Priya P',
    location: 'India',
  },
  {
    id: 4,
    image: '/images/testimonials-main.jpg',
    text: 'I had an absolutely fantastic tourism experience. AApka tourism offers the best tourism service available, and the overall experience I enjoyed was truly unbeatable. I highly recommend it! Shoutout to Kamal Pandey and his marvellous team!! KUDOS to all',
    name: 'Ishu Dhiman',
    location: 'India',
  },
  {
    id: 5,
    image: '/images/testimonials-main.jpg',
    text: 'Cheapest dubai tour package. You can visit most tourist attractions in dubai and abudhabi for short time, strictly follow the timing and informations given by tour guides. You can enjoy good hotels stay and good food in your whole trip.',
    name: 'Ganesh Kumar',
    location: 'India',
  },
  {
    id: 6,
    image: '/images/testimonials-main.jpg',
    text: 'It\'s awesome experience with Aapka tourism with Kamal jee, mukesh jee, khalfan Rashid & Bilal (Bus Driver) all are very cooperative Soft spoken and well behaved during the dubai Tour..😊 Our journey experience with them are awesome and remarkable..',
    name: 'Sanjeev Kumar',
    location: 'India',
  },
  {
    id: 7,
    image: '/images/testimonials-main.jpg',
    text: 'Thank you for an amazing tour! I truly enjoyed the entire experience. The itinerary was well-planned, the information provided was interesting and easy to follow, and the guide was knowledgeable, friendly, and very professional.',
    name: 'Paresh Mistry',
    location: 'India',
  },
  {
    id: 8,
    image: '/images/testimonials-main.jpg',
    text: 'Loved the Dubai tour—every moment felt like a page out of a glossy magazine. The itinerary was spot‑on: sunset over the desert, a smooth city drive past the Burj Khalifa, and evenings spent at the dhow Cruise with live Drone show. The team, right from the drivers to the office staff, was so prompt and active. All details were shared beforehand. The hotel was a perfect blend of luxury and comfort. Can\'t wait to book the next adventure with the same team!',
    name: 'Priya Pisat',
    location: 'India',
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
