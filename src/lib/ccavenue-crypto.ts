/**
 * CCAvenue Encryption/Decryption Utility
 * Based on official CCAvenue Node.js integration kit
 * Source: src/lib/NodeJS_Integration_Kit/nonseamless/ccavutil.js
 */

import crypto from 'crypto';

/**
 * Encrypt data for CCAvenue payment gateway
 * Official CCAvenue encryption method from their Node.js integration kit
 */
export function encrypt(plainText: string, workingKey: string): string {
  try {
    // Official CCAvenue method: MD5 hash the working key and use binary digest
    const m = crypto.createHash('md5');
    m.update(workingKey);
    const key = m.digest('binary'); // Get binary (16 bytes) - this is the key difference!

    // Official CCAvenue IV - must match exact format from official kit
    const iv =
      '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';

    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encoded = cipher.update(plainText, 'utf8', 'hex');
    encoded += cipher.final('hex');

    return encoded;
  } catch (error) {
    console.error('CCAvenue encryption error:', error);
    throw new Error('Failed to encrypt payment data');
  }
}

/**
 * Decrypt data from CCAvenue payment gateway
 * Official CCAvenue decryption method from their Node.js integration kit
 */
export function decrypt(encryptedText: string, workingKey: string): string {
  try {
    // Official CCAvenue method: MD5 hash the working key and use binary digest
    const m = crypto.createHash('md5');
    m.update(workingKey);
    const key = m.digest('binary'); // Get binary (16 bytes) - this is the key difference!

    // Official CCAvenue IV - must match exact format from official kit
    const iv =
      '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';

    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decoded = decipher.update(encryptedText, 'hex', 'utf8');
    decoded += decipher.final('utf8');

    return decoded;
  } catch (error) {
    console.error('CCAvenue decryption error:', error);
    throw new Error('Failed to decrypt payment response');
  }
}
