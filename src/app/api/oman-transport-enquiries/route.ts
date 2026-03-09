import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const travellingDate = (body?.travelling_date || '').trim();
    const leadPassengerName = (body?.lead_passenger_name || '').trim();
    const whatsappNumber = (body?.whatsapp_number || '').trim();
    const callingNumber = (body?.calling_number || '').trim();
    const email = (body?.email || '').trim();
    const nationality = (body?.nationality || '').trim();
    const statusInUae = (body?.status_in_uae || '').trim();
    const omanVisaStatus = (body?.oman_visa_status || '').trim();
    const numberOfAdults = Math.max(0, parseInt(body?.number_of_adults || '1', 10) || 1);
    const numberOfChildren = Math.max(0, parseInt(body?.number_of_children || '0', 10) || 0);
    const flightHotelBooking = (body?.flight_hotel_booking || '').trim();
    const passportValidityAccepted = !!body?.passport_validity_accepted;
    const termsAccepted = !!body?.terms_accepted;

    if (!travellingDate)
      return NextResponse.json({ error: 'Travelling date is required' }, { status: 400 });
    if (!leadPassengerName)
      return NextResponse.json({ error: 'Lead passenger name is required' }, { status: 400 });
    if (!whatsappNumber)
      return NextResponse.json({ error: 'WhatsApp number is required' }, { status: 400 });
    if (!email)
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!nationality)
      return NextResponse.json({ error: 'Nationality is required' }, { status: 400 });
    if (!statusInUae)
      return NextResponse.json({ error: 'Status in UAE is required' }, { status: 400 });
    if (!omanVisaStatus)
      return NextResponse.json({ error: 'Oman visa status is required' }, { status: 400 });
    if (!passportValidityAccepted)
      return NextResponse.json({ error: 'You must confirm all passengers have passport validity of more than 6 months' }, { status: 400 });
    if (!termsAccepted)
      return NextResponse.json({ error: 'You must accept the terms and conditions' }, { status: 400 });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });

    const { data: enquiry, error: insertError } = await supabaseAdmin
      .from('oman_transport_enquiries')
      .insert([
        {
          travelling_date: travellingDate,
          lead_passenger_name: leadPassengerName,
          whatsapp_number: whatsappNumber,
          calling_number: callingNumber || null,
          email,
          nationality,
          status_in_uae: statusInUae,
          oman_visa_status: omanVisaStatus,
          number_of_adults: numberOfAdults,
          number_of_children: numberOfChildren,
          flight_hotel_booking: flightHotelBooking || null,
          passport_validity_accepted: passportValidityAccepted,
          terms_accepted: termsAccepted,
        },
      ])
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Oman transport enquiry insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save your request. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your enquiry has been submitted successfully. We will contact you shortly.',
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Oman transport enquiry error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '10', 10)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from('oman_transport_enquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err?.message ?? 'Failed to load' }, { status: 500 });
  }
}
