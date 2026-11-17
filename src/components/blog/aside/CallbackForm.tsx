'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Phone } from 'lucide-react';
import { PHONE_COUNTRIES, type PhoneCountryId } from '@/config/phone-countries';
import type { BlogsContent } from '@/features/cms/pages/blogs';
import { cmsSection, cmsText } from '@/features/cms/preview/markers';

type Field = 'name' | 'phone' | 'email';
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name: string, phone: string, email: string): Errors {
  const errors: Errors = {};
  const digits = phone.replace(/\D/g, '');
  if (!name.trim()) errors.name = 'Enter your full name';
  if (digits.length < 7 || digits.length > 12) errors.phone = 'Enter a valid mobile number';
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email';
  return errors;
}

export function CallbackForm({ content }: { content: BlogsContent['callback'] }) {
  const [name, setName] = useState('');
  const [countryId, setCountryId] = useState<PhoneCountryId>('in');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const country = PHONE_COUNTRIES.find((c) => c.id === countryId) ?? PHONE_COUNTRIES[0];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(name, phone, email);
    setErrors(found);
    if (Object.keys(found).length) return;

    const [firstName, ...rest] = name.trim().split(/\s+/);
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName: rest.join(' ') || '-',
          email: email.trim(),
          phone: `${country.code} ${phone.replace(/\D/g, '')}`,
          message: `Call-back request from the blog${newsletter ? ' · subscribed to newsletter' : ''}`,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('sent');
    } catch {
      setStatus('failed');
    }
  };

  if (status === 'sent') {
    return (
      <section className='bl-widget bl-callback bl-callback--done'>
        <CheckCircle2 size={36} aria-hidden />
        <h2 className='bl-widget__title'>{content.thanksTitle}</h2>
        <p>{content.thanksText}</p>
      </section>
    );
  }

  return (
    <section className='bl-widget bl-callback' {...cmsSection('callback', 'Contact form')}>
      <h2 className='bl-widget__title' {...cmsText('callback.title')}>
        {content.title}
      </h2>
      <p className='bl-callback__intro' {...cmsText('callback.text')}>
        {content.text}
      </p>

      <form onSubmit={submit} noValidate>
        <label className={`bl-input${errors.name ? ' has-error' : ''}`}>
          <span>Full Name*</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete='name' />
        </label>
        {errors.name && <p className='bl-input__error'>{errors.name}</p>}

        <div className={`bl-input bl-input--phone${errors.phone ? ' has-error' : ''}`}>
          <span>Mobile No.*</span>
          <label className='bl-input__country'>
            <img src={country.flag} alt='' width={20} height={14} />
            <select value={countryId} onChange={(e) => setCountryId(e.target.value as PhoneCountryId)} aria-label='Country code'>
              {PHONE_COUNTRIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.code}
                </option>
              ))}
            </select>
          </label>
          <span className='bl-input__code'>{country.code}</span>
          <input type='tel' value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete='tel-national' aria-label='Mobile number' />
        </div>
        {errors.phone && <p className='bl-input__error'>{errors.phone}</p>}

        <label className={`bl-input${errors.email ? ' has-error' : ''}`}>
          <span>Email ID*</span>
          <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} autoComplete='email' />
        </label>
        {errors.email && <p className='bl-input__error'>{errors.email}</p>}

        <label className='bl-switch'>
          Subscribe to Newsletter
          <input type='checkbox' role='switch' checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
          <span className='bl-switch__track' aria-hidden />
        </label>

        {status === 'failed' && <p className='bl-input__error'>Could not send right now. Please try again.</p>}

        <button type='submit' className='bl-btn bl-btn--primary bl-btn--block' disabled={status === 'sending'}>
          {status === 'sending' ? <Loader2 size={16} className='bl-spin' aria-hidden /> : <Phone size={16} aria-hidden />}
          Request Call Back
        </button>
      </form>
    </section>
  );
}
