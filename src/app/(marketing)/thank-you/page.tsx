'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import './thank-you.css';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    if (!bookingId) {
      router.replace('/cart');
    }
  }, [bookingId, router]);

  // Show loading while redirecting or if no bookingId
  if (!bookingId) {
    return (
      <div className='thank-you-page'>
        <div className='thank-you-container'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='thank-you-page'>
      <div className='thank-you-container'>
        <div className='thank-you-icon'>
          <CheckCircle size={80} />
        </div>
        <h1>Thank You for Your Booking!</h1>
        <p className='thank-you-message'>
          Your booking has been confirmed. Your booking ID is:{' '}
          <strong>{bookingId}</strong>
        </p>
        <p className='thank-you-info'>
          We have received your booking and will process it shortly. You will
          receive a confirmation email with all the details.
        </p>
        <div className='thank-you-actions'>
          <Link href='/' className='thank-you-button primary'>
            <Home size={20} />
            Go to Home
          </Link>
          <Link href='/cart' className='thank-you-button secondary'>
            <ArrowLeft size={20} />
            Back to Cart
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
          <div className='thank-you-container'>Loading...</div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
