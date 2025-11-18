/**
 * Location detection and currency utilities
 */

// Fallback rate if API fails
const FALLBACK_AED_TO_INR_RATE = 22.5;

// Client-side cache for exchange rate
let clientRateCache: { rate: number; timestamp: number } | null = null;
const CLIENT_CACHE_DURATION = 3600000; // 1 hour in milliseconds

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
        console.log('Using test location from localStorage:', parsed);
        return parsed;
      } catch (e) {
        console.error('Error parsing test location:', e);
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
      currency: isIndia ? 'INR' : 'AED',
      currencySymbol: isIndia ? '₹' : 'AED',
    };

    console.log('Location detection result:', location);
    return location;
  } catch (error) {
    console.error('Error detecting location:', error);

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
          currency: 'INR',
          currencySymbol: '₹',
        };
        console.log('Detected India from timezone:', timezone, location);
        return location;
      }
    } catch (tzError) {
      console.error('Error checking timezone:', tzError);
    }

    // Default to non-India
    const defaultLocation: UserLocation = {
      country: 'Unknown',
      countryCode: 'US',
      isIndia: false,
      currency: 'AED',
      currencySymbol: 'AED',
    };
    console.log('Using default location:', defaultLocation);
    return defaultLocation;
  }
}

/**
 * Fetch real-time AED to INR exchange rate from API
 * Uses cached rate if available and fresh
 */
export async function getExchangeRate(): Promise<number> {
  try {
    // Check client-side cache first
    const now = Date.now();
    if (
      clientRateCache &&
      now - clientRateCache.timestamp < CLIENT_CACHE_DURATION
    ) {
      return clientRateCache.rate;
    }

    // Fetch fresh rate from API
    const response = await fetch('/api/currency/rate', {
      cache: 'no-store', // Always fetch fresh
    });

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();

    if (data.success && data.rate) {
      // Update cache
      clientRateCache = {
        rate: data.rate,
        timestamp: data.timestamp || now,
      };
      return data.rate;
    }

    throw new Error('Invalid exchange rate response');
  } catch (error) {
    console.error('Error fetching exchange rate:', error);

    // Return cached rate if available (even if expired)
    if (clientRateCache) {
      return clientRateCache.rate;
    }

    // Last resort: return fallback rate
    return FALLBACK_AED_TO_INR_RATE;
  }
}

/**
 * Convert AED amount to INR using real-time exchange rate
 * This is an async function that fetches the latest rate
 */
export async function convertAEDToINRAsync(aedAmount: number): Promise<number> {
  const rate = await getExchangeRate();
  return Math.round(aedAmount * rate);
}

/**
 * Convert AED amount to INR (synchronous version using cached rate)
 * For immediate calculations, use this. For accurate rates, use convertAEDToINRAsync
 */
export function convertAEDToINR(aedAmount: number): number {
  // Use cached rate if available, otherwise use fallback
  const rate = clientRateCache?.rate || FALLBACK_AED_TO_INR_RATE;
  const converted = Math.round(aedAmount * rate);
  console.log(
    `Converting ${aedAmount} AED to INR: rate=${rate}, result=${converted}, cache=${!!clientRateCache}`
  );
  return converted;
}

/**
 * Initialize exchange rate on client side
 * Call this once when the app loads to fetch the latest rate
 */
export async function initializeExchangeRate(): Promise<void> {
  try {
    await getExchangeRate();
  } catch (error) {
    console.error('Failed to initialize exchange rate:', error);
  }
}

/**
 * Convert INR amount to AED
 */
export async function convertINRToAEDAsync(inrAmount: number): Promise<number> {
  const rate = await getExchangeRate();
  return Math.round((inrAmount / rate) * 100) / 100;
}

/**
 * Convert INR amount to AED (synchronous version)
 */
export function convertINRToAED(inrAmount: number): number {
  const rate = clientRateCache?.rate || FALLBACK_AED_TO_INR_RATE;
  return Math.round((inrAmount / rate) * 100) / 100;
}

/**
 * Format currency based on location
 */
export function formatCurrency(amount: number, location: UserLocation): string {
  if (location.isIndia) {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `AED ${amount.toLocaleString()}`;
}
