/* The travel-enquiry form's data: field shape (the /api/website/leads
   contract — keep the keys), starting values, choice lists and validation.
   EnquiryForm only draws this. */

export interface LeadFormData {
  // 1. Lead details
  full_name_as_per_passport: string;
  whatsapp_number: string;
  email_id: string;
  nationality: string;
  city_country_of_departure: string;

  // 2. Travel dates
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  flexible_dates: boolean;

  // 3. Travellers
  total_travelers: number;
  adults: number;
  children_count: number;
  children_ages: string;
  infant_count: number;
  senior_travelers: boolean;
  senior_travelers_age_detail: string;
  special_needs: string;

  // 4. Visa
  need_dubai_visa: boolean;

  // 5. Hotel preference
  hotel_category: string;
  room_type: string;
  room_type_id?: string;
  meal_plan: string;
  preferred_location: string;
  bed_type: string;
  smoking_room_required: boolean;

  // 6. Tours & activities (attraction ids)
  tours_and_activities: string[];

  // 7. Food
  food_preference_id: number | null;

  // 8. Budget & payment
  per_person_budget: number;
  full_package_budget: number;
  flexible_budget: boolean;
  payment_mode: string;
  currency: string;

  // 9. Special occasions
  honeymoon: boolean;
  anniversary: boolean;
  birthday: boolean;
  surprise_decorations: boolean;
  cake_private_dinner: boolean;
}

export type LeadField = keyof LeadFormData;
/** the yes/no fields */
export type FlagField = { [K in LeadField]: LeadFormData[K] extends boolean ? K : never }[LeadField];
export type FormErrors = Partial<Record<LeadField, string>>;

export const INITIAL_FORM: LeadFormData = {
  full_name_as_per_passport: '',
  whatsapp_number: '',
  email_id: '',
  nationality: '',
  city_country_of_departure: '',
  check_in_date: '',
  check_out_date: '',
  total_nights: 0,
  flexible_dates: false,
  total_travelers: 0,
  adults: 0,
  children_count: 0,
  children_ages: '',
  infant_count: 0,
  senior_travelers: false,
  senior_travelers_age_detail: '',
  special_needs: '',
  need_dubai_visa: false,
  hotel_category: '',
  room_type: '',
  room_type_id: '',
  meal_plan: '',
  preferred_location: '',
  bed_type: '',
  smoking_room_required: false,
  tours_and_activities: [],
  food_preference_id: null,
  per_person_budget: 0,
  full_package_budget: 0,
  flexible_budget: false,
  payment_mode: '',
  currency: '',
  honeymoon: false,
  anniversary: false,
  birthday: false,
  surprise_decorations: false,
  cake_private_dinner: false,
};

export interface Choice {
  value: string;
  label: string;
  hint?: string;
}

export const HOTEL_CATEGORIES: Choice[] = [
  { value: '3★', label: '3 Star' },
  { value: '4★', label: '4 Star' },
  { value: '5★', label: '5 Star' },
];

export const MEAL_PLANS: Choice[] = [
  { value: 'RO', label: 'Room only' },
  { value: 'BB', label: 'Breakfast' },
  { value: 'HB', label: 'Half board' },
  { value: 'FB', label: 'Full board' },
];

export const BED_TYPES: Choice[] = [
  { value: 'King', label: 'King' },
  { value: 'Twin', label: 'Twin' },
];

/** values are the CRM's food_preference ids */
export const FOOD_PREFERENCES: Choice[] = [
  { value: '1', label: 'Veg' },
  { value: '2', label: 'Non Veg' },
  { value: '3', label: 'Jain' },
  { value: '4', label: 'Mix' },
];

export const PAYMENT_MODES: Choice[] = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'Bank Transfer', label: 'Bank transfer' },
];

export const CURRENCIES: Choice[] = [
  { value: 'AED', label: 'AED' },
  { value: 'USD', label: 'USD' },
];

/** the yes/no flags shown as one row of chips */
export const OCCASIONS: { field: FlagField; label: string }[] = [
  { field: 'honeymoon', label: 'Honeymoon' },
  { field: 'anniversary', label: 'Anniversary' },
  { field: 'birthday', label: 'Birthday' },
  { field: 'surprise_decorations', label: 'Surprise decorations' },
  { field: 'cake_private_dinner', label: 'Cake / private dinner' },
];

/** The steps, in the order they open: the fun part first, contact last.
    `short` labels the step in the summary card. */
export const STEPS = [
  { id: 'tours', short: 'Activities', title: 'What would you like to do?', hint: 'Pick at least one tour or activity', required: true },
  { id: 'dates', short: 'Dates', title: 'When are you travelling?', hint: 'Rough dates are fine' },
  { id: 'travellers', short: 'Travellers', title: 'Who’s coming along?', hint: 'Adults, children and infants' },
  { id: 'hotel', short: 'Stay', title: 'Where would you like to stay?', hint: 'Hotel category, meals and room' },
  { id: 'budget', short: 'Budget', title: 'Food & budget', hint: 'Helps us pitch the right package' },
  { id: 'occasions', short: 'Occasion', title: 'Celebrating something?', hint: 'We’ll add the little extras' },
  { id: 'details', short: 'Contact', title: 'Where should we send your plan?', hint: 'Your name and WhatsApp number', required: true },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

/** the step holding each field that can fail validation */
export const ERROR_STEP: Partial<Record<LeadField, StepId>> = {
  full_name_as_per_passport: 'details',
  whatsapp_number: 'details',
  email_id: 'details',
  tours_and_activities: 'tours',
};

/** Required to send — drives "Still needed" and validation. */
export const REQUIRED: { field: LeadField; label: string }[] = [
  { field: 'full_name_as_per_passport', label: 'your name' },
  { field: 'whatsapp_number', label: 'a WhatsApp number' },
  { field: 'tours_and_activities', label: 'one activity' },
];

export function isFilled(form: LeadFormData, field: LeadField): boolean {
  const v = form[field];
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim().length > 0;
  return !!v;
}

/** Same rules as before the redesign. */
export function validate(form: LeadFormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.full_name_as_per_passport.trim()) errors.full_name_as_per_passport = 'Full name (as per passport) is required';
  if (!form.whatsapp_number.trim()) errors.whatsapp_number = 'WhatsApp number is required';
  if (!form.tours_and_activities.length) errors.tours_and_activities = 'Please select at least one tour or activity';
  if (form.email_id && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_id)) errors.email_id = 'Please enter a valid email address';
  return errors;
}

/** Nights between two yyyy-mm-dd days (0 until both are set). */
export function nightsBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const ms = new Date(to + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

/** "12 Oct '26" for a yyyy-mm-dd day ('' when unset). */
export function dayLabel(iso: string): string {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ (\d\d)$/, " '$1");
}

/** What the API receives: the form with its derived totals filled in. */
export function toPayload(form: LeadFormData): LeadFormData {
  return {
    ...form,
    total_nights: nightsBetween(form.check_in_date, form.check_out_date),
    total_travelers: form.adults + form.children_count + form.infant_count,
  };
}
