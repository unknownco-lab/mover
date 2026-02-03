// electron/license/validator.ts

import nacl from 'tweetnacl';
import { decodeUTF8, decodeBase64 } from 'tweetnacl-util';
import { LICENSE_PUBLIC_KEY } from './publicKey';

export interface LicensePayload {
  email: string;
  licenseId: string;
  issuedAt: number;
  expiresAt: number | null;
  product: string;
  version: string;
}

export interface ValidationResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
}

/**
 * Validates a license key using Ed25519 signature verification
 *
 * License key format: MOVER-{base64url(payload)}.{base64url(signature)}
 *
 * @param licenseKey - The license key to validate
 * @returns ValidationResult with payload if valid, or error message
 */
export function validateLicenseKey(licenseKey: string): ValidationResult {
  try {
    // Check basic format
    if (!licenseKey.startsWith('MOVER-')) {
      return { valid: false, error: 'Invalid license key format' };
    }

    // Remove prefix and split into payload and signature
    const keyPart = licenseKey.substring(6); // Remove "MOVER-"
    const parts = keyPart.split('.');

    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid license key structure' };
    }

    const [payloadB64, signatureB64] = parts;

    // Decode payload (base64url -> string -> JSON)
    const payloadStr = base64UrlDecode(payloadB64);
    const payload: LicensePayload = JSON.parse(payloadStr);

    // Decode signature (base64url -> Uint8Array)
    const signature = base64UrlToUint8Array(signatureB64);

    // Decode public key
    const publicKey = decodeBase64(LICENSE_PUBLIC_KEY ?? '');

    // Verify signature
    const message = decodeUTF8(payloadStr);
    const isValid = nacl.sign.detached.verify(message, signature, publicKey);

    if (!isValid) {
      return { valid: false, error: 'Invalid signature - license may be forged' };
    }

    // Check if expired
    if (payload.expiresAt !== null) {
      const now = Math.floor(Date.now() / 1000);
      if (now > payload.expiresAt) {
        return {
          valid: false,
          error: `License expired on ${new Date(payload.expiresAt * 1000).toLocaleDateString()}`
        };
      }
    }

    // Check product match
    if (payload.product !== 'mover') {
      return { valid: false, error: 'License is not for this product' };
    }

    return { valid: true, payload };
  } catch (error) {
    console.error('License validation error:', error);
    return { valid: false, error: 'Failed to validate license key' };
  }
}

/**
 * Decode base64url string to regular string
 */
function base64UrlDecode(str: string): string {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  // Decode base64 to string
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Convert base64url string to Uint8Array
 */
function base64UrlToUint8Array(str: string): Uint8Array {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  // Decode to Uint8Array
  return decodeBase64(base64);
}
