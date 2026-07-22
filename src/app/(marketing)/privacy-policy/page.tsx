import React from 'react';
import './privacy.css';

export default function PrivacyPolicyPage() {
  return (
    <main className='page'>
      <article className='card'>
        <header className='header'>
          <h1 className='title'>Privacy Policy — AAPKA Tourism</h1>

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
            <strong>AAPKA Tourism</strong> (“we,” “our,” “us”) respects your
            privacy and is committed to protecting the personal information of
            all users who visit our website or use our Dubai holiday packages,
            UAE visa services, desert safari tours, city tours, Abu Dhabi tours,
            hotel bookings, airport transfers, and yacht rentals.
          </p>
          <p>
            By using our website or services, you agree to this Privacy Policy.
          </p>
        </section>

        <ol className='list'>
          {/* 1. Information We Collect */}
          <li>
            <h2 className='sectionTitle'>1. Information We Collect</h2>
            <ul className='bullets'>
              <li>
                <strong>Personal Information:</strong> Name, email, phone
                number, passport details, visa details, payment information.
              </li>
              <li>
                <strong>Travel Information:</strong> Package selections, tour
                preferences, hotel choices, pick-up/drop-off details.
              </li>
              <li>
                <strong>Technical Information:</strong> IP address, browser
                type, device info, website usage, cookies, analytics data.
              </li>
            </ul>
            <p>
              This information helps us provide personalized and seamless travel
              services.
            </p>
          </li>

          {/* 2. How We Use Your Information */}
          <li>
            <h2 className='sectionTitle'>2. How We Use Your Information</h2>
            <ul className='bullets'>
              <li>
                To process bookings for holiday packages, visas, tours, hotel
                reservations, transfers, and yacht rentals.
              </li>
              <li>
                To provide updates regarding bookings, payments, or travel
                arrangements.
              </li>
              <li>
                To improve our website, services, and customer experience.
              </li>
              <li>To send promotions and newsletters (only with consent).</li>
              <li>To comply with UAE immigration and tourism regulations.</li>
            </ul>
          </li>

          {/* 3. Data Sharing & Third Parties */}
          <li>
            <h2 className='sectionTitle'>
              3. Data Sharing & Third-Party Services
            </h2>
            <ul className='bullets'>
              <li>
                We may share your data with hotels, airlines, safari operators,
                payment gateways, and other service partners strictly as needed
                for bookings.
              </li>
              <li>We do NOT sell or trade your personal information.</li>
              <li>
                Analytics and marketing tools may collect data through cookies
                or tracking pixels.
              </li>
            </ul>
          </li>

          {/* 4. Cookies */}
          <li>
            <h2 className='sectionTitle'>4. Cookies & Tracking</h2>
            <ul className='bullets'>
              <li>
                We use cookies to improve performance, personalize experience,
                and understand user behavior.
              </li>
              <li>
                You may disable cookies in your browser, but some features may
                not function correctly.
              </li>
            </ul>
          </li>

          {/* 5. Data Security */}
          <li>
            <h2 className='sectionTitle'>5. Data Security</h2>
            <ul className='bullets'>
              <li>
                We implement industry-standard measures to protect your
                information from unauthorized access and misuse.
              </li>
              <li>
                However, no online system is 100% secure — using our platform
                means you accept these risks.
              </li>
            </ul>
          </li>

          {/* 6. Your Rights */}
          <li>
            <h2 className='sectionTitle'>6. Your Rights</h2>
            <ul className='bullets'>
              <li>
                You may request access, correction, or deletion of your personal
                information.
              </li>
              <li>
                You may opt out of marketing communications anytime by
                contacting us at:{' '}
                <a href='mailto:info@aapkatourism.com' className='link'>
                  info@aapkatourism.com
                </a>
              </li>
            </ul>
          </li>

          {/* 7. Children's Privacy */}
          <li>
            <h2 className='sectionTitle'>7. Children’s Privacy</h2>
            <ul className='bullets'>
              <li>Our services are not intended for children under 18.</li>
              <li>We do not knowingly collect information from minors.</li>
            </ul>
          </li>

          {/* 8. Changes */}
          <li>
            <h2 className='sectionTitle'>8. Changes to Privacy Policy</h2>
            <ul className='bullets'>
              <li>AAPKA Tourism may update this policy from time to time.</li>
              <li>
                Updates will be posted here with a revised effective date.
              </li>
              <li>We recommend checking this page regularly.</li>
            </ul>
          </li>

          {/* 9. Contact */}
          <li>
            <h2 className='sectionTitle'>9. Contact Us</h2>

            <div className='contactWrap'>
              <p>For inquiries regarding this Privacy Policy, contact us:</p>

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
