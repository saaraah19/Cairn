# Cairn — Project Progress

## Current Status

Overall progress: ~78%
Current phase: Phase 7 — Destinations
Current milestone: Phase 7 — Destinations (COMPLETE)
Status: IMPLEMENTED — pending your live-DB verification and browser review
Last updated: 2026-09-01

## Summary

Application code: Phase 0-6 (fully verified by you) + Phase 7 Destinations implemented
Frontend: Destinations list/form/detail with cover image and a "related activities & plans" view; destination selection now available on both the Activity and Planned Activity forms
Backend: Destination CRUD with cover-image upload (reusing the Cloudinary pipeline again), plus an important upgrade — `destinationId` ownership is now fully verified on Activities and Planned Activities (previously format-only, a gap flagged since Phase 3)
Database: Connected (your Atlas cluster) — new Destination collection
Authentication/Activities/Photos/Gear/Planned Activities/Pack My Bag: Unchanged, all previously verified
Testing: Manual — validation/auth-guarding verified live; DB-backed happy path needs your run

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
| **Destinations (Phase 7)** | **IMPLEMENTED** | CRUD, cover image, related-records view, and destination selection on both activity forms all built. `destinationId` ownership check upgraded from format-only to real verification. Validation/auth verified live. DB-backed happy path and browser review both need you. |
| Database | IMPLEMENTED | Added `Destination` collection this phase. |
| Backend | IN PROGRESS | Auth + Activities + Photos + Gear + Planned Activities + Pack My Bag + Destinations + lightweight Groups/Companions done. Statistics not started. |
| Frontend | IN PROGRESS | Shell + auth + Activities + Gear + Planned Activities + Pack My Bag + Destinations done. |
| Planning | DONE | |
| Gear | DONE | |
| Backpack (Pack My Bag) | DONE | |
| Destinations | **DONE** | |
| Statistics | NOT STARTED | Next and final major product phase before Profile/Data Management/Polish. |
| Profile | IN PROGRESS | Unchanged (read-only) since Phase 2. |
| Testing | IN PROGRESS | Manual only. |
| Mobile/Responsive | IMPLEMENTED (Phase 2 shell) | Destination pages reuse the same responsive components as Gear/Activities; not checked on an actual device yet. |
| Deployment | NOT STARTED | |

## Completed

