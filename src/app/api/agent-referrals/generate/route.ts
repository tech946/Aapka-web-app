import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateReferralCode, hashReferralCode, generateReferralUrl } from '@/lib/referral-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Generate a referral link for an agent
 * 
 * Body: {
 *   packageId?: string, // Optional: specific package
 *   discountApplied: boolean // true = customer gets discount, false = agent gets commission
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const supabase = createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify user is an active agent
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, agent_code, is_active, subscription_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (agentError || !agent || !agent.agent_code) {
      return NextResponse.json(
        { error: 'Agent account not found or inactive' },
        { status: 403 }
      );
    }

    // Check if agent has active subscription
    if (agent.subscription_id) {
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('id, payment_status, is_active, end_date')
        .eq('id', agent.subscription_id)
        .single();

      if (
        !subscription ||
        subscription.payment_status !== 'completed' ||
        !subscription.is_active ||
        new Date(subscription.end_date) <= new Date()
      ) {
        return NextResponse.json(
          { error: 'Active subscription required to generate referral links' },
          { status: 403 }
        );
      }
    }

    // Rate limiting: Check how many codes generated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabaseAdmin
      .from('agent_referrals')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .gte('created_at', today.toISOString());

    const maxCodesPerDay = 100;
    if (todayCount && todayCount >= maxCodesPerDay) {
      return NextResponse.json(
        { error: `Daily limit reached. Maximum ${maxCodesPerDay} referral codes per day.` },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();
    const packageId = body?.packageId || null;
    const discountApplied = body?.discountApplied === true;

    // Validate package if provided
    if (packageId) {
      const { data: pkg } = await supabaseAdmin
        .from('packages')
        .select('package_id')
        .eq('package_id', packageId)
        .single();

      if (!pkg) {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }
    }

    // Generate secure referral code
    const referralCode = generateReferralCode(agent.agent_code);
    const referralCodeHash = hashReferralCode(referralCode);

    // Check for hash collision (extremely unlikely but check anyway)
    const { data: existing } = await supabaseAdmin
      .from('agent_referrals')
      .select('id')
      .eq('referral_code_hash', referralCodeHash)
      .maybeSingle();

    if (existing) {
      // Retry with new code (should never happen, but safety check)
      return NextResponse.json(
        { error: 'Code generation conflict. Please try again.' },
        { status: 500 }
      );
    }

    // Set expiration (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Create referral record
    const { data: referral, error: insertError } = await supabaseAdmin
      .from('agent_referrals')
      .insert({
        agent_id: agent.id,
        referral_code_hash: referralCodeHash,
        package_id: packageId,
        discount_applied: discountApplied,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError || !referral) {
      console.error('[REFERRAL GENERATE] Error creating referral:', insertError);
      return NextResponse.json(
        { error: 'Failed to create referral link', details: insertError?.message },
        { status: 500 }
      );
    }

    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    let packagePath = '/';
    
    if (packageId) {
      // Get package slug for URL
      const { data: pkg } = await supabaseAdmin
        .from('packages')
        .select('package_id, package_name')
        .eq('package_id', packageId)
        .single();

      if (pkg) {
        // Generate slug from package name (simplified - you may need to adjust)
        const slug = pkg.package_name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        const packageIdSuffix = pkg.package_id.replace(/-/g, '').slice(-5);
        packagePath = `/category/packages/${slug}-${packageIdSuffix}`;
      }
    }

    const shareableUrl = generateReferralUrl(
      baseUrl,
      packagePath,
      referralCode,
      discountApplied
    );

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        referralCode, // Plain code for URL (only returned once)
        shareableUrl,
        discountApplied,
        expiresAt: referral.expires_at,
        packageId: referral.package_id,
      },
    });
  } catch (error: any) {
    console.error('[REFERRAL GENERATE] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate referral link' },
      { status: 500 }
    );
  }
}
