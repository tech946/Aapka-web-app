import { NextRequest, NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/lib/ccavenue-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify CCAvenue encryption/decryption is working correctly
 * This helps debug authentication issues
 */
export async function GET(req: NextRequest) {
  try {
    // Using credentials directly (as provided)
    const merchantId = '54983';
    const accessCode = 'AVLG05MJ58AS49GLSA';
    const workingKey = '5E25D58B6BF1633A1525984EB4E2E944';

    // Fallback to env if needed
    // const merchantId = process.env.CCAVENUE_MERCHANT_ID || '54983';
    // const accessCode = process.env.CCAVENUE_ACCESS_CODE || 'AVLG05MJ58AS49GLSA';
    // const workingKey = process.env.CCAVENUE_WORKING_KEY || '5E25D58B6BF1633A1525984EB4E2E944';

    if (!merchantId || !accessCode || !workingKey) {
      return NextResponse.json({
        error: 'CCAvenue credentials not configured',
        hasMerchantId: !!merchantId,
        hasAccessCode: !!accessCode,
        hasWorkingKey: !!workingKey,
      });
    }

    // Test encryption with sample data
    const testData = `merchant_id=${merchantId}&order_id=TEST123&amount=100.00&currency=INR`;

    console.log('Testing encryption with:', testData);
    const encrypted = encrypt(testData, workingKey);
    console.log('Encrypted result:', encrypted.substring(0, 50) + '...');

    // Test decryption
    const decrypted = decrypt(encrypted, workingKey);
    console.log('Decrypted result:', decrypted);

    const isMatch = decrypted === testData;

    return NextResponse.json({
      success: true,
      test: {
        original: testData,
        encrypted: encrypted.substring(0, 100) + '...',
        decrypted: decrypted,
        encryptionWorking: !!encrypted,
        decryptionWorking: isMatch,
        merchantIdLength: merchantId.length,
        accessCodeLength: accessCode.length,
        workingKeyLength: workingKey.length,
      },
      credentials: {
        merchantIdPrefix: merchantId.substring(0, 5) + '...',
        accessCodePrefix: accessCode.substring(0, 5) + '...',
        workingKeyPrefix: workingKey.substring(0, 5) + '...',
      },
      recommendations: [
        'Verify Merchant ID, Access Code, and Working Key in CCAvenue MARS > Settings > API Keys',
        'Contact CCAvenue Customer Help Center to register your domain (required!)',
        'Check if you should use .com (India) or .ae (UAE) domain',
        'Ensure your domain is whitelisted in CCAvenue account',
      ],
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Encryption test failed',
      message: error?.message,
      stack: error?.stack,
    });
  }
}
