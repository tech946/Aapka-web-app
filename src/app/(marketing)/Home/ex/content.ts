import { LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';
import { CONTACT } from '@/components/site/site-config';

export const NAV = [
  { label: 'Holidays', href: '/holidays', menu: true },
  { label: 'Deals', href: holidaysHref(LIMITED_DEALS.key) },
  { label: 'Blogs', href: '/blogs' },
];

export type HeroType = 'offer-packages' | 'flexible-date-packages' | 'uae-tours' | 'marina-cruise';

export type HeroCard = { name: string; label: string; type: HeroType; video?: string };

export type HeroSlide = {
  kicker: string;
  title: string;
  accent: string;
  sub: string;
  search: string[];
  trust: { stat: string; label: string }[];
  cards: HeroCard[];
};

export const HERO: HeroSlide = {
  kicker: 'Dubai-based travel experts for 12+ years',
  title: 'Your Perfect Dubai Holiday',
  accent: 'Locals.',
  sub: 'Desert safaris, marina cruises and city tours, planned by our team in Dubai.',
  search: [
    'Search Dubai holidays, tours and cruises',
    'Try “Desert safari”',
    'Try “Marina dinner cruise”',
    'Try “Abu Dhabi city tour”',
    'Try “4 nights in Dubai”',
  ],
  trust: [
    { stat: '12+', label: 'years in Dubai' },
    { stat: '10,000+', label: 'happy travellers' },
    { stat: 'Offices', label: 'in Dubai & Delhi' },
    { stat: '280K+', label: 'on Instagram' },
  ],
  cards: [
    { name: 'desert-safari', label: 'Desert Safari', type: 'uae-tours' },
    { name: 'burj-al-arab', label: 'Burj Al Arab', type: 'offer-packages' },
    { name: 'dubai-marina', label: 'Dubai Marina', type: 'marina-cruise', video: '/videos/strips/dubai-marina.mp4' },
    { name: 'camel-trek', label: 'Camel Trek', type: 'uae-tours' },
    { name: 'burj-khalifa', label: 'Burj Khalifa', type: 'flexible-date-packages' },
    { name: 'hatta', label: 'Hatta', type: 'uae-tours' },
    { name: 'grand-mosque', label: 'Sheikh Zayed Mosque', type: 'uae-tours', video: '/videos/strips/grand-mosque.mp4' },
    { name: 'dhow-cruise', label: 'Dhow Cruise', type: 'marina-cruise' },
    { name: 'downtown-dubai', label: 'Downtown Dubai', type: 'flexible-date-packages' },
    { name: 'desert-drive', label: 'Desert Drive', type: 'uae-tours', video: '/videos/strips/desert-road.mp4' },
    { name: 'marina-night', label: 'Marina by Night', type: 'marina-cruise' },
    { name: 'louvre-abu-dhabi', label: 'Louvre Abu Dhabi', type: 'uae-tours' },
    { name: 'sharjah', label: 'Sharjah', type: 'offer-packages' },
    { name: 'dubai-night', label: 'Dubai by Night', type: 'flexible-date-packages' },
  ],
};

export const WHY = {
  title: 'Why Thousands of Travellers choose Aapka Tourism',
  cards: [
    {
      image: '/images/stock/dest-dubai-600.jpg',
      stat: '2',
      label: 'Offices in Dubai & Delhi',
      text: 'Visit us in Bur Dubai or at Nehru Place, New Delhi.',
      cta: 'Find our offices',
      href: '/contact',
    },
    {
      image: '/images/stock/traveller-couple-dunes-600.jpg',
      stat: '10,000+',
      label: 'Happy Travellers',
      text: 'Holidays planned city by city, day by day, for travellers from India & the world.',
      cta: 'Read traveller stories',
      href: '/#stories',
    },
    {
      image: '/images/stock/about-couple-desert-600.jpg',
      stat: '12+',
      label: 'Years in Dubai',
      text: 'A local team that looks after you before you fly and while you travel.',
      cta: 'Meet our team',
      href: '/About',
    },
  ],
  highlight: {
    stat: '280K+',
    label: 'Instagram Followers',
    text: 'Watch real trips and guest stories shared by our travellers.',
    cta: 'Follow us on Instagram',
    href: 'https://www.instagram.com/aapkatourism/',
  },
};

export const STORIES = {
  title: 'Aapka Travel Stories',
  sub: 'Creating unforgettable memories, one traveller at a time',
};

export const FOOTER = {
  columns: [
    {
      title: 'About Aapka Tourism',
      links: [
        { label: 'About us', href: '/About' },
        { label: "Founder's message", href: '/founder-message' },
        { label: 'Traveller stories', href: '/#stories' },
        { label: 'Blogs', href: '/blogs' },
        { label: 'Contact us', href: '/contact' },
        { label: 'Help Centre & FAQs', href: '/faq' },
      ],
    },
    {
      title: 'Explore',
      links: [
        { label: 'All holidays', href: '/holidays' },
        { label: 'Anydate Packages', href: holidaysHref('flexible-date-packages') },
        { label: 'Offer Packages', href: holidaysHref('offer-packages') },
        { label: 'UAE Tours', href: holidaysHref('uae-tours') },
        { label: 'Marina Cruise', href: holidaysHref('marina-cruise') },
        { label: 'Customize your package', href: '/customize-your-package' },
        { label: 'Travel enquiry', href: '/travel-enquiry' },
      ],
    },
  ],
  stacked: [
    {
      title: 'Do Business With Us',
      links: [
        { label: 'Become a Partner', href: '/become-partner' },
        { label: 'B2B collaboration', href: '/b2b-collaboration' },
      ],
    },
    {
      title: 'Visas & Transport',
      links: [
        { label: 'Oman Visa', href: '/visas/apply-for-oman-visa' },
        { label: 'Oman Transport', href: '/oman-transport' },
      ],
    },
  ],
  reach: [
    { label: 'UAE', text: CONTACT.uaePhone, href: CONTACT.uaePhoneHref },
    { label: 'India', text: CONTACT.indiaPhone, href: CONTACT.indiaPhoneHref },
  ],
  email: { text: CONTACT.email, href: `mailto:${CONTACT.email}` },
  caution: `Caution: beware of fake promotions or offers. Please do not share card details or make payments through links sent by unknown numbers or emails. Aapka Tourism only writes from @aapkatourism.com and WhatsApp ${CONTACT.uaePhone}. If in doubt, call us before you pay. Payments on our website are secure, and we accept VISA, Mastercard and Google Pay.`,
  legal: [
    { label: 'Terms & Conditions', href: '/terms-and-conditions' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Cancellation Policy', href: '/cancellation-policy' },
    { label: 'Disclaimer', href: '/disclaimer' },
    { label: 'Contact us', href: '/contact' },
  ],
};

export const TRAVELLERS: { label: string; image: string; href: string }[] = [
  { label: 'Couple', image: '/images/travellers/couple.webp', href: '/travel-enquiry' },
  { label: 'Family', image: '/images/travellers/family.webp', href: '/travel-enquiry' },
  { label: 'Friends', image: '/images/travellers/friends.webp', href: '/travel-enquiry' },
  { label: 'Solo', image: '/images/travellers/solo.webp', href: '/travel-enquiry' },
  { label: 'Groups', image: '/images/travellers/groups.webp', href: '/travel-enquiry' },
];
