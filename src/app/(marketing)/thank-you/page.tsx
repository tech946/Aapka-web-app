'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import './thank-you.css';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const id = searchParams.get('bookingId');
      setBookingId(id);
      setIsLoading(false);

      if (!id) {
        // Redirect after a short delay to allow page to render
        setTimeout(() => {
          router.replace('/cart');
        }, 2000);
      }
    } catch (error) {
      console.error('Error reading booking ID:', error);
      setIsLoading(false);
      setTimeout(() => {
        router.replace('/cart');
      }, 2000);
    }
  }, [searchParams, router]);

  // Show loading while checking bookingId
  if (isLoading) {
    return (
      <div className='thank-you-page'>
        <div className='thank-you-container'>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no bookingId (will redirect)
  if (!bookingId) {
    return (
      <div className='thank-you-page'>
        <div className='thank-you-container'>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No booking ID found. Redirecting...</p>
          </div>
        </div>
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
