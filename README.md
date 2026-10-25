# Setu Moolya frontend

The frontend is a Next.js application. It calls the Express API directly; login,
registration, OTP verification, profile loading, and the admin approval queue
use backend endpoints rather than local demo records.

## Run locally

1. Start the backend from `backend` with `npm run dev`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to
   the backend URL (default: `http://localhost:5000`).
3. If the backend uses `SMS_PROVIDER=msg91`, configure the MSG91 widget ID and
   widget `tokenAuth` in `NEXT_PUBLIC_MSG91_WIDGET_ID` and
   `NEXT_PUBLIC_MSG91_WIDGET_TOKEN`. These are browser widget credentials;
   never expose `MSG91_AUTH_KEY` in the frontend.
4. Run `npm run dev` from `frontend`.

The MSG91 widget credentials are public-facing settings and must be restricted
to the frontend domain in the MSG91 dashboard. For `twilio` or development OTP,
leave both widget variables empty.