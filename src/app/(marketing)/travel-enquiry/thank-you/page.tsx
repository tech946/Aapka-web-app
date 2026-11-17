import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Check, ClipboardCheck, Mail, MessageCircle, Phone, PlaneTakeoff, UserRound } from 'lucide-react';
import DeferredVideo from '@/components/site/DeferredVideo';
import { CONTACT } from '@/components/site/site-config';
import ExHeader from '../../Home/ex/ExHeader';
import { ExFooter } from '../../Home/ex/ExSections';
import { EX_FONTS } from '../../Home/ex/fonts';
import '../../Home/ex/ex.css';
import './thank-you-ex.css';

export const metadata: Metadata = {
  title: 'Enquiry received | Aapka Tourism',
  robots: { index: false },
};

const NEXT_STEPS = [
  { icon: ClipboardCheck, title: 'We read your request', text: 'A Dubai travel expert goes through your dates, travellers and wishes.' },
  { icon: UserRound, title: 'We plan your trip', text: 'You get a tailored plan and price on WhatsApp or email within 24 hours.' },
  { icon: PlaneTakeoff, title: 'You decide', text: 'Change anything you like, then book when it feels right.' },
];

const CONTACTS = [
  { icon: MessageCircle, label: 'WhatsApp', value: CONTACT.uaePhone, href: CONTACT.whatsappHref, external: true },
  { icon: Phone, label: 'Call', value: CONTACT.uaePhone, href: CONTACT.uaePhoneHref, external: false },
  { icon: Mail, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}`, external: false },
];

export default function TravelEnquiryThankYouPage() {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <main className="ty">
        <div className="ty-band" aria-hidden="true">
          <DeferredVideo className="ty-band__video" src="/videos/hero-desert-sunset.mp4" poster="/images/hero/hero-desert-sunset-poster.webp" priority autoPlay muted loop playsInline />
        </div>
        <div className="ty-wrap">
          <section className="ty-card" aria-labelledby="ty-title">
            <span className="ty-icon" aria-hidden="true">
              <Check />
            </span>
            <p className="ty-kicker">Enquiry received</p>
            <h1 id="ty-title">Thank you! Your trip is in good hands.</h1>
            <p className="ty-lead">Our team will get in touch with you within 24 hours.</p>

            <ol className="ty-steps">
              {NEXT_STEPS.map((step, i) => (
                <li key={step.title}>
                  <span className="ty-steps__num" aria-hidden="true">
                    <step.icon />
                  </span>
                  <span className="ty-steps__text">
                    <b>
                      {i + 1}. {step.title}
                    </b>
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>

            <div className="ty-actions">
              <Link href="/holidays" className="ty-btn ty-btn--brand">
                Explore holidays
              </Link>
              <Link href="/travel-enquiry" className="ty-btn ty-btn--line">
                <ArrowLeft aria-hidden="true" />
                New enquiry
              </Link>
            </div>
          </section>

          <section className="ty-help" aria-labelledby="ty-help-title">
            <h2 id="ty-help-title">Need us sooner?</h2>
            <ul>
              {CONTACTS.map((c) => (
                <li key={c.label}>
                  <a href={c.href} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <span className="ty-help__icon" aria-hidden="true">
                      <c.icon />
                    </span>
                    <span className="ty-help__text">
                      <small>{c.label}</small>
                      {c.value}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <ExFooter />
    </div>
  );
}
