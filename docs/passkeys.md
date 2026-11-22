# WebAuthn passkeys for AUC Atlas

The Account Security panel supports Apple Passwords / iCloud Keychain passkey enrollment,
listing, and removal through standard WebAuthn. Only Account Security has visible new
controls. The existing login email field gains an invisible WebAuthn autofill token
that allows supported browsers to suggest a saved passkey.

## Domains and devices

- Production relying-party ID defaults to aucatlas.com; accepted production origins
  are https://aucatlas.com and https://www.aucatlas.com.
- To use a different verified site domain set PASSKEY_RP_ID to the correct
  parent domain. Temporary Vercel preview URLs are deliberately blocked.
- Local development supports http://localhost:<port>.
- Apple Passwords / iCloud Keychain must be enabled on the user's Apple device;
  browsers/OS select the storage provider, not AUC Atlas. Passkeys do not
  disclose private keys or biometric data to the server.

## Security and persistence

- Enrolling or removing requires a signed-in, verified AUC student, recent login
  (within 30 minutes), and the existing Security panel authenticator challenge
  for users with app-based 2FA enabled.
- User-verifying, discoverable platform credentials are requested, with ES256/RS256
  algorithms. Server verifies origin, challenge, relying-party ID and signature.
- One-time registration/login challenges expire in five minutes and are consumed
  atomically. The server persists only WebAuthn public keys and metadata.
- Credential records reside under users/{uid}/passkeys/{credentialId}, with a
  global passkeyCredentials/{credentialId} ownership lookup for discoverable
  sign-ins. Removing the passkey or deleting the account removes the index.
- A verified passkey signs into the existing Firebase UID and session flow.
  Accounts with 2FA still need their existing authenticator/email challenge.
- Password login, Google login, recovery, and existing two-factor UI are unchanged.
- Removing a site passkey does not automatically delete the copy from Apple Passwords.

## Live device checks still required

1. Sign in on https://www.aucatlas.com as a test verified student, open Account
   Security and add a passkey using Safari on an iPhone or Mac.
2. Confirm the native Apple Passwords/iCloud Keychain save prompt, and a synced
   entry visible in Account Security after refresh.
3. Sign out; focus the existing email field in Safari and choose its passkey
   autofill suggestion; verify that the same student account signs in.
4. Repeat with authenticator 2FA enabled and confirm the six-digit code is
   still required before a site session is issued.
5. Remove the credential and confirm it can no longer log in, plus test
   cancellation, expired challenges, wrong origins and old sessions.
6. Automated checks cannot interact with real Face ID, Touch ID, or iCloud prompts.
