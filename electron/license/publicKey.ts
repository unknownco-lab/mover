/**
 * Ed25519 Public Key for License Verification
 *
 * This key is safe to include in the source code - it can only VERIFY signatures,
 * not create them. The private key (kept secret on your backend) is used to SIGN licenses.
 *
 * Generated using scripts/generate-test-license.js
 * For production, override with MOVER_LICENSE_PUBLIC_KEY environment variable
 */

// Default test public key for development
const DEFAULT_PUBLIC_KEY = '2U1mSCcjDuA9pz72/yH50IGS4SdN2n55yvY7ejzxS/c=';

// Use environment variable in production, fall back to test key in development
export const LICENSE_PUBLIC_KEY = process.env.MOVER_LICENSE_PUBLIC_KEY || DEFAULT_PUBLIC_KEY;
