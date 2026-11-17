import { REVIEWS, type Review } from '@/components/site/reviews';
import { PACKAGE_PAGE_TEXT_DEFAULTS } from './package-page-text';

export interface PackagePageText {
  reviewsTitle: string;
  reviewsSubtitle: string;
  reviews: Review[];
  expertTitle: string;
  expertAvailability: string;
  callbackButton: string;
  callbackTitle: string;
  callbackThanks: string;
  priceSoonLabel: string;
  pricesFinalisingNote: string;
}

export const PACKAGE_PAGE_DEFAULTS: PackagePageText = { ...PACKAGE_PAGE_TEXT_DEFAULTS, reviews: REVIEWS };
