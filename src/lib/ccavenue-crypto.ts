/**
 * CCAvenue Encryption/Decryption Utility
 * Based on official CCAvenue integration guide
 * Source: https://javascript.plainenglish.io/integrating-ccavenue-payment-gateway-with-next-js-projects-8f9de6637ced
 */

import { createHash, createCipheriv, createDecipheriv } from 'crypto';

/**
 * Encrypt data for CCAvenue payment gateway
 * Exact implementation from the official guide
 */
export function encrypt(plainText: string, workingKey: string): string {
  if (!plainText || !workingKey) {
    throw new Error('Plain text and working key are required');
  }

  // MD5 hash the working key and use binary digest (exact from guide)
  const m = createHash('md5');
  m.update(workingKey);
  const key = m.digest();

  // IV as string literal (exact format from guide)
  const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';

  // Create cipher with AES-128-CBC
  const cipher = createCipheriv('aes-128-cbc', key, iv);
  let encoded = cipher.update(plainText, 'utf8', 'hex');
  encoded += cipher.final('hex');

  // Return lowercase hex (CCAvenue expects lowercase hex encoding)
  return encoded;
}

/**
 * Decrypt data from CCAvenue payment gateway
 * Exact implementation from the official guide
 */
export function decrypt(encryptedText: string, workingKey: string): string {
  if (!encryptedText || !workingKey) {
    throw new Error('Encrypted text and working key are required');
  }

  // MD5 hash the working key and use binary digest (exact from guide)
  const m = createHash('md5');
  m.update(workingKey);
  const key = m.digest();

  // IV as string literal (exact format from guide)
  const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';

  // Create decipher with AES-128-CBC
  const decipher = createDecipheriv('aes-128-cbc', key, iv);
  let decoded = decipher.update(encryptedText, 'hex', 'utf8');
  decoded += decipher.final('utf8');

  return decoded;
}

/**
 * Convert CCAvenue encrypted response to JSON object
 * Exact implementation from the official guide
 */
export function redirectResponseToJson(
  response: string,
  workingKey: string
): Record<string, string> {
  if (!response) {
    throw new Error('CCAvenue encrypted response is required');
  }

  const ccavResponse = decrypt(response, workingKey);
  const result: Record<string, string> = {};

  // Parse key=value&key=value (values may contain commas or =)
  for (const pair of ccavResponse.split('&')) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex >= 0) {
      const key = pair.slice(0, eqIndex).trim();
      const value = pair.slice(eqIndex + 1).trim();
      if (key) result[key] = value;
    }
  }
  return result;
}
