# Cairn — Project Progress

## V1 Status: COMPLETE AND DEPLOYED

All twelve V1 roadmap phases (`04_DEVELOPMENT_ROADMAP.md`) are implemented. The application is deployed to Render (backend as a Web Service, frontend as a Static Site) and the product owner has confirmed it works in production.

**Verification honesty note** (per explicit product-owner instruction): this section distinguishes what was *actually confirmed* from what was *implemented but not explicitly re-confirmed after deployment*. Nothing below is marked verified unless the product owner said so directly.

Last updated: 2026-09-05

---

## What Is Actually Verified

- **Phases 0–10**: each phase was implemented, then explicitly confirmed working by the product owner in a dedicated verification step before the next phase began (registration/login, activity CRUD + photos, gear + usage history, planned-activity completion flow, pack-my-bag, destinations, statistics, profile editing + dark mode, data export/account deletion — each individually confirmed).
- **Phase 12 (Deployment)**: the product owner deployed to Render following `DEPLOYMENT.md` and confirmed "it works" after the session-refresh fix and cookie fix were applied. This confirms basic functionality in production (the app loads, login works). It does **not** confirm every individual endpoint/flow was re-tested post-deployment — the consolidated `test-security-flow.sh` script was written but its output against the live deployment was never reported back.

## What Is Implemented But Not Explicitly Confirmed

- **Phase 11 (Polish) — visual/device review**: a full code-level audit was completed (accessibility fixes, stale-documentation fixes, consistency checks — see "Phase 11 Detail" below). The actual hands-on visual review this phase calls for — phone portrait/landscape, tablet, desktop, dark mode across multiple pages — was explicitly asked for twice and never received a direct answer. **This should be treated as an open item, not a completed one**, regardless of the general "it works" confirmation that came later for an unrelated reason (the deployment walkthrough).
- **Post-deployment security/regression verification**: `test-security-flow.sh` and the other nine `test-*.sh` scripts were never explicitly reported as run against the *live deployed* backend (only against local dev during original implementation).

---

## V1 Feature Completeness (by phase)

| Phase | Area | Status |
|---|---|---|
| 0 | Project Foundation | Verified |
| 1 | Authentication (email/password + Google OAuth) | Verified |
| 2 | Application Shell (navigation, design system, dark mode groundwork) | Verified |
| 3 | Activities (CRUD, search/filter/sort, Cloudinary photos, lightbox) | Verified |
| 4 | Gear (CRUD, single photo, derived usage history) | Verified |
| 5 | Planned Activities (CRUD, plan→activity completion flow) | Verified |
| 6 | Pack My Bag (gear selection, live weight total) | Verified |
| 7 | Destinations (CRUD, cover image, related-records view) | Verified |
| 8 | Statistics (totals, personal records, breakdowns, gear-value stat) | Verified |
| 9 | Profile & Settings (editable profile, password mgmt, working dark mode) | Verified |
| 10 | Data Management (JSON export, account deletion) | Verified |
| 11 | Polish | Code-level audit verified; **visual/device review unconfirmed** |
| 12 | Testing & Deployment | Deployed and confirmed working; full post-deploy test-script run unconfirmed |

**Everything in the roadmap through Phase 12 is implemented.** Nothing from `06_FUTURE_VISION.md` (community, maps/GPX, native mobile, offline, AI, group accounts) has been built, and none of it should be, absent an explicit product-owner decision — see `07_POST_V1_ROADMAP.md`.

---

## Architecture Summary

