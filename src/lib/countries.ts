/**
 * Country data and utilities for country selection
 */

export interface CountryOption {
  value: string;
  label: string;
  flagCode: string;
}

/**
 * Get flag image URL from flagcdn.com
 */
export function getFlagImageUrl(countryCode: string, size: 'w20' | 'w40' | 'w80' = 'w20'): string {
  const code = countryCode.toLowerCase();
  return `https://flagcdn.com/${size}/${code}.png`;
}

/**
 * Comprehensive list of countries with ISO codes
 */
export const COUNTRIES: CountryOption[] = [
  { value: 'Afghanistan', label: 'Afghanistan', flagCode: 'af' },
  { value: 'Albania', label: 'Albania', flagCode: 'al' },
  { value: 'Algeria', label: 'Algeria', flagCode: 'dz' },
  { value: 'Argentina', label: 'Argentina', flagCode: 'ar' },
  { value: 'Australia', label: 'Australia', flagCode: 'au' },
  { value: 'Austria', label: 'Austria', flagCode: 'at' },
  { value: 'Bahrain', label: 'Bahrain', flagCode: 'bh' },
  { value: 'Bangladesh', label: 'Bangladesh', flagCode: 'bd' },
  { value: 'Belgium', label: 'Belgium', flagCode: 'be' },
  { value: 'Brazil', label: 'Brazil', flagCode: 'br' },
  { value: 'Canada', label: 'Canada', flagCode: 'ca' },
  { value: 'China', label: 'China', flagCode: 'cn' },
  { value: 'Denmark', label: 'Denmark', flagCode: 'dk' },
  { value: 'Egypt', label: 'Egypt', flagCode: 'eg' },
  { value: 'Finland', label: 'Finland', flagCode: 'fi' },
  { value: 'France', label: 'France', flagCode: 'fr' },
  { value: 'Germany', label: 'Germany', flagCode: 'de' },
  { value: 'Greece', label: 'Greece', flagCode: 'gr' },
  { value: 'Hong Kong', label: 'Hong Kong', flagCode: 'hk' },
  { value: 'India', label: 'India', flagCode: 'in' },
  { value: 'Indonesia', label: 'Indonesia', flagCode: 'id' },
  { value: 'Iran', label: 'Iran', flagCode: 'ir' },
  { value: 'Iraq', label: 'Iraq', flagCode: 'iq' },
  { value: 'Ireland', label: 'Ireland', flagCode: 'ie' },
  { value: 'Israel', label: 'Israel', flagCode: 'il' },
  { value: 'Italy', label: 'Italy', flagCode: 'it' },
  { value: 'Japan', label: 'Japan', flagCode: 'jp' },
  { value: 'Jordan', label: 'Jordan', flagCode: 'jo' },
  { value: 'Kuwait', label: 'Kuwait', flagCode: 'kw' },
  { value: 'Lebanon', label: 'Lebanon', flagCode: 'lb' },
  { value: 'Malaysia', label: 'Malaysia', flagCode: 'my' },
  { value: 'Mexico', label: 'Mexico', flagCode: 'mx' },
  { value: 'Morocco', label: 'Morocco', flagCode: 'ma' },
  { value: 'Netherlands', label: 'Netherlands', flagCode: 'nl' },
  { value: 'New Zealand', label: 'New Zealand', flagCode: 'nz' },
  { value: 'Norway', label: 'Norway', flagCode: 'no' },
  { value: 'Oman', label: 'Oman', flagCode: 'om' },
  { value: 'Pakistan', label: 'Pakistan', flagCode: 'pk' },
  { value: 'Philippines', label: 'Philippines', flagCode: 'ph' },
  { value: 'Poland', label: 'Poland', flagCode: 'pl' },
  { value: 'Portugal', label: 'Portugal', flagCode: 'pt' },
  { value: 'Qatar', label: 'Qatar', flagCode: 'qa' },
  { value: 'Russia', label: 'Russia', flagCode: 'ru' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia', flagCode: 'sa' },
  { value: 'Singapore', label: 'Singapore', flagCode: 'sg' },
  { value: 'South Africa', label: 'South Africa', flagCode: 'za' },
  { value: 'South Korea', label: 'South Korea', flagCode: 'kr' },
  { value: 'Spain', label: 'Spain', flagCode: 'es' },
  { value: 'Sri Lanka', label: 'Sri Lanka', flagCode: 'lk' },
  { value: 'Sweden', label: 'Sweden', flagCode: 'se' },
  { value: 'Switzerland', label: 'Switzerland', flagCode: 'ch' },
  { value: 'Thailand', label: 'Thailand', flagCode: 'th' },
  { value: 'Turkey', label: 'Turkey', flagCode: 'tr' },
  { value: 'Ukraine', label: 'Ukraine', flagCode: 'ua' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates', flagCode: 'ae' },
  { value: 'United Kingdom', label: 'United Kingdom', flagCode: 'gb' },
  { value: 'United States', label: 'United States', flagCode: 'us' },
  { value: 'Vietnam', label: 'Vietnam', flagCode: 'vn' },
  { value: 'Yemen', label: 'Yemen', flagCode: 'ye' },
];
