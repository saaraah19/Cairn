# Cairn — Project Progress

## Current Status

Overall progress: ~66%
Current phase: Phase 5 — Planned Activities
Current milestone: Phase 5 — Planned Activities (COMPLETE)
Status: IMPLEMENTED — pending your live-DB verification and browser review
Last updated: 2026-08-31

## Summary

Application code: Phase 0-4 (fully verified by you) + Phase 5 Planned Activities implemented
Frontend: Planned Activities list (status filter) now live in My Outdoors' "Planned" tab, create/edit form, detail page with the full "Log this activity" completion flow
Backend: PlannedActivity CRUD with ownership enforcement, a dedicated completion-linking endpoint, shared ownership-check utilities (refactored out of activityService for reuse)
Database: Connected (your Atlas cluster) — new PlannedActivity collection
Authentication/Activities/Photos/Gear: Unchanged, all previously verified
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
| **Planned Activities (Phase 5)** | **IMPLEMENTED** | CRUD, list, form, detail, and the full completion flow (plan → pre-filled Activity form → linked + marked complete) all built. Validation/auth verified live. DB-backed happy path and browser review both need you. |
| Database | IMPLEMENTED | Added `PlannedActivity` collection this phase. |
| Backend | IN PROGRESS | Auth + Activities + Photos + Gear + Planned Activities + lightweight Groups/Companions done. Pack My Bag, Destinations, Statistics not started. |
| Frontend | IN PROGRESS | Shell + auth + Activities + Gear + Planned Activities done. |
| Planning | **DONE** | |
| Gear | DONE | |
| Backpack (Pack My Bag) | NOT STARTED | `PlannedActivity.packedGearItemIds` reserved on the schema, no UI yet — Phase 6. |
| Destinations | NOT STARTED | |
| Statistics | NOT STARTED | |
| Profile | IN PROGRESS | Unchanged (read-only) since Phase 2. |
| Testing | IN PROGRESS | Manual only. |
| Mobile/Responsive | IMPLEMENTED (Phase 2 shell) | Planned Activities pages reuse the same responsive components as Activities/Gear; not checked on an actual device yet. |
| Deployment | NOT STARTED | |

## Completed

- Phases 0-4 (fully verified working by you).
- **Phase 5 — Planned Activities:**
  - **Backend:**
    - `PlannedActivity` model (`server/src/models/PlannedActivity.js`) per the data model doc §23-26 — `packedGearItemIds` reserved (unexposed) for Phase 6, `completedActivityId` links to a separately-created `Activity` rather than transforming the plan document itself, per §25's explicit instruction.
    - **Shared ownership-check utilities extracted** (`server/src/utils/ownershipChecks.js`): `assertGroupOwnership`, `assertGearOwnership`, and `assertDestinationIdFormat` were previously local to `activityService.js` — pulled out so `plannedActivityService.js` could reuse them without duplicating the same logic. `activityService.js` now imports from the shared module; behavior is unchanged, verified via the full regression pass.
    - `plannedActivityService.js`: CRUD with the same always-404 ownership pattern as activities/gear, status filtering, sort by soonest `plannedDate` first. **`completePlannedActivity`**: verifies the activity being linked actually belongs to the same user (never trusts a client-supplied ID pairing), sets `status → completed` and `completedActivityId`, and — critically — never overwrites the plan's own fields, so the original `plannedDate`/estimated values remain visible as historical planning context even after the real activity records different actuals.
    - Deleting a plan does **not** delete its linked `Activity` — the completed activity is permanent history independent of the plan, per `02_TECHNICAL_ARCHITECTURE.md` §17.
    - Routes: `GET/POST /api/planned-activities`, `GET/PATCH/DELETE /api/planned-activities/:id`, `POST /api/planned-activities/:id/complete`.
    - `server/scripts/test-planned-activity-flow.sh` — 10 steps covering the full plan→activity→complete flow, confirming the plan's original data survives completion, cross-user rejection on the complete endpoint, and that deleting a plan doesn't cascade to its linked activity.
  - **Frontend:**
    - `PlannedActivitiesList.jsx`/`PlannedActivityCard.jsx` — reuses the Activities/Gear list toolbar and grid styling for visual consistency, adds a status badge (color-coded: planned/ready/completed/cancelled).
    - `PlannedActivityForm.jsx` — reuses `ActivityForm.css`, same Group/Companion autocomplete pattern as the activity form. Status dropdown intentionally **excludes "completed"** as a manually-selectable option — completion should only happen through the linking flow, so `completedActivityId` never ends up unset on a "completed" plan.
    - `PlannedActivityDetail.jsx` — the **"Log this activity" button** is the actual point of this phase: it navigates to the existing Activity creation form with the plan's known info pre-filled (`state` passed via React Router, not a URL param, so nothing sensitive leaks into the address bar) and an editable `plannedActivityId` reference. `ActivityForm.jsx` was extended to accept this prefill and, on successful save, automatically calls the complete-linking endpoint — the user just fills out the form as normal and everything connects behind the scenes.
    - `MyOutdoorsPage`'s "Planned" tab now renders the real list instead of the "coming soon" placeholder from Phase 2/3.

