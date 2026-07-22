import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRM_BASE = process.env.CRM_API_URL || 'https://crm.aapkatourism.com';
const CRM_B2B_URL =
  process.env.CRM_B2B_COLLABORATION_URL?.trim() ||
  `${CRM_BASE.replace(/\/$/, '')}/api/website/b2b-collaboration-enquiry`;

const BUCKET = 'packages';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const SERVICE_TYPES = [
  'hotel',
  'restaurant',
  'dmc',
  'transport',
  'tour_operator',
] as const;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

async function uploadB2BFile(file: File, subfolder: string): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Each file must be 10 MB or less');
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error('Allowed types: PDF, JPG, PNG, WebP');
  }

  const ext =
    file.name.split('.').pop()?.toLowerCase() ||
    (file.type === 'application/pdf' ? 'pdf' : 'jpg');
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = `b2b-collaboration/${subfolder}/${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const contentType =
    file.type ||
    (ext === 'pdf' ? 'application/pdf' : 'image/jpeg');

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error('B2B file upload error:', error);
    throw new Error(error.message || 'File upload failed');
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

function parseBool(v: FormDataEntryValue | null): boolean {
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 }
      );
    }

    const form = await req.formData();

    const company_name = String(form.get('company_name') || '').trim();
    const contact_person_name = String(form.get('contact_person_name') || '').trim();
    const whatsapp_number = String(form.get('whatsapp_number') || '').trim();
    const email = String(form.get('email') || '').trim();
    const country = String(form.get('country') || '').trim();
    const city = String(form.get('city') || '').trim();
    const type_of_service = String(form.get('type_of_service') || '').trim();
    const years_in_business = parseInt(String(form.get('years_in_business') || ''), 10);
    const company_website_or_instagram = String(
      form.get('company_website_or_instagram') || ''
    ).trim();
    const services_offered_detail = String(
      form.get('services_offered_detail') || ''
    ).trim();
    const key_products = String(form.get('key_products') || '').trim();
    const license_type = String(form.get('license_type') || '').trim();
    const why_partner_with_aapka = String(
      form.get('why_partner_with_aapka') || ''
    ).trim();
    const dedicated_manager_available = parseBool(
      form.get('dedicated_manager_available')
    );

    const regFile = form.get('company_registration_proof') as File | null;

    if (!company_name)
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    if (!contact_person_name)
      return NextResponse.json(
        { error: 'Contact person name is required' },
        { status: 400 }
      );
    if (!whatsapp_number)
      return NextResponse.json(
        { error: 'WhatsApp number is required' },
        { status: 400 }
      );
    if (!email)
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    if (!country)
      return NextResponse.json({ error: 'Country is required' }, { status: 400 });
    if (!city) return NextResponse.json({ error: 'City is required' }, { status: 400 });
    if (!SERVICE_TYPES.includes(type_of_service as (typeof SERVICE_TYPES)[number])) {
      return NextResponse.json(
        { error: 'Invalid type of service' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(years_in_business) || years_in_business < 1 || years_in_business > 10) {
      return NextResponse.json(
        { error: 'Years in business must be between 1 and 10' },
        { status: 400 }
      );
    }
    if (!services_offered_detail)
      return NextResponse.json(
        { error: 'Services offered (detail) is required' },
        { status: 400 }
      );
    if (!key_products)
      return NextResponse.json(
        { error: 'Key products is required' },
        { status: 400 }
      );
    if (!license_type)
      return NextResponse.json({ error: 'License type is required' }, { status: 400 });
    if (!why_partner_with_aapka)
      return NextResponse.json(
        { error: 'Please tell us why you want to partner with Aapka' },
        { status: 400 }
      );

    let company_registration_proof_url: string | null = null;

    try {
      if (regFile && typeof regFile === 'object' && regFile.size > 0) {
        company_registration_proof_url = await uploadB2BFile(
          regFile,
          'registration'
        );
      }
    } catch (uploadErr: unknown) {
      const msg =
        uploadErr instanceof Error ? uploadErr.message : 'File upload failed';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const payload = {
      company_name,
      contact_person_name,
      whatsapp_number,
      email,
      country,
      city,
      type_of_service,
      years_in_business,
      company_website_or_instagram: company_website_or_instagram || null,
      services_offered_detail,
      key_products,
      company_registration_proof_url,
      license_type,
      why_partner_with_aapka,
      dedicated_manager_available,
    };

    const apiKey = process.env.WEBSITE_API_KEY?.trim();
    if (!apiKey) {
      console.error('B2B collaboration: WEBSITE_API_KEY not set; CRM forward skipped');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error. Please contact support.',
        },
        { status: 500 }
      );
    }

    const crmRes = await fetch(CRM_B2B_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const crmText = await crmRes.text();
    let crmJson: { success?: boolean; message?: string; error?: string } = {};
    try {
      crmJson = crmText ? JSON.parse(crmText) : {};
    } catch {
      /* non-JSON */
    }

    if (!crmRes.ok) {
      console.error('B2B CRM error:', crmRes.status, crmText);
      return NextResponse.json(
        {
          success: false,
          error:
            crmJson.error ||
            crmJson.message ||
            `Partner request could not be submitted (CRM ${crmRes.status}). Please try again or contact us.`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        crmJson.message ||
        'Thank you. Your B2B collaboration request has been submitted. Our team will contact you soon.',
    });
  } catch (e: unknown) {
    console.error('B2B collaboration error:', e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Something went wrong',
      },
      { status: 500 }
    );
  }
}
