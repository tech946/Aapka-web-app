import { EXPERIENCES, TPL, type ReviewSlide } from '../../Home/foreigner/content';

const CDN = 'https://cdn.prod.website-files.com';
const A = `${CDN}/69247547c23b7c23d27ef795`;
const C = `${CDN}/6926c0f2f201e871905f14af`;
const clip = (name: string) => ({ video: `/videos/strips/${name}.mp4`, poster: `/videos/strips/${name}.jpg` });

export const ABOUT_TPL = {
  balloon: `${A}/69393ddeb317f7d364364bc4_balloon%20light.svg`,
  plane: `${A}/69393ddf57cab5a966cf972e_plane%20light.svg`,
  clouds: `${A}/69393dde80eb0600455f3d07_clouds%20light.svg`,
  car: `${A}/69393a5ae5586c483adad5d7_Car%20Green.svg`,
  earth: TPL.earth,
  lottiePlanning: `${A}/6927fc153b9f6d764e8071ee_Untitled%20file%20(1).json`,
  lottieFamily: `${A}/69317ffe7ec5243ab1ef726d_Untitled%20file%20(3).json`,
  lottieStories: `${A}/6927086c7bc9e9766d07db21_Untitled%20file.json`,
  reviewPhoto3: '/images/stock/review-atlantis.jpg',
};

export const BANNER = [
  { top: 'Hand-Picked', bottom: 'UAE Holidays', href: '/holidays', image: '/images/stock/banner-burj-palms.jpg' },
  { top: 'Desert &', bottom: 'Dune Nights', href: '/holidays', image: '/images/stock/banner-dunes-suv.jpg' },
  { top: 'Behind Every', bottom: 'Aapka Journey', href: '/holidays', image: '/images/stock/banner-dubai-dusk.jpg' },
];

export const BANNER_CTA = 'View Holidays';

export const INTRO = {
  images: ['/images/stock/traveller-quad.jpg', '/images/stock/traveller-downtown.jpg'],
  title: 'How Travel Became Our Way of Looking After People',
  paragraphs: [
    'We are a Dubai team that chose holidays over routine, and now we plan them for travellers from everywhere — city by city, day by day. We travel to understand the UAE, and to share it. Every trip is a story we help write.',
    'Each guest teaches us something new about families, friends and the quiet moments in between. This page is where those experiences come together, one journey at a time.',
  ],
  marquee: 'Escape With Us',
};

export const DESTINATIONS = {
  title: 'Destinations That Shape Our Journey',
  text: 'These destinations are more than places on a map — they are desert sunsets, city lights and coastlines waiting for your own story.',
  items: [
    { name: 'Dubai', region: 'United Arab Emirates', image: '/images/stock/dest-dubai.jpg' },
    { name: 'Abu Dhabi', region: 'United Arab Emirates', image: '/images/stock/dest-abu-dhabi.jpg' },
    { name: 'Sharjah', region: 'United Arab Emirates', image: '/images/stock/dest-sharjah.jpg' },
    { name: 'Ras Al Khaimah', region: 'United Arab Emirates', image: '/images/stock/dest-ras-al-khaimah.jpg' },
    { name: 'Fujairah', region: 'United Arab Emirates', image: '/images/stock/dest-fujairah.jpg' },
    { name: 'Al Ain', region: 'United Arab Emirates', image: '/images/stock/dest-al-ain.jpg' },
    { name: 'Musandam', region: 'Oman', image: '/images/stock/dest-musandam.jpg' },
    { name: 'Hatta', region: 'United Arab Emirates', image: '/images/stock/dest-hatta.jpg' },
  ],
};

export const FEATURES = {
  title: 'Why Our Journeys Might Help Yours',
  text: 'Practical holiday planning, trusted local guides, and honest stories from the road — all shaped by real trips and the people who took them.',
  cta: { label: 'Start Traveling', href: '/holidays' },
  cards: [
    {
      lottie: ABOUT_TPL.lottiePlanning,
      large: false,
      title: 'Travel Planning',
      text: 'Here you will find clear itineraries, honest prices, visa help and practical tips to make every stage of your UAE holiday simple to plan and easy to enjoy.',
    },
    {
      lottie: ABOUT_TPL.lottieFamily,
      large: true,
      title: 'Family Holidays',
      text: 'From desert safaris to dhow cruises, we plan days that work for parents, grandparents and children alike, with comfortable stays and food everyone enjoys.',
    },
    {
      lottie: ABOUT_TPL.lottieStories,
      large: false,
      title: 'Authentic Travel Stories',
      text: 'Our holidays are built on real experiences, not highlight reels. We share honest stories from the road and plan each trip around the people taking it.',
    },
  ],
};

export const LOGO_GROUPS = EXPERIENCES.groups;

export const CONTINUE_DARK = {
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

export const REVIEWS: { title: string; slides: ReviewSlide[] } = {
  title: 'What Guests From Around the World Say',
  slides: [
    { kind: 'photo', name: 'Traveller Story', place: 'Dubai Holiday', image: TPL.reviewPhoto1, video: '/videos/stories/DeEDL7XI3xJ.mp4' },
    {
      kind: 'lime',
      name: 'Ishu Dhiman',
      place: 'Dubai Tour',
      quote: 'Aapka Tourism offers the best tourism service available, and the overall experience was truly unbeatable.',
    },
    { kind: 'photo', name: 'Traveller Story', place: 'Dubai & Abu Dhabi', image: TPL.reviewPhoto2, video: '/videos/stories/DeV0YNnoGfO.mp4' },
    {
      kind: 'green',
      name: 'Paresh Mistry',
      place: 'UAE Tour',
      quote: 'The itinerary was well-planned, and the guide was knowledgeable, friendly, and very professional.',
    },
    { kind: 'photo', name: 'Traveller Story', place: 'Desert Safari', image: ABOUT_TPL.reviewPhoto3, video: '/videos/stories/DeOFtjAoTWr.mp4' },
    {
      kind: 'lime',
      name: 'Priya Pisat',
      place: 'Dubai Tour',
      quote: 'Loved the Dubai tour — every moment felt like a page out of a glossy magazine.',
    },
  ],
};
