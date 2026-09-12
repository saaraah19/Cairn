# Cairn — Project Progress

## V1 Status: COMPLETE AND DEPLOYED

All twelve V1 roadmap phases (`04_DEVELOPMENT_ROADMAP.md`) are implemented. The application is deployed to Render (backend as a Web Service, frontend as a Static Site) and the product owner has confirmed it works in production.

**Verification honesty note** (per explicit product-owner instruction): this section distinguishes what was *actually confirmed* from what was *implemented but not explicitly re-confirmed after deployment*. Nothing below is marked verified unless the product owner said so directly.

Last updated: 2026-09-12 (M8 — Following and M9 — Notifications Inbox implemented, see "Community Milestone Progress" below)

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
| M1 — Community Foundation | IMPLEMENTED — verification script passing | New: `server/src/models/Notification.js`, `server/src/middleware/optionalAuthenticate.js`, `server/src/services/communityService.js` (`toPublicActivityDTO`, `toPublicProfileDTO`, group/destination resolvers), `server/src/services/notifyService.js`, `server/scripts/test-community-foundation.js`. Modified: `server/src/models/Activity.js` (+`publicCaption`, +`kudosCount`, +`{visibility,date}` index), `server/src/models/User.js` (+`isPublicProfile`). No routes/controllers exposed — nothing reachable externally yet, matching the milestone's own definition. `node scripts/test-community-foundation.js` passes 18/18 checks (whitelist DTOs never leak any of activityNumber/exact coordinates/companions/cost/review.notes/gearItemIds/email/passwordHash/googleId/preferences even when a fixture has all of them populated; self-notification suppression confirmed). Model/index sanity-checked directly (schema paths, registered indexes) since nothing is live yet to hit over HTTP. |
| M2 — Public Activity View | IMPLEMENTED — mocked unit test passing; **live end-to-end (real DB) run not yet done, no MongoDB reachable in this environment** | New: `server/src/controllers/communityController.js`, `server/src/routes/community.routes.js`, `server/scripts/test-community-m2-unit.js` (mocked, run here), `server/scripts/test-community-public-activity.sh` (live-server, **needs to be run against a real dev environment — not yet run**). New client: `client/src/features/community/api.js`, `PublicActivityDetail.jsx` + `.css`, `client/src/layouts/PublicPageLayout.jsx` + `.css`. Modified: `server/src/services/communityService.js` (+`getPublicActivityById`, query-level `visibility:'public'` filter, non-distinguishing 404), `server/src/app.js` (mounted `/api/community`), `client/src/App.jsx` (`/community/activities/:id` route added to both the signed-out tree, wrapped in the new minimal `PublicPageLayout`, and the signed-in tree, wrapped in the existing `AppShell`). `npm run build` and `oxlint` clean on all client files. **Action needed from product owner: run `bash server/scripts/test-community-public-activity.sh` against a real dev server before this milestone is considered fully verified** — it covers anonymous public read, private→404 (including as the owner, confirming this endpoint grants no ownership shortcut), and immediate public→private enforcement, none of which this sandbox could execute end-to-end. |
| M3 — Public Profiles | IMPLEMENTED — mocked unit test passing; **live end-to-end (real DB) run not yet done, no MongoDB reachable in this environment** | New: `server/src/services/communityStatisticsService.js` (dedicated, public-only scoping, separate from `statisticsService.js` per §3), `server/scripts/test-community-m3-unit.js` (mocked, run here), `server/scripts/test-community-public-profile.sh` (live-server, **not yet run**). New client: `client/src/features/community/PublicProfile.jsx` + `.css`. Modified: `server/src/services/communityService.js` (+`getPublicProfileByUsername`, +`listPublicActivitiesByUser`, cursor pagination per §7/§9), `communityController.js`/`community.routes.js` (+`GET /api/community/users/:username`), `server/src/validators/profileValidators.js` + `profileService.js` (+`isPublicProfile` toggle on `PATCH /api/profile`), `client/src/features/profile/ProfileSettingsPage.jsx` (new "Make my profile public" checkbox in the existing Privacy section, explicitly noting the decoupling from activity visibility), `client/src/features/community/api.js` (+`getPublicProfileRequest`), `client/src/App.jsx` (`/community/users/:username` in both trees). `npm run build` and `oxlint` clean. Mocked unit test — **7/7 passing**, critically including the statistics-scoping property (a fixture user with one 8km public and one 100km private activity correctly reports `distanceKm: 8`, not `108`, and the highest-rated-activity record points at the public activity only). **Action needed from product owner: run `bash server/scripts/test-community-public-profile.sh` against a real dev server** before this milestone is considered fully verified. |
| M4 — Explore Feed | IMPLEMENTED — mocked unit test passing; **live end-to-end (real DB) run not yet done, no MongoDB reachable in this environment** | New: `server/scripts/test-community-m4-unit.js` (mocked, run here — uses a real in-memory fixture + filter/sort/limit simulation, not hand-coded expected results), `server/scripts/test-community-feed.sh` (live-server, **not yet run**). New client: `client/src/features/community/ExplorePage.jsx` + `.css`, `PublicActivityCard.jsx` (reuses `ActivityCard.css`, no activity number, no author attribution yet — documented as a deliberate scope choice). Modified: `communityService.js` (+`listPublicFeed`, refactored a shared `paginatePublicActivities` cursor-pagination core used by both M3's profile-activities list and this feed; `scope=following` explicitly rejected with 400 rather than silently falling back to Explore, since Follow doesn't exist until M8), `communityController.js`/`community.routes.js` (+`GET /api/community/feed`), `navItems.js` (+Explore, removed the "intentionally absent" note — condition from `01_PRODUCT_SPEC.md` §6 is now met), `NavIcons.jsx` (+`ExploreIcon`), `client/src/App.jsx` (`/explore` in both trees — browsable while logged out). `npm run build` and `oxlint` clean. Mocked unit test — **9/9 passing**, including that private activities never appear regardless of type/wilaya filters, and that two consecutive cursor-paginated pages share zero activity ids (genuine pagination-correctness check, not just a shape check). Ran all four milestones' mocked tests together — **33/33 passing, no regressions**. **Action needed from product owner: run `bash server/scripts/test-community-feed.sh` against a real dev server** before this milestone is considered fully verified. Also worth a quick manual look: the bottom tab bar now has 6 items instead of 5 — should still fit via its existing flexible layout, but hasn't been visually confirmed on a narrow phone width. |
| M5 — Kudos | IMPLEMENTED — mocked unit test passing; **live end-to-end (real DB) run not yet done, no MongoDB reachable in this environment** | New: `server/src/models/Kudos.js` (unique `{activityId,userId}` index), `server/src/services/kudosService.js` (full give/remove consistency strategy from §4: idempotent duplicate handling, guarded atomic increment/decrement, compensating rollback on the visibility race, never-negative guard, self-kudos block, notification only on genuine first-time give), `server/src/controllers/kudosController.js`, `server/scripts/test-community-m5-unit.js` (mocked, run here — includes a genuine concurrent-give race simulation, not just sequential calls), `server/scripts/test-community-kudos.sh` (live-server, **not yet run**). Modified: `community.routes.js` (+`POST`/`DELETE /activities/:id/kudos`, gated by real `authenticate` stacked on the router's `optionalAuthenticate`), `communityService.js` (`getPublicActivityById` now takes an optional `viewerUserId` and attaches a per-viewer `hasKudos` field), `communityController.js` (passes `req.userId` through). New client: kudos give/remove wired into `PublicActivityDetail.jsx` (hidden for the activity's own owner, redirects to `/login` if a logged-out visitor clicks it), `community/api.js` (+`giveKudosRequest`/`removeKudosRequest`). Also fixed a self-introduced inconsistency: M4's `scope=following` rejection used HTTP 400, but the codebase's established convention (confirmed via a full grep) is 422 for validation-style rejections — corrected, and M4's test/shell script updated to match. `npm run build` and `oxlint` clean. Mocked unit test — **20/20 passing**, including the milestone's key concurrency property: two "concurrent" give requests from the same user (fired via `Promise.all`, racing through the same in-memory fixture) produce exactly one counter increment, not two. Ran all five milestones' mocked tests together — **53/53 passing, no regressions**. **Action needed from product owner: run `bash server/scripts/test-community-kudos.sh` against a real dev server** before this milestone is considered fully verified — a mocked concurrency test proves the *logic* is race-safe, but only a real run against MongoDB's actual unique-index enforcement confirms the database agrees. |
| M6 — Comments | IMPLEMENTED — mocked unit test passing; **live end-to-end (real DB) run not yet done, no MongoDB reachable in this environment** | New: `server/src/models/Comment.js`, `server/src/services/commentService.js` (write/read re-verify current activity visibility every time; `assertCanDeleteComment` helper matching the proposal's exact documented name; edit is author-only, delete is author-or-activity-owner, deliberately using 403 rather than a non-distinguishing 404 since a comment on a public activity is already publicly visible — documented reasoning for the departure from the private-resource 404 pattern), `server/src/validators/commentValidators.js`, `server/src/controllers/commentController.js`, `server/scripts/test-community-m6-unit.js` (mocked, run here), `server/scripts/test-community-comments.sh` (live-server, **not yet run**). New client: `CommentSection.jsx` + `.css`, embedded in `PublicActivityDetail.jsx`. Modified: `community.routes.js` (+4 comment routes, using `validateBody`/`validateQuery` — the established Zod convention that M2/M4/M5's query-param handling didn't follow; noting this now as a known small inconsistency worth a later pass, not fixed retroactively in this milestone), `communityService.js`'s comment DTO now populates and exposes the author's name/username (a comment with no visible author isn't usable — judged in-scope for this milestone, not a later nice-to-have, unlike the feed card's author-attribution deferral in M4). `npm run build` and `oxlint` clean. Mocked unit test — **17/17 passing**, including the one asymmetry worth double-checking by hand: the activity owner can *delete* a comment on their own activity but explicitly *cannot edit* it. Ran all six milestones' mocked tests together — **70/70 passing, no regressions**. **Action needed from product owner: run `bash server/scripts/test-community-comments.sh` against a real dev server** before this milestone is considered fully verified. |
| M7 — Reporting | IMPLEMENTED — mocked unit test passing; **live end-to-end (real DB) run not yet done, no MongoDB reachable in this environment** | New: `server/src/models/Report.js` (unique `{reporterUserId,targetType,targetId}` index — the real dedup enforcement, plus a `{status,createdAt}` index for ordered manual review), `server/src/services/reportService.js` (`createReport` — re-verifies the target is currently public exactly like `commentService`/`kudosService` already do; resolves ownership to the *comment's* author for `targetType:'comment'`, not the activity owner, so an activity owner can validly report a comment on their own activity; self-reporting blocked with 422; a duplicate insert is caught via the Mongo `11000` code and turned into a clean 409 `ALREADY_REPORTED` — **deliberately NOT idempotent like Kudos**, since a rejected duplicate is the documented M7 test-plan behavior), `server/src/validators/reportValidators.js` (`targetType` is never accepted from the request body — it's implied by which of the two routes was hit), `server/src/controllers/reportController.js`, `server/scripts/test-community-m7-unit.js` (mocked, run here), `server/scripts/test-community-reporting.sh` (live-server, **not yet run**). New client: `client/src/features/community/ReportButton.jsx` + `.css` (small self-contained inline form — no admin/review UI exists per the resolved §16 decision, so its only job is to file the report and confirm receipt). Modified: `community.routes.js` (+`POST /activities/:id/reports`, +`POST /comments/:commentId/reports`, both `authenticate`-gated like kudos/comments), `PublicActivityDetail.jsx` (Report action shown to any logged-in non-owner viewer), `CommentSection.jsx` (Report action shown for any comment that isn't the current user's own). `npm run build` and `oxlint` both clean on client and server. Mocked unit test — **16/16 passing**, including: self-report rejected for both target types, private/nonexistent target rejected (404), duplicate report rejected (409, not silently accepted), a second distinct reporter on the same target succeeds independently, and a comment's ownership resolution correctly points at the comment author (verified by having the *activity owner* successfully report a comment on their own public activity). Ran all seven milestones' mocked tests together — **86/86 passing, no regressions**. **Action needed from product owner: run `bash server/scripts/test-community-reporting.sh` against a real dev server** before this milestone is considered fully verified — same live-DB caveat as M2–M6. |
| M8 — Following | IMPLEMENTED — mocked unit test passing; **live end-to-end (real DB) run not yet done, no MongoDB reachable in this environment** | New: `server/src/models/Follow.js` (single unique `{followerId,followingId}` index, deliberately the only index — a `{followingId,createdAt}` index for a followers-list/count feature is explicitly deferred per §6, since neither feature exists), `server/src/services/followService.js` (`followUserByUsername` re-verifies `isPublicProfile` live; self-follow blocked 422; a duplicate follow is an **idempotent success**, not an error — a deliberate, documented departure from Report's duplicate-rejection behavior, since the target state is identical either way and nothing is lost, closer to Kudos's reasoning; `unfollowUserByUsername` is idempotent per the resolved edge case in §6 — an existing Follow relationship, and the ability to end it, survives the followed user's profile later going private), `server/src/controllers/followController.js`, `server/scripts/test-community-m8-unit.js` (mocked, run here), `server/scripts/test-community-follow.sh` (live-server, **not yet run**). New client: none new — reused `ReportButton`-adjacent patterns inline. Modified: `community.routes.js` (+`POST`/`DELETE /users/:username/follow`, `authenticate`-gated), `communityService.js` (`listPublicFeed` now genuinely implements `scope:'following'` — resolves the viewer's `followingId` list via `Follow.find`, then reuses the exact same `paginatePublicActivities` core as Explore with `userId:{$in:followingIds}` added, no new infrastructure per §9; `getPublicProfileByUsername` now attaches a per-viewer `isFollowing` flag, mirroring how M5 attached `hasKudos`), `communityController.js` (threads `req.userId` through both `getFeed` and `getProfile`), `client/src/features/community/api.js` (+`followUserRequest`/`unfollowUserRequest`), `PublicProfile.jsx` (+Follow/Unfollow button, hidden on your own profile, redirects to `/login` for anonymous visitors), `ExplorePage.jsx` (+Explore/Following scope tabs, tabs only shown to logged-in users). **Behavior change to a prior milestone, done deliberately as part of this one, not silently**: M4's `scope=following` rejection changes from a blanket 422 ("not available yet") to a real 401 when no viewer is authenticated (following now genuinely exists) — `test-community-m4-unit.js` updated in place to assert the new 401 for `scope=following` while confirming a still-422 for a genuinely unknown scope value like `"trending"`. `npm run build` and `oxlint` clean on client and server. Mocked unit test — **26/26 passing**, including: following a non-public-profile or nonexistent user rejected (404), self-follow rejected (422), following twice is idempotent (no second record, no second notification), unfollow is idempotent for both an already-unfollowed and a nonexistent target, and — the milestone's key feed-correctness property — a following-feed integration test proving the feed shows a followed user's public activity, never that same user's private activity, and never an unfollowed (but otherwise public) user's activity. Ran all eight milestones' mocked tests together — **113/113 passing, no regressions**. **Action needed from product owner: run `bash server/scripts/test-community-follow.sh` against a real dev server** before this milestone is considered fully verified. |
| M9 — Notifications Inbox | IMPLEMENTED — mocked unit test passing; **live end-to-end (real DB) run not yet done, no MongoDB reachable in this environment** | New: `server/src/services/notificationService.js` (`listNotifications` — cursor pagination matching the Notification model's own `{recipientUserId,createdAt:-1}` index, same shape as Community's `paginatePublicActivities`; `toNotificationDTO` resolves the actor and, for kudos/comment, the activity — **never visibility-filtered**, since the activity always belongs to the recipient themselves, so showing it to its own owner carries no privacy risk regardless of current visibility; a deleted actor or deleted activity renders a safe `null` fallback rather than erroring the whole inbox, per §8; `markAsRead`/`markAllAsRead`; `getUnreadCount`), `server/src/validators/notificationValidators.js`, `server/src/controllers/notificationController.js`, `server/src/routes/notification.routes.js` (mounted at `/api/notifications`, **unconditionally** `authenticate`-gated — unlike `community.routes.js`, never `optionalAuthenticate`, since an inbox has no meaning for a logged-out visitor and every route only ever touches the caller's own data, same contract as `activity.routes.js`), `server/scripts/test-community-m9-unit.js` (mocked, run here), `server/scripts/test-community-notifications.sh` (live-server, **not yet run**). New client: `client/src/features/notifications/` — `api.js`, `NotificationBell.jsx` + `.css` (polls unread count every 60s, no WebSocket/SSE introduced, matching §8's in-app-only/no-queue stance), `NotificationsPage.jsx` + `.css` (full inbox list, mark-one-read on click, mark-all-read button, cursor "load more", per-type human-readable sentence with the same actor/activity null-fallback the backend produces). Modified: `server/src/app.js` (mounted `/api/notifications`), `client/src/components/NavIcons.jsx` (+`BellIcon`), `client/src/layouts/Sidebar.jsx`/`.css` and `AppShell.jsx`/`.css` (bell+badge placed beside the wordmark in both the desktop sidebar and the mobile header — deliberately **not** added as a 7th bottom-tab-bar item, to avoid disturbing the already product-owner-confirmed 6-item tab bar), `client/src/App.jsx` (`/notifications` route, signed-in tree only). `npm run build` and `oxlint` clean on client and server. Mocked unit test — **19/19 passing**, including the milestone's two defining properties: (1) a notification belonging to a different user never appears in, and can never be marked read via, another user's inbox (404, non-distinguishing, same as any other owned resource) — "a user can only ever read their own notifications"; (2) a notification whose actor account was deleted, and separately one whose referenced activity was deleted, each render their respective safe `null` fallback rather than throwing, while an *intact* reference on the very same notification (e.g. actor present but activity deleted, or vice versa) still resolves normally — proving the two fallbacks are independent, not an all-or-nothing failure. Ran all nine milestones' mocked tests together — **139/139 passing, no regressions**. **Action needed from product owner: run `bash server/scripts/test-community-notifications.sh` against a real dev server** before this milestone is considered fully verified. |
| M10 — Cross-Feature Security Audit | NOT STARTED | |
| M11 — Polish | NOT STARTED | |

This table will be updated as each milestone is actually completed and verified — never marked done in advance.

**Landing page:**
**STATUS = PLANNED / NOT IMPLEMENTED.**
Confirmed by direct inspection: unauthenticated visitors currently see a bare login/register form (`client/src/App.jsx`'s `AuthGate`), with no explanation of what Cairn is. Approved as an independent milestone, sequenced before or alongside Community Foundation work — see `docs/08_COMMUNITY_PROPOSAL.md` §11 and its milestone M0.

See `docs/07_POST_V1_ROADMAP.md` (newly created 2026-09-09 — it was referenced by this file and by `HANDOVER.md` but had never actually been committed to the repository) for the consolidated post-V1 priority list including Community's status alongside the pre-existing Must Fix / Should Improve / V1.1 items.

---

## Files Changed at This Checkpoint (M8 — Following, M9 — Notifications Inbox)

**New (server, M8):**
- `server/src/models/Follow.js`
- `server/src/services/followService.js`
- `server/src/controllers/followController.js`
- `server/scripts/test-community-m8-unit.js` (mocked, run — 26/26 passing)
- `server/scripts/test-community-follow.sh` (live-server, **not yet run**)

**New (server, M9):**
- `server/src/services/notificationService.js`
- `server/src/validators/notificationValidators.js`
- `server/src/controllers/notificationController.js`
- `server/src/routes/notification.routes.js`
- `server/scripts/test-community-m9-unit.js` (mocked, run — 19/19 passing)
- `server/scripts/test-community-notifications.sh` (live-server, **not yet run**)

**New (client):**
- `client/src/features/notifications/api.js`
- `client/src/features/notifications/NotificationBell.jsx` + `.css`
- `client/src/features/notifications/NotificationsPage.jsx` + `.css`

**Modified:**
- `server/src/routes/community.routes.js` — `+POST`/`DELETE /users/:username/follow`
- `server/src/services/communityService.js` — `listPublicFeed` now implements `scope:'following'` for real; `getPublicProfileByUsername` attaches per-viewer `isFollowing`
- `server/src/controllers/communityController.js` — threads `req.userId` through `getFeed`/`getProfile`
- `server/src/app.js` — mounted `/api/notifications`
- `server/scripts/test-community-m4-unit.js` — updated in place: `scope=following` with no viewer now asserts 401 (real feature), not 422; a genuinely unknown scope still asserts 422
- `client/src/features/community/api.js` — `+followUserRequest`, `+unfollowUserRequest`
- `client/src/features/community/PublicProfile.jsx` — Follow/Unfollow button
- `client/src/features/community/ExplorePage.jsx` — Explore/Following scope tabs
- `client/src/components/NavIcons.jsx` — `+BellIcon`
- `client/src/layouts/Sidebar.jsx`/`.css`, `AppShell.jsx`/`.css` — notification bell + badge
- `client/src/App.jsx` — `+/notifications` route (signed-in tree only)
- `docs/PROGRESS.md` — this file, M8/M9 rows updated
- `docs/HANDOVER.md` — current state and next-step sections updated for M10

**Verification performed this checkpoint:**
- `node scripts/test-community-m8-unit.js` — 26/26 passing
- `node scripts/test-community-m9-unit.js` — 19/19 passing
- Re-ran `test-community-foundation.js` + `test-community-m2-unit.js` through `test-community-m7-unit.js` (M4's updated for the `scope=following` behavior change) — all still passing
- **139/139 mocked checks passing across all nine milestone test files combined, no regressions**
- `npm run build` (client) — clean
- `npx oxlint` (client all new/modified files, server all new/modified files) — clean, 0 warnings
- `node --input-type=module -e "import('./src/app.js')..."` — confirms the full app (including the newly-mounted `/api/notifications` router) boots without import errors
- `server/scripts/test-community-follow.sh` and `test-community-notifications.sh` were written but **not run** — no live MongoDB in this environment, same limitation as every prior milestone's `.sh` script

---

## Last Handover

A formal handover was produced at the V1-completion checkpoint — see **`docs/HANDOVER.md`**. That handover has now been updated in place to reflect M8 and M9's completion and to hand off M10 (Cross-Feature Security Audit) as the immediate next task.
