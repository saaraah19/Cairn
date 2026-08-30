# Cairn — Project Progress

## Current Status

Overall progress: ~48%
Current phase: Phase 3 — Activities
Current milestone: Phase 3 — Activities (COMPLETE, including photos)
Status: IMPLEMENTED — pending your Cloudinary credentials + live verification
Last updated: 2026-08-30

## Summary

Application code: Phase 0-2 (verified) + Phase 3 fully complete, including Cloudinary photo uploads
Frontend: Activity list/form/detail (Phase 3 core, verified by you) + photo gallery (upload, cover selection, remove) on the detail page; real cover photos now shown on cards and hero
Backend: Activity CRUD (verified by you) + Photo model/service/routes wired to Cloudinary, with graceful degradation when unconfigured
Database: Connected (your Atlas cluster)
Authentication: Unchanged, verified
Cloudinary: **Not yet configured on your end** — you have credentials, need to add them to `server/.env`. Everything is built and ready.
Testing: Manual — validation/auth/degradation paths verified live; actual Cloudinary upload flow needs your credentials to test
Deployment: Not implemented

## Milestone Status

| Area | Status | Notes |
|---|---|---|
| Product foundation (docs) | IMPLEMENTED | |
| Project scaffold (Phase 0) | IMPLEMENTED | |
| Authentication (Phase 1) | VERIFIED | |
| Application Shell (Phase 2) | VERIFIED | |
| **Activities (Phase 3)** | **IMPLEMENTED — core VERIFIED by you, photos pending your Cloudinary setup** | CRUD/list/detail/form confirmed working. Photo upload/cover/remove built and unit-verified (validation, auth, graceful degradation) but not yet exercised against real Cloudinary — needs your credentials. |
| Database | IMPLEMENTED | Added `Photo` collection this slice. |
| Backend | IN PROGRESS | Auth + Activities + Photos + lightweight Groups/Companions done. Gear, Planned Activities, Destinations, Statistics not started. |
| Frontend | IN PROGRESS | Shell + auth + Activities + Photos done. |
| Planning | NOT STARTED | |
| Gear | NOT STARTED | |
| Backpack (Pack My Bag) | NOT STARTED | |
| Destinations | NOT STARTED | |
| Statistics | NOT STARTED | |
| Profile | IN PROGRESS | Unchanged (read-only) since Phase 2. |
| Testing | IN PROGRESS | Manual only. |
| Mobile/Responsive | IMPLEMENTED (Phase 2 shell) | Photo grid uses the same responsive shell; not checked on an actual device yet. |
| Deployment | NOT STARTED | |

## Completed

- Phases 0-2 (verified working by you).
- Phase 3 core — Activities CRUD, list, form, detail (verified working by you).
- **Phase 3 — Activity Photos (this slice):**
  - **Backend:**
    - `Photo` model (`server/src/models/Photo.js`) per the data model doc §35 — metadata + Cloudinary references only, no binary data in MongoDB.
    - `config/cloudinary.js` — configures the Cloudinary SDK from env vars, returns `null` if unconfigured rather than throwing, so the server always boots cleanly regardless of Cloudinary setup state.
    - `photoService.js`: upload (verifies activity ownership before touching Cloudinary at all; auto-sets the first photo as cover; enforces a 20-photo-per-activity cap — my assumption, not specified in the docs), list, set-cover (unsets the previous cover, keeps `Activity.coverPhotoId` in sync), delete (removes from Cloudinary *and* Mongo; if the deleted photo was the cover, automatically promotes the next-oldest remaining photo — a UX nicety not explicitly required but avoids leaving an activity with a "missing" cover), and a cascade-delete helper wired into `activityService.deleteActivity` so deleting an activity now cleans up all its Cloudinary assets too.
    - Upload validation: JPEG/PNG/WebP only, 10MB max, handled via `multer` (memory storage — buffers stream straight to Cloudinary, never touch disk) with errors routed through the same centralized error handler as everything else.
    - Routes: `POST/GET /api/activities/:id/photos`, `PATCH /api/activities/:id/photos/:photoId/cover`, `DELETE /api/photos/:photoId`. Every route ownership-checks before doing anything.
    - Server boots fine and every photo endpoint returns a clean `501 PHOTOS_NOT_CONFIGURED` if Cloudinary env vars are missing — verified live, same graceful-degradation pattern as Google OAuth.
    - `server/scripts/test-photo-flow.sh` — an 11-step script (needs a real image file as an argument) covering auto-cover-on-first-upload, manual cover change, auto-promote-on-cover-delete, and cascade-delete verification (asks you to confirm in your Cloudinary dashboard that the folder is actually empty afterward).
  - **Frontend:**
    - `PhotoGallery.jsx` — grid of uploaded photos with hover-revealed "Set cover" / "Remove" actions, an upload tile, inline error display. Mirrors the backend's auto-promote-on-cover-delete behavior client-side so the UI doesn't need a refetch to stay in sync.
    - `ActivityDetail.jsx` — hero now shows the real cover photo when one exists (graceful gradient fallback otherwise, per `03_UX_DESIGN_SPEC.md` §16), Photos section wired in.
    - `ActivityCard.jsx` — list cards now show the real cover photo thumbnail instead of the gradient placeholder, once an activity has one.
    - Photo upload lives only on the detail page (not the create form) since Cloudinary needs a real `activityId` to attach to — the create flow already navigates straight to the detail page on save, so this doesn't add friction.

