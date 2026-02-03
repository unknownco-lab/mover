// electron/license/manager.ts

import { validateLicenseKey, ValidationResult, LicensePayload } from './validator';
import {
  saveLicense,
  getLicenseKey,
  getLicensePayload,
  clearLicense,
  hasLicense,
  needsOnlineValidation,
  updateLastValidated
} from './store';

export interface LicenseStatus {
  isLicensed: boolean;
  payload?: LicensePayload;
  needsValidation?: boolean;
}

/**
 * Main License Manager API
 * This is the primary interface for license operations
 */
export class LicenseManager {
  /**
   * Check if the app is currently licensed
   */
  static checkLicense(): LicenseStatus {
    if (!hasLicense()) {
      return { isLicensed: false };
    }

    const licenseKey = getLicenseKey();
    if (!licenseKey) {
      return { isLicensed: false };
    }

    // Validate locally
    const result = validateLicenseKey(licenseKey);

    if (!result.valid) {
      // Invalid license - clear it
      clearLicense();
      return { isLicensed: false };
    }

    // Check if we need online validation
    const needsValidation = needsOnlineValidation();

    return {
      isLicensed: true,
      payload: result.payload,
      needsValidation
    };
  }

  /**
   * Activate a new license key
   */
  static activateLicense(licenseKey: string): ValidationResult {
    // Validate the license key locally first
    const result = validateLicenseKey(licenseKey);

    if (!result.valid) {
      return result;
    }

    // Save to persistent storage
    saveLicense(licenseKey, result.payload!);

    // Optionally: Perform online validation immediately
    // await this.validateOnline(licenseKey);

    return result;
  }

  /**
   * Deactivate current license
   */
  static deactivateLicense(): void {
    clearLicense();
  }

  /**
   * Get current license information
   */
  static getLicenseInfo(): LicensePayload | null {
    return getLicensePayload();
  }

  /**
   * Validate license online with backend (optional)
   * Call this periodically (e.g., once a week)
   */
  static async validateOnline(licenseKey?: string): Promise<{ valid: boolean; error?: string }> {
    const key = licenseKey || getLicenseKey();

    if (!key) {
      return { valid: false, error: 'No license key found' };
    }

    try {
      // TODO: Replace with your actual backend URL
      const response = await fetch('https://your-backend.vercel.app/api/validate-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ licenseKey: key })
      });

      const data = await response.json();

      if (data.valid) {
        // Update last validated timestamp
        updateLastValidated();
        return { valid: true };
      } else {
        // License was revoked or invalid on backend
        if (data.revoked) {
          clearLicense();
        }
        return { valid: false, error: data.error || 'License validation failed' };
      }
    } catch (error) {
      console.error('Online validation error:', error);
      // Don't fail validation if server is unreachable
      // Allow offline usage
      return { valid: true }; // Graceful degradation
    }
  }

  /**
   * Format license key for display
   * e.g., MOVER-abc...xyz (shortened)
   */
  static formatLicenseKey(licenseKey?: string): string {
    const key = licenseKey || getLicenseKey();
    if (!key) return '';

    if (key.length > 20) {
      const prefix = key.substring(0, 10);
      const suffix = key.substring(key.length - 6);
      return `${prefix}...${suffix}`;
    }

    return key;
  }
}
