import { LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';
import { CONTACT } from '@/components/site/site-config';

const CDN = 'https://cdn.prod.website-files.com';
const A = `${CDN}/69247547c23b7c23d27ef795`;
const C = `${CDN}/6926c0f2f201e871905f14af`;
const clip = (name: string) => ({ video: `/videos/strips/${name}.mp4`, poster: `/videos/strips/${name}.jpg` });
const logo = (n: string) => `${A}/${n}`;

export const TPL = {
  plus: `${A}/69328f7174c49f01f75373c1_add_2.svg`,
  menu: `${CDN}/6658979d4cc4833c73cd89c2/6658979d4cc4833c73cd8a92_menu-btn.svg`,
  close: `${CDN}/6658979d4cc4833c73cd89c2/6658979d4cc4833c73cd8a93_close-btn.svg`,
  balloon: `${A}/6926ea29a04e6c01951890d7_balloon.svg`,
  plane: `${A}/6926ea29f94881e2100f77b6_plane.svg`,
  clouds: `${A}/6926ea28d1210e32846dae99_clouds.svg`,
  car: `${A}/6926ebc4da713e00924068a4_car.svg`,
  earth: `${A}/69271339da713e00924e9d04_3d-rendering-planet-earth%201%20copy.webp`,
  lottie: `${A}/69317ffe7ec5243ab1ef726d_Untitled%20file%20(3).json`,
  play: `${A}/693ad7c67f0b3f7f0fe6641d_play-icon.svg`,
  arrowRight: `${A}/6925ae88081ff8c150578887_arrow_top_right.svg`,
  arrowRightGreen: `${A}/6925af984c4a6ce1ffa52112_arrow_top_right%20green.svg`,
  arrowLeft: `${A}/6925ae88804331c515c1c357_arrow_top_left.svg`,
  arrowLeftGreen: `${A}/6925af989fe4a2b7e68c18e8_arrow_top_left%20green.svg`,
  reviewPhoto1: '/images/stock/review-burj-al-arab.jpg',
  reviewPhoto2: '/images/stock/review-couple-desert.jpg',
};

export const HERO = {
  title: 'Explore the UAE',
  video: '/videos/home-hero-1080.mp4',
  poster: '/images/package-3.jpg',
  cards: [
    { title: 'Limited Time Deals', tag: 'Special prices', href: holidaysHref(LIMITED_DEALS.key), image: '/images/stock/card-limited-deals.jpg', color: 'yellow' },
    { title: 'Desert & City Tours', tag: 'UAE Tours', href: holidaysHref('uae-tours'), image: '/images/stock/card-desert-tours.jpg', color: null },
    { title: 'Anydate Packages', tag: 'Pick any date', href: holidaysHref('flexible-date-packages'), image: '/images/stock/card-anydate.jpg', color: 'lime' },
    { title: 'Marina Cruise Dinner', tag: 'Marina Cruise', href: holidaysHref('marina-cruise'), image: '/images/stock/card-marina-cruise.jpg', color: null },
  ],
  lead: 'Holidays that help you travel deeper, lighter and braver.',
  scroll: 'Scroll to explore',
} as const;

export const ABOUT = {
  title: 'Planning, Guiding, and Looking After You in Every Place',
  images: ['/images/stock/about-woman-views.jpg', '/images/stock/about-couple-desert.jpg'],
  text: 'We are a Dubai team that chose holidays over routine, and now we plan them for you — city by city, day by day. 10,000+ travellers and 12+ years later, every trip is still built by people who live here.',
  cta: { label: 'About us', href: '/About' },
  marquee: 'Escape With Us',
};

export const DESTINATIONS = {
  title: 'Destinations That Shape Every Journey',
  text: 'These destinations are more than places on a map — they are desert sunsets, city lights and coastlines waiting for your own story.',
  cta: { label: 'Explore Holidays', href: '/holidays' },
  rows: [
    [
      { name: 'Dubai', region: 'United Arab Emirates', image: '/images/stock/dest-dubai.jpg' },
      { name: 'Abu Dhabi', region: 'United Arab Emirates', image: '/images/stock/dest-abu-dhabi.jpg' },
    ],
    [
      { name: 'Sharjah', region: 'United Arab Emirates', image: '/images/stock/dest-sharjah.jpg' },
      { name: 'Ras Al Khaimah', region: 'United Arab Emirates', image: '/images/stock/dest-ras-al-khaimah.jpg' },
      { name: 'Fujairah', region: 'United Arab Emirates', image: '/images/stock/dest-fujairah.jpg' },
    ],
    [
      { name: 'Al Ain', region: 'United Arab Emirates', image: '/images/stock/dest-al-ain.jpg' },
      { name: 'Musandam', region: 'Oman', image: '/images/stock/dest-musandam.jpg' },
    ],
  ],
};

export const FAQ = {
  title: 'What You Want to Know Before You Book',
  image: '/images/stock/faq-dubai-frame.jpg',
  items: [
    {
      topic: 'Booking & Payments',
      q: 'How do I book a holiday?',
      a: 'Pick a package, choose your travellers and date, and pay securely online. Our team confirms every booking personally, sends your vouchers on WhatsApp and email, and is happy to book it all for you by phone if you prefer.',
    },
    {
      topic: 'Dates & Departures',
      q: 'Can I choose my own travel date?',
      a: 'Yes — Anydate Packages let you start on the day that suits you. Other packages run on set departure dates, shown on each package before you book, so you always know exactly when your holiday starts and ends.',
    },
    {
      topic: 'Visas & Documents',
      q: 'Can you help with my visa?',
      a: 'Many packages can include your UAE visa — look for “Visa included” on the package. We also arrange Oman visas. If you are not sure which visa you need for your passport, just ask us before you book and we will guide you.',
    },
    {
      topic: 'Help on Your Trip',
      q: 'Who do I contact during my trip?',
      a: `From the airport pick-up to your last drop-off, our Dubai team is a message away on WhatsApp (${CONTACT.uaePhone}). Pick-ups, timings, a missed transfer or a change of plan — tell us what you need and we will sort it out quickly, wherever you are in the UAE.`,
    },
  ],
  cta: { label: 'Ask Us Anything', href: '/contact' },
};

export type ReviewSlide = { kind: 'photo' | 'lime' | 'green'; name: string; place: string; quote?: string; image?: string; video?: string };
export const REVIEWS_SLIDER: { title: string; text: string; slides: ReviewSlide[] } = {
  title: 'What Guests From Around the World Say',
  text: 'Honest stories and thoughtful feedback from travellers across the world who have booked with us, explored the UAE, and come home with stories of their own.',
  slides: [
    { kind: 'photo', name: 'Traveller Story', place: 'Dubai Holiday', image: TPL.reviewPhoto1, video: '/videos/stories/DeEDL7XI3xJ.mp4' },
    { kind: 'lime', name: 'Ishu Dhiman', place: 'Dubai Tour', quote: 'Aapka Tourism offers the best tourism service available, and the overall experience was truly unbeatable.' },
    { kind: 'photo', name: 'Traveller Story', place: 'Dubai & Abu Dhabi', image: TPL.reviewPhoto2, video: '/videos/stories/DeV0YNnoGfO.mp4' },
    { kind: 'green', name: 'Paresh Mistry', place: 'UAE Tour', quote: 'The itinerary was well-planned, and the guide was knowledgeable, friendly, and very professional.' },
  ],
};

export const EXPERIENCES = {
  title: 'Here are the experiences we plan, book and look after on every trip.',
  text: 'We work with tours, stays and cruises that share our love for honest service, real experiences and the beauty of discovering the UAE.',
  cta: { label: 'Become a Partner', href: '/become-partner' },
  groups: [
    {
      title: 'Tours & Attractions',
      sets: [
        ['6931863a1773ec7ad8be2e2e_Fictional%20company%20logo-9.png', '6931863a1773ec7ad8be2e31_Fictional%20company%20logo-2.png', '6931863a1773ec7ad8be2e2b_Fictional%20company%20logo-6.png'],
        ['6931863a1773ec7ad8be2e1c_Fictional%20company%20logo-7.png', '6931863a1773ec7ad8be2e19_Fictional%20company%20logo-1.png', '6931863a1773ec7ad8be2e22_Fictional%20company%20logo-8.png'],
      ].map((s) => s.map(logo)),
    },
    {
      title: 'Stays, Cruises & Transfers',
      sets: [
        ['6931863a1773ec7ad8be2e25_Fictional%20company%20logo.png', '6931863a1773ec7ad8be2e28_Fictional%20company%20logo-5.png', '6931863a1773ec7ad8be2e34_Fictional%20company%20logo-4.png'],
        ['6931863a1773ec7ad8be2e1f_Fictional%20company%20logo-3.png', '6931863a1773ec7ad8be2e25_Fictional%20company%20logo.png', '6931863a1773ec7ad8be2e2b_Fictional%20company%20logo-6.png'],
      ].map((s) => s.map(logo)),
    },
  ],
};

export const STORIES = [
  { title: 'Eat Like a Local in Dubai', tag: 'Travel Guides', image: '/images/stock/story-food.jpg' },
  { title: 'Hidden Lives of Abu Dhabi', tag: 'Guides & Tips', image: '/images/stock/story-abu-dhabi.jpg' },
  { title: 'Notes from the Desert', tag: 'Destinations', image: '/images/stock/story-desert.jpg' },
  { title: 'The Art of a Dhow Cruise', tag: 'Travel Stories', image: '/images/stock/story-dhow.jpg' },
].map((s) => ({ ...s, href: '/blogs', label: 'Read the blog' }));

export const CONTINUE = {
  kicker: 'Let the Adventure Continue',
  title: 'Join us to uncover cities, cultures, and moments worth remembering.',
  text: 'Dive into new holidays, destinations, and ideas from across the UAE.',
  cta: { label: 'Continue Exploring', href: '/holidays' },
  left: [
    clip('dubai-marina'),
    clip('desert-road'),
    clip('grand-mosque'),
  ],
  right: [
    clip('sheikh-zayed-road'),
    clip('burj-al-arab-beach'),
    clip('dubai-frame-dusk'),
  ],
};

export const FOOTER = {
  title: 'Follow our journeys on social media',
  text: 'Follow our trips and travellers’ stories across our social channels.',
  company: [
    { label: 'About Us', href: '/About' },
    { label: 'Become a Partner', href: '/become-partner' },
    { label: 'Blogs', href: '/blogs' },
  ],
  contacts: [
    { label: CONTACT.uaePhone, href: CONTACT.uaePhoneHref },
    { label: CONTACT.indiaPhone, href: CONTACT.indiaPhoneHref },
    { label: CONTACT.email, href: `mailto:${CONTACT.email}` },
  ],
  plan: 'Plan your next holiday with us and never miss a deal!',
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-and-conditions' },
    { label: 'Cancellation Policy', href: '/cancellation-policy' },
  ],
};
