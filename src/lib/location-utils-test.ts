/**
 * Test utilities for location detection
 * Use these in browser console to test location-based features
 */

import type { UserLocation } from './location-utils';

/**
 * Set test location (for development/testing)
 * Usage in browser console:
 *   import { setTestLocation } from '@/lib/location-utils-test';
 *   setTestLocation({ country: 'India', countryCode: 'IN', isIndia: true, currency: 'INR', currencySymbol: '₹' });
 */
export function setTestLocation(location: UserLocation) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('test_user_location', JSON.stringify(location));
    console.log('Test location set:', location);
    console.log('Reload the page to apply the test location');
  }
}

/**
 * Clear test location
 */
export function clearTestLocation() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('test_user_location');
    console.log('Test location cleared. Reload the page.');
  }
}

/**
 * Get current test location
 */
export function getTestLocation(): UserLocation | null {
  if (typeof window !== 'undefined') {
    const testLocation = localStorage.getItem('test_user_location');
    if (testLocation) {
      try {
        return JSON.parse(testLocation);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

