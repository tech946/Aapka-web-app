'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Building2, Compass, Headset, Loader2, Mail, MapPin, Navigation, Phone, PhoneCall, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import ExHeader from '../Home/ex/ExHeader';
import { ExFooter } from '../Home/ex/ExSections';
import { EX_FONTS } from '../Home/ex/fonts';
import { CONTACT } from '@/components/site/site-config';
import '../Home/ex/ex.css';
import './contact-ex.css';

type Office = {
  id: string;
  tag: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  phoneHref: string;
  query: string;
};

const OFFICES: Office[] = [
  {
    id: 'dubai',
    tag: 'Head Office',
    city: 'Dubai',
    area: 'Bur Dubai, UAE',
    address: 'Office #10118, CBD Bank Building, Near Sharaf DG Metro Exit 1, Al Mankhool, Bur Dubai, UAE',
    phone: CONTACT.uaePhone,
    phoneHref: CONTACT.uaePhoneHref,
    query: 'Office #10118, CBD Bank Building, Near Sharaf DG Metro Exit 1, Al Mankhool, Bur Dubai, UAE',
  },
  {
    id: 'delhi',
    tag: 'India Office',
    city: 'New Delhi',
    area: 'Nehru Place, Delhi',
    address: '1522 B, Hemkunt Chambers 89, Nehru Place, Delhi 110019',
    phone: CONTACT.indiaPhone,
    phoneHref: CONTACT.indiaPhoneHref,
    query: '1522 B, Hemkunt Chambers 89, Nehru Place, Delhi 110019',
  },
];

const DESKS = [
  { title: 'For guests in the UAE & worldwide', phone: CONTACT.uaePhone, phoneHref: CONTACT.uaePhoneHref },
  { title: 'For guests in India', phone: CONTACT.indiaPhone, phoneHref: CONTACT.indiaPhoneHref },
];

const FEATURES = [
  { icon: Compass, title: 'Planned by locals', text: 'Our team lives and works in Dubai, so every plan is built on the ground.' },
  { icon: Building2, title: 'Offices in Dubai & Delhi', text: 'Visit us in Bur Dubai or at Nehru Place, New Delhi.' },
  { icon: Users, title: 'City by city, day by day', text: 'Holidays planned for travellers from India & the world.' },
  { icon: Headset, title: '24x7 trip support', text: 'A dedicated number for help at any hour of your trip.' },
];

const mapsLink = (q: string) => `https://maps.google.com/?q=${encodeURIComponent(q)}`;
const mapsEmbed = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed&z=15`;

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', message: '' };

function OfficeCard({ office }: { office: Office }) {
  const share = async () => {
    const text = `Aapka Tourism ${office.city}: ${office.address}`;
    const url = mapsLink(office.query);
    try {
      if (navigator.share) {
        await navigator.share({ title: `Aapka Tourism ${office.city}`, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success('Address copied');
    } catch {}
  };

  return (
    <article className="cx-card" id={office.id}>
      <div className="cx-card__top">
        <span className="cx-card__tag">{office.tag}</span>
        <div className="cx-card__acts">
          <a href={mapsLink(office.query)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${office.city} office in Google Maps`}>
            <MapPin aria-hidden="true" />
          </a>
          <button type="button" onClick={share} aria-label={`Share ${office.city} office address`}>
            <Share2 aria-hidden="true" />
          </button>
        </div>
      </div>
      <h3 className="cx-card__city">{office.city}</h3>
      <a className="cx-card__phone" href={office.phoneHref}>
        {office.phone}
      </a>
      <p className="cx-card__addr">{office.address}</p>
      <div className="cx-card__map">
        <iframe src={mapsEmbed(office.query)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`Aapka Tourism ${office.city} office on the map`} />
      </div>
      <div className="cx-card__btns">
        <a className="cx-btn cx-btn--brand" href={mapsLink(office.query)} target="_blank" rel="noopener noreferrer">
          <Navigation aria-hidden="true" />
          Get Directions
        </a>
        <a className="cx-btn cx-btn--line" href={office.phoneHref}>
          <Phone aria-hidden="true" />
          Call Office
        </a>
      </div>
    </article>
  );
}

