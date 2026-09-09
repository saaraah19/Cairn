# CAIRN — POST-V1 HANDOVER

Produced at the V1 completion checkpoint, 2026-09-05. This document is meant to let a completely fresh Claude conversation continue Cairn's development without access to the conversation that built it.

---

## 1. Project Identity

Cairn is a personal-first outdoor activity platform for hikers, trekkers, and campers — a personal journal, planner, gear closet, and statistics tool, with a lightweight future community layer explicitly deferred. Core loop: **Plan your adventure. Prepare for it. Live it. Record it. Remember it. Understand your journey.**

Core philosophy, non-negotiable:
- **Personal-first**: must be fully valuable with zero social interaction. Community is future work, not V1.
- **Calm, natural, minimal** — not a spreadsheet, not generic SaaS, not an AI-generated-looking dashboard.
- **Strict data isolation** — every user's data is completely private from every other user, enforced server-side.
- **Derive, don't duplicate** — statistics, usage history, and personal records are computed from source data, never separately stored.

The product owner (a human, not Claude) makes all product-direction decisions. Claude is the engineering partner.

## 2. Current State

**V1 is complete and deployed.** All twelve roadmap phases are implemented. The app is live on Render (separate frontend Static Site + backend Web Service) and the product owner has confirmed basic functionality works in production. See `docs/PROGRESS.md` for the precise, honestly-caveated verification state — not everything is confirmed to the same degree, and that document says exactly what is and isn't.

## 3. V1 Completion

Every phase in `04_DEVELOPMENT_ROADMAP.md` (Phase 0 through Phase 12) is implemented:

