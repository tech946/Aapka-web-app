'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import './success.css';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      router.push('/cart');
    } else {
      setLoading(false);
    }
  }, [bookingId, router]);

  if (loading) {
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
        <h1>Booking Confirmed!</h1>
        <p className='success-message'>
          Thank you for your booking. Your booking ID is:{' '}
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
          <Link href='/cart' className='success-button secondary'>
            <ArrowLeft size={20} />
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
