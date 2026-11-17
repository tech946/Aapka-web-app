export const PHONE_COUNTRIES = [
  { id: 'ae', name: 'UAE', code: '+971', flag: '/images/flags/ae.svg' },
  { id: 'in', name: 'India', code: '+91', flag: '/images/flags/in.svg' },
] as const;

export type PhoneCountryId = (typeof PHONE_COUNTRIES)[number]['id'];
