# CAIRN — POST-V1 / COMMUNITY HANDOVER

Originally produced at the V1 completion checkpoint, 2026-09-05, and updated in place as Community milestones landed since. Last updated 2026-09-13, after M10 (Comment Likes & Replies) plus a round of bug fixes and two mid-stream product-decision revisions. This document is meant to let a completely fresh Claude conversation continue Cairn's development without access to the conversation that built it.

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

**V1 is complete and deployed.** All twelve roadmap phases are implemented. The app is live on Render (separate frontend Static Site + backend Web Service) and the product owner has confirmed basic functionality works in production.

**Community is under active implementation on top of V1**, per `docs/08_COMMUNITY_PROPOSAL.md`. Milestones M0–M11 are implemented (Landing Page, Foundation, Public Activity View, Public Profiles, Explore Feed, Kudos, Comments, Reporting, Following, Notifications Inbox, Comment Likes & Replies, Cross-Feature Security Audit). **The product owner has confirmed M0–M10 all work end-to-end against a real dev server (2026-09-13)** — the earlier "no live DB in this environment" caveat for those milestones no longer applies. M11's own consolidated live script (`test-community-flow.sh`) has NOT yet been run, however — see §11. Two explicit, deliberate revisions to the original Community design have been made along the way by the product owner:
1. **Comments now support one level of replies and likes** (M10) — the original "deliberately flat, no threading" stance in §5 was revised so a question on a comment can get an answer.
2. **Public profile statistics now show OVERALL totals (public + private activities), not public-only** — a deliberate privacy-behavior change from §3's original design. Implemented carefully: totals are overall, but *records* (which specific activity was longest/highest/etc.) stay scoped to public activities only, since a record names and links to a specific activity and letting it point at a private one would leak that activity's existence. See `communityStatisticsService.js` and `docs/PROGRESS.md`'s "Session Fixes & Product Decisions (2026-09-13)" section for full detail.

**A numbering note**: `docs/08_COMMUNITY_PROPOSAL.md` §13 calls the security-audit milestone "M10" and Polish "M11" — but this project's actual sequence inserted Comment Likes & Replies as its own M10 mid-stream (a decision not in the original document), so this project tracks the security audit as **M11** and Polish as **M12**. `docs/PROGRESS.md`'s milestone table is authoritative on this.

**Bugs fixed this session, all predating the M7-M10 work**: `CommentSection` had never actually been rendered anywhere since M6 shipped (comments never appeared on any activity page); the public activity DTO never resolved any photo data (Explore/detail images never showed); Explore cards and the activity detail page never showed the author's name, meaning there was no way to discover a public profile or its Follow button from anywhere in the app.

**Also closed this session (M11)**: rate limiting, a "Must Fix" gap named in `07_POST_V1_ROADMAP.md` and never actually implemented, did not exist ANYWHERE in the codebase before now — closed via `server/src/middleware/rateLimit.js`, applied to auth endpoints and every Community write route. `app.set('trust proxy', 1)` was also entirely missing, which would have made IP-based rate limiting meaningless in production behind Render's reverse proxy.

See `docs/PROGRESS.md` for the precise, honestly-caveated verification state, milestone by milestone.


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

**Superseded by the approved, now-substantially-complete Community effort.** The A1-D prioritization above was the recommendation at the V1-only checkpoint and is preserved for historical reference, but is not the live plan.

**Current next step**: run `bash server/scripts/test-community-flow.sh` (M11's own consolidated audit script) against a real dev server — this is the one remaining unverified piece of M11 itself. After that, **M12 — Polish** (visual/UX pass against `03_UX_DESIGN_SPEC.md`, empty states, mobile responsiveness across feed/detail/profile/comments/notifications/reporting) is the next actual milestone. Read `docs/PROGRESS.md`'s milestone table and "Session Fixes & Product Decisions" section before proposing anything, and confirm the plan with the product owner first, same as every prior milestone.

## 12. Important Deferred Features — Do Not Implement Without Explicit Approval

- ~~Community, public activity feeds, kudos, comments, reporting, following, notifications, comment likes/replies~~ — **approved and now implemented (M0–M10)**, see §2.
- Maps, GPX import/export, route recording, trail discovery
- Native mobile application
- Offline mode
- AI features of any kind (insights, recommendations, packing assistance) — `01_PRODUCT_SPEC.md` §34 and `Claude.md` §9 both explicitly prohibit adding AI "merely because it's available"; a genuine identified user problem is required first, and none currently exists
- Group accounts / multi-user group management (distinct from the existing lightweight personal `Group` tag, which stays as-is)
- Followers/following counts or lists (the `Follow` model deliberately has only one index; a `{followingId, createdAt}` index for this would need to be added first)

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

I'm continuing development of Cairn, a personal-first outdoor activity platform (MERN stack). This is not a new project — V1 is complete and deployed to Render, and Community (a lightweight social layer on top of V1) is substantially built out on top of it, milestone by milestone, per `docs/08_COMMUNITY_PROPOSAL.md`.

Attached/available to you is the full repository, including:
- `docs/01` through `06` — product spec, architecture, UX spec, roadmap, data model, future vision
- `docs/07_POST_V1_ROADMAP.md` — categorized post-V1 analysis, produced at the V1 completion checkpoint (superseded by the now-approved and mostly-complete Community work — see `docs/HANDOVER.md` §11)
- `docs/08_COMMUNITY_PROPOSAL.md` — the finalized Community architecture and milestone plan
- `docs/PROGRESS.md` — the living implementation-state record, updated honestly after every milestone. Its "Community Milestone Progress" table and "Session Fixes & Product Decisions (2026-09-13)" section are the authoritative record of what's actually done, including two deliberate mid-stream revisions to the original Community design (comment replies/likes, and overall — not public-only — profile statistics)
- `docs/HANDOVER.md` — this handover

Before doing anything else:
1. Read all the documentation listed above, especially `docs/PROGRESS.md` in full and this handover
2. Inspect the actual repository and compare it against what the documentation claims — the repository is the final authority if anything seems inconsistent
3. Confirm to me, briefly, that your understanding of the current state matches reality: Community milestones M0–M10 are implemented and mocked-unit-tested (165+ checks passing); none of the ten live `.sh` integration scripts have ever been run against a real database; M11 (Polish) has not been started

**Do not start implementing anything yet.** I am the product owner. Confirm the plan with me before writing any code, same as every prior milestone.

Once you've confirmed the current state, ask me what I'd like to work on next.

**PASTE ENDING HERE**
