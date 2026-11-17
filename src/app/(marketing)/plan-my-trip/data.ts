export type StepId = 'start' | 'type' | 'when' | 'who' | 'acts' | 'hotel' | 'extras' | 'budget' | 'details' | 'review' | 'done';

export interface Plan {
  tripType: string;
  dateMode: 'month' | 'exact';
  month: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  flexibleDates: boolean;
  adults: number;
  children: number;
  childAges: number[];
  infants: number;
  seniors: boolean;
  acts: string[];
  hotel: string;
  areas: string[];
  meal: string;
  extras: string[];
  food: string;
  notes: string;
  currency: string;
  band: string;
  flexibleBudget: boolean;
  name: string;
  phone: string;
  email: string;
  from: string;
}

export const INITIAL_PLAN: Plan = {
  tripType: '',
  dateMode: 'month',
  month: '',
  checkIn: '',
  checkOut: '',
  nights: 5,
  flexibleDates: false,
  adults: 2,
  children: 0,
  childAges: [],
  infants: 0,
  seniors: false,
  acts: [],
  hotel: '',
  areas: [],
  meal: '',
  extras: [],
  food: '',
  notes: '',
  currency: 'AED',
  band: '',
  flexibleBudget: false,
  name: '',
  phone: '',
  email: '',
  from: '',
};

const photo = (name: string) => `/images/hero/${name}-720.webp`;

export const VIDEO = '/videos/hero-desert-sunset.mp4';
export const VIDEO_POSTER = '/images/hero/hero-desert-sunset-poster.webp';

export interface StepMeta {
  id: StepId;
  stage: number;
  kicker: string;
  title: string;
  line: string;
  media: string | null;
  caption: string;
}

export const STEPS: StepMeta[] = [
  {
    id: 'start',
    stage: -1,
    kicker: 'Free trip planning',
    title: 'Design your Dubai holiday',
    line: 'Tell us what you love. A Dubai expert builds the plan and price around it.',
    media: null,
    caption: 'Dubai desert at sunset',
  },
  {
    id: 'type',
    stage: 0,
    kicker: 'Your trip',
    title: 'Your Dubai, your way',
    line: 'Start with the kind of trip you have in mind.',
    media: photo('camel-trek'),
    caption: 'Camel trek, Dubai desert',
  },
  {
    id: 'when',
    stage: 0,
    kicker: 'Your trip',
    title: 'Pick your season',
    line: 'October to April is the sweet spot for sun without the heat.',
    media: photo('downtown-dubai'),
    caption: 'Downtown Dubai',
  },
  {
    id: 'who',
    stage: 0,
    kicker: 'Your trip',
    title: 'Who is coming along',
    line: 'We match rooms, cars and tickets to your group.',
    media: photo('dubai-marina'),
    caption: 'Dubai Marina',
  },
  {
    id: 'acts',
    stage: 1,
    kicker: 'Experiences',
    title: 'Fill your days',
    line: 'Dunes, skyline, sea and souks. Pick what excites you.',
    media: photo('desert-safari'),
    caption: 'Desert safari, Dubai',
  },
  {
    id: 'hotel',
    stage: 2,
    kicker: 'Stay & extras',
    title: 'Rest well',
    line: 'From smart city hotels to beach resorts on the Palm.',
    media: photo('burj-al-arab'),
    caption: 'Burj Al Arab, Jumeirah',
  },
  {
    id: 'extras',
    stage: 2,
    kicker: 'Stay & extras',
    title: 'Travel easy',
    line: 'Transfers, visas and the little touches, all in one plan.',
    media: photo('dhow-cruise'),
    caption: 'Dhow cruise, Dubai Creek',
  },
  {
    id: 'budget',
    stage: 2,
    kicker: 'Stay & extras',
    title: 'Plan to your budget',
    line: 'A rough range is enough. We show you the best value inside it.',
    media: photo('marina-night'),
    caption: 'Marina by night',
  },
  {
    id: 'details',
    stage: 3,
    kicker: 'Your details',
    title: 'Almost there',
    line: 'Tell us where to send your plan.',
    media: photo('burj-khalifa'),
    caption: 'Burj Khalifa, Downtown',
  },
  {
    id: 'review',
    stage: 3,
    kicker: 'Review',
    title: 'Your trip at a glance',
    line: 'Check it over, then send it to our experts.',
    media: photo('dubai-night'),
    caption: 'Dubai skyline at night',
  },
  {
    id: 'done',
    stage: 4,
    kicker: 'Enquiry sent',
    title: 'See you in Dubai',
    line: 'Your plan is on its way.',
    media: null,
    caption: 'Dubai desert at sunset',
  },
];

export const QUESTION_COUNT = STEPS.filter((s) => s.stage >= 0 && s.stage <= 3 && s.id !== 'review').length;

export const STAGES: { label: string; steps: StepId[] }[] = [
  { label: 'Your trip', steps: ['type', 'when', 'who'] },
  { label: 'Experiences', steps: ['acts'] },
  { label: 'Stay & extras', steps: ['hotel', 'extras', 'budget'] },
  { label: 'Your details', steps: ['details', 'review'] },
];

export interface TripType {
  value: string;
  note: string;
  image: string;
}

