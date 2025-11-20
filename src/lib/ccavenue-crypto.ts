/**
 * CCAvenue Encryption/Decryption Utility
 * Based on official CCAvenue Node.js integration kit
 * Source: src/lib/NodeJS_Integration_Kit/nonseamless/ccavutil.js
 */

import crypto from 'crypto';

/**
 * Encrypt data for CCAvenue payment gateway
 * Official CCAvenue encryption method from their Node.js integration kit
 * Based on official CCAvenue Node.js integration documentation
 */
export function encrypt(plainText: string, workingKey: string): string {
  try {
    if (!plainText || !workingKey) {
      throw new Error('Plain text and working key are required');
    }

    // Official CCAvenue method: MD5 hash the working key and use binary digest
    // This is the critical part - CCAvenue uses binary digest, not hex
    const m = crypto.createHash('md5');
    m.update(workingKey);
    const key = m.digest(); // Get binary digest (16 bytes Buffer) - this is what CCAvenue expects

    // Official CCAvenue IV - must be all zeros (16 bytes)
    // According to CCAvenue documentation, IV should be Buffer.alloc(16, 0)
    const iv = Buffer.alloc(16, 0);

    // Create cipher with AES-128-CBC
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    cipher.setAutoPadding(true);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted.toUpperCase(); // CCAvenue expects uppercase hex
  } catch (error: any) {
    console.error('CCAvenue encryption error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      plainTextLength: plainText?.length,
      workingKeyLength: workingKey?.length,
      hasPlainText: !!plainText,
      hasWorkingKey: !!workingKey,
    });
    throw new Error(
      `Failed to encrypt payment data: ${error?.message || 'Unknown error'}`
    );
  }
}

/**
 * Decrypt data from CCAvenue payment gateway
 * Official CCAvenue decryption method from their Node.js integration kit
 */
export function decrypt(encryptedText: string, workingKey: string): string {
  try {
    if (!encryptedText || !workingKey) {
      throw new Error('Encrypted text and working key are required');
    }

    // Official CCAvenue method: MD5 hash the working key and use binary digest
    const m = crypto.createHash('md5');
    m.update(workingKey);
    const key = m.digest(); // Get binary digest (16 bytes Buffer) - this is what CCAvenue expects

    // Official CCAvenue IV - must be all zeros (16 bytes)
    // According to CCAvenue documentation, IV should be Buffer.alloc(16, 0)
    const iv = Buffer.alloc(16, 0);

    // Create decipher with AES-128-CBC
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(encryptedText.toLowerCase(), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('CCAvenue decryption error:', error);
    throw new Error(
      `Failed to decrypt payment response: ${error?.message || 'Unknown error'}`
    );
  }
}