- Phases 0-6 (fully verified working by you).
- **Phase 7 — Destinations:**
  - **Backend:**
    - `Destination` model (`server/src/models/Destination.js`) per the data model doc §27-28 — kept genuinely independent of `PlannedActivity`, with its own `status` (`wishlist/planned/visited`, per `02_TECHNICAL_ARCHITECTURE.md` §18), `targetDate`, `description`, `notes`, a single `coverImage` (same Cloudinary metadata pattern as `GearItem.photo`), and a `links` array (plain URL strings).
    - **Closed a gap flagged since Phase 3**: `assertDestinationIdFormat` (which only checked the string *looked like* a valid ID) is now `assertDestinationOwnership` in the shared `ownershipChecks.js` — a real database check that a referenced destination actually belongs to the authenticated user, exactly mirroring how group/gear ownership already worked. Both `activityService.js` and `plannedActivityService.js` were updated to use it (now `await`ed, since the check is genuinely async). Verified via full regression pass that nothing broke.
    - `destinationService.js`: CRUD with the standard always-404 ownership pattern, cover-image upload/replace/remove (reusing `uploadBufferToCloudinary`, the same helper shared with gear and activity photos), and `getDestinationRelated` — a derived query (never stored) returning every Activity *and* PlannedActivity that references this destination, mirroring the gear-usage-history pattern from Phase 4.
    - **Deliberate non-cascade on delete**: unlike gear deletion (which `$pull`s dangling references out of activities), deleting a Destination does *not* clear `destinationId` from activities/plans that reference it. A past activity's record of "I went to X" stays meaningful even if the saved Destination entry is later removed. The docs don't specify either way — flagged as a judgment call, differing intentionally from the gear-deletion precedent.
    - Routes: `GET/POST /api/destinations`, `GET/PATCH/DELETE /api/destinations/:id`, `GET /api/destinations/:id/related`, `POST/DELETE /api/destinations/:id/cover-image`.
    - `server/scripts/test-destination-flow.sh` — 10 steps, including explicit tests that cross-user destination attachment is now rejected on *both* Activities and Planned Activities (the actual point of the ownership-check upgrade).
  - **Frontend:**
    - `DestinationList.jsx`/`DestinationCard.jsx` — same list/toolbar/pagination pattern as Activities/Gear/Planned Activities, status badge reusing `PlannedActivityCard.css`'s badge style for visual consistency across the app.
    - `DestinationForm.jsx` — links entered one-per-line in a textarea, split into an array on submit (same pattern as companions being comma-separated).
    - `DestinationDetail.jsx` — cover image management (identical UX to gear's single-photo pattern), and a "Related activities & plans" section listing everything that references this destination.
    - `MyOutdoorsPage`'s "Destinations" tab now renders the real list instead of the Phase 2/3 placeholder — **all three My Outdoors tabs are now fully functional**.
    - Both `ActivityForm.jsx` and `PlannedActivityForm.jsx` gained a "Saved destination" dropdown (optional, defaults to "None"), and both detail pages now show a link to the linked destination when one is set.

## In Progress

Nothing actively in progress. Phase 7 is implemented and awaiting your live-DB verification + browser review.

## Remaining

- **Immediate**: run `server/scripts/test-destination-flow.sh`; try it in the browser — save a destination, attach it to an activity and a plan, open the destination and check "Related activities & plans" shows both
- **Phase 8 — Statistics** — the last major product-feature phase before Profile/Data Management/Polish/Testing/Deployment round out V1

## Known Issues

- **DB-backed destination flow not yet verified by you.** Same sandbox limitation as every prior phase. Everything not requiring a live DB write was verified: auth-guarding on every new endpoint, all validation-error paths (missing name, bad status enum on create and list-filter), and a full regression pass confirming the destinationId ownership-check upgrade didn't break Activities or Planned Activities. The actual create→attach-to-activity-and-plan→verify-related→cross-user-rejection→delete-without-cascading flow needs your run. Script provided.
- Not yet visually reviewed in a browser (same standing caveat since Phase 2).
- No automated test suite yet.

## Technical Decisions

- **`destinationId` ownership upgraded from format-check to real verification** — this was explicitly flagged as a temporary, deliberate gap in both the Phase 3 and Phase 5 progress notes ("destinationId ownership cannot be verified yet — the Destination model doesn't exist"). Closing it was the natural first task of this phase.
- **No cascade-cleanup on destination deletion** — deliberately different from gear deletion's behavior (Phase 4), since a historical activity's connection to a place feels like it should persist even if the saved Destination record is later removed. Flagged as a judgment call, not something the docs specify.
- **Links stored as plain URL strings**, not `{label, url}` objects — the data model doc just says "links" plural with no further structure specified; kept it simple.

Open decisions for upcoming phases: none currently.

## Files / Areas Recently Changed

**Backend — new:**
`models/Destination.js`, `validators/destinationValidators.js`, `services/destinationService.js`, `controllers/destinationController.js`, `routes/destination.routes.js`, `scripts/test-destination-flow.sh`

**Backend — modified:**
`app.js` (mounted destination routes), `utils/ownershipChecks.js` (`assertDestinationIdFormat` → `assertDestinationOwnership`, now genuinely async), `services/activityService.js` + `services/plannedActivityService.js` (awaited the upgraded check, populate `destinationId` on single-record fetch)

**Frontend — new:**
`features/destinations/` — `api.js`, `formatters.js`, `DestinationCard.jsx/css`, `DestinationList.jsx`, `DestinationForm.jsx`, `DestinationDetail.jsx`, `DestinationCreatePage.jsx`, `DestinationEditPage.jsx`

**Frontend — modified:**
`App.jsx` (destination routes), `pages/MyOutdoorsPage.jsx` (Destinations tab now live), `features/activities/ActivityForm.jsx/Detail.jsx` (destination selection + display), `features/plannedActivities/PlannedActivityForm.jsx/Detail.jsx` (destination selection + display, carried through the "Log this activity" prefill)

## Verification

Build: `client` — `npm run build` succeeds (verified).
Lint: `client` — `npx oxlint` → 0 warnings, 0 errors across 59 files (verified — clean on the first pass).
Backend: all files pass `node --check`; app assembles cleanly with destination routes mounted and the upgraded async ownership check wired in correctly (verified).
Manual verification (live, this session):
- Full regression pass: health, auth `/me`, activity validation, gear validation, planned-activity validation, destinations auth-guard — all still correct after the ownership-check upgrade (the highest-risk change this phase, since it touched two existing services)
- Every new destination endpoint correctly returns `401` without authentication
- Destination validation: missing name, invalid status enum (on both create and list-filter) — all correct `422`s

Not yet verified (requires your live database): actual destination CRUD, cross-user rejection specifically on the new ownership check (both from Activities and Planned Activities), the related-records query, and non-cascading deletion. Script provided: `server/scripts/test-destination-flow.sh`. Also not yet verified: how any of this looks/feels in a browser.

## Next Recommended Step

1. Pull this update, `npm install` in `server/` if needed (no new dependencies this phase)
2. Run `bash scripts/test-destination-flow.sh` from `server/` against your live database
3. In the browser: add a destination, use it on both an activity and a plan, open the destination and confirm "Related activities & plans" shows both, add a cover image, then check the My Outdoors "Destinations" tab
4. Report back — then we start **Phase 8 — Statistics**

## Last Handover

No prior handover — continuing directly within the same conversation from Phase 6.
