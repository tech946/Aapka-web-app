import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

interface ExchangeRateResponse {
  success: boolean;
  rate?: number;
  timestamp?: number;
  error?: string;
}

// Cache for exchange rate (in-memory cache)
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Fetch real-time AED to INR exchange rate
 * Uses multiple reliable free APIs with fallbacks for maximum accuracy
 * Primary: fawazahmed0/currency-api (free, accurate, no API key)
 * Fallbacks: exchangerate.host and exchangerate-api.com
 */
async function fetchExchangeRate(): Promise<number> {
  // Primary: fawazahmed0/currency-api - Free, accurate, updated daily
  // This API provides rates similar to Google Finance
  try {
    const response = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aed.json',
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch exchange rate`);
    }

    const data = await response.json();
    // Response format: { "aed": { "inr": 22.75, ... } }
    const inrRate = data?.aed?.inr;

    if (
      inrRate &&
      typeof inrRate === 'number' &&
      inrRate > 0 &&
      inrRate < 100
    ) {
      // Validate rate is in reasonable range (AED to INR is typically 20-25)
      console.log('Primary API rate fetched:', inrRate);
      return inrRate;
    }

    throw new Error('Invalid exchange rate data from primary API');
  } catch (error) {
    console.error('Error fetching exchange rate (primary):', error);

    // Fallback 1: exchangerate.host - Free, reliable, frequently updated
    try {
      const fallbackResponse1 = await fetch(
        'https://api.exchangerate.host/latest?base=AED&symbols=INR',
        {
          next: { revalidate: 3600 },
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (fallbackResponse1.ok) {
        const fallbackData = await fallbackResponse1.json();
        const inrRate = fallbackData?.rates?.INR;

        if (
          inrRate &&
          typeof inrRate === 'number' &&
          inrRate > 0 &&
          inrRate < 100
        ) {
          console.log('Fallback 1 API rate fetched:', inrRate);
          return inrRate;
        }
      }
    } catch (fallbackError1) {
      console.error('Fallback API 1 failed:', fallbackError1);
    }

    // Fallback 2: exchangerate-api.com (original but as fallback)
    try {
      const fallbackResponse2 = await fetch(
        'https://api.exchangerate-api.com/v4/latest/AED',
        {
          next: { revalidate: 3600 },
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (fallbackResponse2.ok) {
        const fallbackData = await fallbackResponse2.json();
        const inrRate = fallbackData?.rates?.INR;

        if (
          inrRate &&
          typeof inrRate === 'number' &&
          inrRate > 0 &&
          inrRate < 100
        ) {
          console.log('Fallback 2 API rate fetched:', inrRate);
          return inrRate;
        }
      }
    } catch (fallbackError2) {
      console.error('Fallback API 2 failed:', fallbackError2);
    }

    // If all APIs fail, return cached rate or default
    if (cachedRate) {
      console.log('Using cached rate:', cachedRate.rate);
      return cachedRate.rate;
    }

    // Last resort: return approximate rate
    console.warn('All APIs failed, using fallback rate:', 22.5);
    return 22.5;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if we have a valid cached rate
    const now = Date.now();
    if (cachedRate && now - cachedRate.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        rate: cachedRate.rate,
        timestamp: cachedRate.timestamp,
        cached: true,
      } as ExchangeRateResponse);
    }

    // Fetch fresh rate
    const rate = await fetchExchangeRate();
    const timestamp = Date.now();

    // Update cache
    cachedRate = { rate, timestamp };

    return NextResponse.json({
      success: true,
      rate,
      timestamp,
      cached: false,
    } as ExchangeRateResponse);
  } catch (error: any) {
    console.error('Error in currency rate API:', error);

    // Return cached rate if available, even if expired
    if (cachedRate) {
      return NextResponse.json({
        success: true,
        rate: cachedRate.rate,
        timestamp: cachedRate.timestamp,
        cached: true,
        warning: 'Using cached rate due to API error',
      } as ExchangeRateResponse);
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch exchange rate',
        rate: 22.5, // Fallback rate
      } as ExchangeRateResponse,
      { status: 500 }
    );
  }
}
