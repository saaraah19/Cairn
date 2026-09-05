# Cairn — Project Progress

## Current Status

Overall progress: ~99%
Current phase: Phase 12 — Testing & Deployment
Current milestone: Phase 12 — production-readiness code changes and deployment guide complete; formal deployment and final visual review still needed from you
Status: IMPLEMENTED — awaiting your deployment + Phase 11's still-outstanding visual review
Last updated: 2026-09-04

## Summary

Application code: Phase 0-9 (fully verified by you) + Phase 10 Data Management implemented
Frontend: Settings' Data section is now fully functional — real "Export my data" download and a proper "Delete my account" confirmation dialog (type DELETE + password re-entry when applicable)
Backend: Full JSON data export across every user-owned collection; account deletion that removes every user-owned document and every Cloudinary asset, with layered confirmation
Database: Connected (your Atlas cluster) — no new collection; the `Counter` model gained a proper named export (was previously only accessible via an internal helper function)
Everything from Phases 1-9: Unchanged, all previously verified
Testing: Manual — validation/auth-guarding verified live, full regression pass covering every prior phase; DB-backed happy path needs your run

## Milestone Status

| Area | Status | Notes |
|---|---|---|
| Product foundation (docs) | IMPLEMENTED | |
| Project scaffold (Phase 0) | IMPLEMENTED | |
| Authentication (Phase 1) | VERIFIED | |
| Application Shell (Phase 2) | VERIFIED | |
| Activities (Phase 3) | VERIFIED | |
| Gear (Phase 4) | VERIFIED | |
| Planned Activities (Phase 5) | VERIFIED | |
| Pack My Bag (Phase 6) | VERIFIED | |
| Destinations (Phase 7) | VERIFIED | |
| Statistics (Phase 8) | VERIFIED | |
| Profile & Settings (Phase 9) | VERIFIED | |
| Data Management (Phase 10) | VERIFIED | |
| Polish (Phase 11) | IN PROGRESS | Code-level audit done (accessibility fixes, stale docs corrected, small gear-value stat added at your request). Visual/device review is still outstanding — needs your eyes, this sandbox has never been able to render anything. |
| **Testing & Deployment (Phase 12)** | **IN PROGRESS** | Cross-origin cookie fix and CORS hardening done (critical for your Render deployment plan), a consolidated cross-user security test script covering every resource type, and a Render-specific deployment guide. Actual deployment and post-deploy verification are yours to do. |
| Database | IMPLEMENTED | No new collection — `Counter` model given a proper export. |
| Backend | **All V1 roadmap features implemented.** | Every phase through 10 now has a backend. Only Polish and Testing/Deployment remain — neither adds new product features. |
| Frontend | **All V1 roadmap features implemented.** | Every phase through 10 now has a working UI. |
| Testing | IN PROGRESS | Manual only — Phase 12 covers formal testing pass. |
| Mobile/Responsive | IMPLEMENTED (Phase 2 shell) | Delete-confirmation dialog reuses the same responsive dialog component as Activity/Gear delete; not checked on an actual device yet. |
| Deployment | NOT STARTED | Phase 12. |

## Completed

