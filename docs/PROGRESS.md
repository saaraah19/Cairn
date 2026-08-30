# Cairn — Project Progress

## Current Status

Overall progress: ~42%
Current phase: Phase 3 — Activities
Current milestone: Phase 3 — Activities (core CRUD + list + detail + form; photos deferred)
Status: IMPLEMENTED — pending your live-DB verification and browser review
Last updated: 2026-08-29

## Summary

Application code: Phase 0-2 (unchanged, verified) + Phase 3 core Activities implemented
Frontend: Full activity list (search/filter/sort/pagination), sectioned create/edit form, detail page with delete confirmation, all wired into My Outdoors
Backend: Activity CRUD API with ownership enforcement, atomic per-user numbering, lightweight Group/Companion support for the People section
Database: Connected (your Atlas cluster) — schema/indexes defined, live CRUD not yet verified by you this phase
Authentication: Unchanged, verified working
Cloudinary: Not configured — activity photos deliberately deferred, see "Remaining"
Testing: Manual (validation paths + regressions verified live; DB-backed happy path needs your run)
Deployment: Not implemented

## Milestone Status

| Area | Status | Notes |
|---|---|---|
| Product foundation (docs) | IMPLEMENTED | |
| Project scaffold (Phase 0) | IMPLEMENTED | |
| Authentication (Phase 1) | VERIFIED | |
| Application Shell (Phase 2) | VERIFIED | You confirmed "love it." |
| **Activities (Phase 3)** | **IMPLEMENTED** | Core CRUD, list, detail, form all built. Validation and auth-guarding verified live. DB-backed happy path and visual review both need you — see "Next Recommended Step". **Photos not yet built** (needs your Cloudinary credentials). |
| Database | IMPLEMENTED | Activity/Group/Companion/Counter collections and indexes defined. |
| Backend | IN PROGRESS | Auth + Activities + lightweight Groups/Companions done. Gear, Planned Activities, Destinations, Statistics not started. |
| Frontend | IN PROGRESS | Shell + auth + Activities done. My Outdoors now has working Activities tab; Planned/Destinations tabs show honest "coming soon" states (not fake data). |
| Planning | NOT STARTED | |
| Gear | NOT STARTED | `Activity.gearItemIds` field reserved on the schema, no UI yet — Phase 4. |
| Backpack (Pack My Bag) | NOT STARTED | |
| Destinations | NOT STARTED | `Activity.destinationId` field reserved, format-validated but not ownership-checked yet (Destination model doesn't exist until Phase 7) — see Known Issues. |
| Statistics | NOT STARTED | |
| Profile | IN PROGRESS | Unchanged from Phase 2 (read-only). |
| Testing | IN PROGRESS | Manual only. |
| Mobile/Responsive | IMPLEMENTED (Phase 2 shell) | Activity list/form/detail use the same responsive shell; not yet checked on an actual small screen. |
| Deployment | NOT STARTED | |

## Completed

- Phases 0-2 (unchanged; all verified working by you).
- **Phase 3 — Activities (core, no photos yet):**
  - **Backend:**
    - `Counter` model (`server/src/models/Counter.js`) — atomic per-user sequence numbers via `findOneAndUpdate` + `$inc`, avoiding race conditions without needing a multi-document transaction (per `02_TECHNICAL_ARCHITECTURE.md` §12).
    - `Activity` model (`server/src/models/Activity.js`) — full schema per the data model doc: location, trail, conditions, social, review, visibility, plus `gearItemIds` and `coverPhotoId` reserved for later phases. Only `name`/`type`/`date` required, everything else optional (supports both quick and detailed logging with one model, per §7).
    - `Group` and `Companion` models — lightweight, user-owned, name-only, with unique-per-user indexes. Added because Phase 3's activity fields explicitly include "Group" and "Companions" (roadmap §7), even though these aren't their own roadmap phase.
    - Zod validators for create/update (partial) and list-query (page/limit/search/type/difficulty/wilaya/group/date-range/sort).
    - `activityService.js`: ownership-verified `groupId` attachment (rejects another user's group with 403), format-checked `destinationId` (full ownership check deferred — see Known Issues), atomic numbering on create, deep-merge on partial update (so patching just `trail.distanceKm` doesn't wipe sibling trail fields), and a `getOwnedActivity` helper that always 404s rather than leaking existence to other users.
    - `POST/GET/PATCH/DELETE /api/activities`, `/api/activities/:id`, plus `/api/groups` and `/api/companions` (list/create/delete).
    - **Shared improvement**: `errorHandler.js` now converts malformed MongoDB ObjectIds (e.g. `GET /api/activities/not-an-id`) and duplicate-key errors into clean 404/409 responses instead of leaking a raw 500 — benefits every future resource, not just Activities.
    - `server/scripts/test-activity-flow.sh` — an 11-step script covering create (full + minimal), list, get-with-populated-group, partial-update-preserves-siblings, cross-user-group-rejection, delete, post-delete-404, and non-reused numbering.
  - **Frontend** (`features/activities/`):
    - `ActivitiesList.jsx` — cards, search, type filter, sort (newest/oldest/distance/rating/elevation), pagination.
    - `ActivityCard.jsx` — per the UX spec's card example (number, name, date, place, type, quick stats).
    - `ActivityForm.jsx` — sectioned per `03_UX_DESIGN_SPEC.md` §20 (Activity / Trail / Conditions / Review / Visibility — Gear and Photos sections intentionally absent, per the phase-3 slicing plan). Group field with autocomplete + create-on-the-fly; Companions as a comma-separated field with autocomplete suggestions, persisted as reusable `Companion` records in the background.
    - `ActivityDetail.jsx` — stat tiles, conditions, "who I went with," cost, rating, notes, edit/delete with a confirmation dialog naming the specific activity.
    - `MyOutdoorsPage` rewritten with tabs: Activities (functional), Planned/Destinations (honest "coming soon" empty states, not fabricated placeholder data).
    - `HomePage`'s "Log an activity" button now links to the real flow instead of being disabled.

## In Progress

Nothing actively in progress. Phase 3 core is implemented and awaiting your live-DB verification + browser review before we tackle photos.

## Remaining

- **Immediate**: run `server/scripts/test-activity-flow.sh` against your live database; try the full flow in the browser (create, edit, delete, search/filter/sort, pagination)
- **Activity Photos** (still Phase 3, deliberately split off): needs your Cloudinary credentials (cloud name, API key, API secret) — same pattern as the Google OAuth pause point. Once you have them, I'll build upload/multiple-photos/cover-photo/remove-photo.
- Phase 4 — Gear (and the deferred Gear ↔ Activity selection UI)
- Phase 5 through Phase 12 — per `04_DEVELOPMENT_ROADMAP.md`

## Known Issues

- **DB-backed activity CRUD not yet verified by you.** Everything not requiring a live DB write was verified live in this session: all validation-error paths (missing name/date, bad enums, limit/sort bounds), auth-guarding on every new endpoint (401 without a session), and the new CastError→404 handling. The actual create→list→get→update→delete flow against a real database needs your run — script provided.
- **`destinationId` ownership is not yet enforced** — only its format is validated. Full cross-user ownership checking (matching what `groupId` already has) can't be added until the `Destination` model exists in Phase 7. Not a live risk right now since there's no UI anywhere to attach a destination yet, but flagging it as a deliberate, temporary gap rather than an oversight.
- **Not visually reviewed in a browser** — same caveat as Phase 2. Please check the activity list/form/detail on both desktop and mobile widths.
- No automated test suite yet.

## Technical Decisions

- **Photos split off Phase 3 into its own pause point**, mirroring how Google OAuth was handled in Phase 1 — needs your Cloudinary credentials before it can be built or tested.
- **Group/Companion models added**, even though they're not their own roadmap phase, because Phase 3's activity fields explicitly require them. Kept deliberately minimal (name-only, list/create/delete) — no dedicated management UI, just inline autocomplete-and-create-on-the-fly from the activity form, matching `05_DATA_MODEL_AND_API_CONTRACT.md` §17-18's "lightweight" framing.
- **Weather enum**: `sunny/cloudy/rainy/windy/snowy/foggy/other` — my assumption, flagged in the Phase 3 kickoff; the data model doc doesn't pin exact values.
- **Trail condition enum**: `dry/muddy/wet/snowy/rocky/other` — same kind of assumption.
- **Activity numbering**: atomic counter via `findOneAndUpdate`/`$inc` rather than a MongoDB transaction — simpler, and sufficient since it's a single-document atomic operation (per `02_TECHNICAL_ARCHITECTURE.md` §39: "avoid transactions where a single atomic update is sufficient").
- **Partial-update merge strategy**: nested objects (`trail`, `conditions`, `location`, etc.) are deep-merged rather than replaced wholesale on `PATCH`, so sending just `{"trail":{"distanceKm":13.1}}` doesn't erase `difficulty` or `elevationGainM` set earlier. This wasn't explicitly specified in the docs — flagging as my judgment call, verified by step 7 of the test script.
- **Malformed-ObjectId and duplicate-key handling** centralized in `errorHandler.js` rather than repeated per-service — a general improvement that will benefit Gear, Destinations, etc. too.

Open decisions for upcoming phases (not yet made): none currently — the numbering-concurrency question from earlier phases is now resolved (see above).

## Files / Areas Recently Changed

**Backend — new:**
`models/Counter.js`, `models/Activity.js`, `models/Group.js`, `models/Companion.js`, `validators/activityValidators.js`, `validators/nameValidators.js`, `services/activityService.js`, `services/groupService.js`, `services/companionService.js`, `controllers/activityController.js`, `controllers/groupController.js`, `controllers/companionController.js`, `routes/activity.routes.js`, `routes/group.routes.js`, `routes/companion.routes.js`, `scripts/test-activity-flow.sh`

**Backend — modified:**
`middleware/validate.js` (added `validateQuery`), `middleware/errorHandler.js` (CastError/duplicate-key handling), `app.js` (mounted new routes)

**Frontend — new:**
`features/activities/` — `api.js`, `formatters.js`, `ActivityCard.jsx/css`, `ActivitiesList.jsx/css`, `ActivityForm.jsx/css`, `ActivityDetail.jsx/css`, `ActivityCreatePage.jsx`, `ActivityEditPage.jsx`, `pageWrapper.css`

**Frontend — modified:**
`App.jsx` (new routes), `pages/MyOutdoorsPage.jsx/css` (tabs), `pages/HomePage.jsx` (working CTA link)

## Verification

Build: `client` — `npm run build` succeeds (verified).
Lint: `client` — `npx oxlint` → 0 warnings, 0 errors across 32 files (verified — including fixing two `set-state-in-effect` warnings by refactoring to a derived-loading-state pattern rather than suppressing them).
Backend: all files pass `node --check`; app assembles with all new routes mounted (verified).
Manual verification (live, this session):
- Regression pass: health, auth `/me`, register validation, Google-not-configured — all still correct after `errorHandler.js` changes
- Every new endpoint correctly returns `401` without authentication (activities list/create, groups, companions)
- All activity validation paths tested via a forged dev-secret JWT (bypasses auth without needing a DB user, since validation runs before any DB call): missing `date`, invalid `type` enum, invalid `difficulty` enum, `limit` over max, invalid `sort` value, missing group `name` — all correct `422`s
- Malformed activity ID now correctly returns `404` (previously would have been a raw `500`) — verified

Not yet verified (requires your live database): the actual create→list→get→update→delete flow, group-name population on activity detail, partial-update sibling-field preservation, cross-user group-attachment rejection, activity-number non-reuse after deletion. Script provided: `server/scripts/test-activity-flow.sh`. Also not yet verified: how any of this actually looks/feels in a browser.

## Next Recommended Step

1. Pull this update, `npm install` in `server/` (no new dependencies this phase)
2. Run `bash scripts/test-activity-flow.sh` from `server/` against your live database
3. In the browser: log an activity (try both a quick minimal log and a fully detailed one), check it appears in My Outdoors, search/filter/sort the list, open the detail page, edit it, delete it with the confirmation dialog
4. When you're ready for photos, get your Cloudinary credentials (cloud name, API key, API secret from cloudinary.com) and I'll wire up upload/cover-photo/remove — same pattern as Google OAuth
5. Or, if you'd rather defer photos further and move on, we can start **Phase 4 — Gear** instead and circle back

## Last Handover

No prior handover — continuing directly within the same conversation from Phase 2.
