import type { LucideIcon } from 'lucide-react';
import { BadgeIndianRupee, MonitorPlay, CalendarRange, CreditCard, Flag, Headphones, LayoutGrid, Percent, Ship, Stamp, Users } from 'lucide-react';

export const PRICE = 100;
export const PRICE_WAS = 250;
export const AUTO_MS = 6000;

export const HERO = {
  title: ['Learn How Dubai Holidays', 'Get Booked, From Our Team.'],
  lede: 'A live, hands-on program to meet our team and understand our website and bookings end to end',
  points: [
    { bold: 'Meet', rest: ' our travel experts in a live session.' },
    { bold: 'Understand', rest: ' how packages, dates, prices and visas work on our website.' },
    { bold: 'Make', rest: ' your first booking with our team guiding you.' },
  ],
  play: 'Join for just ₹100',
};

export const STATS = [
  { value: '₹100', label: 'one-time joining fee' },
  { value: '6', label: 'live website walkthroughs' },
  { value: '12+', label: 'years of Dubai holidays' },
  { value: '10,000+', label: 'travellers served' },
  { value: '98%', label: 'customer retention' },
];

export const ROLES = ['Traveller', 'Travel agent', 'Student', 'Other'];

export type Module = {
  key: string;
  icon: LucideIcon;
  name: string;
  short: string;
  tag: string;
  capstone?: boolean;
  url: string;
  lines: { label: string; value: string }[];
  badges: string[];
  headline: string;
  body: string;
  skills: string[];
  leave: string;
};

export const MODULES: Module[] = [
  {
    key: 'holidays',
    icon: LayoutGrid,
    name: 'Holiday Packages',
    short: 'Find, filter and compare every package',
    tag: 'Holidays',
    url: 'aapkatourism.com/holidays',
    lines: [
      { label: 'Holiday type', value: 'Fixed departure' },
      { label: 'Duration', value: '4N / 5D' },
      { label: 'Filters', value: 'Visa included · Deals' },
    ],
    badges: ['12 packages match', 'Sorted by price'],
    headline: 'Browse the full holiday listing',
    body: 'See how holiday types, filters and sorting work, and how to read a package card before you open it.',
    skills: ['Holiday types', 'Filters', 'Package cards'],
    leave: 'a shortlist of packages that suit your travellers.',
  },
  {
    key: 'anydate',
    icon: CalendarRange,
    name: 'Anydate Packages',
    short: 'Flexible dates and how they are priced',
    tag: 'Flexible dates',
    url: 'aapkatourism.com/category/flexible-date-packages',
    lines: [
      { label: 'Travel date', value: 'Any day you choose' },
      { label: 'Surcharge days', value: 'Shown on the calendar' },
      { label: 'Sold-out days', value: 'Greyed out' },
    ],
    badges: ['Live date check', 'Per-person price'],
    headline: 'Pick any date, see the right price',
    body: 'Learn how anydate packages handle surcharges, sold-out days and traveller counts, so you quote the correct total.',
    skills: ['Date rules', 'Surcharges', 'Traveller count'],
    leave: 'the confidence to quote any date correctly.',
  },
  {
    key: 'deals',
    icon: Percent,
    name: 'Limited Time Deals',
    short: 'Offers, countdowns and seat limits',
    tag: 'Deals',
    url: 'aapkatourism.com/limited-time-deals',
    lines: [
      { label: 'Offer', value: 'Price drop for a few days' },
      { label: 'Seats', value: 'Limited per departure' },
      { label: 'Ends', value: 'Countdown on the page' },
    ],
    badges: ['Deal price', 'Seats left'],
    headline: 'Catch the deal before it ends',
    body: 'Understand how deals are listed, how seat limits work and when a deal closes, so no traveller misses out.',
    skills: ['Deal pages', 'Seat limits', 'Countdowns'],
    leave: 'a clear way to spot and share the best deals.',
  },
  {
    key: 'visa',
    icon: Stamp,
    name: 'Visas',
    short: 'Visa options and the documents we need',
    tag: 'Visa',
    url: 'aapkatourism.com/visas',
    lines: [
      { label: 'Visa type', value: 'Tourist visa' },
      { label: 'Documents', value: 'Passport · Photo' },
      { label: 'Add-on', value: 'With a holiday package' },
    ],
    badges: ['Document upload', 'Status updates'],
    headline: 'Get the visa side right',
    body: 'Walk through our visa options, the documents travellers upload and how a visa is added to a holiday booking.',
    skills: ['Visa types', 'Documents', 'Package add-on'],
    leave: 'a simple checklist for every visa request.',
  },
  {
    key: 'cruise',
    icon: Ship,
    name: 'Marina Cruise Dinner',
    short: 'Day experiences and their add-ons',
    tag: 'Cruise',
    url: 'aapkatourism.com/marina-cruise-dinner',
    lines: [
      { label: 'Experience', value: 'Dhow cruise dinner' },
      { label: 'Add-ons', value: 'Transfers · Upgrades' },
      { label: 'Days', value: 'Open days on the calendar' },
    ],
    badges: ['Add-ons', 'Instant total'],
    headline: 'Sell the evening, not just the trip',
    body: 'See how cruise dinners and other day experiences are booked, with add-ons and open days shown live.',
    skills: ['Experiences', 'Add-ons', 'Open days'],
    leave: 'easy extras to add to any Dubai trip.',
  },
  {
    key: 'checkout',
    icon: CreditCard,
    name: 'Booking & Checkout',
    short: 'From Book now to a confirmed booking',
    tag: 'Booking',
    url: 'aapkatourism.com/checkout',
    lines: [
      { label: 'Step 1', value: 'Travellers and date' },
      { label: 'Step 2', value: 'Traveller details' },
      { label: 'Step 3', value: 'Secure payment' },
    ],
    badges: ['Secure payment', 'Instant confirmation'],
    headline: 'Follow a booking from start to finish',
    body: 'Go through the booking window, traveller details, documents and secure payment, exactly as a customer does.',
    skills: ['Booking window', 'Traveller details', 'Payment'],
    leave: 'a full picture of what happens after Book now.',
  },
  {
    key: 'first',
    icon: Flag,
    name: 'Your First Booking',
    short: 'Make a real booking with us guiding you',
    tag: 'Hands-on',
    capstone: true,
    url: 'aapkatourism.com',
    lines: [
      { label: 'You choose', value: 'A package for a real trip' },
      { label: 'We guide', value: 'Every step, live' },
      { label: 'Result', value: 'A confirmed booking' },
    ],
    badges: ['Live guidance', 'Real booking'],
    headline: 'Put it all together',
    body: 'Pick a package, check dates and prices, add extras and complete a booking, with our team on hand to help.',
    skills: ['Planning', 'Quoting', 'Booking'],
    leave: 'your first booking done the right way.',
  },
];

