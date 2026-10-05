# Yardly

Hyperlocal community task marketplace for gated residential estates in Nigeria — MVP.

"Post a task → find someone nearby → get it done → pay → review."

## Stack

- **Backend:** Django REST Framework, PostgreSQL (SQLite for local dev), JWT auth (SimpleJWT)
- **Frontend:** React (Vite) PWA — installable, offline app-shell caching via a service worker

## Project layout

```
backend/          Django REST API
  config/         settings, root urls
  apps/
    users/        custom User model, WorkerProfile, registration/auth
    estates/      Estate, EstateMembership, invite-code onboarding
    jobs/         Category, Job (state machine), job feed
    applications/ JobApplication — apply / accept / withdraw
    reviews/      post-completion ratings
    notifications/in-app notifications
    reports/      safety reports + blocks
    common/       shared permissions (verified-resident gate, estate scoping)
frontend/         React PWA (Vite)
```

## Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env       # then edit SECRET_KEY etc.
python manage.py migrate
python manage.py seed_demo_estate    # creates "Chevron Estate" with invite code DEMO2026
python manage.py createsuperuser
python manage.py runserver
```

API runs at `http://localhost:8000/api/`. Admin at `http://localhost:8000/admin/`.

By default the app uses local SQLite — zero config. To use Postgres instead, set
`DATABASE_URL=postgres://user:password@localhost:5432/yardly` in `backend/.env`.

### Verifying a resident (MVP moderation)

New accounts start as `PENDING_VERIFICATION` and can browse but not post/apply. In
Django admin, under **Estate memberships**, select a membership and run the
**"Verify selected memberships"** action — it marks the membership verified and flips
the user's status to `VERIFIED`.

## Frontend setup

```bash
cd frontend
npm install
copy .env.example .env       # points at the local API by default
npm run dev
```

Runs at `http://localhost:5173`. `npm run build` produces an installable PWA build
(manifest, service worker, offline app-shell caching) in `frontend/dist`.

## Golden path

1. Register with an estate invite code (`DEMO2026` for the seeded demo estate).
2. An estate admin verifies the membership (see above).
3. Post a task, or browse the feed and apply to one.
4. Task owner assigns an applicant → `ASSIGNED`.
5. Worker starts the task → `IN_PROGRESS` → marks complete → `COMPLETED`.
6. Owner confirms completion → `CLOSED`; payment is handled off-platform (bank
   transfer) for the MVP.
7. Both parties leave a review.

## What's intentionally out of MVP scope

Per the product spec: in-app messaging (WhatsApp deep link is used instead),
escrow/integrated payments, AI matching, live GPS tracking, multi-estate discovery,
and automated dispute arbitration. See the product brief for the full list and the
phased build order.


## Account email and password reset

The sign-in page links to `/forgot-password`. Password reset emails contain a six-digit code that expires after 10 minutes. Codes are stored as hashes, used once, and locked after five incorrect attempts. Requesting a new code invalidates the previous code. A successful reset invalidates previously issued JWTs. Registration sends a welcome email. Estate admins can check **Email this update to verified residents** when publishing an announcement; each recipient receives a separate message and delivery counts are displayed.

Run `python manage.py preview_emails` to generate browser previews at `/email-previews/welcome.html` and `/email-previews/password-reset.html`. Add `--to YOUR_EMAIL` to send sample templates; sample OTPs do not reset an account.

Local development uses Django's file email backend: captured messages are saved in `backend/emails/`. They are not delivered to real inboxes. For Resend, add `RESEND_API_KEY` and a verified `DEFAULT_FROM_EMAIL` to `backend/.env`; the Resend backend is selected automatically when a key exists. If `EMAIL_BACKEND` is explicitly set, use `apps.common.resend_backend.EmailBackend`. Resend acceptance is logged with its message ID; actual inbox delivery is not confirmed by API acceptance. Alternatively, configure `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, and a verified `DEFAULT_FROM_EMAIL` for real delivery. Set `FRONTEND_URL` to the deployed frontend so email links point to the correct site. Environment variable examples are in `backend/.env.example`. Delivery is synchronous; failures are logged and registration or a published announcement remains saved.

## Access codes

The admin access-code screen loads the current estate invite code. **Save estate invite code** changes onboarding invitations only; **Rotate gate code** changes the daily entry code only. Codes persist after reload. Both operations require a verified admin membership in the estate.

## Error logs

Backend logs rotate in `backend/logs/yardly.log` (5 MB each, five backups). JSON records identify the app/logger, timestamp, severity, route, request ID, status, user ID and duration. Validation failures include field names; unhandled errors include tracebacks. Email records identify message type, user ID and delivery outcome. Passwords, JWTs, email bodies and request payloads are not logged.

Frontend API, rendering, runtime and rejected-promise errors appear in the browser console under `[Yardly]`. Authenticated client error metadata is also recorded by the backend. API responses include `X-Request-ID` to correlate browser failures with server records. Captured emails and logs are ignored by Git; reset codes in captured emails should remain private.

Regression checks: `python manage.py test apps.users apps.estates --noinput`.

## Neon database and Vercel Analytics

Set `DATABASE_URL` in `backend/.env` to the Neon PostgreSQL connection string with `sslmode=require`. Django reads this file directly; a Neon management API key is not a database password. Run `python manage.py migrate` to initialize the schema. Changing databases does not automatically copy accounts or estate records from local SQLite.

The React app includes `@vercel/analytics/react` in production builds. Query strings and fragments are removed before page-view events are sent; legacy password-reset token URLs are excluded. Enable Web Analytics for the Vercel project and deploy the frontend to start collecting visits. Local Vite development does not send analytics. Live collection must be verified on the deployed site.
