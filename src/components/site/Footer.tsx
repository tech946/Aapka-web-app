'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useFooterPackages } from '@/hooks/use-marketing-queries';
import { generateShortSlug } from '@/lib/utils';
import SocialIcon from './SocialIcon';
import { HOLIDAY_TYPES, LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';
import { CONTACT, SOCIALS, categorySlug } from './site-config';
import './styles/theme.css';
import './styles/site.css';
import './ta/ta-chrome.css';

/* Site footer, laid out like tripadvisor.in's: light grey, short link
   columns (muted heading, 14px links), a wide column on the right, then the
   legal row — logo mark, copyright, underlined policy links and the about
   text clamped to two lines with "Read more"; payments + social on the
   right. Styles in ta/ta-chrome.css. */

interface FooterPackage {
  package_id: string;
  package_name: string;
  category_name: string;
  package_days?: number | null;
  package_nights?: number | null;
}

type FooterLink = { label: string; href: string; external?: boolean };

function packageHref(pkg: FooterPackage) {
  const slug = generateShortSlug(pkg.package_name, pkg.package_id, pkg.package_days, pkg.package_nights);
  return `/category/${categorySlug(pkg.category_name)}/${slug}`;
}

const ABOUT =
  'Aapka Tourism is a travel company with offices in Dubai and Delhi, specialising in Dubai and UAE holidays. For over a decade we have planned group tours, family holidays and custom itineraries for more than 10,000 travellers — all-inclusive Dubai packages, UAE tours and desert safaris, any-date packages, Dubai Marina dinner cruises, and Oman visa and exit transport. Our team looks after you before you fly and while you travel, with round-the-clock support, secure card and GPay payments, and partner prices for travel agents through the Aapka Partner programme.';

const COMPANY: FooterLink[] = [
  { label: 'About Us', href: '/About' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Become a Partner', href: '/become-partner' },
  { label: 'B2B Collaboration', href: '/b2b-collaboration' },
  { label: 'Agent Login', href: '/agent/login' },
];

const EXPLORE: FooterLink[] = [
  ...HOLIDAY_TYPES.map((t) => ({ label: t.label, href: holidaysHref(t.key) })),
  { label: LIMITED_DEALS.label, href: holidaysHref(LIMITED_DEALS.key) },
  { label: 'All Holidays', href: '/holidays' },
  { label: 'Oman Tourist Visa', href: '/visas/apply-for-oman-visa' },
  { label: 'Oman Exit Transportation', href: '/oman-transport' },
  { label: 'Submit Your Enquiry', href: '/travel-enquiry' },
];

const POLICY: FooterLink[] = [
  { label: 'Terms and Conditions', href: '/terms-and-conditions' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Refund & Cancellation Policy', href: '/cancellation-policy' },
  { label: 'Disclaimer', href: '/disclaimer' },
];

const TALK: FooterLink[] = [
  { label: `${CONTACT.uaePhone} (UAE)`, href: CONTACT.uaePhoneHref, external: true },
  { label: `${CONTACT.indiaPhone} (India)`, href: CONTACT.indiaPhoneHref, external: true },
  { label: 'WhatsApp us', href: CONTACT.whatsappHref, external: true },
  { label: CONTACT.email, href: `mailto:${CONTACT.email}`, external: true },
];

const PAYMENTS = ['VISA', 'Mastercard', 'Google Pay'];

function Links({ links }: { links: FooterLink[] }) {
  return (
    <ul>
      {links.map((l) =>
        l.external ? (
          <li key={l.href}>
            <a href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {l.label}
            </a>
          </li>
        ) : (
          <li key={l.href + l.label}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ),
      )}
    </ul>
  );
}

export default function Footer() {
  const { offerPackages, tours } = useFooterPackages();
  const offerPkgs = (Array.isArray(offerPackages) ? offerPackages : []) as FooterPackage[];
  const tourPkgs = (Array.isArray(tours) ? tours : []) as FooterPackage[];
  const toLinks = (pkgs: FooterPackage[]) => pkgs.slice(0, 5).map((p) => ({ label: p.package_name, href: packageHref(p) }));
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="at-site desert-ember">
      <footer className="ta-ftr">
        <div className="ta-ftr__in">
          <div className="ta-ftr__cols">
            <div>
              <h3>About Aapka Tourism</h3>
              <Links links={COMPANY} />
            </div>
            <div>
              <h3>Explore</h3>
              <Links links={EXPLORE} />
            </div>
            <div>
              <h3>Policies</h3>
              <Links links={POLICY} />
              <h3>Talk to us</h3>
              <Links links={TALK} />
            </div>
            <div className="ta-ftr__col--wide">
              {offerPkgs.length > 0 && (
                <>
                  <h3>Dubai holiday packages</h3>
                  <Links links={toLinks(offerPkgs)} />
                </>
              )}
              {tourPkgs.length > 0 && (
                <>
                  <h3>UAE tours</h3>
                  <Links links={toLinks(tourPkgs)} />
                </>
              )}
              <h3>Our offices</h3>
              <ul className="ta-ftr__addr">
                <li>{CONTACT.dubaiOffice}</li>
                <li>{CONTACT.indiaOffice.replace(/^India Office:\s*/, '')}</li>
              </ul>
            </div>
          </div>

          <div className="ta-ftr__legal">
            <div className="ta-ftr__brand">
              <img src="/aapka-tourism-logo-dark.png" width="404" height="322" alt="Aapka Tourism" loading="lazy" />
              <div>
                <p className="ta-ftr__copy">© {new Date().getFullYear()} Aapka Tourism. All rights reserved.</p>
                <nav className="ta-ftr__policies" aria-label="Policies">
                  {POLICY.map((l) => (
                    <Link key={l.href} href={l.href}>
                      {l.label}
                    </Link>
                  ))}
                  <Link href="/contact">Contact us</Link>
                </nav>
              </div>
              <div className={'ta-ftr__about' + (aboutOpen ? ' is-open' : '')}>
                <p>{ABOUT}</p>
                <button type="button" className="ta-ftr__more" onClick={() => setAboutOpen((o) => !o)} aria-expanded={aboutOpen}>
                  {aboutOpen ? 'Read less' : 'Read more'}
                  <ChevronDown aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="ta-ftr__side">
              <p className="ta-ftr__pay">
                Pay securely with <b>{PAYMENTS.join(' · ')}</b>
              </p>
              <ul className="ta-ftr__social" aria-label="Follow Aapka Tourism">
                {SOCIALS.map((s) => (
                  <li key={s.id}>
                    <a href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer">
                      <SocialIcon id={s.id} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
