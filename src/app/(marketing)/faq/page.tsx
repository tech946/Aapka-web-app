import type { Metadata } from 'next';
import { applyPageSeo } from '@/features/seo/server';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Mail, MessageCircle, Phone, Plus } from 'lucide-react';
import ExHeader from '../Home/ex/ExHeader';
import { ExFooter } from '../Home/ex/ExSections';
import { EX_FONTS } from '../Home/ex/fonts';
import { CONTACT } from '@/components/site/site-config';
import { FAQ_ITEMS } from './foreigner/content';
import '../Home/ex/ex.css';
import './faq-ex.css';

const PAGE_METADATA: Metadata = {
  title: 'FAQs | Aapka Tourism',
  description: 'Answers to common questions about booking, dates, visas, hotels and help during your Dubai holiday with Aapka Tourism.',
};

export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(PAGE_METADATA);
}

const LINKS = [
  { href: '/travel-enquiry', label: 'Plan a custom trip' },
  { href: '/cancellation-policy', label: 'Cancellation policy' },
  { href: '/become-partner', label: 'Become a partner' },
  { href: '/contact', label: 'Our offices' },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/\n/g, ' ') },
  })),
};

export default function FaqPage() {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <main className="xf">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <div className="xf-band" aria-hidden="true">
          <Image className="xf-band__img" src="/images/stock/faq-dubai-frame.jpg" alt="" fill priority sizes="100vw" />
        </div>
        <div className="xf-wrap">
          <div className="xf-grid">
            <div className="xf-main">
              <div className="xf-intro">
                <p className="xf-kicker">Help centre</p>
                <h1>Frequently asked questions</h1>
                <p className="xf-lead">Quick answers about booking, dates, visas and help during your trip. Can&apos;t find yours? Our Dubai team is a message away.</p>
              </div>

              <section className="xf-card" aria-label="Questions">
                {FAQ_ITEMS.map((f, i) => (
                  <details key={f.q} className="xf-item" open={i === 0}>
                    <summary>
                      <span className="xf-item__num" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="xf-item__q">
                        <small>{f.topic}</small>
                        {f.q}
                      </span>
                      <span className="xf-item__icon" aria-hidden="true">
                        <Plus />
                      </span>
                    </summary>
                    <div className="xf-item__a">
                      {f.a.split('\n').map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </details>
                ))}
              </section>
            </div>

            <aside className="xf-side">
              <section className="xf-help" aria-labelledby="xf-help-title">
                <h2 id="xf-help-title">Still have a question?</h2>
                <p>Message us and we&apos;ll usually reply within a few hours.</p>
                <a className="xf-btn xf-btn--brand" href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" />
                  Chat on WhatsApp
                </a>
                <ul className="xf-reach">
                  <li>
                    <span aria-hidden="true">
                      <Phone />
                    </span>
                    <span>
                      <small>UAE</small>
                      <a href={CONTACT.uaePhoneHref}>{CONTACT.uaePhone}</a>
                    </span>
                  </li>
                  <li>
                    <span aria-hidden="true">
                      <Phone />
                    </span>
                    <span>
                      <small>India</small>
                      <a href={CONTACT.indiaPhoneHref}>{CONTACT.indiaPhone}</a>
                    </span>
                  </li>
                  <li>
                    <span aria-hidden="true">
                      <Mail />
                    </span>
                    <span>
                      <small>Email</small>
                      <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                    </span>
                  </li>
                </ul>
              </section>

              <nav className="xf-links" aria-label="Useful links">
                <h2>Useful links</h2>
                <ul>
                  {LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}>
                        {l.label}
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          </div>
        </div>
      </main>
      <ExFooter />
    </div>
  );
}