export const PROGRAM_INTRO = {
  title: { first: 'A Live, Hands-On Program To Understand', second: 'How Dubai Holidays Are ', bold: 'Booked And Sold' },
  lines: [
    { text: 'Learn how our website, holiday packages and bookings work, from the people who run them every day.' },
    { bold: 'Meet the Aapka Tourism team', text: ' and make your first booking with their guidance and support.' },
  ],
};

export const PROGRAM = {
  name: 'Aapka Tourism Booking Program',
  body: 'Go from browsing our website to booking Dubai holidays with confidence: holiday packages, anydate dates, deals, visas and checkout, with 6 live walkthroughs and your first booking done alongside our team.',
  checks: [
    'Holiday packages, filters and package cards, explained live',
    'Anydate pricing, surcharge days and limited time deals',
    'Visa options, documents and Marina cruise add-ons',
    'Your first booking, start to finish, with our team guiding you',
  ],
  tiles: [
    '6 live walkthroughs of the real Aapka Tourism website',
    'A live meet and Q&A with our travel experts',
    'Help from our team with your first bookings',
  ],
  facts: [
    { icon: BadgeIndianRupee, label: 'Joining Fee', value: `₹${PRICE} one-time` },
    { icon: MonitorPlay, label: 'Format', value: 'Meeting' },
    { icon: Users, label: 'Hosted By', value: 'The Aapka Tourism team' },
    { icon: Headphones, label: 'After The Session', value: 'Support from our experts' },
  ],
  more: { label: 'Learn More', href: '/About' },
  join: { label: 'Join Now', href: '#join' },
};
