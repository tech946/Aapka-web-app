import { NextRequest, NextResponse } from 'next/server';
import {
  sendBookingConfirmationEmail,
  sendLimitedTimeDealBookingConfirmationEmail,
} from '@/lib/email';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseDateStringToLocal } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentTransactionId } = body;

    // Validate required field
    if (!paymentTransactionId) {
      return NextResponse.json(
        { error: 'Payment transaction ID is required' },
        { status: 400 }
      );
    }

    console.log(`📧 [EMAIL API] Fetching booking by payment_transaction_id: ${paymentTransactionId}`);

    // Fetch booking by payment_transaction_id (what we save in DB)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('payment_transaction_id', paymentTransactionId)
      .single();

    if (bookingError || !booking) {
      console.error('❌ [EMAIL API] Booking not found:', bookingError);
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found for this transaction ID',
        },
        { status: 404 }
      );
    }

    console.log(`✅ [EMAIL API] Booking found: ${booking.id}`);

    // Get passenger data
    const passengers = Array.isArray(booking.passengers) ? booking.passengers : [];
    const leadPassenger = passengers[0] || {};

    // Get customer info from lead passenger
    const customerName =
      `${leadPassenger.firstName || ''} ${leadPassenger.lastName || ''}`.trim() ||
      'Valued Customer';
    const customerEmail = leadPassenger.email || '';
    const customerPhone = leadPassenger.phone || '';
    const customerWhatsApp = leadPassenger.whatsapp || '';

    if (!customerEmail) {
      console.error('❌ [EMAIL API] No customer email found');
      return NextResponse.json(
        {
          success: false,
          error: 'Customer email not found in booking',
        },
        { status: 400 }
      );
    }

    // Fetch package details
    const packageIds = Array.isArray(booking.package_ids) ? booking.package_ids : [];
    const cartItems = Array.isArray(booking.cart_items) ? booking.cart_items : [];

    const packageDetails = await Promise.all(
      packageIds.map(async (packageId: string) => {
        const { data: pkg } = await supabaseAdmin
          .from('packages')
          .select('package_name, package_id')
          .eq('package_id', packageId)
          .single();

        return {
          packageId,
          packageName: pkg?.package_name || 'Unknown Package',
        };
      })
    );

    const packages = cartItems.map((item: any) => {
      const pkgDetail = packageDetails.find((p) => p.packageId === item.packageId);
      return {
        packageName: pkgDetail?.packageName || 'Unknown Package',
        packageId: item.packageId || '',
        selectedDate: item.selectedDate || null,
        adults: item.adults || 0,
        children: item.children || 0,
        infants: item.infants || 0,
        price: item.price || 0,
      };
    });

    // Limited Time Deal: dedicated “booking fee only” template (PDF-style), not full-package confirmation
    if (booking.limited_time_deal_id) {
      const item = cartItems[0] as Record<string, unknown> | undefined;
      const pkgName =
        packages[0]?.packageName ||
        (Array.isArray(booking.package_ids) && booking.package_ids[0]
          ? 'Package'
          : 'Limited time deal package');
      const selectedRaw = item?.selectedDate != null ? String(item.selectedDate) : '';
      let travelDateDisplay = 'Not specified';
      if (selectedRaw) {
        const d = parseDateStringToLocal(selectedRaw.split('T')[0]);
        travelDateDisplay = d
          ? d.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : selectedRaw.split('T')[0];
      }

      const ltdData = {
        bookingId: booking.id,
        packageName: pkgName,
        travelDateDisplay,
        adults: Number(item?.adults) || 0,
        children: Number(item?.children) || 0,
        infants: Number(item?.infants) || 0,
        isSoloTraveller: Boolean(item?.isSoloTraveller),
        salutation: String(leadPassenger.salutation || ''),
        firstName: String(leadPassenger.firstName || ''),
        lastName: String(leadPassenger.lastName || ''),
        email: customerEmail,
        phone: String(leadPassenger.phone || customerPhone || ''),
        whatsapp: String(leadPassenger.whatsapp || customerWhatsApp || ''),
        bookingFeePaid: Number(booking.payment_amount ?? booking.total_amount) || 0,
        currency: String(booking.payment_amount_currency || 'AED'),
        paymentTransactionId: String(paymentTransactionId || ''),
      };

      console.log(`📧 [EMAIL API] Sending LTD booking-fee emails for booking ${booking.id}`);
      const result = await sendLimitedTimeDealBookingConfirmationEmail(ltdData);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Limited time deal booking fee confirmation emails sent',
          template: 'limited_time_deal',
          customerEmailId: result.customerEmailId,
          internalEmailId: result.internalEmailId,
        });
      }
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send LTD emails',
          errors: result.errors,
        },
        { status: 500 }
      );
    }

    // Standard full booking confirmation
    const emailData = {
      bookingId: booking.id,
      customerName,
      customerEmail,
      customerPhone,
      customerWhatsApp,
      bookingDate: booking.created_at || new Date().toISOString(),
      packages,
      totalAmount: booking.total_amount || 0,
      paymentAmount: booking.payment_amount || 0,
      paymentCurrency: booking.payment_amount_currency || 'AED',
      paymentType: booking.payment_type || 'full',
      paymentStatus: booking.payment_status || 'completed',
      paymentTransactionId: paymentTransactionId,
      paymentGateway: booking.payment_gateway || 'ccavenue',
      passengers: passengers.map((p: any) => ({
        salutation: p.salutation || '',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email || '',
        phone: p.phone || '',
        whatsapp: p.whatsapp || '',
        country: p.country || '',
        pickupLocation: p.pickupLocation || undefined,
        permanentAddress: p.permanentAddress || '',
        passportExpiry: p.passportExpiry || '',
        nationality: p.nationality || undefined,
      })),
    };

    // Send emails
    console.log(`📧 [EMAIL API] Sending emails for booking ${booking.id}`);
    const result = await sendBookingConfirmationEmail(emailData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Booking confirmation emails sent successfully',
        customerEmailId: result.customerEmailId,
        internalEmailId: result.internalEmailId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send emails',
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ [EMAIL API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send booking confirmation emails',
      },
      { status: 500 }
    );
  }
}

