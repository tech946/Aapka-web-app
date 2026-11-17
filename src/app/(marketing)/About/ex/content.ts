import { LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';
import { WHY } from '../../Home/ex/content';

export const HERO = {
  title: 'We plan every holiday like our own family is travelling.',
  sub: 'Dubai-based travel experts for 12+ years',
  image: '/images/stock/traveller-couple-quad.jpg',
  next: '#our-story',
};

export const STORY = {
  kicker: 'Our story',
  title: 'Born from a simple dream: to make Dubai feel like home',
  paragraphs: [
    'Aapka Tourism started in Dubai with one idea. Whether you visit once or many times, you should feel welcomed, cared for and valued at every step.',
    'Over the years we grew into holiday packages, visas, safaris, tours, hotels, transfers and yachts. What never changed is our commitment to honesty, clear prices and a team you can reach at any hour.',
  ],
  pillars: [
    { label: 'Goal', text: 'To be the most trusted way to holiday in Dubai & the UAE.' },
    { label: 'Vision', text: 'Holidays that feel easy from the first call to the flight home.' },
    { label: 'Mission', text: 'To plan every trip like it is our own family travelling.' },
  ],
  images: {
    main: { src: '/images/stock/about-couple-desert.jpg', alt: 'Travellers in the Dubai desert' },
    side: { src: '/images/stock/about-woman-views.jpg', alt: 'Traveller enjoying the views in Dubai' },
  },
  badge: { stat: '12+', label: 'years planning UAE holidays' },
  guests: {
    title: 'Who travels with us',
    text: 'Couples, families, friends, solo travellers and groups',
    href: '/travel-enquiry',
    photos: [
      '/images/travellers/couple.webp',
      '/images/travellers/family.webp',
      '/images/travellers/friends.webp',
      '/images/travellers/solo.webp',
      '/images/travellers/groups.webp',
    ],
  },
};

export const FOUNDER = {
  kicker: 'Founder’s message',
  title: '“Success begins with trust, and trust begins with responsibility.”',
  paragraphs: [
    'Namaste & warm greetings from Dubai. I didn’t want to build just another travel agency. I wanted to create a place where every guest feels emotionally connected, from visas to airport pickups to the last drop-off.',
    'My vision is to make Aapka Tourism a brand people proudly recommend: a brand of care, comfort & commitment.',
  ],
  pillars: [
    { label: 'Families', text: 'feel safe on every day of the trip.' },
    { label: 'Couples', text: 'feel special, with plans made around them.' },
    { label: 'Travellers', text: 'feel guided, before they fly and while they travel.' },
  ],
  images: {
    main: { src: '/images/about-section-1.jpg', alt: 'Kamal Pandey, Founder & CEO of Aapka Tourism' },
    side: { src: '/images/about-section-4.jpg', alt: 'Kamal Pandey in the Dubai desert' },
  },
  badge: { stat: 'CEO', label: 'Founder of Aapka Tourism' },
  sign: {
    name: 'Kamal Pandey',
    role: 'Founder & CEO, Aapka Tourism',
    photo: '/images/about-section-1.jpg',
    cta: 'Read the full message',
    href: '/founder-message',
  },
};

export const WHY_CARDS = WHY.cards.map((c) =>
  c.href === '/About' ? { ...c, cta: 'Read our founder’s message', href: '/founder-message' } : c
);

export const WHY_HIGHLIGHT = WHY.highlight;

export const ONE_ROOF = {
  kicker: 'Why Aapka Tourism?',
  title: 'Everything under One Roof',
  items: [
    { icon: 'compass', title: 'Holiday Packages', text: 'Hand-picked Dubai & UAE holidays, planned city by city, day by day.', href: '/holidays' },
    { icon: 'calendar', title: 'Anydate Packages', text: 'Packages you can start on the date that suits you.', href: holidaysHref('flexible-date-packages') },
    { icon: 'sun', title: 'UAE Tours', text: 'Desert safaris, city tours and day trips across the Emirates.', href: holidaysHref('uae-tours') },
    { icon: 'ship', title: 'Marina Cruise', text: 'Dinner cruises on Dubai Marina, booked straight from our site.', href: holidaysHref('marina-cruise') },
    { icon: 'stamp', title: 'Oman Visa & Transport', text: 'Oman visa applications and transport, handled by our team.', href: '/visas/apply-for-oman-visa' },
    { icon: 'sliders', title: 'Custom Packages', text: 'Tell us your dates, budget and pace, and we design the trip.', href: '/customize-your-package' },
    { icon: 'tag', title: 'Limited Time Deals', text: 'Special prices on selected holidays for a short time.', href: holidaysHref(LIMITED_DEALS.key) },
    { icon: 'headset', title: '24x7 Connect', text: 'Our team is reachable at any hour of your trip.', href: '/contact' },
  ],
};
