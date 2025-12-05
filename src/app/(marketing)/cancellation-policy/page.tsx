import React from 'react';
import './cancellation.css';

export default function CancellationPolicyPage() {
  return (
    <main className='page'>
      <article className='card'>
        <header className='header'>
          <h1 className='title'>
            Refund & Cancellation Policy — AAPKA Tourism
          </h1>

          <div className='meta'>
            <span>
              Effective Date: <strong>01-10-2025</strong>
            </span>
            <span>
              Website:{' '}
              <a href='https://www.aapkatourism.com' className='link'>
                www.aapkatourism.com
              </a>
            </span>
          </div>
        </header>

        <section className='intro'>
          <p>
            At <strong>AAPKA Tourism</strong>, we strive to provide smooth and
            hassle-free travel experiences. This Refund & Cancellation Policy
            explains the terms for cancellations, refunds, and rescheduling for
            Dubai holiday packages, UAE visa services, desert safari tours, city
            tours, Abu Dhabi tours, hotel bookings, airport transfers, and yacht
            rentals.
          </p>
          <p>By booking with us, you agree to this policy.</p>
        </section>

        <ol className='list'>
          {/* 1. Booking & Advance Payment */}
          <li>
            <h2 className='sectionTitle'>1. Booking & Advance Payment</h2>
            <ul className='bullets'>
              <li>
                Bookings for holiday packages, tours, and hotel reservations
                require a minimum advance payment to confirm.
              </li>
              <li>
                Payments may be made via credit/debit cards, online gateways, or
                bank transfers.
              </li>
              <li>
                A booking is confirmed only after payment is received and an
                official Booking Confirmation is issued.
              </li>
            </ul>
          </li>

          {/* 2. Cancellation Policy */}
          <li>
            <h2 className='sectionTitle'>2. Cancellation Policy</h2>

            <h3 className='subHeading'>🔹 Dubai Holiday Packages</h3>
            <ul className='bullets'>
              <li>
                15+ days before travel: <strong>75% refund</strong>
              </li>
              <li>
                7–14 days before travel: <strong>50% refund</strong>
              </li>
              <li>
                3–6 days before travel: <strong>25% refund</strong>
              </li>
              <li>
                Within 48 hours: <strong>No refund</strong>
              </li>
            </ul>

            <h3 className='subHeading'>🔹 Desert Safari / City Tours</h3>
            <ul className='bullets'>
              <li>
                24+ hours before tour: <strong>50% refund</strong>
              </li>
              <li>
                Within 24 hours: <strong>No refund</strong>
              </li>
            </ul>

            <h3 className='subHeading'>🔹 Hotel Booking</h3>
            <ul className='bullets'>
              <li>Policies vary depending on the hotel.</li>
              <li>Some reservations may be non-refundable.</li>
            </ul>

            <h3 className='subHeading'>🔹 UAE Visa Services</h3>
            <ul className='bullets'>
              <li>
                No refund once the visa application is submitted to UAE
                Immigration.
              </li>
              <li>
                Delays or rejection by Immigration are beyond our control.
              </li>
            </ul>

            <h3 className='subHeading'>🔹 Airport Transfers & Yacht Rentals</h3>
            <ul className='bullets'>
              <li>24+ hours before service: Refund applicable</li>
              <li>
                Within 24 hours: <strong>No refund</strong>
              </li>
            </ul>
          </li>

          {/* 3. Rescheduling Policy */}
          <li>
            <h2 className='sectionTitle'>3. Rescheduling Policy</h2>
            <ul className='bullets'>
              <li>Requests must be submitted at least 48 hours in advance.</li>
              <li>
                Subject to availability and may involve additional charges.
              </li>
            </ul>
          </li>

          {/* 4. Refund Process */}
          <li>
            <h2 className='sectionTitle'>4. Refund Process</h2>
            <ul className='bullets'>
              <li>
                Refund requests can be submitted via WhatsApp, email, or contact
                form.
              </li>
              <li>
                Approved refunds are processed using the original payment
                method.
              </li>
              <li>
                Processing time: <strong>7–14 business days</strong>.
              </li>
            </ul>
          </li>

          {/* 5. Non-Refundable Situations */}
          <li>
            <h2 className='sectionTitle'>5. Non-Refundable Situations</h2>
            <ul className='bullets'>
              <li>Failure to show up on the scheduled date.</li>
              <li>
                Delays or cancellations due to natural disasters, political
                unrest, flight issues, or unforeseen events.
              </li>
              <li>
                Visa rejection due to incorrect or incomplete traveler
                information.
              </li>
            </ul>
          </li>

          {/* 6. Important Notes */}
          <li>
            <h2 className='sectionTitle'>6. Important Notes</h2>
            <ul className='bullets'>
              <li>Refunds may include deductions for processing fees.</li>
              <li>
                AAPKA Tourism may modify this policy anytime without prior
                notice. Updated terms will be posted on our website.
              </li>
            </ul>
          </li>

          {/* 7. Contact Us */}
          <li>
            <h2 className='sectionTitle'>7. Contact Us</h2>
            <div className='contactWrap'>
              <p>For refund or cancellation inquiries, contact us:</p>

              <ul className='contactList'>
                <li>
                  WhatsApp (UAE):{' '}
                  <a href='https://wa.me/971567809460' className='tel'>
                    +971 567809460
                  </a>
                </li>
                <li>
                  India Calling:{' '}
                  <a href='tel:+917042857575' className='tel'>
                    +91 7042857575
                  </a>
                </li>
                <li>
                  Email:{' '}
                  <a href='mailto:info@aapkatourism.com' className='link'>
                    info@aapkatourism.com
                  </a>
                </li>
                <li>
                  Website:{' '}
                  <a href='https://www.aapkatourism.com' className='link'>
                    www.aapkatourism.com
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ol>

        <footer className='footer'>
          <p>
            © {new Date().getFullYear()} AAPKA Tourism. All rights reserved.
          </p>
        </footer>
      </article>
    </main>
  );
}