- Phases 0-10 (fully verified working by you).
- **Phase 11 — Polish (code-level audit; visual/device review still needed from you):**
  - **Accessibility gaps found and fixed**: toolbar search inputs and filter `<select>`s across five files (`ActivitiesList`, `GearList`, `DestinationList`, `PlannedActivitiesList`, `PackMyBagPage`) relied only on `placeholder` text for search boxes and had **no accessible name at all** on the filter dropdowns — a real gap against `03_UX_DESIGN_SPEC.md` §51's "form labels" requirement, not just a stylistic nitpick. Added `aria-label` to every one. Also fixed the Account section's Email field in `ProfileSettingsPage.jsx`, which had a `<label>` with no `htmlFor` pointing at the input.
  - **Verified clean, no fixes needed**: no `<img>` tags missing `alt` (all have at least `alt=""` for supplementary images, correct per WCAG), no `outline: none` removals anywhere without a replacement focus style, all five destructive-action confirmation dialogs (Activity/Gear/PlannedActivity/Destination/Account deletion) share the exact same `role="dialog"`/`aria-modal="true"` structure and CSS classes — genuinely consistent, not just similar.
  - **Stale documentation caught and fixed**: the root `README.md` still said *"Currently in Phase 0 — Project Foundation"* — completely out of date. Rewrote the Project Status section, added a real feature list, updated Prerequisites to mention Google OAuth and Cloudinary as optional-but-relevant, and added a new "Manual Testing Scripts" section documenting all ten `server/scripts/test-*.sh` scripts accumulated across phases — these existed but were never actually referenced anywhere a new reader would find them.
  - **Copy fix**: `ActivityForm.jsx`'s empty-gear-closet message said "add some from the Gear tab" — imprecise, since Gear is a top-level navigation destination, not a tab (tabs only exist within My Outdoors). Corrected.
  - **Systematically verified, no issues found**: no stale "Coming in Phase X" placeholder text anywhere (the two that existed — Home's and Gear's "coming soon" CTAs — were already corrected in their respective launch phases), no leftover `TODO`/`FIXME` markers, no stray `console.log`/`console.debug` calls in either the frontend or backend beyond the four expected/intentional backend locations (env warnings, DB connection, server startup, centralized error handler), both `.env.example` files already fully up to date with every variable added across all ten phases, all responsive grids use `auto-fit`/`auto-fill` with `minmax()` except one deliberately-fixed 3-column simple row layout (statistics breakdown bars) that's fine at any realistic viewport width.
  - **What I explicitly could not do**: this sandbox has never had a way to render the app — every "visual QA" claim in this phase is a code-level check (are the right ARIA attributes present, are the right CSS classes shared, is the grid pattern responsive-capable), not a look at how it actually renders. The roadmap's own list for this phase (typography, spacing, color, cards, images, icons, and hands-on testing across phone-portrait/phone-landscape/tablet/desktop) is fundamentally a visual/device exercise that needs your eyes, not mine.
  - **Small feature addition, your request**: Statistics now shows total gear value spent — derived from summing `GearItem.purchasePriceDzd` across all your gear (never stored, computed fresh each request, same "derive don't duplicate" principle as every other statistic). Shown as a fifth highlight tile with its own icon and color, but **only when the total is actually greater than zero** — if you haven't recorded purchase prices on your gear, the tile doesn't appear rather than showing a hollow "0 DZD." One thing worth knowing: this tile currently only shows up when you also have at least one activity logged, since the Statistics page's empty-state check is still scoped to activity count (a Phase 8 decision). If you have gear with prices but zero activities yet, you'd see the "nothing to show yet" empty state instead of just the gear-value tile — flagging this as a possible follow-up if you'd rather it show independently.
