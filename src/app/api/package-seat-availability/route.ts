import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper function to calculate occupied seats from successful bookings
async function getOccupiedSeatsForPackageDates(
  packageId: string
): Promise<Map<string, number>> {
  const occupiedSeatsMap = new Map<string, number>();

  try {
    // Fetch all successful bookings (payment_status = 'completed')
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('cart_items')
      .eq('payment_status', 'completed');

    if (error || !bookings) {
      console.error('Error fetching bookings for seat calculation:', error);
      return occupiedSeatsMap;
    }

    // Process each booking to count occupied seats per date
    for (const booking of bookings) {
      const cartItems = booking.cart_items;
      if (!Array.isArray(cartItems)) continue;

      for (const item of cartItems) {
        // Check if this cart item is for the requested package
        if (item.packageId === packageId && item.selectedDate) {
          // Normalize the date to YYYY-MM-DD format
          const dateStr = item.selectedDate.split('T')[0];
          const adults = Number(item.adults) || 0;
          const children = Number(item.children) || 0;
          const infants = Number(item.infants) || 0;
          // For solo traveller, count as 1 seat
          const totalPersons = item.isSoloTraveller ? 1 : adults + children + infants;

          const currentOccupied = occupiedSeatsMap.get(dateStr) || 0;
          occupiedSeatsMap.set(dateStr, currentOccupied + totalPersons);
        }
      }
    }
  } catch (e) {
    console.error('Error calculating occupied seats:', e);
  }

  return occupiedSeatsMap;
}

// GET: Get seat availability for a package
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('package_id');

    if (!packageId) {
      return NextResponse.json(
        { error: 'package_id is required' },
        { status: 400 }
      );
    }

    // Get occupied seats map
    const occupiedSeatsMap = await getOccupiedSeatsForPackageDates(packageId);

    // Convert map to object for JSON response
    const seatAvailability: Record<string, number> = {};
    const DEFAULT_SEATS = 45;

    // For each date in the map, calculate available seats
    occupiedSeatsMap.forEach((occupied, dateStr) => {
      seatAvailability[dateStr] = Math.max(0, DEFAULT_SEATS - occupied);
    });

    return NextResponse.json({
      success: true,
      data: seatAvailability,
      defaultSeats: DEFAULT_SEATS,
    });
  } catch (error: any) {
    console.error('Error fetching seat availability:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch seat availability' },
      { status: 500 }
    );
  }
}