## In Progress

Nothing actively in progress. Phase 5 is implemented and awaiting your live-DB verification + browser review.

## Remaining

- **Immediate**: run `server/scripts/test-planned-activity-flow.sh`; try the full flow in the browser — plan something, open it, click "Log this activity," confirm the form arrives pre-filled, save it, and check the plan now shows "Completed as #N [name]" linking back to the real activity
- Phase 6 — Pack My Bag (now unblocked — depends on Planned Activities existing, which it now does)
- Phase 7 through Phase 12 — per `04_DEVELOPMENT_ROADMAP.md`

## Known Issues

- **DB-backed plan→activity→complete flow not yet verified by you.** Same sandbox limitation as every prior phase. Everything not requiring a live DB write was verified: auth-guarding on every new endpoint, all validation-error paths (missing `plannedDate`, bad `status` enum on both create and list-filter, missing `activityId` on complete). The actual create→list→complete→verify-plan-preserved→delete-without-cascading flow needs your run. Script provided.
- Not yet visually reviewed in a browser (same standing caveat since Phase 2) — the "Log this activity" flow in particular is worth checking closely since it's the most involved cross-page interaction built so far.
- No automated test suite yet.

## Technical Decisions

- **Ownership-check utilities refactored into a shared module** rather than adding a third near-duplicate copy in `plannedActivityService.js` — a pure internal cleanup, no behavior change, verified via regression testing.
- **"Completed" excluded from the manual status dropdown** in the plan edit form — completion should only happen via the "Log this activity" linking flow, to guarantee `completedActivityId` is always set whenever `status === 'completed'`. This wasn't explicitly specified in the docs but felt like an important invariant to protect.
- **Prefill data passed via React Router navigation `state`**, not URL query params — keeps the plan's details out of the browser history/address bar, and avoids re-parsing/encoding structured data through a URL.
- **Deliberately not touched**: Home page still doesn't surface "upcoming planned activity" (mentioned in the product spec's Home section) — that's Home-dashboard polish, not something the roadmap's Phase 5 done-when criteria requires, so I left it out to stay within phase scope. Flagging as a nice future addition, not forgotten.

Open decisions for upcoming phases: none currently.

## Files / Areas Recently Changed

**Backend — new:**
`models/PlannedActivity.js`, `validators/plannedActivityValidators.js`, `services/plannedActivityService.js`, `controllers/plannedActivityController.js`, `routes/plannedActivity.routes.js`, `utils/ownershipChecks.js`, `scripts/test-planned-activity-flow.sh`

**Backend — modified:**
`app.js` (mounted planned-activity routes), `services/activityService.js` (imports shared ownership checks instead of local copies — no behavior change)

**Frontend — new:**
`features/plannedActivities/` — `api.js`, `formatters.js`, `PlannedActivityCard.jsx/css`, `PlannedActivitiesList.jsx`, `PlannedActivityForm.jsx`, `PlannedActivityDetail.jsx`, `PlannedActivityCreatePage.jsx`, `PlannedActivityEditPage.jsx`

**Frontend — modified:**
`App.jsx` (planned-activity routes, ordered before the activity `:id` routes so the static `planned` segment wins), `pages/MyOutdoorsPage.jsx` (Planned tab now live), `features/activities/ActivityForm.jsx` (accepts prefill + links plan on save), `features/activities/ActivityCreatePage.jsx` (reads prefill from navigation state)

## Verification

Build: `client` — `npm run build` succeeds (verified).
Lint: `client` — `npx oxlint` → 0 warnings, 0 errors across 50 files (verified — clean on the first pass this time, the derived-loading-state pattern from Phases 3-4 was applied consistently from the start).
Backend: all files pass `node --check`; app assembles cleanly with planned-activity routes mounted (verified).
Manual verification (live, this session):
- Full regression pass: health, auth `/me`, activity validation, gear validation, planned-activities auth-guard — all still correct after the ownership-checks refactor
- Every new endpoint correctly returns `401` without authentication
- Planned-activity validation: missing `plannedDate`, invalid `status` enum (on both create and list-filter), missing `activityId` on the complete endpoint — all correct `422`s

Not yet verified (requires your live database): actual plan CRUD, the complete-linking flow, confirmation that the plan's original data survives completion unmodified, cross-user rejection on the complete endpoint, and that deleting a plan doesn't cascade-delete its linked activity. Script provided: `server/scripts/test-planned-activity-flow.sh`. Also not yet verified: the "Log this activity" cross-page flow in an actual browser.

## Next Recommended Step

1. Pull this update, `npm install` in `server/` if needed (no new dependencies this phase)
2. Run `bash scripts/test-planned-activity-flow.sh` from `server/` against your live database
3. In the browser: create a plan, check it shows in My Outdoors → Planned, open it, click "Log this activity," confirm the form arrives pre-filled with the plan's info, save with some changed details, and verify the plan now shows "Completed as #N" linking to the real activity
4. Report back — then we start **Phase 6 — Pack My Bag**

## Last Handover

No prior handover — continuing directly within the same conversation from Phase 4.