- **Foundation & Auth**: project scaffold, email/password + Google OAuth (ID-token verification, no Passport.js)
- **Application Shell**: responsive nav (sidebar/bottom-bar), full design system, working dark mode
- **Activities**: CRUD, search/filter/sort/pagination, Cloudinary photo gallery with lightbox, gear selection, group/companion tagging
- **Gear**: CRUD, single photo, usage history derived from Activity references
- **Planned Activities**: CRUD, the plan → pre-filled activity form → linked-and-completed flow
- **Pack My Bag**: gear selection for a plan with live weight calculation
- **Destinations**: CRUD, cover image, related-activities/plans view
- **Statistics**: totals, personal records, category breakdowns, a gear-total-value stat (added at product owner's request)
- **Profile & Settings**: fully editable profile, password change/set, working light/dark/system theme, privacy preference
- **Data Management**: full JSON export, account deletion (two-layer confirmation, full Cloudinary + database cleanup)
- **Polish**: code-level accessibility/consistency audit done; hands-on visual/device review was never explicitly confirmed by the product owner (see §9)
- **Testing & Deployment**: cross-origin cookie fix (critical for Render's two-service topology), CORS hardening, a consolidated cross-user security test script, a session-refresh bug fix (real sessions are 7 days, not the 15 minutes they were silently capped at before the fix), full Render deployment guide

## 4. Deployment

- **Platform**: Render, free tier, two separate services
- **Backend**: Web Service, root `server/`, build `npm install`, start `npm start`
- **Frontend**: Static Site, root `client/`, build `npm install && npm run build`, publish `dist`, with an SPA rewrite rule (`/*` → `/index.html`)
- **Full step-by-step guide**: `DEPLOYMENT.md` at the repo root — env var lists, exact Render configuration, MongoDB/Google/Cloudinary setup notes, free-tier cold-start caveat
- **Critical production detail**: `NODE_ENV=production` on the backend switches auth cookies to `SameSite=None; Secure` — required because Render's `*.onrender.com` subdomains count as different "sites" for cookie purposes even within the same project. Without this, login silently fails to persist.
- **MongoDB Atlas**: Network Access set to `0.0.0.0/0` (documented tradeoff, no static Render IP on free tier)
- Confirmed working by the product owner after deployment, including the cookie and session-refresh fixes

## 5. Repository Structure

```text
cairn/
├── client/src/
│   ├── features/{auth,activities,gear,plannedActivities,destinations,statistics,profile,theme}/
│   │   Each: api.js, components, feature-specific CSS
│   ├── layouts/       AppShell, Sidebar, BottomTabBar, AuthLayout
│   ├── components/    Logo, NavIcons, LoadingState, EmptyState (shared primitives)
│   ├── pages/         Thin wrappers composing feature components
│   ├── lib/apiClient.js    Shared fetch wrapper — silent refresh-on-401, used by every feature's api.js
│   └── styles/tokens.css   Design tokens, light + dark palettes
├── server/src/
│   ├── models/         User, Activity, Photo, GearItem, PlannedActivity, Destination, Group, Companion, Counter
│   ├── services/        One per resource — all business logic and ownership checks live here
│   ├── controllers/, routes/, validators/, middleware/
│   └── utils/           ownershipChecks.js (shared group/gear/destination ownership assertions),
│                        tokens.js (JWT + cookie config), cloudinaryUpload.js (shared upload helper)
├── server/scripts/      10 shell scripts (test-*.sh) — manual integration tests against a live DB,
│                        the closest thing to a test suite that currently exists
├── docs/
│   ├── 01-06_*.md       Product spec, architecture, UX spec, roadmap, data model, future vision
│   ├── PROGRESS.md      Living implementation-state record — READ THIS FIRST
│   ├── 07_POST_V1_ROADMAP.md   Categorized post-V1 analysis (Must Fix / Should Improve / V1.1 / Future)
│   ├── HANDOVER.md      This file
│   └── MASTER_IMPLEMENTATION_PROMPT.md   The original engineering-process document
├── DEPLOYMENT.md
└── README.md
```

## 6. Architecture

- **Frontend**: React 19 + Vite, React Router, no state-management library beyond Context (`AuthContext`, `ThemeContext`)
- **Backend**: Express 5 + Node, layered as route → controller → service → model, Zod for all input validation
- **Database**: MongoDB Atlas + Mongoose. No aggregation pipelines used anywhere — statistics and derived data are computed by fetching and reducing in JS, a deliberate simplicity choice appropriate at V1's personal-use data scale.
- **Auth**: JWT access token (15 min) + refresh token (7 days), both HTTP-only cookies. Google OAuth via ID-token verification (`google-auth-library`), not a redirect/Passport flow. `client/src/lib/apiClient.js` automatically retries once on a `401` via silent refresh, shared across every feature module.
- **Images**: Cloudinary. Activities have a photo gallery (`Photo` collection, many-per-activity); Gear/Destinations/Profile have a single image each (`{cloudinaryPublicId, secureUrl}` embedded field, not a separate collection). All uploads go browser → backend (multer, in-memory buffer) → Cloudinary → backend stores metadata — Cloudinary credentials never reach the browser.
- **Deployment topology**: two independent Render services, which is *why* the `SameSite=None` cookie fix was necessary — don't reintroduce `SameSite=Lax` without re-checking this.

## 7. Data Model

Core entities and how they relate (see `docs/05_DATA_MODEL_AND_API_CONTRACT.md` for full detail):

- **User** — has `preferences.theme`, `preferences.defaultActivityVisibility`, `authProviders` (`['password']`, `['google']`, or both), `profilePicture` (Cloudinary object)
- **Activity** — the core historical record. `userId`-owned, sequentially numbered per-user (`activityNumber`, via an atomic `Counter` document, never reused after deletion). Optionally references `destinationId`, `social.groupId`, `gearItemIds[]`. Has its own `Photo` gallery.
- **PlannedActivity** — intention, not history. Can be linked to a completed `Activity` via `completedActivityId` after the fact; the plan document is never overwritten or deleted when this happens. Has `packedGearItemIds[]` for Pack My Bag.
- **GearItem** — user's closet. Usage history is *always* derived from `Activity.gearItemIds`, never stored on the gear item itself. Different physical items are never deduplicated by name/brand.
- **Destination** — fully independent of `PlannedActivity`. A destination can exist with or without a plan, and vice versa. Deleting a destination does **not** clean up `destinationId` references on activities/plans that used it (deliberate, differs from Gear's cascade-cleanup behavior — see §9).
- **Group** / **Companion** — lightweight, user-owned, name-only. Not multi-user entities. `Group` referenced by ID from Activity/PlannedActivity; `Companion` names are stored as plain strings on the activity (not a foreign key), only used for autocomplete suggestions.
- **Photo** — Activity photo gallery metadata only; binaries live in Cloudinary.
- **Counter** — backs atomic per-user sequence numbers (currently just `activityNumber`).

## 8. Security / Data Isolation

These rules must never be broken by future work:

- Every resource has a `userId` field. Every service function that reads/writes a resource must filter by both the resource ID *and* the authenticated `userId` — never trust a client-supplied ID alone.
- Unauthorized access to another user's resource must return `404`, never a distinguishable `403` — this prevents confirming a resource's existence to someone who doesn't own it.
- Cross-resource references (attaching a Group/Gear/Destination to an Activity or PlannedActivity) must independently verify that *referenced* resource also belongs to the authenticated user, not just that the primary resource does. This logic lives in `server/src/utils/ownershipChecks.js` — reuse it, don't duplicate it.
- The authenticated user's identity always comes from the verified JWT (`req.userId`, set by `authenticate` middleware), never from a request body/query field.
- `server/scripts/test-security-flow.sh` is a consolidated test of exactly these rules across every resource type. Run it after any change that touches ownership logic.
- **Known gap**: no rate limiting exists on `/api/auth/*` endpoints. This is a named V1 requirement that was missed — see §9 and §10.

## 9. Known Issues

**Security gaps (real):**
- No rate limiting on `/api/auth/register`, `/login`, `/refresh` — a named V1 requirement, never implemented.
- No account-recovery path for password-only accounts — no forgot-password flow, no email-sending infrastructure exists anywhere in the stack.

**Unconfirmed (implemented but not verified):**
- Phase 11's hands-on visual/device review (phone portrait/landscape, tablet, dark mode across multiple pages, Pack My Bag's sticky bar, statistics breakdown bars at narrow widths) was asked for twice and never received a direct answer from the product owner. Treat as open, not done.
- The ten `test-*.sh` scripts were run and passed during original local development but were never explicitly re-run and reported against the *live deployed* backend.

**Technical debt:**
- No automated test suite (Jest/Vitest) — everything is manual shell-script integration tests plus historical live validation.
- No CI/CD gating before Render's auto-deploy-on-push.
- Cloudinary cleanup failures are silently swallowed everywhere (`.catch(() => {})`, deliberate) with zero observability if it ever actually fails. No error-tracking service integrated.
- Undocumented inconsistency: deleting a `Group` leaves dangling references in Activities that used it (same practical behavior as Destination's deliberate choice, but never actually decided/written down for Group specifically).
- Gear-picker in Activity/PlannedActivity forms caps at 50 items (no pagination in the picker itself).
- Search behavior differs between `$text`-based main search (word-tokenized) and regex-based Wilaya filtering (true substring) — inconsistent UX, not a bug.

**Product gap:**
- Home page shows only an empty-state CTA regardless of activity history — the product spec always intended a real dashboard (recent activity, upcoming plans, highlights). Flagged since Phase 5, never revisited.

No confirmed production bugs as of this handover.

## 10. Post-V1 Assessment

Full detail in `docs/07_POST_V1_ROADMAP.md`. Summary:

**A. Must Fix**
- A1 — Rate limiting on auth endpoints. Small, urgent, no product-direction implications.
- A2 — Account-recovery flow. Real gap, but needs an email-service decision first (none currently integrated).

**B. Should Improve**
- Automated test suite; observability/error tracking; CI/CD gating; the undocumented Group-deletion inconsistency; gear-picker scale limit; search-behavior inconsistency; closing out Phase 11's visual review.

**C. V1.1 / Product Improvements** (still personal-first, no identity change)
- Home page dashboard (highest-leverage single item — most-visited, least-developed screen); Outdoor Journey/Playback (explicitly deferred from Phase 8); bulk import; gear-picker pagination; saved filter preferences; print/PDF export; personal notifications; currency flexibility.

**D. Major Future Features** (all `06_FUTURE_VISION.md` territory, none currently justified)
- Community/public feed; maps/GPX/route recording; native mobile app; offline mode; AI features; group accounts (multi-user organizations, distinct from today's lightweight personal Group tag).

## 11. Current Recommended Next Step

Claude's recommendation (**not a decision** — the product owner has not approved a next milestone): implement **A1 (rate limiting)** first, since it's small, was a named V1 requirement that got missed, and carries no product-direction weight either way. After that, it's a genuine choice between hardening what's live (A2 → B1 → B2) or improving daily-use experience (C1, the Home dashboard). **Nothing in category D is currently justified by any product signal — do not start there.**

**The product owner has not yet approved any of this.** Do not implement anything from this list until they explicitly say to.

## 12. Important Deferred Features — Do Not Implement Without Explicit Approval

- Community, public activity feeds, following, kudos, comments
- Maps, GPX import/export, route recording, trail discovery
- Native mobile application
- Offline mode
- AI features of any kind (insights, recommendations, packing assistance) — `01_PRODUCT_SPEC.md` §34 and `Claude.md` §9 both explicitly prohibit adding AI "merely because it's available"; a genuine identified user problem is required first, and none currently exists
- Group accounts / multi-user group management (distinct from the existing lightweight personal `Group` tag, which stays as-is)

If the product owner asks about any of these, discuss them — don't refuse to talk about the future vision — but do not start building without an explicit go-ahead.

## 13. Development Rules

Carried forward from `Claude.md` and `MASTER_IMPLEMENTATION_PROMPT.md`, still fully in force:

- The product owner has final authority over product decisions. Claude makes engineering decisions (file structure, internal patterns, library choices for implementation details) independently; Claude asks before adding features, changing navigation/core flows, changing privacy behavior, or altering what an entity means.
- `06_FUTURE_VISION.md` describes a destination, not an authorization — never build from it without being asked.
- Work in small, verifiable increments. Test before claiming something works — this project's whole history is built on that discipline (every phase was verified, live, before moving on).
- Never trust client-supplied ownership/identity fields — always derive from the authenticated session.
- Prefer simplicity over premature abstraction — this codebase deliberately avoids aggregation pipelines, unnecessary dependencies, and speculative architecture throughout.
- Update `docs/PROGRESS.md` after every significant milestone, honestly — only mark something verified if it actually was.
- Generate a handover (like this one) at natural stopping points, especially before a context/conversation reset.

## 14. Exact Next-Session Instructions

When this handover is pasted into a new conversation, the next Claude instance should, **in this order, before writing or changing any code**:

1. Read `docs/01_PRODUCT_SPEC.md`, `02_TECHNICAL_ARCHITECTURE.md`, `03_UX_DESIGN_SPEC.md`, `04_DEVELOPMENT_ROADMAP.md`, `05_DATA_MODEL_AND_API_CONTRACT.md`, `06_FUTURE_VISION.md`
2. Read `docs/PROGRESS.md` in full
3. Read `docs/07_POST_V1_ROADMAP.md` in full
4. Inspect the actual repository — directory structure, key source files, `package.json` files, `DEPLOYMENT.md`
5. Compare what's actually in the repository against what this handover and `PROGRESS.md` claim — the repository is the final authority if anything conflicts
6. Report back a concise confirmation of current state (a few sentences, not a re-derivation of this entire document)
7. **Then stop and discuss the next milestone with the product owner.** Do not propose implementation, do not start coding, do not assume the recommendation in §11 has been accepted — wait for an explicit decision.

## 15. Ready-to-Paste Prompt

Everything below this line is meant to be copied as a single message into a fresh Claude conversation.

---

**PASTE STARTING HERE:**

I'm continuing development of Cairn, a personal-first outdoor activity platform (MERN stack). This is not a new project — V1 is complete and already deployed to Render.

Attached/available to you is the full repository, including:
- `docs/01` through `06` — product spec, architecture, UX spec, roadmap, data model, future vision
- `docs/PROGRESS.md` — the living implementation-state record, updated honestly (it distinguishes verified from unconfirmed work — read it carefully, don't assume everything marked "implemented" was also confirmed working)
- `docs/07_POST_V1_ROADMAP.md` — a categorized post-V1 analysis (Must Fix / Should Improve / V1.1 improvements / Major Future Features) produced at the V1 completion checkpoint
- `docs/HANDOVER.md` — a detailed handover document from the previous Claude session, covering project identity, current state, architecture, data model, security rules, known issues, and the post-V1 assessment in full

Before doing anything else:
1. Read all the documentation listed above, especially `docs/PROGRESS.md` and `docs/HANDOVER.md`
2. Inspect the actual repository and compare it against what the documentation claims
3. Confirm to me, briefly, that your understanding of the current state matches reality (the repository is the final authority if anything seems inconsistent)

**Do not start implementing anything yet.** I am the product owner and have not yet decided on the next milestone. `docs/HANDOVER.md` §11 contains a recommendation from the previous session (rate limiting on auth endpoints, as a small urgent fix), but that is a recommendation, not an approved plan — wait for me to decide before writing any code.

Once you've confirmed the current state, ask me what I'd like to work on next.

**PASTE ENDING HERE**
