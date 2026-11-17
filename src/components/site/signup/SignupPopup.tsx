'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useIsEmbedded } from '@/hooks/use-is-embedded';
import { ChevronDown, Loader2, X } from 'lucide-react';
import './signup-popup.css';
import { PHONE_COUNTRIES, type PhoneCountryId } from '@/config/phone-countries';

const SEEN_KEY = 'aapka-signup-popup';
const DELAY_MS = 5000;
const HIDDEN_ON = ['/dashboard', '/auth', '/checkout', '/thank-you', '/influencer', '/ref', '/agent'];

const COUNTRIES = PHONE_COUNTRIES;

type CountryId = PhoneCountryId;
type Field = 'name' | 'phone' | 'email';
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasSeen() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {}
}

function validate(name: string, phone: string, email: string): Errors {
  const out: Errors = {};
  if (!name.trim()) out.name = 'Full name is';
  const digits = phone.replace(/\D/g, '');
  if (!digits) out.phone = 'Mobile number is';
  else if (digits.length < 7 || digits.length > 12) out.phone = 'Enter a valid mobile number';
  if (!email.trim()) out.email = 'Email ID is';
  else if (!EMAIL_RE.test(email.trim())) out.email = 'Enter a valid email ID';
  return out;
}

function ErrorText({ text }: { text?: string }) {
  if (!text) return null;
  const required = text.endsWith(' is');
  return (
    <p className="su-error" role="alert">
      {text}
      {required ? <b> required</b> : null}
    </p>
  );
}

export default function SignupPopup() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<CountryId>('ae');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const first = useRef<HTMLInputElement>(null);

  const embedded = useIsEmbedded();
  const hidden = embedded || HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (open || hidden || hasSeen()) return;
    const timer = window.setTimeout(() => {
      if (hasSeen()) return;
      markSeen();
      setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, hidden, open]);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!open) return null;

  const picked = COUNTRIES.find((c) => c.id === country) ?? COUNTRIES[0];

  const clear = (field: Field) => setErrors((cur) => (cur[field] ? { ...cur, [field]: undefined } : cur));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(name, phone, email);
    setErrors(found);
    if (Object.keys(found).length) return;
    const parts = name.trim().split(/\s+/);
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: parts[0],
          lastName: parts.slice(1).join(' ') || '-',
          email: email.trim(),
          phone: `${picked.code} ${phone.replace(/\D/g, '')}`,
          message: 'Newsletter sign-up from the website pop-up',
        }),
      });
      if (!res.ok) throw new Error('failed');
      setDone(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="desert-ember su-root">
      <div className="su-overlay">
        <div className="su-box" role="dialog" aria-modal="true" aria-labelledby="su-title" onClick={(e) => e.stopPropagation()}>
          <div className="su-media" aria-hidden="true">
            <img src="/images/stock/about-woman-views-720.jpg" alt="" />
          </div>

          <div className="su-panel">
            <button type="button" className="su-close" onClick={() => setOpen(false)} aria-label="Close">
              <X aria-hidden="true" />
            </button>

            <h2 className="su-title" id="su-title">
              <span>Join a community of</span>
              <b>10,000+ happy travellers</b>
            </h2>

            {done ? (
              <div className="su-done">
                <p>Thank you for subscribing! Our travel deals and holiday ideas will reach your inbox soon.</p>
                <button type="button" className="su-submit" onClick={() => setOpen(false)}>
                  Continue browsing
                </button>
              </div>
            ) : (
              <>
                <p className="su-sub">Get the latest Dubai holiday deals, new package announcements, travel ideas &amp; a whole lot more…</p>

                <form className="su-form" onSubmit={submit} noValidate>
                  <p className="su-form__title">Get in touch with us</p>

                  <div className="su-field">
                    <input
                      ref={first}
                      className={'su-input' + (errors.name ? ' is-error' : '')}
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="Full Name*"
                      aria-label="Full name"
                      aria-invalid={!!errors.name}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clear('name');
                      }}
                    />
                    <ErrorText text={errors.name} />
                  </div>

                  <div className="su-field">
                    <div className={'su-phone' + (errors.phone ? ' is-error' : '')}>
                      <span className="su-phone__legend">Mobile No.*</span>
                      <label className="su-phone__country">
                        <img src={picked.flag} width="24" height="16" alt="" />
                        <ChevronDown aria-hidden="true" />
                        <select value={country} onChange={(e) => setCountry(e.target.value as CountryId)} aria-label="Country code">
                          {COUNTRIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className="su-phone__code">{picked.code}</span>
                      <input
                        className="su-phone__input"
                        type="tel"
                        name="phone"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        aria-label="Mobile number"
                        aria-invalid={!!errors.phone}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/[^\d\s]/g, ''));
                          clear('phone');
                        }}
                      />
                    </div>
                    <ErrorText text={errors.phone} />
                  </div>

                  <div className="su-field">
                    <input
                      className={'su-input' + (errors.email ? ' is-error' : '')}
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="Email ID*"
                      aria-label="Email ID"
                      aria-invalid={!!errors.email}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clear('email');
                      }}
                    />
                    <ErrorText text={errors.email} />
                  </div>

                  {failed ? <p className="su-error su-error--form">Something went wrong. Please try again.</p> : null}

                  <button type="submit" className="su-submit" disabled={busy}>
                    {busy ? <Loader2 className="su-spin" aria-hidden="true" /> : null}
                    Subscribe
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
