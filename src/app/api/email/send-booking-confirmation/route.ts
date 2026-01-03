import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      customerWhatsApp,
      bookingDate,
      packages,
      totalAmount,
      paymentAmount,
      paymentCurrency,
      paymentType,
      paymentStatus,
      paymentTransactionId,
      paymentGateway,
      passengers,
    } = body;

    // Validate required fields
    if (!bookingId || !customerEmail) {
      return NextResponse.json(
        { error: 'Booking ID and customer email are required' },
        { status: 400 }
      );
    }

    // Call the email service
    const result = await sendBookingConfirmationEmail({
      bookingId,
      customerName: customerName || 'Valued Customer',
      customerEmail,
      customerPhone: customerPhone || '',
      customerWhatsApp: customerWhatsApp || '',
      bookingDate: bookingDate || new Date().toISOString(),
      packages: packages || [],
      totalAmount: totalAmount || 0,
      paymentAmount: paymentAmount || 0,
      paymentCurrency: paymentCurrency || 'AED',
      paymentType: paymentType || 'full',
      paymentStatus: paymentStatus || 'completed',
      paymentTransactionId: paymentTransactionId || '',
      paymentGateway: paymentGateway || 'ccavenue',
      passengers: passengers || [],
    });

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
    console.error('Error in email API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send booking confirmation emails',
      },
      { status: 500 }
    );
  }
}

