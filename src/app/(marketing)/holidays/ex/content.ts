import { LIMITED_DEALS } from '@/config/holiday-types';

export const PAGE_SIZE = 15;

export const LISTING = {
  allTitle: 'Dubai & UAE Holiday Packages',
  heading: (count: number, label: string) => `${count} ${label === 'All Holidays' ? 'Dubai & UAE Holiday Packages' : label}`,
  soonPill: (n: number) => `${n} Departing Soon`,
  kicker: (n: number) => `${n} Hand-picked ${n === 1 ? 'Holiday' : 'Holidays'} to Choose From`,
};

export const SUBS: Record<string, string> = {
  all: 'Offer packages, anydate holidays, desert safaris and Marina cruises, all planned by our team in Dubai.',
  'offer-packages': 'Hotels, transfers, sightseeing and visas taken care of, at one clear price.',
  'flexible-date-packages': 'Pick the day your holiday starts and we will plan everything around it.',
  'uae-tours': 'Desert safaris, city tours and day trips with hotel pick-up and drop-off.',
  'marina-cruise': 'An evening on the water with dinner and the Dubai Marina skyline.',
  [LIMITED_DEALS.key]: 'Special prices on hand-picked holidays, for a short time only.',
};

export const INTROS: Record<string, string> = {
  all: 'Dubai is a city of skylines and sand, where a morning on the 124th floor of the Burj Khalifa can end with a barbecue dinner under the desert stars. Our holidays bring the whole of the UAE together in one place: offer packages with hotels, transfers and visas taken care of, anydate packages you can start on the day that suits you, desert safaris and city tours, and dinner cruises along Dubai Marina. Every itinerary is planned by our team in Dubai, who have been looking after travellers for more than 12 years, and you can reach us on WhatsApp at any hour while you travel.',
  'offer-packages': 'Our offer packages are hand-picked Dubai holidays with the hotel, airport transfers, sightseeing and, on many trips, the UAE visa already included. Prices are set for fixed departure dates so you know exactly what you pay, and our Dubai team looks after you from the moment you land until your flight home.',
  'flexible-date-packages': 'Anydate packages let you choose the day your holiday starts. Pick a date that fits your leave, and we will arrange the hotel, transfers and tours around it. They are ideal for families, couples and anyone whose plans do not fit a fixed departure.',
  'uae-tours': 'From dune bashing and a camel ride in the desert to a full day around Abu Dhabi, our UAE tours are easy to add to any stay. Most run daily with hotel pick-up and drop-off, so you can book the experiences you want without planning the logistics.',
  'marina-cruise': 'Spend an evening on the water with a dinner cruise along Dubai Marina, with dinner on board and the lights of the skyline all around you. A relaxed way to see the city, whether it is your first night in Dubai or your last.',
  [LIMITED_DEALS.key]: 'Limited time deals are special prices on hand-picked holidays that run for a short time only. Each one shows the day the deal ends, so book before it goes.',
};

export type BannerImage = { src: string; position: string };

const BANNERS: Record<string, BannerImage> = {
  all: { src: '/images/stock/dest-dubai.jpg', position: 'center 62%' },
  'offer-packages': { src: '/images/stock/review-burj-al-arab.jpg', position: 'center 45%' },
  'flexible-date-packages': { src: '/images/stock/faq-dubai-frame.jpg', position: 'center 50%' },
  'uae-tours': { src: '/images/stock/story-desert.jpg', position: 'center 55%' },
  'marina-cruise': { src: '/images/stock/banner-dubai-dusk.jpg', position: 'center 62%' },
  [LIMITED_DEALS.key]: { src: '/images/stock/review-atlantis.jpg', position: 'center 50%' },
};

export function bannerFor(key: string): BannerImage {
  return BANNERS[key] ?? { src: '/images/stock/story-abu-dhabi.jpg', position: 'center 50%' };
}