export const TRIP_TYPES: TripType[] = [
  { value: 'Family holiday', note: 'Theme parks, beaches, easy days', image: photo('dubai-marina') },
  { value: 'Honeymoon', note: 'Romantic stays and dinners', image: photo('burj-al-arab') },
  { value: 'Couple getaway', note: 'Just the two of you', image: photo('dhow-cruise') },
  { value: 'Friends trip', note: 'Dunes, yachts and nights out', image: photo('desert-drive') },
  { value: 'Solo trip', note: 'Your own pace, safely planned', image: photo('downtown-dubai') },
  { value: 'Luxury escape', note: 'Five stars and private cars', image: photo('dubai-night') },
];

export interface Attraction {
  id: string;
  name: string;
  category: string;
  duration: string;
  image: string;
}

export const ATTRACTION_TABS = ['All', 'Desert', 'City', 'Cruises', 'Abu Dhabi', 'Day trips'];

export const ATTRACTIONS: Attraction[] = [
  { id: 'desert-safari', name: 'Evening desert safari with BBQ dinner', category: 'Desert', duration: '6 hours', image: photo('desert-safari') },
  { id: 'dune-drive', name: 'Dune bashing and quad biking', category: 'Desert', duration: 'Half day', image: photo('desert-drive') },
  { id: 'camel-trek', name: 'Sunrise camel trek', category: 'Desert', duration: '4 hours', image: photo('camel-trek') },
  { id: 'burj-khalifa', name: 'Burj Khalifa, At the Top', category: 'City', duration: '2 hours', image: photo('burj-khalifa') },
  { id: 'downtown', name: 'Downtown Dubai and Dubai Mall', category: 'City', duration: 'Half day', image: photo('downtown-dubai') },
  { id: 'burj-al-arab', name: 'Inside Burj Al Arab tour', category: 'City', duration: '2 hours', image: photo('burj-al-arab') },
  { id: 'dhow-cruise', name: 'Dhow dinner cruise', category: 'Cruises', duration: '2 hours', image: photo('dhow-cruise') },
  { id: 'marina-yacht', name: 'Marina yacht at night', category: 'Cruises', duration: '2 hours', image: photo('marina-night') },
  { id: 'grand-mosque', name: 'Sheikh Zayed Grand Mosque', category: 'Abu Dhabi', duration: 'Full day', image: photo('grand-mosque') },
  { id: 'louvre', name: 'Louvre Abu Dhabi', category: 'Abu Dhabi', duration: 'Half day', image: photo('louvre-abu-dhabi') },
  { id: 'hatta', name: 'Hatta mountains day trip', category: 'Day trips', duration: 'Full day', image: photo('hatta') },
  { id: 'sharjah', name: 'Sharjah heritage tour', category: 'Day trips', duration: 'Half day', image: photo('sharjah') },
];

export interface HotelClass {
  value: string;
  stars: number;
  note: string;
}

export const HOTEL_CLASSES: HotelClass[] = [
  { value: '3 Star', stars: 3, note: 'Clean, central and great value' },
  { value: '4 Star', stars: 4, note: 'Pools, more space, top locations' },
  { value: '5 Star', stars: 5, note: 'Resorts and landmark hotels' },
  { value: 'Expert’s pick', stars: 0, note: 'Let us choose the best value' },
];

export const AREAS = ['Downtown', 'Dubai Marina', 'JBR beach', 'Palm Jumeirah', 'Business Bay', 'Deira'];

export const MEALS = ['Room only', 'Breakfast', 'Half board', 'All inclusive'];

export const FOODS = ['Vegetarian', 'Jain', 'Non-vegetarian', 'No preference'];

export interface Extra {
  value: string;
  note: string;
  icon: 'car' | 'visa' | 'cake' | 'heart' | 'gift';
}

export const EXTRAS: Extra[] = [
  { value: 'Airport transfers', note: 'Private car both ways', icon: 'car' },
  { value: 'UAE tourist visa', note: 'We handle the paperwork', icon: 'visa' },
];

export const COUPLE_EXTRAS: Extra[] = [
  { value: 'Cake and private dinner', note: 'A table set just for you', icon: 'cake' },
  { value: 'Room decoration', note: 'Flowers and a surprise on arrival', icon: 'heart' },
];

export const PARTY_EXTRAS: Extra[] = [{ value: 'Birthday surprise', note: 'Cake and decoration', icon: 'gift' }];

export const CURRENCIES = ['AED', 'INR', 'USD', 'GBP'];

export const BUDGET_BANDS: Record<string, string[]> = {
  AED: ['Under AED 3,000', 'AED 3,000 – 6,000', 'AED 6,000 – 10,000', 'AED 10,000+'],
  INR: ['Under ₹70,000', '₹70,000 – 1.4 lakh', '₹1.4 – 2.3 lakh', '₹2.3 lakh+'],
  USD: ['Under $800', '$800 – 1,600', '$1,600 – 2,700', '$2,700+'],
  GBP: ['Under £650', '£650 – 1,300', '£1,300 – 2,200', '£2,200+'],
};

export const BAND_NOTES = ['Smart and simple', 'Comfortable', 'Premium', 'Luxury'];

export const NOT_SURE = 'Not sure yet';

export function isoOf(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export function nightsBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
}

export function shortDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function nextMonths(count: number): { value: string; month: string; year: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return {
      value: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      month: d.toLocaleDateString('en-GB', { month: 'short' }),
      year: String(d.getFullYear()),
    };
  });
}

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
