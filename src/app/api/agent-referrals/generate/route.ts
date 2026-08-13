import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generates a secure referral code
 * Format: r_{32_random_hex_chars}
 * Uses 128 bits of entropy for security
 */
function generateSecureReferralCode(): string {
  // 16 bytes = 128 bits of entropy = 32 hex chars
  const randomPart = crypto.randomBytes(16).toString('hex');
  return `r_${randomPart}`;
}

/**
 * Creates a SHA256 hash of the referral code for secure storage
 */
function hashReferralCode(referralCode: string): string {
  return crypto.createHash('sha256').update(referralCode).digest('hex');
}

interface GenerateRequest {
  packageId: string;
  linkType: 'discount' | 'commission';
}

/**
 * POST - Generate a new referral link for an agent
 * 
 * Security features:
 * - Link type (discount/commission) is stored in DB, not in URL
 * - Discount percentage is locked at creation time
 * - Uses 128-bit entropy referral codes
 * - Prevents self-referral via agent_id tracking
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body: GenerateRequest = await req.json();
    const { packageId, linkType } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    if (!linkType || !['discount', 'commission'].includes(linkType)) {
      return NextResponse.json(
        { error: 'Invalid link type. Must be "discount" or "commission"' },
        { status: 400 }
      );
    }

    // Get the agent record for this user
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, agent_code, user_id, is_active')
      .eq('user_id', session.user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent account not found. Please register as an agent first.' },
        { status: 403 }
      );
    }

    if (!agent.is_active) {
      return NextResponse.json(
        { error: 'Your agent account is not active.' },
        { status: 403 }
      );
    }

    // Check if agent has active subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id, is_active, end_date')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .eq('payment_status', 'completed')
      .gte('end_date', new Date().toISOString())
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Active subscription required to generate referral links.' },
        { status: 403 }
      );
    }

    // Get package details including discount percentage
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('package_id, package_name, agent_discount')
      .eq('package_id', packageId)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // For discount links, ensure package has agent discount configured
    if (linkType === 'discount' && (!pkg.agent_discount || pkg.agent_discount <= 0)) {
      return NextResponse.json(
        { error: 'This package does not have an agent discount configured.' },
        { status: 400 }
      );
    }

    // Rate limiting: Check how many referrals agent has created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabaseAdmin
      .from('agent_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .gte('created_at', today.toISOString());

    if (todayCount && todayCount >= 2) {
      return NextResponse.json(
        { error: 'Daily referral link limit reached (2 per day). You can share existing links with unlimited customers.' },
        { status: 429 }
      );
    }

    // Generate secure referral code
    const referralCode = generateSecureReferralCode();
    const referralCodeHash = hashReferralCode(referralCode);

    // Calculate expiration (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Create the referral record
    const { data: referral, error: createError } = await supabaseAdmin
      .from('agent_referrals')
      .insert({
        agent_id: agent.id,
        referral_code_hash: referralCodeHash,
        referral_code: referralCode, // Store for display in dashboard
        package_id: packageId,
        package_name: pkg.package_name,
        link_type: linkType,
        discount_percentage: linkType === 'discount' ? (pkg.agent_discount || 0) : 0,
        discount_applied: linkType === 'discount',
        status: 'active',
        expires_at: expiresAt.toISOString(),
        usage_count: 0,
      })
      .select('id, referral_code, link_type, discount_percentage, expires_at')
      .single();

    if (createError) {
      console.error('[REFERRAL GENERATE] Error creating referral:', createError);
      return NextResponse.json(
        { error: 'Failed to create referral link', details: createError.message },
        { status: 500 }
      );
    }

    // Build the referral URL (no discount parameter - it's determined by the code)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    
    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        code: referralCode,
        linkType: linkType,
        discountPercentage: referral.discount_percentage,
        expiresAt: referral.expires_at,
        packageId: packageId,
        packageName: pkg.package_name,
      },
      // Note: The full URL should be constructed on the client with the package path
      baseUrl: baseUrl,
      message: linkType === 'discount' 
        ? `Discount link created! Customers will get ${pkg.agent_discount}% off.`
        : 'Commission link created! You will earn commission on successful bookings.',
    });
  } catch (error: any) {
    console.error('[REFERRAL GENERATE] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate referral link' },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch agent's referral links for a package
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');

    // Get agent
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from('agent_referrals')
      .select('id, referral_code, link_type, discount_percentage, package_id, package_name, status, usage_count, expires_at, created_at')
      .eq('agent_id', agent.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (packageId) {
      query = query.eq('package_id', packageId);
    }

    const { data: referrals, error } = await query.limit(50);

    if (error) {
      console.error('[REFERRAL GET] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch referrals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      referrals: referrals || [],
    });
  } catch (error: any) {
    console.error('[REFERRAL GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}