- **Phase 12 — Testing & Deployment (in progress — you mentioned Render as your deployment target):**
  - **Critical cookie fix, found before it could bite you in production**: auth cookies were `SameSite=Lax`, which works fine locally (frontend/backend share "localhost" as their site regardless of port) but **silently breaks on Render specifically** — `*.onrender.com` is on the public suffix list, so your frontend and backend, as two separate Render services, count as different "sites." Lax cookies are dropped on cross-site fetch requests, which would have meant login appearing to work but the session not actually persisting — a confusing bug to debug after the fact. Now `SameSite=None; Secure` in production (`env.nodeEnv === 'production'`), which works correctly whether your deployment ends up same-origin or cross-origin, since Secure just requires HTTPS (which Render always provides). Local dev is unaffected — still `Lax`, no HTTPS requirement.
  - **CORS hardened for multiple origins**: `CLIENT_URL` now accepts a comma-separated list (`env.clientUrls`), and the CORS origin check was changed from a plain string match to a function-based check against that list — useful once you add a custom domain alongside Render's default URL, since you won't need to choose between them.
  - **CORS rejections now return a clean `403`** instead of an unhandled error surfacing as a generic `500` — same principle as every other error-handling improvement in this project (Phase 3's CastError handling, Phase 3's duplicate-key handling): a rejection is an expected, correctly-handled outcome, not a server failure, and shouldn't be logged or reported as one.
  - **Consolidated cross-user security test** (`server/scripts/test-security-flow.sh`): the architecture doc explicitly names this requirement (§52) — "User A attempts to retrieve/modify User B's resources," "the server determines ownership from authentication," never trusting a client-supplied ID. Individual phases tested pieces of this already (e.g. "can't attach someone else's group"), but this is the first single pass covering **every** resource type — activities, gear, planned activities, destinations — for read, modify, delete, and cross-attachment, plus a check that a forged `userId` field in a request body is silently ignored rather than trusted. 20 checks in total, each with a pass/fail assertion, exits non-zero if anything fails.
  - **`DEPLOYMENT.md`**: a concrete, Render-specific step-by-step guide — MongoDB Atlas network access (and why `0.0.0.0/0` is a reasonable tradeoff here, not a security hole, since the database itself still requires credentials), exact Render service configuration for both the backend Web Service and frontend Static Site, the SPA rewrite rule you'll need (without it, refreshing on any page but `/` 404s), updating Google Cloud Console's authorized origin once you have a real URL, and a note that Cloudinary needs no additional configuration at all. Also flags Render free-tier cold starts as expected behavior, not a bug, so it doesn't look like something's broken the first time you hit it.
  - **What's still yours to do**: the actual deployment (I have no way to do this myself), running the security/auth scripts against the live deployed URL, and the in-browser verification `DEPLOYMENT.md` walks through — especially confirming a page refresh keeps you logged in, since that's the specific thing the cookie fix was for.
  - **Session-refresh bug found and fixed** (surfaced while answering your question about session length): the backend has had a working `/api/auth/refresh` endpoint with a 7-day refresh token since Phase 1a — but nothing on the frontend ever called it. Every session was silently capped at the 15-minute access-token lifetime regardless of the refresh token sitting unused, meaning anyone using the app for more than 15 minutes would start hitting authentication errors. Fixed by extracting the six near-identical, duplicated `request()` helpers scattered across every feature's `api.js` into one shared `client/src/lib/apiClient.js`, which now automatically attempts a silent refresh-and-retry exactly once on any `401` (except on the auth endpoints themselves, where that would be meaningless or loop forever). Concurrent requests that all hit a `401` at the same moment share a single in-flight refresh attempt rather than firing duplicate refresh calls. Real session length is now genuinely 7 days of use with the access token silently renewing in the background, not 15 minutes.

## In Progress

