# Mover: Paid Licensing & Distribution Implementation Plan

## Overview
Convert Mover from free to paid software with Stripe payments, license key validation, code signing, and automated distribution.

## Architecture Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **License Validation** | Offline with weekly online checks | Works offline, prevents casual piracy, good UX |
| **Cryptography** | Ed25519 signatures | Modern, fast, smaller keys than RSA |
| **Backend** | Vercel Serverless Functions | Zero cold starts, Node.js, generous free tier |
| **Email Service** | Resend | 3,000 emails/month free, simple API |
| **Download Distribution** | GitHub Releases (public) | Simple, free, works with auto-updater |
| **License Storage** | electron-store | Simple, persistent, cross-platform |

## Payment & License Flow (Simplified)

```
User → Marketing Website → Download App (public, no auth)
                                ↓
                        Install & Launch App
                                ↓
                    License Activation Screen
                                ↓
                    Click "Purchase License"
                                ↓
                        Stripe Checkout
                                ↓
                        Payment Success
                                ↓
                        Stripe Webhook
                                ↓
                      Vercel Function
                                ↓
            Generate License Key (Ed25519)
                                ↓
            Send Email (Resend) with license key only
                                ↓
    User → Enter License Key → Validate Locally
                                ↓
            App checks server weekly to verify
```

**Key Advantage:** Downloads are public and simple. Only the license key gates access to the app.

## Implementation Phases

### Phase 1: Core License System (Week 1)
**Priority: Foundation**

1. **Generate Ed25519 Keypair**
   ```bash
   node -e "const nacl = require('tweetnacl'); const pair = nacl.sign.keyPair(); console.log('Private:', Buffer.from(pair.secretKey).toString('base64')); console.log('Public:', Buffer.from(pair.publicKey).toString('base64'));"
   ```
   - Store private key in Vercel environment variables
   - Add public key to codebase

2. **Install Dependencies**
   ```bash
   npm install electron-store tweetnacl tweetnacl-util
   ```

3. **Create License Module**
   - `electron/license/publicKey.ts` - Public key constant
   - `electron/license/validator.ts` - Ed25519 signature verification
   - `electron/license/store.ts` - electron-store configuration
   - `electron/license/manager.ts` - Main license API

4. **Add IPC Handlers**
   - Update `electron/index.ts` with license IPC handlers
   - Update `electron/preload.ts` with License API exposure
   - Add TypeScript types for License API

**Files Modified:**
- `electron/index.ts` (add IPC handlers)
- `electron/preload.ts` (expose License API)
- `package.json` (dependencies)

**Test:** Generate hardcoded license keys and validate locally

---

### Phase 2: Frontend Integration (Week 2)
**Priority: User Interface**

1. **Create License Activation Screen**
   - New component: `src/components/LicenseActivation.tsx`
   - License key input field (format: `MOVER-xxx.yyy`)
   - Validation feedback (success/error states)
   - Link to purchase page

2. **Update App.tsx**
   - Check license on startup
   - Show activation screen if unlicensed
   - Implement periodic online validation (weekly)
   - Handle validation failures gracefully

3. **Add License Management**
   - View current license details
   - Deactivate/change license option
   - Display license status in settings

**Files Modified:**
- `src/App.tsx` (license check on startup)
- `src/components/LicenseActivation.tsx` (new)
- `src/components/controls.tsx` (optional: show license info)

**Test:**
- Valid license → app opens
- Invalid license → shows activation screen
- Expired license → shows error message

---

### Phase 3: Backend Setup (Week 3)
**Priority: Payment Processing**

1. **Setup Vercel Project**
   - Create new repo: `mover-backend`
   - Initialize TypeScript project
   - Install dependencies: `stripe`, `resend`, `tweetnacl`

2. **Implement Stripe Webhook**
   - Endpoint: `POST /api/stripe-webhook`
   - Verify webhook signature
   - Handle `checkout.session.completed` event
   - Generate license key using Ed25519
   - Store purchase record (optional: Supabase/Vercel KV)

3. **Implement License Validation API**
   - Endpoint: `POST /api/validate-license`
   - Verify Ed25519 signature
   - Check revocation status (database lookup)
   - Return validation result

4. **Setup Resend Email**
   - Create email template with license key and download links
   - Test email delivery
   - Implement `api/resend-license` endpoint for re-sending

5. **Deploy to Vercel**
   ```bash
   cd vercel-backend
   vercel deploy --prod
   ```

**Environment Variables (Vercel):**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `SIGNING_PRIVATE_KEY` (Ed25519 private key, base64)

**Test:** Complete Stripe test checkout → receive email with license

---

### Phase 4: Code Signing (Week 4)
**Priority: Security & Trust**

#### macOS Code Signing

1. **Create Entitlements File**
   - File: `entitlements.mac.plist`
   - Required for hardened runtime and notarization

