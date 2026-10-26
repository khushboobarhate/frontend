# SetuMoolya frontend

A responsive farmer–buyer marketplace built around the actual SetuMoolya Express API. The interface uses forest green, warm cream, editorial typography, Indian farming photography, and original SVG artwork. Photo sources and license information are in [public/images/CREDITS.md](public/images/CREDITS.md) and the `/en/credits` page.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Start the sibling `setu-moolya-backend` project separately with its documented configuration. The default frontend URL is `http://localhost:3000`; Next chooses another port if it is occupied.

| Variable                   | Purpose                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `API_BASE_URL`             | Server-to-server backend origin; defaults to the public backend origin.                          |
| `NEXT_PUBLIC_API_BASE_URL` | Public backend origin for uploaded profile and crop images; defaults to `http://localhost:5000`. |

The browser calls the frontend's `/api/backend/api/...` routes. Next forwards those calls to Express. Do not put Supabase service keys, SMTP passwords, or admin passwords in frontend environment variables. Local environment files are ignored by Git.

## Account flow

1. Farmer or buyer submits contact and location details, plus an optional profile photo. Farmers also provide their farm location. Registration does not ask for OTPs, document verification services, or a password.
2. The application appears in the admin registration inbox. Admin can inspect the details, correct a pending email, approve, or reject with a reason.
3. Approval creates the account and asks the backend to email a random temporary password. The UI reports approval separately from email delivery. Admin can retry sending temporary credentials when permitted by the backend.
4. The member signs in using their email and temporary password, then sets a personal password before accessing business screens. Forgot password requests an email recovery link. Reset links use `/reset-password#token_hash=...&role=farmer|buyer` (the unlocalized entry redirects to English and preserves the fragment).
5. Farmers list crops with photos, quantity, unit, growing method, and price. Buyers search crops, rate their interest, and leave notes. Farmers see buyer interests. Contact buttons request permission from the API before revealing a phone number; tapping that number opens the device's telephone handler.

There are three role workspaces:

- **Admin:** registration inbox, request review, credential retry, approved members, crop listings, and contact activity.
- **Farmer:** harvest listings, crop uploads and removal, buyer interests, profile, password, and call availability.
- **Buyer:** searchable crop marketplace, crop details, interest ratings and notes, saved interests, profile, password, and call availability.

All counts and business records come from the API. The public crop categories are illustrative navigation, not inventory. There are no fabricated orders, payments, revenue, testimonials, or document-verification claims.

## Sessions and deployment

Access tokens remain in HttpOnly, SameSite=Lax cookies; production cookies also use Secure. Tokens and refresh tokens are removed from the sign-in response sent to browser JavaScript. The backend has no refresh endpoint, so an expired access session requires signing in again. Farmer and buyer sessions restore from their profile endpoint; admin sessions validate using the existing dashboard endpoint.

Serve the production frontend over HTTPS. Preserve the public Host and protocol when using a reverse proxy so the mutation origin checks remain valid. Configure the public backend image origin before building; it must be reachable over HTTPS when the frontend uses HTTPS. Backend authorization remains authoritative for every protected operation.

The backend currently limits authentication attempts by IP. Since these requests pass through Next, Express sees the Next server IP. Before a public multi-user deployment, configure a trusted ingress/IP-forwarding strategy and shared rate-limit storage in the backend; do not blindly trust client-provided forwarding headers. This frontend deliberately does not forge client IP headers.

Primary navigation, landing introduction, and account field copy support English, Hindi, and Gujarati through next-intl. Workspace and secondary storytelling copy currently remain English. Preferred communication language is recorded independently during registration.

**Live setup pending:** the backend's `supabase_migration_v4.sql` was intentionally left for the project owner to apply. Live account creation, SMTP delivery, and production Supabase flows still require that setup and real-service verification. This frontend does not apply migrations or seed production accounts.

## Verification

```sh
npm run type-check
npm run build
npm audit
npm run format:check
```

The integration tests exercise the same-origin proxy over HTTP. Use the isolated fixture service to avoid production mutations or email:

```sh
# Terminal 1: disposable in-memory service, bound to loopback only
node tests/fixture-server.mjs

# Terminal 2: dedicated UI test instance
API_BASE_URL=http://127.0.0.1:5101 npm run dev -- --hostname 127.0.0.1 --port 3001

# Terminal 3: HTTP integration checks
npm run test:integration
```

Tests refuse to start mutations unless the frontend returns the explicit fixture marker. The fixture never connects to Supabase, sends mail, or persists data. Restart it to reset its in-memory state. Fixture-only sign-in: `admin@example.com`, `farmer@example.com`, or `buyer@example.com`, with password `Fixture-only@123`. These are not live accounts and never appear as fallback data in the application.

Browser QA covered both registrations, all three sign-ins, admin review and mail-failure retry, crop upload, buyer interest and permitted contact, availability, logout, and desktop/mobile layouts. Integration checks also cover cookie flags, token filtering, recovery/reset payloads, password-change cleanup, invalid sessions, same-origin acceptance, and cross-origin rejection.

## Structure

- `src/app/[locale]`: public, account, and workspace routes.
- `src/components`: public design, account forms, and role workspace components.
- `src/lib/api/client.ts`: typed calls matching the Express API.
- `src/lib/server/backend.ts` and `src/app/api`: server-side token and proxy handling.
- `src/types`: API response shapes; no obsolete OTP/document service types.
- `tests`: disposable HTTP service and integration checks.

The app uses Next.js 16, React 19, TypeScript, next-intl, plain CSS, and Lucide icons. The lockfile pins the installed dependency graph. Tailwind and the unused form/schema dependencies were removed because the redesigned interface does not require them. Fonts are self-hosted by Next's font loader after build; the first build needs access to Google's font service.
