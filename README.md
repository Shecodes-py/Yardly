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
