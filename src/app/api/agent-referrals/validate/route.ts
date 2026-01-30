import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hashReferralCode, validateReferralCodeFormat } from '@/lib/referral-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Validate a referral code
 * 
 * Body: {
 *   referralCode: string,
 *   discount: string // "true" or "false"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const referralCode = body?.referralCode;
    const discountParam = body?.discount;

    if (!referralCode || !discountParam) {
      return NextResponse.json(
        { error: 'Referral code and discount parameter are required' },
        { status: 400 }
      );
    }

    // Validate format
    if (!validateReferralCodeFormat(referralCode)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code format' },
        { status: 200 } // Return 200 but with valid: false
      );
    }

    // Hash the code for database lookup
    const referralCodeHash = hashReferralCode(referralCode);

    // Lookup referral in database
    const { data: referral, error: fetchError } = await supabaseAdmin
      .from('agent_referrals')
      .select(`
        id,
        agent_id,
        package_id,
        discount_applied,
        status,
        expires_at
      `)
      .eq('referral_code_hash', referralCodeHash)
      .eq('status', 'active')
      .single();

    if (fetchError || !referral) {
      return NextResponse.json(
        { valid: false, error: 'Referral code not found or inactive' },
        { status: 200 }
      );
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(referral.expires_at);
    if (now > expiresAt) {
      // Update status to expired
      await supabaseAdmin
        .from('agent_referrals')
        .update({ status: 'cancelled', rejection_reason: 'expired' })
        .eq('id', referral.id);

      return NextResponse.json(
        { valid: false, error: 'Referral code has expired' },
        { status: 200 }
      );
    }

    // Verify agent subscription is still active
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, is_active, subscription_id')
      .eq('id', referral.agent_id)
      .single();

    if (agentError || !agent || !agent.is_active) {
      return NextResponse.json(
        { valid: false, error: 'Agent account is inactive' },
        { status: 200 }
      );
    }

    // Check subscription if exists
    if (agent.subscription_id) {
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('id, payment_status, is_active, end_date')
        .eq('id', agent.subscription_id)
        .single();

      if (
        subError ||
        !subscription ||
        subscription.payment_status !== 'completed' ||
        !subscription.is_active ||
        new Date(subscription.end_date) <= new Date()
      ) {
        return NextResponse.json(
          { valid: false, error: 'Agent subscription is not active' },
          { status: 200 }
        );
      }
    }

    // Verify discount parameter matches
    const discountApplied = discountParam === 'true';
    if (referral.discount_applied !== discountApplied) {
      return NextResponse.json(
        { valid: false, error: 'Discount parameter mismatch' },
        { status: 200 }
      );
    }

    // Referral is valid
    return NextResponse.json({
      valid: true,
      referral: {
        id: referral.id,
        agentId: referral.agent_id,
        packageId: referral.package_id,
        discountApplied: referral.discount_applied,
        expiresAt: referral.expires_at,
      },
    });
  } catch (error: any) {
    console.error('[REFERRAL VALIDATE] Error:', error);
    return NextResponse.json(
      { valid: false, error: error?.message || 'Validation failed' },
      { status: 500 }
    );
  }
}
