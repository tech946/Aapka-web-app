'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import './thank-you.css';

function ThankYouContent() {
  // the booking is paid for: the next "Book now" starts fresh
  const { isLoaded, clearBooking } = useBooking();
  useEffect(() => {
    if (isLoaded) clearBooking();
  }, [isLoaded, clearBooking]);

  return (
    <div className='thank-you-page'>
      <div className='thank-you-container'>
        <div className='thank-you-icon'>
          <CheckCircle size={80} />
        </div>
        <h1>Thank You for Your Booking!</h1>
        <p className='thank-you-message'>
          Your booking has been confirmed successfully!
        </p>
        <p className='thank-you-info'>
          Our team will review your booking and get back to you in 24 hours.
        </p>
        <div className='thank-you-actions'>
          <Link href='/' className='thank-you-button primary'>
            <Home size={20} />
            Go to Home
          </Link>
          <Link href='/holidays' className='thank-you-button secondary'>
            <ArrowLeft size={20} />
            Browse holidays
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className='thank-you-page'>
          <div className='thank-you-container'>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
