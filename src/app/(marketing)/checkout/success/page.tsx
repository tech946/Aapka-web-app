'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import './success.css';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const { isLoaded, clearBooking } = useBooking();

  useEffect(() => {
    if (!bookingId) {
      router.replace('/holidays');
    }
  }, [bookingId, router]);

  // the booking is confirmed: the next "Book now" starts fresh
  useEffect(() => {
    if (bookingId && isLoaded) clearBooking();
  }, [bookingId, isLoaded, clearBooking]);

  // Show loading while redirecting or if no bookingId
  if (!bookingId) {
    return (
      <div className='success-page'>
        <div className='success-container'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='success-page'>
      <div className='success-container'>
        <div className='success-icon'>
          <CheckCircle size={80} />
        </div>
        <h1>Thank You for Your Booking!</h1>
        <p className='success-message'>
          Your booking has been confirmed. Your booking ID is:{' '}
          <strong>{bookingId}</strong>
        </p>
        <p className='success-info'>
          We have received your booking and will process it shortly. You will
          receive a confirmation email with all the details.
        </p>
        <div className='success-actions'>
          <Link href='/' className='success-button primary'>
            <Home size={20} />
            Go to Home
          </Link>
          <Link href='/holidays' className='success-button secondary'>
            <ArrowLeft size={20} />
            Browse holidays
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className='success-page'>
          <div className='success-container'>Loading...</div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
