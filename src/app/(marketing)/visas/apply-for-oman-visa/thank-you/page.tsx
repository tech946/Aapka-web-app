'use client';

import Link from 'next/link';
import { CheckCircle, Home, FileCheck } from 'lucide-react';
import './thank-you.css';

export default function OmanVisaThankYouPage() {
  return (
    <div className="oman-visa-thank-you-page">
      <div className="oman-visa-thank-you-container">
        <div className="oman-visa-thank-you-icon">
          <CheckCircle size={64} />
        </div>
        <h1>Oman Visa Enquiry Submitted</h1>
        <p className="oman-visa-thank-you-message">
          Thank you for submitting your Oman visa application. Processing time is approximately 24 hours after we receive complete documents and payment confirmation (0.01 AED). Our team will contact you shortly.
        </p>
        <p className="oman-visa-thank-you-info">
          We have sent a confirmation email to your registered email address. If you have any questions, please contact us at{' '}
          <a href="mailto:info@aapkatourism.com">info@aapkatourism.com</a>.
        </p>
        <div className="oman-visa-thank-you-actions">
          <Link href="/" className="oman-visa-thank-you-btn primary">
            <Home size={20} />
            Back to Home
          </Link>
          <Link href="/visas/apply-for-oman-visa" className="oman-visa-thank-you-btn secondary">
            <FileCheck size={20} />
            New Application
          </Link>
        </div>
      </div>
    </div>
  );
}
