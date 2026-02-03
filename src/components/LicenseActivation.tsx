import React, { useState } from 'react';
import { Key, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import AppBar from '../AppBar';

interface LicenseActivationProps {
  onActivationSuccess: () => void;
}

export function LicenseActivation({ onActivationSuccess }: LicenseActivationProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setIsValidating(true);
    setError('');
    setSuccess(false);

    try {
      const result = await window.license.activateLicense(licenseKey.trim());

      if (result.valid) {
        setSuccess(true);
        setError('');
        // Wait a moment to show success message, then notify parent
        setTimeout(() => {
          onActivationSuccess();
        }, 1000);
      } else {
        setError(result.error || 'Invalid license key');
        setSuccess(false);
      }
    } catch (err) {
      setError('Failed to validate license key. Please try again.');
      setSuccess(false);
      console.error('License activation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating) {
      handleActivate();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <div className="w-full bg-zinc-900 overflow-hidden flex flex-col flex-1">
        <AppBar />
      </div>
      <div className="bg-zinc-800 rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-purple-600/20 p-4 rounded-full">
              <Key className="w-12 h-12 text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Activate Mover</h1>
          <p className="text-zinc-400 text-sm">
            Enter your license key to start using Mover
          </p>
        </div>

        {/* License Key Input */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400 block">License Key</label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="MOVER-xxxxxxxxxxxxx"
            disabled={isValidating}
            className="w-full bg-zinc-700 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
          />
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">License activated successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Activate Button */}
        <button
          onClick={handleActivate}
          disabled={isValidating || !licenseKey.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-purple-700"
        >
          {isValidating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Activate License
            </>
          )}
        </button>

        {/* Purchase Link */}
        <div className="pt-4 border-t border-zinc-700">
          <p className="text-center text-zinc-400 text-sm mb-3">
            Don't have a license yet?
          </p>
          <a
            href="https://unknownco.dev/mover"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Purchase a License
          </a>
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-zinc-500 space-y-1">
          <p>Need help? Contact us at</p>
          <a
            href="mailto:i.am.unknownco@gmail.com"
            className="text-purple-400 hover:text-purple-300"
          >
            i.am.unknownco@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
