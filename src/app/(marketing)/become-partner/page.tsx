import type { Metadata } from 'next';
import { applyPageSeo } from '@/features/seo/server';
import Link from 'next/link';
import { ArrowRight, Award, Check, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import NavyHeader from '@/components/marketing/Header/NavyHeader';
import NavyFooter from '@/components/marketing/Footer/NavyFooter';
import { FactList, HelpCard, PageShell, SideCard } from '@/components/site/page/PageShell';

const PAGE_METADATA: Metadata = {
  title: 'Become a Partner | Aapka Tourism',
  description: 'Join the Aapka Tourism partner programme for partner prices, priority support and your own booking dashboard.',
};

export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(PAGE_METADATA);
}

const FEATURES = [
  { icon: TrendingUp, title: 'Partner discounts', text: 'Exclusive partner prices on all our packages.' },
  { icon: Zap, title: 'Priority support', text: 'Faster answers from our team in Dubai and Delhi.' },
  { icon: Shield, title: 'Partner dashboard', text: 'Your own dashboard for bookings and clients.' },
  { icon: Users, title: 'Booking management', text: 'Follow every booking in real time.' },
  { icon: Award, title: 'Commissions & invoices', text: 'Track your commission and download invoices.' },
];

const STEPS = [
  { title: 'Subscribe', text: 'Pay the yearly fee securely online.' },
  { title: 'Get your login', text: 'Your partner account is activated straight away.' },
  { title: 'Book at partner prices', text: 'Log in and book holidays for your clients.' },
];

export default function BecomeAgentPage() {
  return (
    <>
      <NavyHeader />
      <PageShell
        kicker="Aapka Partner Programme"
        title="Become an Aapka Partner"
        text="Join our network of travel partners and book Dubai holidays for your clients at partner prices."
        image="/images/stock/traveller-downtown.jpg"
        position="center 40%"
        aside={
          <>
            <SideCard title="Aapka Partner Premium" tone="lift">
              <div className="xp-plan__price">
                <b>AED 110</b>
                <span>per year</span>
              </div>
              <p className="xp-sidecard__text">Best value for Aapka travel partners.</p>
              <Link className="xp-btn xp-btn--brand xp-btn--block" href="/become-partner/subscribe">
                Subscribe now
                <ArrowRight aria-hidden="true" />
              </Link>
              <ul className="xp-plan__trust">
                <li>
                  <Check aria-hidden="true" />
                  Secure payment via CCAvenue
                </li>
                <li>
                  <Check aria-hidden="true" />
                  Instant activation after payment
                </li>
              </ul>
            </SideCard>
            <HelpCard text="Questions about the partner programme? Talk to our team." />
          </>
        }
      >
        <section className="xp-card">
          <h2>What&apos;s included</h2>
          <FactList items={FEATURES} />
        </section>
        <section className="xp-card">
          <h2>How it works</h2>
          <ol className="xp-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="xp-steps__num" aria-hidden="true">
                  {i + 1}
                </span>
                <b>{s.title}</b>
                {s.text}
              </li>
            ))}
          </ol>
        </section>
        <p className="xp-hint">
          Already a partner? <Link href="/agent/login" className="xp-terms-link">Log in here</Link>
        </p>
      </PageShell>
      <NavyFooter />
    </>
  );
}
