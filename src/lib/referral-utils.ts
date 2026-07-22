import crypto from 'crypto';

/**
 * Generates a secure referral code
 * Format: {AGENT_CODE}-{RANDOM_16_CHARS}-{TIMESTAMP_HASH}
 * Example: AGT-ABC123-a7f3k9m2x5p8q1r4-1704067200
 * 
 * @param agentCode - The agent's code (e.g., "AGT-ABC123")
 * @returns Secure referral code
 */
export function generateReferralCode(agentCode: string): string {
  // Generate 16 random alphanumeric characters
  const randomPart = crypto.randomBytes(8).toString('hex'); // 16 chars
  // Generate timestamp hash (base36 for shorter)
  const timestampHash = Date.now().toString(36);
  
  return `${agentCode}-${randomPart}-${timestampHash}`;
}

/**
 * Creates a SHA256 hash of the referral code for secure storage
 * 
 * @param referralCode - The plain referral code
 * @returns SHA256 hash
 */
export function hashReferralCode(referralCode: string): string {
  return crypto.createHash('sha256').update(referralCode).digest('hex');
}

/**
 * Validates referral code format
 * 
 * @param referralCode - The referral code to validate
 * @returns true if format is valid
 */
export function validateReferralCodeFormat(referralCode: string): boolean {
  // Format: AGT-XXXXXX-XXXXXXXXXXXXXXXX-XXXXXXXXXX
  // Example: AGT-ABC123-a7f3k9m2x5p8q1r4-1704067200
  const pattern = /^AGT-[A-Z0-9]+-[a-f0-9]{16}-[a-z0-9]+$/;
  return pattern.test(referralCode);
}

/**
 * Extracts agent code from referral code
 * 
 * @param referralCode - The referral code
 * @returns Agent code (e.g., "AGT-ABC123") or null if invalid
 */
export function extractAgentCodeFromReferral(referralCode: string): string | null {
  if (!validateReferralCodeFormat(referralCode)) {
    return null;
  }
  
  // Extract first part before second dash
  const parts = referralCode.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  
  return null;
}

/**
 * Generates a shareable referral URL
 * 
 * @param baseUrl - Base URL of the site
 * @param packagePath - Package path (e.g., "/category/dubai-packages/dubai-4n5d-pkg-12345")
 * @param referralCode - The referral code
 * @param discountApplied - Whether discount is applied
 * @returns Shareable URL
 */
export function generateReferralUrl(
  baseUrl: string,
  packagePath: string,
  referralCode: string,
  discountApplied: boolean
): string {
  const url = new URL(packagePath, baseUrl);
  url.searchParams.set('ref', referralCode);
  url.searchParams.set('discount', discountApplied ? 'true' : 'false');
  return url.toString();
}

/**
 * Parses referral parameters from URL
 * 
 * @param searchParams - URL search parameters
 * @returns Parsed referral data or null
 */
export function parseReferralFromUrl(searchParams: URLSearchParams): {
  referralCode: string;
  discountApplied: boolean;
} | null {
  const ref = searchParams.get('ref');
  const discount = searchParams.get('discount');
  
  if (!ref || !discount) {
    return null;
  }
  
  if (!validateReferralCodeFormat(ref)) {
    return null;
  }
  
  const discountApplied = discount === 'true';
  
  return {
    referralCode: ref,
    discountApplied,
  };
}