export default function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to submit query');
      toast.success('Thank you! We will call you soon.');
      setForm(EMPTY);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <main className="cx">
        <div className="cx-band" aria-hidden="true">
          <Image className="cx-band__img" src="/images/stock/dest-dubai.jpg" alt="" fill priority sizes="100vw" />
        </div>
        <div className="cx-wrap">
          <div className="cx-grid">
            <div className="cx-main">
              <div className="cx-intro">
                <h1>Find your nearest Aapka Tourism office</h1>
                <div className="cx-note">
                  <span className="cx-note__icon" aria-hidden="true">
                    <MapPin />
                  </span>
                  <p>
                    <b>
                      We&apos;re in <a href="#dubai">Dubai</a> &amp; <a href="#delhi">New Delhi</a>.
                    </b>
                    <span>Visit your nearest office and plan your Dubai holiday with our team.</span>
                  </p>
                </div>
              </div>

              {OFFICES.map((o) => (
                <OfficeCard key={o.id} office={o} />
              ))}
            </div>

            <aside className="cx-side">
              <section className="cx-call" id="call-back" aria-labelledby="cx-call-title">
                <h2 id="cx-call-title">Want us to call you?</h2>
                <form className="cx-form" onSubmit={submit} noValidate>
                  <div className="cx-form__row">
                    <label className="cx-field">
                      <span>First Name*</span>
                      <input name="firstName" autoComplete="given-name" value={form.firstName} onChange={change} required />
                    </label>
                    <label className="cx-field">
                      <span>Last Name*</span>
                      <input name="lastName" autoComplete="family-name" value={form.lastName} onChange={change} required />
                    </label>
                  </div>
                  <label className="cx-field">
                    <span>Mobile No.*</span>
                    <input type="tel" name="phone" autoComplete="tel" placeholder="+971" value={form.phone} onChange={change} required />
                  </label>
                  <label className="cx-field">
                    <span>Email ID*</span>
                    <input type="email" name="email" autoComplete="email" value={form.email} onChange={change} required />
                  </label>
                  <label className="cx-field">
                    <span>Message</span>
                    <textarea name="message" rows={3} placeholder="Tell us about your trip" value={form.message} onChange={change} />
                  </label>
                  <button type="submit" className="cx-btn cx-btn--brand cx-btn--block" disabled={busy}>
                    {busy ? <Loader2 className="cx-spin" aria-hidden="true" /> : <PhoneCall aria-hidden="true" />}
                    {busy ? 'Sending…' : 'Request Call Back'}
                  </button>
                </form>

                {DESKS.map((d) => (
                  <ul className="cx-links" key={d.title}>
                    <li className="cx-links__head">{d.title}</li>
                    <li>
                      <span aria-hidden="true">
                        <Phone />
                      </span>
                      <a href={d.phoneHref}>{d.phone}</a>
                    </li>
                    <li>
                      <span aria-hidden="true">
                        <Mail />
                      </span>
                      <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                    </li>
                  </ul>
                ))}
              </section>

              <section className="cx-why" aria-labelledby="cx-why-title">
                <h2 id="cx-why-title">Why travel with Aapka Tourism</h2>
                <ul>
                  {FEATURES.map((f) => (
                    <li key={f.title}>
                      <span className="cx-why__icon" aria-hidden="true">
                        <f.icon />
                      </span>
                      <span>
                        <b>{f.title}</b>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </div>

        <div className="cx-dock">
          <span>
            <small>Call us</small>
            <a href={CONTACT.uaePhoneHref}>{CONTACT.uaePhone}</a>
          </span>
          <a className="cx-btn cx-btn--brand" href="#call-back">
            <PhoneCall aria-hidden="true" />
            Request Call Back
          </a>
        </div>
      </main>
      <ExFooter />
    </div>
  );
}
