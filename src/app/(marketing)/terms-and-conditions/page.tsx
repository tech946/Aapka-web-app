import React from 'react';
import './terms.css';

export default function TermsConditionsPage() {
  return (
    <main className='page'>
      <article className='card'>
        <header className='header'>
          <h1 className='title'>Terms & Conditions — AAPKA Tourism</h1>

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
            Welcome to <strong>AAPKA Tourism</strong>, your trusted Dubai travel
            partner. By using our website or services, you agree to comply with
            these Terms & Conditions.
          </p>
        </section>

        <ol className='list'>
          {/* 1. Booking */}
          <li>
            <h2 className='sectionTitle'>1. Booking & Reservations</h2>
            <ul className='bullets'>
              <li>
                All bookings for holiday packages, visas, tours, hotels,
                transfers, and yacht rentals are subject to availability.
              </li>
              <li>Prices may change without prior notice.</li>
              <li>
                A booking is confirmed only after receiving an official
                confirmation message.
              </li>
            </ul>
          </li>

          {/* 2. Payment */}
          <li>
            <h2 className='sectionTitle'>2. Payment Terms</h2>
            <ul className='bullets'>
              <li>
                Payments can be made via credit/debit cards, bank transfers, or
                online gateways.
              </li>
              <li>A minimum advance may be required to confirm bookings.</li>
              <li>Full payment must be completed before the service begins.</li>
              <li>Payments are non-refundable unless stated otherwise.</li>
            </ul>
          </li>

          {/* 3. Cancellation */}
          <li>
            <h2 className='sectionTitle'>3. Cancellation & Refund Policy</h2>
            <ul className='bullets'>
              <li>Cancellations must be submitted via email or WhatsApp.</li>
              <li>Holiday Packages: Refund as per package rules.</li>
              <li>
                Visa Services: No refund after submission to UAE Immigration.
              </li>
              <li>Tours: Refund only if cancellation is before 48 hours.</li>
              <li>Refunds are processed via original payment method.</li>
            </ul>
          </li>

          {/* 4. Visa Requirements */}
          <li>
            <h2 className='sectionTitle'>4. Visa & Travel Requirements</h2>
            <ul className='bullets'>
              <li>AAPKA Tourism cannot guarantee visa approval.</li>
              <li>
                Travelers must submit accurate passport and personal details.
              </li>
              <li>
                Any issues due to incorrect information are the traveler’s
                responsibility.
              </li>
            </ul>
          </li>

          {/* 5. Liability */}
          <li>
            <h2 className='sectionTitle'>5. Liability & Responsibility</h2>
            <ul className='bullets'>
              <li>
                We act as a facilitator and do not operate flights, hotels,
                safaris, or yachts.
              </li>
              <li>
                We are not liable for losses due to delays, natural disasters,
                political issues, or service provider failures.
              </li>
              <li>Travelers must safeguard their belongings and documents.</li>
            </ul>
          </li>

          {/* 6. Insurance */}
          <li>
            <h2 className='sectionTitle'>6. Travel Insurance</h2>
            <ul className='bullets'>
              <li>We strongly recommend travel insurance for all travelers.</li>
            </ul>
          </li>

          {/* 7. Website Use */}
          <li>
            <h2 className='sectionTitle'>
              7. Website Use & Intellectual Property
            </h2>
            <ul className='bullets'>
              <li>Website content is protected under copyright.</li>
              <li>You agree to use the website for lawful purposes only.</li>
            </ul>
          </li>

          {/* 8. Third Party */}
          <li>
            <h2 className='sectionTitle'>8. Third-Party Links</h2>
            <ul className='bullets'>
              <li>
                We are not responsible for the reliability or content of
                third-party sites.
              </li>
            </ul>
          </li>

          {/* 9. Changes */}
          <li>
            <h2 className='sectionTitle'>9. Changes to Terms</h2>
            <ul className='bullets'>
              <li>Terms may be updated anytime without notice.</li>
              <li>Updated versions will be posted here.</li>
            </ul>
          </li>

          {/* 10. Law */}
          <li>
            <h2 className='sectionTitle'>10. Governing Law</h2>
            <ul className='bullets'>
              <li>Governed by UAE laws.</li>
              <li>All disputes fall under UAE jurisdiction.</li>
            </ul>
          </li>

          {/* 11. Contact */}
          <li>
            <h2 className='sectionTitle'>11. Contact Us</h2>
            <ul className='contactList'>
              <li>WhatsApp (UAE): +971 567809460</li>
              <li>India Calling: +91 7042857575</li>
              <li>Email: info@aapkatourism.com</li>
              <li>Website: www.aapkatourism.com</li>
            </ul>
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
