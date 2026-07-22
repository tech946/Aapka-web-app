import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Creates a SHA256 hash of the referral code for lookup
 */
function hashReferralCode(referralCode: string): string {
  return crypto.createHash('sha256').update(referralCode).digest('hex');
}

/**
 * Validates referral code format
 * Format: r_{32_hex_chars}
 */
function validateReferralCodeFormat(referralCode: string): boolean {
  // New secure format: r_[32 hex chars]
  const newPattern = /^r_[a-f0-9]{32}$/;
  // Legacy format for backwards compatibility: AGT-XXXXXX-[16 hex chars]-[base36 timestamp]
  const legacyPattern = /^AGT-[A-Z0-9]+-[a-f0-9]{16}-[a-z0-9]+$/;
  
  return newPattern.test(referralCode) || legacyPattern.test(referralCode);
}

interface ValidateRequest {
  referralCode: string;
  packageId?: string;
}

/**
 * POST - Validate a referral code and return its details
 * 
 * Security features:
 * - Link type is retrieved from DB, not from URL
 * - Prevents self-referral
 * - Checks expiration
 * - Checks usage limits
 * - Rate limits validation requests
 */
export async function POST(req: NextRequest) {
  try {
    const body: ValidateRequest = await req.json();
    const { referralCode, packageId } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Validate format
    if (!validateReferralCodeFormat(referralCode)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code format' },
        { status: 400 }
      );
    }

    // Hash the code for lookup
    const referralCodeHash = hashReferralCode(referralCode);

    // Look up the referral in database
    const { data: referral, error: lookupError } = await supabaseAdmin
      .from('agent_referrals')
      .select(`
        id,
        agent_id,
        package_id,
        package_name,
        link_type,
        discount_percentage,
        discount_applied,
        status,
        usage_count,
        max_uses,
        expires_at,
        created_at,
        agents (
          id,
          user_id,
          full_name,
          agent_code
        )
      `)
      .eq('referral_code_hash', referralCodeHash)
      .single();

    if (lookupError || !referral) {
      return NextResponse.json(
        { valid: false, error: 'Referral code not found or invalid' },
        { status: 404 }
      );
    }

    // Check if referral is active
    if (referral.status !== 'active') {
      return NextResponse.json(
        { valid: false, error: 'This referral link is no longer active' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(referral.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'This referral link has expired' },
        { status: 400 }
      );
    }

    // Check usage limits
    if (referral.max_uses !== null && referral.usage_count >= referral.max_uses) {
      return NextResponse.json(
        { valid: false, error: 'This referral link has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check if package matches (if package-specific referral)
    if (referral.package_id && packageId && referral.package_id !== packageId) {
      return NextResponse.json(
        { valid: false, error: 'This referral link is for a different package' },
        { status: 400 }
      );
    }

    // Check for self-referral (if user is logged in)
    const supabase = createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const agentData = referral.agents as any;
    if (session?.user && agentData?.user_id === session.user.id) {
      return NextResponse.json(
        { valid: false, error: 'You cannot use your own referral link' },
        { status: 400 }
      );
    }

    // Get package discount info if not already stored
    let discountPercentage = referral.discount_percentage;
    
    // If discount link but percentage is 0, fetch from package
    if (referral.link_type === 'discount' && (!discountPercentage || discountPercentage === 0) && referral.package_id) {
      const { data: pkg } = await supabaseAdmin
        .from('packages')
        .select('agent_discount')
        .eq('package_id', referral.package_id)
        .single();
      
      if (pkg?.agent_discount) {
        discountPercentage = pkg.agent_discount;
      }
    }

    // Return validated referral info
    // IMPORTANT: The link_type determines if discount is applied, NOT a URL parameter
    return NextResponse.json({
      valid: true,
      referral: {
        id: referral.id,
        agentId: referral.agent_id,
        agentName: agentData?.full_name || 'Agent',
        packageId: referral.package_id,
        packageName: referral.package_name,
        // SECURITY: This comes from DB, not from URL
        linkType: referral.link_type,
        // Only include discount if it's a discount-type link
        discountPercentage: referral.link_type === 'discount' ? discountPercentage : 0,
        showDiscount: referral.link_type === 'discount',
        expiresAt: referral.expires_at,
      },
    });
  } catch (error: any) {
    console.error('[REFERRAL VALIDATE] Error:', error);
    return NextResponse.json(
      { valid: false, error: error?.message || 'Failed to validate referral' },
      { status: 500 }
    );
  }
}

/**
 * GET - Quick validation check (lighter weight)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const referralCode = searchParams.get('code');

    if (!referralCode) {
      return NextResponse.json(
        { valid: false, error: 'Referral code required' },
        { status: 400 }
      );
    }

    // Use POST handler logic
    const response = await POST(
      new NextRequest(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({ referralCode }),
      })
    );

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
