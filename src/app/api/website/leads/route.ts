import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    },
  });
}

// POST - Submit lead from website
export async function POST(req: NextRequest) {
  try {
    // Note: This is a public endpoint for website forms
    // The API key (WEBSITE_API_KEY) is stored server-side in environment variables
    // If you need to proxy to a separate CRM system, uncomment and modify the code below
    // to call the CRM endpoint with the API key in the header

    // Example for proxying to separate CRM:
    // const crmUrl = process.env.CRM_API_URL || 'https://your-crm-domain.com/api/leads';
    // const apiKey = process.env.WEBSITE_API_KEY;
    // const response = await fetch(crmUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-api-key': apiKey,
    //   },
    //   body: JSON.stringify(body),
    // });
    // return NextResponse.json(await response.json(), { status: response.status });

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.full_name_as_per_passport || !body.whatsapp_number) {
      return NextResponse.json(
        {
          error: 'Full name (as per passport) and WhatsApp number are required',
        },
        { status: 400 }
      );
    }

    // Prepare lead data for insertion
    const leadData: any = {
      full_name_as_per_passport: body.full_name_as_per_passport,
      whatsapp_number: body.whatsapp_number,
      email_id: body.email_id || null,
      nationality: body.nationality || null,
      city_country_of_departure: body.city_country_of_departure || null,
      check_in_date: body.check_in_date || null,
      check_out_date: body.check_out_date || null,
      total_nights: body.total_nights || null,
      flexible_dates: body.flexible_dates || false,
      total_travelers: body.total_travelers || null,
      adults: body.adults || null,
      children_count: body.children_count || null,
      children_ages: body.children_ages || null,
      infant_count: body.infant_count || null,
      senior_travelers: body.senior_travelers || false,
      senior_travelers_age_detail: body.senior_travelers_age_detail || null,
      special_needs: body.special_needs || null,
      need_dubai_visa: body.need_dubai_visa || false,
      hotel_category: body.hotel_category || null,
      room_type: body.room_type || null,
      room_type_id: body.room_type_id || null,
      meal_plan: body.meal_plan || null,
      preferred_location: body.preferred_location || null,
      bed_type: body.bed_type || null,
      smoking_room_required: body.smoking_room_required || false,
      dubai_city_tour: body.dubai_city_tour || false,
      abu_dhabi_city_tour: body.abu_dhabi_city_tour || false,
      desert_safari: body.desert_safari || null,
      marina_dinner_cruise: body.marina_dinner_cruise || false,
      creek_cruise: body.creek_cruise || false,
      burj_khalifa_ticket: body.burj_khalifa_ticket || null,
      dubai_frame: body.dubai_frame || false,
      miracle_garden: body.miracle_garden || false,
      global_village: body.global_village || false,
      ain_dubai: body.ain_dubai || false,
      atlantis_aquaventure: body.atlantis_aquaventure || false,
      ski_dubai: body.ski_dubai || false,
      ferrari_world: body.ferrari_world || false,
      warner_bros: body.warner_bros || false,
      motiongate_img: body.motiongate_img || null,
      yacht_experience: body.yacht_experience || null,
      vegetarian: body.vegetarian || false,
      jain_food: body.jain_food || false,
      per_person_budget: body.per_person_budget || null,
      full_package_budget: body.full_package_budget || null,
      flexible_budget: body.flexible_budget || false,
      payment_mode: body.payment_mode || null,
      currency: body.currency || null,
      honeymoon: body.honeymoon || false,
      anniversary: body.anniversary || false,
      birthday: body.birthday || false,
      surprise_decorations: body.surprise_decorations || false,
      cake_private_dinner: body.cake_private_dinner || false,
      source: 'website', // Mark as coming from website
    };

    // Insert lead into database
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting lead:', error);
      return NextResponse.json(
        { error: 'Failed to submit lead', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Lead submitted successfully. We will contact you soon.',
        data,
      },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, x-api-key, Authorization',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in website leads API:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Unexpected error occurred',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, x-api-key, Authorization',
        },
      }
    );
  }
}
