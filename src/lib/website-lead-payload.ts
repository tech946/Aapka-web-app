/**
 * Build CRM `/api/website/leads` payload from the travel enquiry form.
 * Omits empty defaults so resubmissions (same WhatsApp) only update filled fields.
 */

function trimString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function positiveNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return !Number.isNaN(num) && num > 0 ? num : null;
}

function countNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return null;
  return num;
}

const STRING_FIELDS = [
  'email_id',
  'nationality',
  'city_country_of_departure',
  'check_in_date',
  'check_out_date',
  'children_ages',
  'senior_travelers_age_detail',
  'special_needs',
  'hotel_category',
  'room_type',
  'room_type_id',
  'meal_plan',
  'preferred_location',
  'bed_type',
  'payment_mode',
  'currency',
] as const;

const POSITIVE_NUMBER_FIELDS = [
  'total_nights',
  'total_travelers',
  'adults',
  'per_person_budget',
  'full_package_budget',
] as const;

const COUNT_FIELDS = ['children_count', 'infant_count'] as const;

const BOOLEAN_FIELDS = [
  'flexible_dates',
  'senior_travelers',
  'need_dubai_visa',
  'smoking_room_required',
  'flexible_budget',
  'honeymoon',
  'anniversary',
  'birthday',
  'surprise_decorations',
  'cake_private_dinner',
] as const;

export function buildCrmWebsiteLeadPayload(body: Record<string, unknown>): Record<string, unknown> {
  const name = trimString(body.full_name_as_per_passport);
  const whatsapp = trimString(body.whatsapp_number);

  const payload: Record<string, unknown> = {
    lead_source: 'website',
    full_name_as_per_passport: name,
    whatsapp_number: whatsapp,
  };

  for (const key of STRING_FIELDS) {
    const value = trimString(body[key]);
    if (value) payload[key] = value;
  }

  for (const key of POSITIVE_NUMBER_FIELDS) {
    const value = positiveNumber(body[key]);
    if (value !== null) payload[key] = value;
  }

  for (const key of COUNT_FIELDS) {
    const value = countNumber(body[key]);
    if (value !== null && value > 0) payload[key] = value;
  }

  for (const key of BOOLEAN_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      payload[key] = Boolean(body[key]);
    }
  }

  if (body.food_preference_id !== null && body.food_preference_id !== undefined && body.food_preference_id !== '') {
    const id = Number(body.food_preference_id);
    if (!Number.isNaN(id) && id > 0) payload.food_preference_id = id;
  }

  const tours = body.tours_and_activities;
  if (Array.isArray(tours) && tours.length > 0) {
    payload.selected_attractions = tours;
  }

  return payload;
}
