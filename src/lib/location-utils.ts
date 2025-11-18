/**
 * Location detection and currency utilities
 */

// AED to INR exchange rate (update this with real-time rates or API)
const AED_TO_INR_RATE = 22.5; // Approximate rate, should be fetched from API in production

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
  try {
    // Try to get location from IP geolocation service
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const country = data.country_name || 'Unknown';
    const countryCode = data.country_code || 'US';
    const isIndia = countryCode === 'IN' || country === 'India';
    
    return {
      country,
      countryCode,
      isIndia,
      currency: isIndia ? 'INR' : 'AED',
      currencySymbol: isIndia ? '₹' : 'AED',
    };
  } catch (error) {
    console.error('Error detecting location:', error);
    // Default to non-India
    return {
      country: 'Unknown',
      countryCode: 'US',
      isIndia: false,
      currency: 'AED',
      currencySymbol: 'AED',
    };
  }
}

/**
 * Convert AED amount to INR
 */
export function convertAEDToINR(aedAmount: number): number {
  return Math.round(aedAmount * AED_TO_INR_RATE);
}

/**
 * Convert INR amount to AED
 */
export function convertINRToAED(inrAmount: number): number {
  return Math.round((inrAmount / AED_TO_INR_RATE) * 100) / 100;
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

