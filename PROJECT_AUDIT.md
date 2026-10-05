# Yardly project audit

Date: 5 October 2026

## Assessment

Yardly is a substantial working prototype with an expanded estate-management scope. It is not ready for production. Feature presence is evidenced by models, API views, client wrappers, and pages; complete user journeys have not been verified in a browser during this audit. The supplied dashboard image is treated as a visual reference, with sample names, dates, amounts, and content rather than product requirements.

## Progress

| Area | Current evidence | Remaining work |
| --- | --- | --- |
| Authentication and onboarding | JWT auth, registration, estate membership, household audit, approval states | Secure role assignment, enforce approval and estate scope, test onboarding |
| Tasks | Posting, applications, assignment, work transitions, reviews and notifications | End-to-end verification and discoverability from the resident home |
| Resident experience | Community, services, gate, estate and profile pages | Build the integrated resident home shown in the reference |
| Gate operations | Visitor passes, deliveries, check-in actions and security alerts | Role permissions, privacy, date filtering, expiry rules and responsive layout |
| Estate administration | Resident/guard approvals, maintenance, access codes, announcements, levies and payment tracker | Secure all admin endpoints and add an overview |
| Payments | Levy models, payment UI and digital receipts | Actual payment verification; simulation is currently accepted as successful payment |
| PWA | Manifest, service worker and successful production build | Device and offline journey verification |

## Release blockers

1. **Privilege escalation:** `UserSerializer` exposes writable `role`, and `MeView` permits updates through that serializer. A user can submit an admin role through profile updates. Registration also accepts every role choice; privileged roles need controlled provisioning.
2. **Admin authorization and estate boundaries:** estate approval, code rotation, maintenance and payment-tracker views generally require authentication alone. Membership verification and maintenance updates fetch their targets by primary key without estate scope. Guard approval has the same missing role and target-estate checks.
3. **Gate permissions and privacy:** visitor check-in and delivery-arrival endpoints lack security-role enforcement. The guard visitor list is available to authenticated verified estate members, and delivery lists expose the whole estate rather than separating residents' own deliveries from guard access.
4. **Unverified payments:** `ProcessLevyPaymentView` creates a successful receipt from client-supplied method/reference without provider verification. The UI's Paystack label therefore overstates implementation progress. Test payments also feed the admin collection totals.
5. **Guard approval mismatch:** approving a guard changes user status but does not verify their estate membership. Gate queries use verified membership, so a normally registered and approved guard can still receive empty results or lack gate-code access.
6. **Validation gap:** Django discovers zero tests. Migration consistency check requests `users/0004_alter_user_role.py`.

## Dashboard design gaps

- `/dashboard` renders `Community` for residents. There is no integrated home with notices, visitors, dues, businesses and jobs. `Home.jsx` is an older task feed and is not routed.
- Resident navigation uses Community / Services / Gate / Estate / Profile with emoji icons. The reference prioritizes Home / Visitors / Community / Payments / More with consistent icons.
- Residents lack the reference's persistent desktop sidebar and contextual estate/account header.
- Admin opens directly into approvals, with no summary overview. Its operational features can be retained beneath a redesigned overview and shared navigation shell.
- Security uses fixed inline two-column grids and tables that need explicit narrow-screen treatment. This is a source-level finding; device rendering was not tested.
- Admin/security fetch errors are converted into empty arrays or null, making outages look like empty queues. Add visible error and retry states.
- Security's “checked in today” count filters status without filtering check-in date, and the list endpoint returns passes across dates. Counts can include older activity; lists also only consume the first paginated response.
- A demo account switcher with embedded demo credentials appears on every protected route. Isolate it behind a development/demo configuration.
- The CSS contains repeated sidebar rules and pages contain extensive inline styling and duplicated icon definitions. Consolidate a shared shell, icon set, cards, typography, spacing and responsive rules.
- Notifications page/API exists, but the page is not registered in the app router.

## Design direction from the supplied reference

Use deep forest green for navigation, warm off-white backgrounds, restrained terracotta accents, thin borders, consistent line icons and natural estate/business imagery. Keep the visual hierarchy calm and practical.

Resident home: estate/account header; personal greeting and unit address; Invite a visitor / Expect a delivery / Pay dues / Report an issue; notice board and nearby businesses/jobs in the main column; visitors, dues, community and emergency access in the secondary column. On mobile, use a two-by-two quick-action grid, stacked content and fixed bottom navigation.

Admin: use the same visual system with pending approvals, maintenance, levy collection and security activity summaries, then dedicated operational screens.

Security: use the same visual system with pass lookup and entry decisions first, followed by expected visitors, deliveries, alerts and today's check-ins. Prioritize clear status and large controls.

## Verification performed

- `npm run build`: passed, including PWA service-worker generation.
- `npm run lint`: completed with 15 warnings and no reported errors.
- `python manage.py check`: passed.
- `python manage.py test --noinput`: discovered zero tests; no behavioral coverage established.
- `python manage.py makemigrations --check --dry-run`: failed consistency check; role-field migration required.
- Git status: substantial existing modified and untracked application work. Those edits were left intact.

## Recommended build order

1. Fix role escalation, admin/security permissions and target estate scoping; add meaningful permission regression tests.
2. Correct payment status handling and guard membership approval; resolve migration drift.
3. Build the shared dashboard visual system and integrated resident home from the reference.
4. Apply the same system to admin and security, with role-specific content and mobile layouts.
5. Verify resident, admin and security journeys against real API data, including errors, empty states, pagination and mobile behavior.

The README still describes the earlier marketplace MVP and omits much of the new estate functionality. Update it alongside the verified implementation. No defensible overall completion percentage can be assigned without agreed scope and acceptance criteria.
