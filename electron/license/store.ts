// electron/license/store.ts

import Store from 'electron-store';
import { LicensePayload } from './validator';

interface LicenseStoreData {
  licenseKey: string | null;
  payload: LicensePayload | null;
  activatedAt: number | null;
  lastValidated: number | null;
}

// Initialize electron-store with type safety
const licenseStore = new Store<LicenseStoreData>({
  name: 'mover-license',
  defaults: {
    licenseKey: null,
    payload: null,
    activatedAt: null,
    lastValidated: null
  },
  // Encrypt the store for basic protection
  encryptionKey: 'mover-license-encryption-key-change-this'
});

/**
 * Save license data to persistent storage
 */
export function saveLicense(licenseKey: string, payload: LicensePayload): void {
  const now = Date.now();
  licenseStore.set('licenseKey', licenseKey);
  licenseStore.set('payload', payload);
  licenseStore.set('activatedAt', now);
  licenseStore.set('lastValidated', now);
}

/**
 * Get stored license key
 */
export function getLicenseKey(): string | null {
  return licenseStore.get('licenseKey');
}

/**
 * Get stored license payload
 */
export function getLicensePayload(): LicensePayload | null {
  return licenseStore.get('payload');
}

/**
 * Get when license was last validated online
 */
export function getLastValidated(): number | null {
  return licenseStore.get('lastValidated');
}

/**
 * Update last validated timestamp
 */
export function updateLastValidated(): void {
  licenseStore.set('lastValidated', Date.now());
}

/**
 * Check if it's time for online validation (7 days)
 */
export function needsOnlineValidation(): boolean {
  const lastValidated = getLastValidated();
  if (!lastValidated) return true;

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const timeSinceLastValidation = Date.now() - lastValidated;

  return timeSinceLastValidation > SEVEN_DAYS;
}

/**
 * Clear all license data (deactivate)
 */
export function clearLicense(): void {
  licenseStore.clear();
}

/**
 * Check if license exists
 */
export function hasLicense(): boolean {
  const key = getLicenseKey();
  return !!key;
}
