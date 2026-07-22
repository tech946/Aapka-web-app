import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendPdfBrochureEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body?.name || '').trim();
    const email = (body?.email || '').trim();
    const whatsapp = (body?.whatsapp || '').trim();
    const packageId = (body?.package_id || '').trim();
    const packageName = (body?.package_name || '').trim();
    const pdfUrl = (body?.pdf_url || '').trim();

    // All three required
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!whatsapp) {
      return NextResponse.json({ error: 'WhatsApp number is required' }, { status: 400 });
    }
    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // Save to pdf_enquiries
    const { data: enquiry, error: insertError } = await supabaseAdmin
      .from('pdf_enquiries')
      .insert([
        {
          name,
          email,
          whatsapp,
          package_id: packageId || null,
          package_name: packageName || null,
          pdf_url: pdfUrl,
        },
      ])
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('PDF enquiry insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save your request. Please try again.' },
        { status: 500 }
      );
    }

    const emailResult = await sendPdfBrochureEmail({
      customerName: name,
      customerEmail: email,
      packageName: packageName || 'Package',
      pdfUrl,
    });

    if (!emailResult.success) {
      console.error('PDF brochure email failed:', emailResult.error);
      return NextResponse.json(
        { error: 'Your details were saved but we could not send the email. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your brochure has been sent to your email!',
    });
  } catch (e: any) {
    console.error('PDF enquiry error:', e);
    return NextResponse.json(
      { error: e?.message ?? 'Something went wrong. Please try again.' },
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
      .from('pdf_enquiries')
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to load' }, { status: 500 });
  }
}