2. **Update forge.config.js**
   ```javascript
   osxSign: {
     identity: 'Developer ID Application: unknownco-lab (5HHAK2PWL3)',
     hardenedRuntime: true,
     entitlements: 'entitlements.mac.plist',
     'entitlements-inherit': 'entitlements.mac.plist',
   },
   osxNotarize: {
     tool: 'notarytool',
     appleId: process.env.APPLE_ID,
     appleIdPassword: process.env.APPLE_PASSWORD,
     teamId: process.env.APPLE_TEAM_ID
   }
   ```

3. **Test Notarization**
   ```bash
   npm run make
   # Verify notarization status
   spctl --assess --verbose=4 out/make/*.dmg
   ```

#### Windows Code Signing

1. **Update forge.config.js for Squirrel Maker**
   ```javascript
   {
     name: '@electron-forge/maker-squirrel',
     config: {
       certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
       certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
       signWithParams: '/tr http://timestamp.digicert.com /td sha256 /fd sha256'
     }
   }
   ```

2. **Prepare Certificate**
   - Place .pfx file in `certs/windows-cert.pfx` (gitignored)
   - Set environment variables

3. **Test Signing**
   ```bash
   npm run make
   # Verify signature on Windows
   signtool verify /pa out/make/*.exe
   ```

**Security:**
- Add to `.gitignore`: `/certs/`, `*.pfx`, `*.p12`, `.env.local`
- Never commit certificates or passwords

**Files Modified:**
- `forge.config.js` (enable signing)
- `entitlements.mac.plist` (new)
- `.gitignore` (certificate paths)

---

### Phase 5: Distribution Setup (Week 5)
**Priority: Public Downloads & Email**

#### Public Downloads via GitHub Releases

1. **Keep Existing Setup**
   - Downloads already configured via `@electron-forge/publisher-github`
   - Releases publish to `unknownco-lab/mover` repository
   - Auto-updates via `update-electron-app` already working

2. **Update Marketing Website**
   - Add download buttons pointing to latest GitHub release
   - Use GitHub API to fetch latest release URLs dynamically:
     ```
     https://api.github.com/repos/unknownco-lab/mover/releases/latest
     ```
   - Or use direct links like:
     ```
     https://github.com/unknownco-lab/mover/releases/latest/download/Mover-1.0.14.dmg
     ```

#### Simplified Email Template

**No download links needed - just the license key:**

```html
<h1>Welcome to Mover!</h1>
<p>Thank you for your purchase. Here's your license key:</p>

<div style="background: #f4f4f4; padding: 20px; margin: 20px 0; font-family: monospace; font-size: 16px; text-align: center;">
  <strong>MOVER-xxx.yyy</strong>
</div>

<p><strong>To activate:</strong></p>
<ol>
  <li>Open the Mover app (if not installed, <a href="https://github.com/unknownco-lab/mover/releases/latest">download here</a>)</li>
  <li>Copy and paste your license key when prompted</li>
  <li>Start using Mover!</li>
</ol>

<p>Need help? Reply to this email.</p>
```

#### Advantages of This Approach

- ✅ **No download protection needed** - Anyone can download, but can't use without license
- ✅ **No Cloudflare R2 costs** - GitHub provides free bandwidth for releases
- ✅ **Simpler backend** - Only need to generate license key, not download URLs
- ✅ **Better UX** - Users can download first, try the UI, then decide to purchase
- ✅ **Marketing friendly** - Easy to share download links publicly
- ✅ **Auto-updates work seamlessly** - Already configured

**Files Modified:**
- Vercel backend: `api/stripe-webhook.ts` (simplified email template)

---

### Phase 6: CI/CD Automation (Week 6)
**Priority: Automation**

1. **Create GitHub Actions Workflow**
   - File: `.github/workflows/release.yml`
   - Trigger on version tags (e.g., `v1.0.15`)
   - Separate jobs for macOS and Windows builds

2. **macOS Build Job**
   - Checkout code
   - Install dependencies
   - Build app (`npm run build`)
   - Import code signing certificate
   - Package and sign (`npm run make`)
   - Publish to GitHub Releases (public download)

3. **Windows Build Job**
   - Checkout code
   - Install dependencies
   - Build app
   - Decode certificate from secret
   - Package and sign
   - Publish to GitHub Releases (public download)

4. **Configure GitHub Secrets**
   - `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`
   - `APPLE_CERTIFICATE_P12` (base64-encoded)
   - `APPLE_CERTIFICATE_PASSWORD`
   - `WINDOWS_CERTIFICATE_BASE64` (base64-encoded .pfx)
   - `WINDOWS_CERTIFICATE_PASSWORD`

**Encode Certificates:**
```bash
# macOS
base64 -i certificate.p12 -o certificate-base64.txt

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pfx")) | Out-File cert-base64.txt
```

**Release Process:**
```bash
npm version patch  # Update version
git push origin main --tags  # Trigger CI/CD
```

**Files Modified:**
- `.github/workflows/release.yml` (new)

---

### Phase 7: Testing & Launch (Week 7)
**Priority: Quality Assurance**

