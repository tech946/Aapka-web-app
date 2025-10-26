import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all leads with pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `fullname.ilike.%${search}%,email.ilike.%${search}%,mobile_no.ilike.%${search}%`
      );
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields for lead creation
    const {
      fullname,
      mobile_no,
      email,
      relationship,
      budget,
      purpose_of_buying,
      buying_timeline,
      notes,
    } = body;

    // All fields are required except notes
    if (
      !fullname ||
      !mobile_no ||
      !email ||
      !relationship ||
      !budget ||
      !purpose_of_buying ||
      !buying_timeline
    ) {
      return NextResponse.json(
        {
          error: 'All fields are required except additional notes',
        },
        { status: 400 }
      );
    }

    // Create lead data
    const leadData = {
      fullname,
      mobile_no,
      email,
      relationship,
      budget: parseFloat(budget),
      purpose_of_buying,
      buying_timeline,
      notes: notes || null,
      status: 'new', // Default status for new leads
      created_by: user.id,
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Lead created successfully',
        lead,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, timeline_status, assigned_to } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Only allow updating timeline_status and assignment (for web interface)
    const updateData: any = {};

    if (timeline_status) {
      updateData.timeline_status = timeline_status;

      // Update timeline_dates to set the current date for the new status
      const { data: currentLead } = await supabase
        .from('leads')
        .select('timeline_dates')
        .eq('id', id)
        .single();

      if (currentLead) {
        const timelineDates = currentLead.timeline_dates || {};
        timelineDates[timeline_status] = new Date().toISOString();
        updateData.timeline_dates = timelineDates;
      }
    }

    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Send notification if timeline status changed
    if (timeline_status) {
      try {
        // Get the lead creator to send them notification
        const { data: leadCreator } = await supabase
          .from('leads')
          .select('created_by, fullname')
          .eq('id', id)
          .single();

        if (leadCreator && leadCreator.created_by) {
          const timelineLabels = {
            lead_submitted: 'Lead Submitted',
            call_scheduled: 'Call Scheduled',
            site_visit_done: 'Site Visit Done',
            booking_confirm: 'Booking Confirm',
            commission_released: 'Commission Released',
          };

          const notificationTitle = `Lead Status Updated`;
          const notificationMessage = `Your lead "${leadCreator.fullname}" has moved to "${timelineLabels[timeline_status as keyof typeof timelineLabels] || timeline_status}" stage.`;

          const notificationData = {
            lead_id: id,
            old_timeline_status: lead.timeline_status,
            new_timeline_status: timeline_status,
            updated_by: user.id,
          };

          // Insert notification
          await supabase.from('notifications').insert({
            user_id: leadCreator.created_by,
            lead_id: id,
            type: 'timeline_update',
            title: notificationTitle,
            message: notificationMessage,
            data: notificationData,
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the main request if notification fails
      }
    }

    return NextResponse.json({
      message: 'Lead updated successfully',
      lead,
    });
  } catch (error) {
    console.error('Error in PUT /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json(
        { error: 'Failed to delete lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
