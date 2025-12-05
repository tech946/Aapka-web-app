import React from 'react';
import './founder.css';

export default function FounderMessagePage() {
  return (
    <main className='page'>
      <article className='card'>
        <header className='header'>
          <h1 className='title'>Founder & CEO Message</h1>

          <div className='meta'>
            <span>
              From: <strong>Kamal Pandey</strong>
            </span>
            <span>Founder & CEO, AAPKA Tourism</span>
          </div>
        </header>

        <section className='intro'>
          <p>Dear Travelers, Partners & Well-Wishers,</p>

          <p>
            Namaste & Warm Greetings from Dubai. AAPKA Tourism was born from a
            simple dream — to make Dubai feel like home for every traveler.
          </p>

          <p>
            Whether you visit once or many times, our mission is to ensure you
            feel welcomed, cared for, and valued at every step.
          </p>

          <p>
            I didn’t want to build just another travel agency. I wanted to
            create a place where:
          </p>

          <ul className='bullets'>
            <li>Families feel safe</li>
            <li>Couples feel special</li>
            <li>Travelers feel guided</li>
            <li>Every guest feels emotionally connected</li>
          </ul>

          <p>
            Because at AAPKA Tourism…{' '}
            <strong>
              We don’t just serve clients, we connect with emotions.
            </strong>
          </p>

          <p>
            Over the years, we expanded — holiday packages, visas, safaris,
            tours, hotels, transfers, yachts — but one thing never changed: our
            commitment to honesty, transparency & 5-star service.
          </p>

          <p>
            As an entrepreneur in Dubai, I believe:
            <br />
            <strong>
              “Success begins with trust, and trust begins with responsibility.”
            </strong>
          </p>

          <p>
            We ensure smooth, memorable experiences — from visas to airport
            pickups to the last drop-off.
          </p>

          <p>
            My vision is to make AAPKA Tourism a brand people proudly recommend
            — a brand of care, comfort & commitment.
          </p>

          <p>
            Thank you to all customers, partners & future travelers for trusting
            us. Your happiness is our achievement. Your trust is our reward.
            Your smile is our success.
          </p>

          <p>
            I look forward to welcoming you to Dubai soon. Until then, stay
            blessed and keep traveling.
          </p>

          <p>
            <strong>Warm Regards,</strong>
            <br />
            Kamal Pandey
            <br />
            Founder & CEO — AAPKA Tourism
          </p>
        </section>

        <footer className='footer'>
          <p>
            © {new Date().getFullYear()} AAPKA Tourism. All rights reserved.
          </p>
        </footer>
      </article>
    </main>
  );
}
