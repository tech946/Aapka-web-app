const IG = 'https://www.instagram.com/';
const reel = (id: string) => ({
  cover: `/images/insta-stories/${id}.jpg`,
  video: `/videos/stories/${id}.mp4`,
  href: `${IG}reel/${id}/`,
});

export const JOURNEYS_BANNER = {
  title: 'Journeys',
  text: 'Real moments from travellers who explored Dubai and the UAE with us, shared on Instagram one journey at a time.',
};

export const INSTAGRAM_PROFILE = `${IG}aapkatourism/`;

export type QuoteCard = { type: 'quote'; tone: 'lime' | 'green'; quote: string; name: string; place: string; instagram?: boolean };
export type ReelCard = { type: 'reel'; mode: 'play' | 'quote'; title: string; tag: string; cover: string; video: string; href: string };
export type JourneyCard = QuoteCard | ReelCard;

export const JOURNEY_CARDS: JourneyCard[] = [
  {
    type: 'quote',
    tone: 'lime',
    quote: 'Aapka tourism offers the best tourism service available, and the overall experience I enjoyed was truly unbeatable.',
    name: 'Ishu Dhiman',
    place: 'Dubai Tour',
    instagram: true,
  },
  { type: 'reel', mode: 'play', title: 'Dubai Holiday Trip from Gujarat', tag: 'Dubai', ...reel('DeEDL7XI3xJ') },
  {
    type: 'quote',
    tone: 'green',
    quote: 'The itinerary was well-planned, and the guide was knowledgeable, friendly, and very professional.',
    name: 'Paresh Mistry',
    place: 'UAE Tour',
    instagram: true,
  },
  { type: 'reel', mode: 'quote', title: 'Guest Feedback That Means A Lot', tag: 'Dubai', ...reel('DeLgfqcIGB0') },
  {
    type: 'quote',
    tone: 'lime',
    quote: 'The four-star hotels were excellent, with clean rooms and yummy food.',
    name: 'Priya P',
    place: 'Dubai Package',
  },
  { type: 'reel', mode: 'quote', title: 'Our Guests Enjoying Desert Safari', tag: 'Desert Safari', ...reel('DeUlGucoqku') },
  {
    type: 'quote',
    tone: 'green',
    quote: 'The hotel and the Indian food were the best. Their service and food were simply amazing.',
    name: 'Pranali Patel',
    place: 'Dubai & Abu Dhabi Tour',
    instagram: true,
  },
  { type: 'reel', mode: 'play', title: 'Burj Khalifa At The Top', tag: 'Burj Khalifa', ...reel('DeV0YNnoGfO') },
  {
    type: 'quote',
    tone: 'lime',
    quote: 'One of the best, affordable, and most enjoyable tour packages. The hospitality was excellent, including comfortable hotel stays and delicious food.',
    name: 'Anil Joshi',
    place: 'Dubai Tour',
    instagram: true,
  },
  { type: 'reel', mode: 'quote', title: 'Jaipur to Dubai Holiday', tag: 'Dubai', ...reel('DeQZv5Vo2Zk') },
  {
    type: 'quote',
    tone: 'lime',
    quote: 'Loved the Dubai tour — every moment felt like a page out of a glossy magazine. The team was so prompt and active.',
    name: 'Priya Pisat',
    place: 'Dubai Tour',
    instagram: true,
  },
  { type: 'reel', mode: 'quote', title: '4 Nights Best Dubai Holiday', tag: 'Dubai', ...reel('DeEyWXXI_hL') },
];
