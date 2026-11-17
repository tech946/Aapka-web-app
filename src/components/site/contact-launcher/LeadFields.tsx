'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { PHONE_COUNTRIES, type PhoneCountryId } from '@/config/phone-countries';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'email';
  autoComplete?: string;
}

export function TextField({ label, value, onChange, error, type = 'text', autoComplete }: TextFieldProps) {
  return (
    <div className='cl-field-wrap'>
      <label className={`cl-field${value ? ' is-filled' : ''}${error ? ' has-error' : ''}`}>
        <span className='cl-field__label'>{label}</span>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} />
      </label>
      {error && <p className='cl-error'>{error}</p>}
    </div>
  );
}

interface PhoneFieldProps {
  countryId: PhoneCountryId;
  onCountryChange: (id: PhoneCountryId) => void;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneField({ countryId, onCountryChange, value, onChange, error }: PhoneFieldProps) {
  const country = PHONE_COUNTRIES.find((c) => c.id === countryId) ?? PHONE_COUNTRIES[0];
  return (
    <div className='cl-field-wrap'>
      <div className={`cl-field cl-field--phone is-filled${error ? ' has-error' : ''}`}>
        <span className='cl-field__label'>Mobile No.*</span>
        <label className='cl-country'>
          <img src={country.flag} alt='' width={22} height={15} />
          <ChevronDown size={14} aria-hidden />
          <select value={countryId} onChange={(e) => onCountryChange(e.target.value as PhoneCountryId)} aria-label='Country code'>
            {PHONE_COUNTRIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </label>
        <span className='cl-code'>{country.code}</span>
        <input
          type='tel'
          inputMode='numeric'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete='tel-national'
          aria-label='Mobile number'
        />
      </div>
      {error && <p className='cl-error'>{error}</p>}
    </div>
  );
}

export function Consent() {
  return (
    <p className='cl-consent'>
      By continuing, I consent to Aapka Tourism and its travel consultants contacting me via call, email, SMS or WhatsApp regarding
      their products and services. <Link href='/privacy-policy'>Privacy Policy</Link>
    </p>
  );
}
