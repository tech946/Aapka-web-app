export interface HomeTile {
  label: string;
  href: string;
  image: string;
  position?: string;
}

export interface HeroSection { title: string; poster: string }
export interface InterestsSection { title: string; subtitle: string; tiles: HomeTile[] }
/** One row per CRM category, categories numbered from 1 in CRM order; no `last` = all remaining. */
export interface PackageRowsSection { first: number; last?: number | null }
export interface RowSection { title: string; subtitle: string }
export interface TitleSection { title: string }
export interface PromoSection { kicker: string; title: string; body: string; buttonLabel: string; buttonHref: string; image: string }
export interface StoriesSection { title: string; body: string; buttonLabel: string }
export interface TrustSection { badgeNumber: string; badgeLabel: string; title: string; body: string; buttonLabel: string; buttonHref: string }

export interface HomeSectionMap {
  homeHero: HeroSection;
  homeInterests: InterestsSection;
  homePackageRows: PackageRowsSection;
  homePartnerPromo: PromoSection;
  homeBlogBand: TitleSection;
  homeDealsRow: RowSection;
  homeMarinaRow: RowSection;
  homeCategoryTiles: TitleSection;
  homeStoriesPromo: StoriesSection;
  homeTrustBand: TrustSection;
  homePromo: PromoSection;
}

export type HomeSectionType = keyof HomeSectionMap;

export type HomeSection = {
  [T in HomeSectionType]: { _type: T; _key: string } & HomeSectionMap[T];
}[HomeSectionType];

export const SECTION_DEFAULTS: HomeSectionMap = {
  homeHero: { title: 'Where in the UAE?', poster: '/images/package-3.jpg' },
  homeInterests: {
    title: 'Find holidays by interest',
    subtitle: "Whatever you're into, we've got it",
    tiles: [
      { label: 'Dubai Holidays', href: '/holidays?type=offer-packages', image: '/images/about-section-3.jpg', position: '50% 35%' },
      { label: 'UAE Tours', href: '/holidays?type=uae-tours', image: '/images/package-2.jpg', position: '40% 50%' },
      { label: 'Anydate Trips', href: '/holidays?type=flexible-date-packages', image: '/images/about-hero.jpg', position: '30% 50%' },
      { label: 'Marina Cruise', href: '/holidays?type=marina-cruise', image: '/assets/images/tcHolidays/tcHome/dubai.avif', position: '50% 50%' },
      {
        label: 'Oman Visa',
        href: '/visas/apply-for-oman-visa',
        image: '/assets/images/tcHolidays/holidaysLP/WhyThomasCook/why-thomas-ccok-bg.jpg',
        position: '72% 40%',
      },
    ],
  },
  homePackageRows: { first: 1, last: null },
  homePartnerPromo: {
    kicker: 'Aapka Partner programme',
    title: 'Sell Dubai holidays at partner prices',
    body: 'Travel agents get exclusive partner prices on every package, plus our team planning and supporting each booking.',
    buttonLabel: 'Become a partner',
    buttonHref: '/become-partner',
    image: '/assets/images/domestic/2026/banners/buy-forex-and-earn-306x349.avif',
  },
  homeBlogBand: { title: 'Inspiration to get you going' },
  homeDealsRow: { title: 'Deals ending soon', subtitle: 'Limited time prices on hand-picked holidays' },
  homeMarinaRow: { title: 'Dubai Marina dinner cruises', subtitle: 'Two hours on the water with dinner and skyline views' },
  homeCategoryTiles: { title: 'Holidays you need to see' },
  homeStoriesPromo: {
    title: "Watch our travellers' stories",
    body: 'Real trips planned by Aapka Tourism, filmed by the families and groups who took them.',
    buttonLabel: 'Watch now',
  },
  homeTrustBand: {
    badgeNumber: '12+',
    badgeLabel: 'years',
    title: 'Loved by 10,000+ travellers',
    body: 'Twelve years of Dubai & UAE holidays, and 98% of our travellers come back to us.',
    buttonLabel: 'Plan my trip',
    buttonHref: '/travel-enquiry',
  },
  // A new, general promo card (photo + text + button); fields are examples to overwrite.
  homePromo: {
    kicker: '',
    title: 'Plan your Dubai holiday with us',
    body: 'Tell us your dates and budget, and our travel experts will build the trip around you.',
    buttonLabel: 'Enquire now',
    buttonHref: '/travel-enquiry',
    image: '/images/package-2.jpg',
  },
};

const section = <T extends HomeSectionType>(type: T, key: string, overrides: Partial<HomeSectionMap[T]> = {}) =>
  ({ _type: type, _key: key, ...SECTION_DEFAULTS[type], ...overrides }) as HomeSection;

/** Today's homepage, top to bottom. */
export const DEFAULT_LAYOUT: HomeSection[] = [
  section('homeHero', 'hero'),
  section('homeInterests', 'interests'),
  section('homePackageRows', 'rows-top', { first: 1, last: 2 }),
  section('homePartnerPromo', 'partner'),
  section('homeBlogBand', 'blogs'),
  section('homeDealsRow', 'deals'),
  section('homePackageRows', 'rows-rest', { first: 3, last: null }),
  section('homeMarinaRow', 'marina'),
  section('homeCategoryTiles', 'tiles'),
  section('homeStoriesPromo', 'stories'),
  section('homeTrustBand', 'trust'),
];

export const SECTION_TITLES: Record<HomeSectionType, string> = {
  homeHero: 'Hero (video + search)',
  homeInterests: 'Holidays by interest (photo tiles)',
  homePackageRows: 'Package rows (one per CRM category)',
  homePartnerPromo: 'Partner programme promo',
  homeBlogBand: 'Blog band',
  homeDealsRow: 'Limited-time deals row',
  homeMarinaRow: 'Marina cruises row',
  homeCategoryTiles: 'Holiday types (tiles)',
  homeStoriesPromo: 'Instagram stories promo',
  homeTrustBand: '"Loved by travellers" band',
  homePromo: 'Promo card (photo + text + button)',
};
