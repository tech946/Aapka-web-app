/**
 * Location detection and currency utilities
 */

export interface UserLocation {
  country: string;
  countryCode: string;
  isIndia: boolean;
  currency: string;
  currencySymbol: string;
}

/**
 * Detect user location based on IP address
 * Falls back to browser geolocation or manual selection
 */
export async function detectUserLocation(): Promise<UserLocation> {
  // Check for test mode (for development/testing)
  if (typeof window !== 'undefined') {
    const testLocation = localStorage.getItem('test_user_location');
    if (testLocation) {
      try {
        const parsed = JSON.parse(testLocation);
        // Override currency to always be AED
        return {
          ...parsed,
          currency: 'AED',
          currencySymbol: 'AED',
        };
      } catch (e) {
        // Error parsing test location
      }
    }
  }

  try {
    // Try to get location from IP geolocation service
    const response = await fetch('https://ipapi.co/json/', {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Location API returned ${response.status}`);
    }

    const data = await response.json();

    const country = data.country_name || 'Unknown';
    const countryCode = data.country_code || 'US';
    // Check both country code and country name for India
    const isIndia =
      countryCode === 'IN' ||
      country === 'India' ||
      countryCode?.toUpperCase() === 'IN' ||
      country?.toLowerCase() === 'india';

    const location: UserLocation = {
      country,
      countryCode,
      isIndia,
      currency: 'AED', // Always use AED
      currencySymbol: 'AED', // Always use AED
    };

    return location;
  } catch (error) {
    // Error detecting location

    // Try fallback: Check browser timezone
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isIndiaTimezone =
        timezone?.includes('Calcutta') ||
        timezone?.includes('Kolkata') ||
        timezone === 'Asia/Kolkata';

      if (isIndiaTimezone) {
        const location: UserLocation = {
          country: 'India',
          countryCode: 'IN',
          isIndia: true,
          currency: 'AED', // Always use AED
          currencySymbol: 'AED', // Always use AED
        };
        return location;
      }
    } catch (tzError) {
      // Error checking timezone
    }

    // Default to non-India
    const defaultLocation: UserLocation = {
      country: 'Unknown',
      countryCode: 'US',
      isIndia: false,
      currency: 'AED',
      currencySymbol: 'AED',
    };
    return defaultLocation;
  }
}

/**
 * Convert AED amount to INR - DEPRECATED: Always returns the same amount (no conversion)
 * Kept for backward compatibility but does not perform conversion
 */
export async function convertAEDToINRAsync(aedAmount: number): Promise<number> {
  // No conversion - always return AED amount
  return aedAmount;
}

/**
 * Convert AED amount to INR - DEPRECATED: Always returns the same amount (no conversion)
 * Kept for backward compatibility but does not perform conversion
 */
export function convertAEDToINR(aedAmount: number): number {
  // No conversion - always return AED amount
  return aedAmount;
}

/**
 * Initialize exchange rate on client side - DEPRECATED: No longer needed
 * Kept for backward compatibility
 */
export async function initializeExchangeRate(): Promise<void> {
  // No longer needed - currency is always AED
  return Promise.resolve();
}

/**
 * Convert INR amount to AED - DEPRECATED: Always returns the same amount (no conversion)
 * Kept for backward compatibility but does not perform conversion
 */
export async function convertINRToAEDAsync(inrAmount: number): Promise<number> {
  // No conversion - always return the same amount
  return inrAmount;
}

/**
 * Convert INR amount to AED - DEPRECATED: Always returns the same amount (no conversion)
 * Kept for backward compatibility but does not perform conversion
 */
export function convertINRToAED(inrAmount: number): number {
  // No conversion - always return the same amount
  return inrAmount;
}

/**
 * Format currency - always formats as AED
 */
export function formatCurrency(amount: number, location: UserLocation): string {
  // Always format as AED regardless of location
  return `AED ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
