'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { ChevronRight, IdCard, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { PRICE, ROLES } from './content';

type Key = 'role' | 'name' | 'email' | 'phone' | 'consent';
type Errors = Partial<Record<Key, string>>;

function Field({ error, icon, children }: { error?: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="jp-fld">
      <label className={'jp-field' + (error ? ' has-err' : '')}>
        {children}
        <span className="jp-field__ico" aria-hidden="true">
          {icon}
        </span>
      </label>
      {error && <p className="jp-err">{error}</p>}
    </div>
  );
}

export default function JoinForm() {
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!role) next.role = 'Please tell us who you are.';
    if (name.trim().length < 2) next.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Please enter a valid email.';
    if (!/^[6-9]\d{9}$/.test(phone)) next.phone = 'Please enter a 10-digit mobile number.';
    if (!consent) next.consent = 'Please allow us to contact you.';
    setErrors(next);
    if (Object.keys(next).length) return;
    toast.info('Online payment for the program is being set up. Please check back soon.');
  };

  return (
    <form id="join" className="jp-form" onSubmit={submit} noValidate>
      <Field error={errors.role} icon={<b>?</b>}>
        <select
          className={'jp-field__select' + (role ? '' : ' is-empty')}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Joining as"
        >
          <option value="" disabled>
            Joining as
          </option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      <Field error={errors.name} icon={<IdCard />}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" autoComplete="name" />
      </Field>

      <Field error={errors.email} icon={<Mail />}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
        />
      </Field>

      <Field error={errors.phone} icon={<Phone />}>
        <span className="jp-field__lbl">Phone</span>
        <span className="jp-field__row">
          <img className="jp-field__flag" src="/images/flags/in.svg" width="20" height="14" alt="" />
          <span className="jp-field__cc">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            autoComplete="tel-national"
            aria-label="Phone number"
          />
        </span>
      </Field>

      <div className="jp-fld">
        <label className="jp-consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I authorise Aapka Tourism &amp; its representatives to contact me with updates and notifications via
            Email/SMS/WhatsApp/Call and other channels, even if my number is registered on DND/NDNC
          </span>
        </label>
        {errors.consent && <p className="jp-err">{errors.consent}</p>}
      </div>

      <button type="submit" className="jp-pay">
        Pay ₹{PRICE} &amp; Join
        <ChevronRight aria-hidden="true" />
      </button>
    </form>
  );
}
