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
 * Uses exchangerate-api.io (free, no API key required for basic usage)
 */
async function fetchExchangeRate(): Promise<number> {
  try {
    // Using exchangerate-api.io free tier (no API key needed)
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/AED',
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    const inrRate = data.rates?.INR;

    if (!inrRate || typeof inrRate !== 'number') {
      throw new Error('Invalid exchange rate data');
    }

    return inrRate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);

    // Fallback: Try alternative API (fixer.io format via exchangerate.host)
    try {
      const fallbackResponse = await fetch(
        'https://api.exchangerate.host/latest?base=AED&symbols=INR',
        {
          next: { revalidate: 3600 },
        }
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.rates?.INR) {
          return fallbackData.rates.INR;
        }
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }

    // If all APIs fail, return cached rate or default
    if (cachedRate) {
      return cachedRate.rate;
    }

    // Last resort: return approximate rate
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