## In Progress

Nothing actively in progress. Phase 3 is fully implemented and awaiting your Cloudinary credentials in `server/.env` before the upload flow can be verified end-to-end.

## Remaining

- **Immediate**: add your Cloudinary credentials to `server/.env`, run `bash scripts/test-photo-flow.sh /path/to/a/photo.jpg`, then try it in the browser
- **Phase 3 is then fully complete** — this closes out the roadmap's first major checkpoint
- Phase 4 — Gear (next major milestone)
- Phase 5 through Phase 12 — per `04_DEVELOPMENT_ROADMAP.md`

## Known Issues

- **Cloudinary upload flow not yet verified against a real account.** This sandbox has no network path to Cloudinary (same limitation as MongoDB Atlas and Google). Everything not requiring a real upload was verified live: auth-guarding on all photo endpoints, the `501` graceful-degradation response, and file-type rejection (tested with a `.txt` file, correctly rejected before ever reaching the "is Cloudinary configured" check). The actual upload → Cloudinary → MongoDB round-trip needs your credentials and a real image file.
- Same "not visually reviewed in a browser" caveat as every phase since Phase 2 — please check how the photo grid actually looks and feels, especially on mobile where hover-to-reveal actions don't really work (tap targets should still be reachable, but it's worth a look).
- 20-photos-per-activity cap is my own assumption, not from the docs — easy to change if you want a different limit.
- No automated test suite yet.

## Technical Decisions

- **Upload path**: browser → backend (multipart, in-memory buffer via multer) → Cloudinary → backend saves metadata → MongoDB. Matches `02_TECHNICAL_ARCHITECTURE.md` §25 exactly — your credentials never reach the browser.
- **Auto-cover-on-first-upload and auto-promote-on-cover-delete**: neither was explicitly specified in the docs. I added both because leaving an activity with photos but no designated cover (or forcing you to manually re-pick a cover every time you delete one) seemed like an obvious rough edge — flagging both as judgment calls in case you'd prefer more explicit control.
- **20-photo cap per activity** — arbitrary reasonable default, not from the docs.
- **Photo upload only from the detail page**, not the create form — a practical constraint (Cloudinary needs a real `activityId`), not a design preference. The create flow's existing redirect-to-detail-on-save already accommodates this naturally.

Open decisions for upcoming phases: none currently.

## Files / Areas Recently Changed

**Backend — new:**
`models/Photo.js`, `config/cloudinary.js`, `services/photoService.js`, `controllers/photoController.js`, `middleware/upload.js`, `routes/activityPhoto.routes.js`, `routes/photo.routes.js`, `scripts/test-photo-flow.sh`

**Backend — modified:**
`services/activityService.js` (populates `coverPhotoId`/`social.groupId` on list+get, cascades photo cleanup on delete), `routes/activity.routes.js` (nested photo routes), `app.js` (mounted photo routes), `config/env.js` (Cloudinary vars), `.env.example` (documented + uncommented Cloudinary vars)

**Frontend — new:**
`features/activities/PhotoGallery.jsx/css`

**Frontend — modified:**
`features/activities/api.js` (photo endpoints), `ActivityDetail.jsx` (real hero image, Photos section, cover-change sync), `ActivityCard.jsx` (real thumbnail)

## Verification

Build: `client` — `npm run build` succeeds (verified).
Lint: `client` — `npx oxlint` → 0 warnings, 0 errors across 33 files (verified).
Backend: all files pass `node --check`; app assembles cleanly — including confirming the `activityService.js` ↔ `photoService.js` circular import (needed for cascade-delete) resolves without issue (verified).
Manual verification (live, this session):
- Full regression pass: health, auth `/me`, activity validation, activities-list auth-guard — all still correct after this slice's changes
- Every photo endpoint correctly returns `401` without authentication
- Photo upload with valid auth but no Cloudinary configured → clean `501 PHOTOS_NOT_CONFIGURED` (checked before any DB write)
- Photo upload with a non-image file → `422 INVALID_FILE_TYPE`, rejected by multer's file filter before reaching any other logic

Not yet verified (requires your Cloudinary credentials): actual upload succeeding, auto-cover-on-first-upload, manual cover switching, auto-promote-on-cover-delete, and — importantly — that deleting an activity actually removes its assets from Cloudinary (please check your dashboard, not just that the API call succeeds). Script provided: `server/scripts/test-photo-flow.sh`.

## Next Recommended Step

1. Add your three Cloudinary values to `server/.env` (already documented in `.env.example`)
2. `npm install` in `server/` (new deps: `cloudinary`, `multer`)
3. Run `bash scripts/test-activity-flow.sh` first if you haven't already this session (unrelated regression check, quick), then `bash scripts/test-photo-flow.sh /path/to/a/real/photo.jpg`
4. In the browser: open an activity, upload a couple of photos, switch the cover, delete one, delete the whole activity — then check your Cloudinary dashboard to confirm cleanup actually happened
5. Once confirmed, **Phase 3 is fully complete** — first roadmap checkpoint closed. Then we move to **Phase 4 — Gear**.

## Last Handover

No prior handover — continuing directly within the same conversation from Phase 3 core.
