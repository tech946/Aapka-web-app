// File: app/disclaimer/page.tsx

import React from 'react';
import './disclaimer.css'; // <-- using separate CSS file

export default function DisclaimerPage() {
  return (
    <main className='page'>
      <article className='card'>
        <header className='header'>
          <h1 className='title'>Disclaimer — AAPKA Tourism</h1>

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
            The information provided on <strong>AAPKA Tourism</strong> (“we,”
            “our,” “us”) website is intended for general informational purposes
            about our Dubai travel packages, UAE visa services, desert safari
            tours, city tours, Abu Dhabi tours, hotel booking, airport
            transfers, and yacht rentals.
          </p>
          <p>
            By using our website, you agree to this Disclaimer in full. If you
            disagree, please do not use our website.
          </p>
        </section>

        <ol className='list'>
          <li>
            <h2 className='sectionTitle'>1. Accuracy of Information</h2>
            <ul className='bullets'>
              <li>
                While we strive to provide accurate and up-to-date information,
                AAPKA Tourism does not guarantee completeness, accuracy, or
                timeliness.
              </li>
              <li>
                Prices, availability, and itineraries are subject to change
                without notice.
              </li>
            </ul>
          </li>

          <li>
            <h2 className='sectionTitle'>2. No Financial or Legal Advice</h2>
            <ul className='bullets'>
              <li>
                Information on this website does not constitute financial, legal
                or professional advice.
              </li>
              <li>
                Travelers should verify visa requirements, hotel details, or
                travel arrangements with official authorities.
              </li>
            </ul>
          </li>

          <li>
            <h2 className='sectionTitle'>3. Third-Party Services</h2>
            <ul className='bullets'>
              <li>
                We may reference third-party providers such as hotels, airlines,
                desert safari operators, and yacht rentals.
              </li>
              <li>
                We do not control or guarantee their services — use them at your
                own discretion.
              </li>
            </ul>
          </li>

          <li>
            <h2 className='sectionTitle'>4. UAE Visa Disclaimer</h2>
            <ul className='bullets'>
              <li>
                We assist in UAE visa applications but **cannot** guarantee visa
                approval. Issuance is solely at the discretion of UAE
                Immigration.
              </li>
              <li>
                Travelers must provide accurate personal information and meet
                all requirements.
              </li>
            </ul>
          </li>

          <li>
            <h2 className='sectionTitle'>5. Travel Risks</h2>
            <ul className='bullets'>
              <li>
                Travel involves risks such as health concerns, natural events,
                delays, political issues, or unforeseen circumstances.
              </li>
              <li>
                AAPKA Tourism is not liable for losses, injuries, or
                inconvenience.
              </li>
              <li>
                We recommend travel insurance for emergencies, cancellations,
                and lost belongings.
              </li>
            </ul>
          </li>

          <li>
            <h2 className='sectionTitle'>6. Website Use</h2>
            <ul className='bullets'>
              <li>
                All content on our website is protected by copyright and cannot
                be reproduced.
              </li>
              <li>Use the website only for lawful purposes.</li>
            </ul>
          </li>

          <li>
            <h2 className='sectionTitle'>7. Changes to Disclaimer</h2>
            <ul className='bullets'>
              <li>
                AAPKA Tourism may update this Disclaimer at any time without
                notice.
              </li>
              <li>Please check this page regularly for updates.</li>
            </ul>
          </li>

          <li>
            <h2 className='sectionTitle'>8. Governing Law</h2>
            <ul className='bullets'>
              <li>Governed by UAE laws.</li>
              <li>Any disputes shall be handled under UAE jurisdiction.</li>
            </ul>
          </li>

          <li>
            <h2 className='sectionTitle'>9. Contact Us</h2>
            <div className='contactWrap'>
              <p>
                For inquiries about Dubai holiday packages, UAE visas, desert
                safari, city tours, hotel booking, or yacht rentals:
              </p>

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
