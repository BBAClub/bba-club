# Admin accounts — chapter 1

## Local review

Run `npm run dev` and open `/admin/login`. Local `.env.local` has
`ADMIN_ACCOUNTS_ENABLED=true` and `ADMIN_BOOTSTRAP_EMAIL=smrm05@vse.cz`.
Existing Resend and Sanity server credentials are reused. No extra service or
password database is needed. No production data has been migrated by this change.

1. Existing verified users: open `/admin/reset-password`, enter your school email
   and follow the one-time email link to set your first password. Existing accounts
   and permissions are retained; no migration writes run automatically.
2. New users: choose **Request an account**, enter name and school email, then enter
   the 8-digit code and choose/confirm a 12–128-character password in the same browser.
3. The configured bootstrap address becomes the first administrator only after
   email verification. Other addresses become pending members.
4. Subsequent logins use school email + password, with no email code. Use
   **Forgot / set password** or the header's **Password** link to replace a password.
5. Use **Access & accounts** to approve/disable people, choose administrator or
   member access, grant sections and optionally link an existing Team profile.
6. A member can view and manage only selected sections. This chapter has one
   permission per section, not separate read/edit/delete permissions. Administrators
   have all permissions and manage accounts.
7. Access changes and password changes revoke existing sessions. Your own access
   and the primary administrator's access cannot be changed here; linking their
   Team profile is allowed. Password resets never change status or permissions.

No notification emails are sent on approval yet. Pending users use **Check approval
status** to refresh. Logged-out users sign in with their password.

## Production activation (only after review)

Configure server-side variables on Vercel, then deploy:

- `ADMIN_ACCOUNTS_ENABLED=true`
- `ADMIN_BOOTSTRAP_EMAIL=<approved primary @vse.cz address>`
- Existing `ADMIN_SESSION_SECRET` must be at least 32 random characters.
- Existing `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SANITY_API_WRITE_TOKEN` and
  `SANITY_API_READ_TOKEN` must be present. The sender must be verified in Resend.
- `NEXT_PUBLIC_SITE_URL` must contain the site's trusted HTTPS URL.
- `ADMIN_AUTH_URL` optionally sets the trusted origin for password links. Locally it
  is `http://localhost:3010`. On Vercel either omit it to use `NEXT_PUBLIC_SITE_URL`
  or set the correct HTTPS deployment URL. Never deploy a localhost value.

When enabled, the shared password and old shared-password sessions cannot grant
access. When disabled/unset, the previous shared-password system is retained for
migration/rollback. Do not use rollback as a routine login alternative: it restores
shared access and bypasses the individual permissions.

The bootstrap email is applied on first verified account creation, not on every
login. Changing it does not promote an already-existing account or demote the old
one. Promote an additional administrator before changing ownership. Removing or
changing an incorrectly configured bootstrap account requires an explicit server
maintenance operation; never give the bootstrap role to the first registrant.

## Storage and security

Authentication infrastructure uses private Sanity document subpaths:
`adminAccounts.*`, `adminChallenges.*`, `adminRate.*`. These explicit IDs enforce
email uniqueness, private document access and atomic rate buckets; they are not
ordinary CMS content IDs. Account and challenge payloads are additionally encrypted
with AES-256-GCM. Document IDs and digests are HMAC-derived and contain no email.
Keep these records out of Studio publishing workflows. No public account schema
is registered intentionally. Server credentials and encryption keys never go to
the browser. Sanity administrators with server credentials retain database access.

Keep `ADMIN_SESSION_SECRET` stable and backed up: it protects existing encrypted
account records as well as sessions. Changing it without re-encryption makes
existing records inaccessible. Key rotation/migration must be planned separately.

Codes are bound to the initiating browser, expire after 10 minutes, allow five
attempts and are consumed once with revision locking. Resending replaces the old
code. Limits are one email per minute and five per hour per address, plus 100/hour
across the app. Rate counters are durable across app instances. Stale counter
windows and challenges are reused per address; no periodic cleanup job is needed
for correctness. There is no CAPTCHA in this first version.

Sessions last 12 hours, use HttpOnly/SameSite cookies and Secure in production.
Every authorization reads the account directly from the Sanity Doc API without
CDN/query caching. Session versions prevent old sessions from returning after a
block/unblock cycle. Sign-out clears this browser's cookie; account access changes
invalidate every session. No persistent browser cache contains access grants.

Passwords use asynchronous scrypt (N=131072, r=8, p=1), a random 16-byte salt and
64-byte output. Hashes stay inside encrypted private account records and are
explicitly stripped from all public account objects, RSC props and API responses.
Changing access preserves the hash. Login is limited to 10 attempts per address
per 15 minutes and 100 attempts/minute globally; unknown accounts also perform
scrypt. Passwords and reset tokens are never logged.

Password links have 256-bit random tokens, expire after 30 minutes and are bound
to the account session version. Reissuing supersedes the previous link. A single
revision-locked account mutation changes the hash and increments the session
version, consuming the link even under concurrent submissions. Tokens appear in
URL fragments, not HTTP request URLs; the client removes the fragment after
reading it. GET requests never change passwords. Reset emails are requested with
an explicit POST; unknown addresses receive the same success response. Existing
hash-bearing accounts cannot use email registration to overwrite passwords or
bypass password sign-in. The reset page has a no-referrer policy and no external
navigation components.

Permissions are checked in protected pages and every existing staff API. The
embedded `/studio` keeps its separate Sanity login and Sanity's own permissions.
This chapter does not change payment webhooks, public registrations or cron auth.

## Validation

- `node --test tests/admin-accounts.test.cjs` uses the real TypeScript business
  logic with a revision-aware in-memory Sanity adapter and mocked Resend/cookies.
  No production writes or email delivery occur during these tests.
- `npx tsc --noEmit`
- `npm run build -- --webpack` (Turbopack cannot bind its worker port in this sandbox)
- `git diff --check`

Before production activation, manually verify school email delivery, approval with
a second school account, private-record access and each assigned section against
the actual deployment. Real email delivery and live Sanity writes are deliberately
not exercised by the automated suite.
