'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import './thank-you.css';

function ThankYouContent() {
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
