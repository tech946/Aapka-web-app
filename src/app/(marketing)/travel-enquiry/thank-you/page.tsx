'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Home, Mail, Phone, MessageCircle, Sparkles } from 'lucide-react';
import './thank-you.css';

function ThankYouContent() {
  return (
    <div className='travel-enquiry-thank-you-page'>
      <div className='travel-enquiry-thank-you-background'>
        <div className='travel-enquiry-thank-you-pattern'></div>
      </div>
      <div className='travel-enquiry-thank-you-container'>
        <div className='travel-enquiry-thank-you-badge'>
          <Sparkles size={16} />
          <span>Enquiry Received</span>
        </div>
        

        
        <h1>
          <span className='travel-enquiry-thank-you-greeting'>Thank You</span>
          <span className='travel-enquiry-thank-you-subtitle'>for Your Travel Enquiry</span>
        </h1>
        
        <p className='travel-enquiry-thank-you-message'> Our team will get in touch with you in 24 hours.</p>
        
        <div className='travel-enquiry-thank-you-divider'>
          <div className='travel-enquiry-thank-you-divider-line'></div>
          <div className='travel-enquiry-thank-you-divider-icon'>✈</div>
          <div className='travel-enquiry-thank-you-divider-line'></div>
        </div>
        
        <p className='travel-enquiry-thank-you-info'>
          Our travel experts have received your details and will get back to you
          soon with the best travel package tailored to your preferences. We'll
          contact you via WhatsApp or email to discuss your dream vacation.
        </p>
        


        <div className='travel-enquiry-thank-you-actions'>
          <Link href='/' className='travel-enquiry-thank-you-button primary'>
            <Home size={20} />
            <span>Explore More</span>
          </Link>
          <Link href='/travel-enquiry' className='travel-enquiry-thank-you-button secondary'>
            <ArrowLeft size={20} />
            <span>New Enquiry</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TravelEnquiryThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className='travel-enquiry-thank-you-page'>
          <div className='travel-enquiry-thank-you-container'>
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