#### Testing Checklist

**License System:**
- [ ] Valid license activates app
- [ ] Invalid license shows error
- [ ] Expired license rejected
- [ ] Tampered license rejected
- [ ] License persists after restart
- [ ] Periodic validation works (7 days)

**Purchase Flow:**
- [ ] Stripe checkout completes
- [ ] Webhook receives payment event
- [ ] License key generated correctly
- [ ] Email delivered within 1 minute
- [ ] Email contains only license key (no download links)
- [ ] GitHub download links work on marketing site

**Code Signing:**
- [ ] macOS: No Gatekeeper warning
- [ ] macOS: Notarization verified (`spctl` test passes)
- [ ] Windows: No SmartScreen warning
- [ ] Windows: Publisher name shown in installer

**Auto-Updates:**
- [ ] Update notification appears
- [ ] Update downloads successfully
- [ ] Update installs without errors
- [ ] License persists after update

#### Beta Testing
- Invite 5-10 users to test full flow
- Test on various macOS/Windows versions
- Collect feedback on UX
- Fix critical bugs before launch

#### Launch Preparation
- Update marketing website with Stripe links
- Prepare launch announcement
- Create support documentation
- Setup customer support email

---

## Critical Files Summary

| File | Purpose |
|------|---------|
| `electron/license/validator.ts` | Ed25519 signature verification |
| `electron/license/store.ts` | Persistent license storage |
| `electron/license/manager.ts` | Main license API |
| `electron/index.ts` | IPC handlers for license operations |
| `electron/preload.ts` | Expose License API to renderer |
| `src/App.tsx` | License check on startup, periodic validation |
| `src/components/LicenseActivation.tsx` | Activation UI |
| `forge.config.js` | Code signing configuration |
| `entitlements.mac.plist` | macOS hardened runtime entitlements |
| `.github/workflows/release.yml` | Automated build & release |
| Vercel: `api/stripe-webhook.ts` | Payment processing |
| Vercel: `api/validate-license.ts` | Online license validation |

---

## License Key Format

```
MOVER-{base64url(payload)}.{base64url(ed25519-signature)}

Payload:
{
  "email": "user@example.com",
  "licenseId": "uuid-v4",
  "issuedAt": 1705190400,
  "expiresAt": null,  // null = lifetime
  "product": "mover",
  "version": "1"
}
```

**Security:**
- Ed25519 signature prevents forgery
- Public key in app source code (safe - can only verify, not sign)
- Signature verification is cryptographically secure
- Tampering invalidates signature

---

## Cost Estimate

**Monthly costs (0-100 customers):**
- Vercel: $0 (free tier)
- Resend: $0 (free tier: 3,000 emails/month)
- GitHub: $0 (free bandwidth for releases)
- Stripe: 2.9% + $0.30 per transaction
- **Total infrastructure: $0** (only Stripe fees)

**Scaling:**
- 100-500 customers/month: ~$20-40/month
- 500+ customers/month: ~$50-100/month

---

## Security Considerations

1. **License Forgery Prevention**: Ed25519 signatures make forging licenses computationally infeasible
2. **Code Signing**: Prevents tampering and builds trust
3. **Webhook Verification**: Stripe signatures prevent fake payments
4. **Environment Variables**: All secrets in environment, never in code
5. **Download Protection**: Signed URLs with expiration
6. **Periodic Validation**: Catches revoked licenses within 7 days
7. **Offline-First**: App works without internet (good UX, reasonable security)

---

## Verification Steps

After implementation, verify:

1. **Local License Validation**
   ```bash
   # Generate test license key
   node scripts/generate-test-license.js
   # Test in app
   ```

2. **Backend Deployment**
   ```bash
   curl -X POST https://yourdomain.com/api/validate-license \
     -H "Content-Type: application/json" \
     -d '{"licenseKey":"MOVER-test.signature"}'
   ```

3. **Stripe Test Checkout**
   - Use Stripe test mode
   - Complete test purchase
   - Verify email delivery
   - Test license activation

4. **Code Signing**
   ```bash
   # macOS
   spctl --assess --verbose=4 out/make/*.dmg

   # Windows
   signtool verify /pa out/make/*.exe
   ```

5. **End-to-End Flow**
   - Purchase from Stripe (test mode)
   - Receive email with license
   - Download app from signed URL
   - Install and activate
   - Verify app works
   - Wait 7 days, verify online validation

---

## Next Steps

1. **Phase 1**: Implement core license system (local validation)
2. **Phase 2**: Add activation UI to app
3. **Phase 3**: Build backend (Vercel + Stripe + Resend)
4. **Phase 4**: Enable code signing
5. **Phase 5**: Setup distribution (Cloudflare R2)
6. **Phase 6**: Automate with GitHub Actions
7. **Phase 7**: Test thoroughly and launch

Estimated timeline: **6-7 weeks** for full implementation and testing.

Ready to start with Phase 1?
