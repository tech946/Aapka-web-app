import { PHONE_COUNTRIES, type PhoneCountryId } from '@/config/phone-countries';

export interface LeadInput {
  name: string;
  countryId: PhoneCountryId;
  phone: string;
  email?: string;
  message: string;
}

export type LeadField = 'name' | 'phone' | 'email';
export type LeadErrors = Partial<Record<LeadField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALLBACK_EMAIL = 'not-provided@aapkatourism.com';

export function validateLead(input: Pick<LeadInput, 'name' | 'phone' | 'email'>, emailRequired = false): LeadErrors {
  const errors: LeadErrors = {};
  const digits = input.phone.replace(/\D/g, '');
  if (!input.name.trim()) errors.name = 'Enter your name';
  if (digits.length < 7 || digits.length > 12) errors.phone = 'Enter a valid mobile number';
  const email = input.email?.trim() ?? '';
  if ((emailRequired || email) && !EMAIL_RE.test(email)) errors.email = 'Enter a valid email';
  return errors;
}

export function fullPhone(countryId: PhoneCountryId, phone: string): string {
  const country = PHONE_COUNTRIES.find((c) => c.id === countryId) ?? PHONE_COUNTRIES[0];
  return `${country.code} ${phone.replace(/\D/g, '')}`;
}

export async function submitLead(input: LeadInput): Promise<void> {
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName,
      lastName: rest.join(' ') || '-',
      email: input.email?.trim() || FALLBACK_EMAIL,
      phone: fullPhone(input.countryId, input.phone),
      message: input.message,
    }),
  });
  if (!res.ok) throw new Error('Could not send');
}

const OPEN_HOUR = 9;
const CLOSE_HOUR = 21;

export function expertsOnline(now = new Date()): boolean {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Dubai' }).format(now));
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}