Two things are converging at the end of this project: Phase 11's visual/device review (still needs your eyes — this sandbox has never been able to render anything) and Phase 12's actual deployment (needs your Render account — I can prepare everything but can't click the buttons). Both are genuinely the last steps.

## Remaining

- **Phase 11 — your visual review**: open the app on an actual phone (portrait and landscape), a tablet if you have one, and desktop. Look specifically at the sidebar/bottom-tab-bar handoff at 860px, dark mode across a few different pages, the Pack My Bag sticky weight bar, and the statistics breakdown bars at narrow widths.
- **Phase 12 — deploy**: follow `DEPLOYMENT.md`. It's written to be followed directly without needing me in the loop, but I'm here if anything doesn't go as described.
- **Phase 12 — post-deploy verification**: run `test-security-flow.sh` and `test-auth-flow.sh` with `BASE_URL` pointed at your live backend, then in the browser confirm login survives a page refresh (the specific thing the cookie fix addresses) and that Google sign-in works with the production origin registered.

## Known Issues

- **Visual/responsive behavior has never been confirmed by an actual render** — this remains the single biggest gap in the project's verification history, unchanged from the last update.
- **The cookie/CORS changes have been tested locally (still `Lax`/non-production in dev) but not against an actual cross-origin deployment**, since this sandbox can't reach the internet to simulate that. The reasoning is sound (this is well-established cookie-spec behavior, not a guess), but "reasoning is sound" and "verified against a real cross-origin deployment" are different things — please treat the post-deploy verification step as genuinely necessary, not a formality.
- No automated test suite yet — Phase 12 mentions this but the roadmap treats the shell-script-based manual testing accumulated across all twelve phases as sufficient for V1; a proper automated suite (Jest/Vitest, etc.) would be a reasonable next investment but is explicitly beyond V1's stated scope.

## Technical Decisions

- **`SameSite=None; Secure` in production, `Lax` in development** — the correct, standard solution for an app that might be deployed same-origin or cross-origin depending on hosting choice, rather than hardcoding an assumption about deployment topology.
- **CORS origin as a function checking an array**, not a hardcoded string — small change, meaningfully more flexible for the multi-domain situations that come up in real deployments (default platform URL + custom domain).
- **`0.0.0.0/0` recommended for MongoDB Atlas network access in `DEPLOYMENT.md`** — flagged explicitly as a tradeoff rather than presented as simply "the answer": Render doesn't offer static outbound IPs below certain paid tiers, so allowlisting specific IPs isn't practical, and the database's own credential requirement is the actual security boundary here, not network-level IP filtering.
- **Consolidated security script rather than relying on the piecemeal per-phase checks alone** — the architecture doc names this as an explicit requirement with specific named scenarios, which warrants a dedicated, comprehensive check rather than trusting that scattered per-feature tests add up to full coverage.

Open decisions: none. Everything remaining is execution (deployment) and observation (your visual review), not design.

## Files / Areas Recently Changed

**Backend — modified:**
`utils/tokens.js` (SameSite/Secure cookie logic), `config/env.js` (`clientUrls` array), `app.js` (function-based CORS origin check), `middleware/errorHandler.js` (CORS rejection → clean 403), `.env.example` (documented comma-separated `CLIENT_URL`), `services/statisticsService.js` (gear-value total, carried over from the prior update)

**Backend — new:**
`scripts/test-security-flow.sh`

**Documentation — new:**
`DEPLOYMENT.md`

**Documentation — modified:**
`README.md` (links to `DEPLOYMENT.md`)

**Frontend — new:**
`lib/apiClient.js` (shared fetch wrapper with silent refresh-on-401)

**Frontend — modified:**
`features/{auth,activities,gear,plannedActivities,destinations,profile,statistics}/api.js` — all six duplicated `request()` helpers replaced with the shared client; file-upload and blob-download functions switched to `apiFetch` for the same retry benefit

## Verification

Build: `client` — `npm run build` succeeds (verified, no client changes this round beyond the prior gear-value addition).
Lint: `client` — `npx oxlint` → 0 warnings, 0 errors across 67 files (verified).
Backend: all files pass `node --check`; app assembles cleanly with the new CORS logic (verified).
Manual verification (live, this session):
- CORS: allowed origin (`http://localhost:5173`) still works, disallowed origin (`http://evil.com`) correctly rejected with a clean `403` instead of the previous generic `500`
- Full regression pass across **every** API surface from every phase: health, auth `/me`/register validation, activity/gear/destination/planned-activity/statistics/profile/export auth-guards — all still correct after touching four core shared files (`tokens.js`, `env.js`, `app.js`, `errorHandler.js`)
- `test-security-flow.sh` syntax-verified (`bash -n`); full execution requires a live database this sandbox doesn't have access to

Not verified, and not verifiable by me: the cookie fix against an actual cross-origin deployment (reasoning is sound, per well-established cookie-spec behavior, but untested against the real thing), and everything in `DEPLOYMENT.md` that depends on you actually having a Render account and live URLs.

## Next Recommended Step

1. Pull this update — no new dependencies; note the `.env.example` changes (comma-separated `CLIENT_URL` support, same variable name)
2. Follow `DEPLOYMENT.md` to deploy both services on Render
3. Run `BASE_URL=<your live backend URL> bash server/scripts/test-security-flow.sh` and `test-auth-flow.sh` against the deployed backend
4. In the browser on your deployed frontend: register, log in, **refresh the page and confirm you're still logged in** (this is the specific thing the cookie fix was for), try Google sign-in, log an activity with a photo
5. Whenever convenient, also do Phase 11's visual review — phone, tablet, desktop, dark mode — and tell me what needs adjusting
6. Report back on both, and we'll close out anything that needs fixing

## Last Handover

No prior handover — continuing directly within the same conversation from Phase 10.