- **Stack**: MERN — React 19 + Vite (client), Express 5 + Node (server), MongoDB Atlas + Mongoose, Cloudinary (images)
- **Auth**: email/password (bcrypt) + Google OAuth (ID-token verification via `google-auth-library`, no Passport.js). JWT access token (15 min) + refresh token (7 days) as HTTP-only cookies. `SameSite=None; Secure` in production (required for Render's cross-origin two-service topology), `Lax` in local dev.
- **Session refresh**: `client/src/lib/apiClient.js` automatically attempts a silent refresh-and-retry on any `401` (except the auth endpoints themselves), with concurrent requests sharing one in-flight refresh call. This was a real bug fix late in the project — see "Known Issues."
- **Ownership model**: every resource carries `userId`; every service function verifies ownership before returning/mutating; unauthorized reads return `404` (never a distinguishable `403`, to avoid leaking existence); cross-resource references (Activity→Group, Activity→Gear, Activity→Destination, PlannedActivity equivalents) are ownership-checked server-side, never trusted from the client.
- **Deployment**: Render — backend as a Web Service, frontend as a Static Site, per `DEPLOYMENT.md`. MongoDB Atlas network access is `0.0.0.0/0` (documented tradeoff, no static Render IP on free tier; database credentials remain the real security boundary).
- **Design system**: stone/moss/clay palette (deliberately not AI-generated-default cream/terracotta), Fraunces/Work Sans/IBM Plex Mono type, slim sidebar (desktop) / bottom tab bar (mobile) at an 860px breakpoint, full dark mode via `html[data-theme]` CSS variable overrides.

## Repository Structure

```text
cairn/
├── client/               React + Vite frontend
│   └── src/
│       ├── features/     One folder per domain: auth, activities, gear,
│       │                 plannedActivities, destinations, statistics, profile, theme
│       ├── layouts/       AppShell, Sidebar, BottomTabBar, AuthLayout
│       ├── components/    Shared: Logo, NavIcons, LoadingState, EmptyState
│       ├── pages/          Thin page wrappers around feature components
│       ├── lib/apiClient.js   Shared fetch wrapper (silent refresh-on-401)
│       └── styles/tokens.css  Design tokens, light + dark palettes
├── server/
│   └── src/
│       ├── models/        User, Activity, Photo, GearItem, PlannedActivity,
│       │                  Destination, Group, Companion, Counter
│       ├── services/       Business logic, one per resource
│       ├── controllers/, routes/, validators/, middleware/
│       └── utils/          ownershipChecks.js, tokens.js, cloudinaryUpload.js
│   └── scripts/            10 manual integration-test shell scripts (test-*.sh)
├── docs/                   Product/architecture/UX/roadmap/data-model docs,
│                           PROGRESS.md (this file), 07_POST_V1_ROADMAP.md
├── DEPLOYMENT.md           Render deployment guide
└── README.md
```

---

## Known Issues

### Bugs / Defects (none currently confirmed in production)
No confirmed production bugs as of this checkpoint. The product owner has not reported any.

### Security Gaps (real, should be prioritized)
- **No rate limiting on authentication endpoints** (`/api/auth/register`, `/login`, `/refresh`) — this was named as a minimum V1 security requirement in `02_TECHNICAL_ARCHITECTURE.md` §35 and was never implemented across all twelve phases. See `07_POST_V1_ROADMAP.md` §A1.
- **No account-recovery path** for password-only accounts — no forgot-password/email-reset flow exists, and no email-sending infrastructure is integrated anywhere in the stack. See `07_POST_V1_ROADMAP.md` §A2.

### Polish / UX Issues
- **Phase 11's visual/device review was never confirmed** — see above. Sidebar/bottom-bar handoff at 860px, dark mode across multiple pages, Pack My Bag's sticky weight bar, and statistics breakdown bars at narrow widths were the specific items flagged as worth checking.
- **Gear picker caps at 50 items** in the Activity and Planned Activity forms — fine for a realistic personal closet, will silently make older gear unselectable past that count.
- **Search inconsistency**: main search boxes use MongoDB `$text` (word-tokenized), while the Wilaya filter uses regex (true substring) — different matching behavior depending on which control you use.
- **Home page has no dashboard** — shows only an empty-state CTA regardless of activity history, despite `01_PRODUCT_SPEC.md` §7 describing recent activity / upcoming plans / highlights. Flagged as a scope gap since Phase 5, never revisited.

### Technical Debt
- **No automated test suite** — all testing across all twelve phases was manual (shell-script integration tests + live validation). Explicitly acceptable for V1 per the roadmap's own framing, but the natural next investment if the project continues.
- **No CI/CD gating** — Render auto-deploys on push with no automated lint/test check in between.
- **Cloudinary cleanup failures are silently swallowed** (`.catch(() => {})`) everywhere they occur, by design (a failed image deletion should never block a more important operation) — but this also means there's zero visibility if cleanup ever actually fails. No error-tracking/observability service exists.
- **Undocumented Group-deletion behavior**: deleting a `GearItem` deliberately cleans up dangling references in Activities (documented, Phase 4). Deleting a `Destination` deliberately does not (documented, Phase 7). Deleting a `Group` behaves like the Destination case in practice (references go dangling, handled gracefully by optional chaining in the frontend) — but this was never actually decided or written down anywhere; it's just what the code happens to do. Not a bug, but an inconsistency in the project's own decision-tracking discipline.

### Reliability Concerns
- MongoDB Atlas network access is `0.0.0.0/0` — a deliberate, documented tradeoff for Render's free tier (no static outbound IP below paid tiers). Worth tightening if the Render plan is ever upgraded.
- Render free-tier cold starts (~30-50s after 15 minutes idle) are expected behavior, not a bug, but worth remembering if something seems "broken" after a period of inactivity.

For the full strategic analysis of what to do about any of this (priority, complexity, dependencies, whether it should happen now/later/deferred), see **`docs/07_POST_V1_ROADMAP.md`**.

---

## Post-V1 Assessment

A full categorized analysis (Must Fix / Should Improve / V1.1 Improvements / Major Future Features) was produced at this checkpoint and lives in **`docs/07_POST_V1_ROADMAP.md`**. Summary:

- **Must Fix**: rate limiting on auth endpoints (small, urgent); account-recovery flow for password-only users (real gap, needs an email-service decision first).
- **Should Improve**: automated tests, observability/error tracking, CI/CD gating, the undocumented Group-deletion inconsistency, gear-picker scale limit, search-behavior inconsistency, closing Phase 11's visual review.
- **V1.1 candidates**: Home page dashboard (highest-leverage single item — most-visited, least-developed screen), Outdoor Journey/Playback (explicitly deferred from Phase 8), bulk import, gear-picker pagination, saved filter preferences, print/PDF export, personal notifications, currency flexibility.
- **Major Future Features** (all explicitly deferred, `06_FUTURE_VISION.md` territory, none currently justified by product signal): community/public feed, maps/GPX/route recording, native mobile app, offline mode, AI features, group accounts.

**Recommended immediate next step** (Claude's recommendation, not a decision, as of the original checkpoint): rate limiting (Must-Fix §A1) — small, urgent, zero product-direction implications. This recommendation has since been superseded by an explicit product-owner decision — see below.

---

## Community & Landing Page (added 2026-09-09; architecture finalized and implementation approved same day)

**Community:**
**STATUS = ARCHITECTURE FINALIZED → IMPLEMENTATION APPROVED.**
The last open decision (§16 of `docs/08_COMMUNITY_PROPOSAL.md` — how `Report` records get reviewed, given no moderator role exists in the codebase) was resolved by the product owner: reports are reviewed manually/out-of-band, no moderator role or dashboard is introduced. Implementation is now underway, milestone by milestone, per the order in `08_COMMUNITY_PROPOSAL.md` §13 (M0 Landing Page → M1 Foundation → M2 Public Activity View → ... → M11 Polish). Each milestone's actual implementation status is tracked below as it happens — do not assume a milestone is complete because it's been discussed; only mark it so once verified, per this file's existing discipline.

**Landing page (M0): see the "Community Milestone Progress" section below for live status.**

See `docs/07_POST_V1_ROADMAP.md` for the consolidated post-V1 priority list and `docs/08_COMMUNITY_PROPOSAL.md` for the full finalized architecture.

---

## Community Milestone Progress

| Milestone | Status | Notes |
|---|---|---|
| M0 — Landing Page | IMPLEMENTED — build + lint clean; **visual/device review not yet confirmed by product owner** | New: `client/src/pages/LandingPage.jsx`, `LandingPage.css`, `client/src/components/FeatureIcons.jsx`. Modified: `client/src/App.jsx` (real `/`, `/login`, `/register` routes for unauthenticated visitors, replacing the bare login-only gate). No backend changes. `npm run build` and `oxlint` both pass clean; no screenshot/visual confirmation has been done. |
| M1 — Community Foundation | NOT STARTED | |
| M2 — Public Activity View | NOT STARTED | |
| M3 — Public Profiles | NOT STARTED | |
| M4 — Explore Feed | NOT STARTED | |
| M5 — Kudos | NOT STARTED | |
| M6 — Comments | NOT STARTED | |
| M7 — Reporting | NOT STARTED | |
| M8 — Following | NOT STARTED | |
| M9 — Notifications Inbox | NOT STARTED | |
| M10 — Cross-Feature Security Audit | NOT STARTED | |
| M11 — Polish | NOT STARTED | |

This table will be updated as each milestone is actually completed and verified — never marked done in advance.

**Landing page:**
**STATUS = PLANNED / NOT IMPLEMENTED.**
Confirmed by direct inspection: unauthenticated visitors currently see a bare login/register form (`client/src/App.jsx`'s `AuthGate`), with no explanation of what Cairn is. Approved as an independent milestone, sequenced before or alongside Community Foundation work — see `docs/08_COMMUNITY_PROPOSAL.md` §11 and its milestone M0.

See `docs/07_POST_V1_ROADMAP.md` (newly created 2026-09-09 — it was referenced by this file and by `HANDOVER.md` but had never actually been committed to the repository) for the consolidated post-V1 priority list including Community's status alongside the pre-existing Must Fix / Should Improve / V1.1 items.

---

## Files Changed at This Checkpoint

**New:**
- `docs/07_POST_V1_ROADMAP.md` — post-V1 strategic analysis
- `docs/HANDOVER.md` — formal handover for the next Claude session (see below)

**Modified:**
- `docs/PROGRESS.md` — this file, fully rewritten as an accurate V1-completion checkpoint

No application code was changed at this checkpoint — this was a documentation/assessment pass only, per explicit instruction not to implement anything.

---

## Last Handover

A formal handover was produced at this checkpoint for continuation in a fresh Claude conversation — see **`docs/HANDOVER.md`**. No prior handover existed before this one; this project has been developed in a single continuous conversation through V1 completion and deployment.
