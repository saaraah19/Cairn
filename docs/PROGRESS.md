# Cairn — Project Progress

## Current Status

Overall progress: ~49%
Current phase: Phase 3 — Activities
Current milestone: Phase 3 — Activities (COMPLETE — Cloudinary verified working by you, lightbox added)
Status: VERIFIED — Phase 3 fully closed out
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
| **Activities (Phase 3)** | **VERIFIED — fully complete** | CRUD/list/detail/form and photo upload/cover/remove all confirmed working by you (root cause of an earlier Cloudinary 403 was a credential misconfiguration on your end, now resolved). Photo lightbox added as a small follow-up polish item. |
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
  - **Photo Lightbox** (small follow-up, same session): `PhotoLightbox.jsx` — clicking any photo thumbnail in the gallery opens a full-size overlay viewer with prev/next navigation (click, arrow buttons, or ← → keys), a counter, and Escape/click-outside to close. The hover-action overlay (Set cover/Remove) was refined so only the buttons themselves capture clicks (`pointer-events: none` on the overlay, `auto` on the buttons) — previously the invisible overlay would have silently swallowed clicks meant for the image underneath. Not wired into the activity-detail hero image yet (would need lightbox state lifted up a level) — flagging as an easy future addition if wanted, not done now since the gallery view covers the actual request.

## In Progress

Nothing actively in progress. Phase 3 is fully implemented and awaiting your Cloudinary credentials in `server/.env` before the upload flow can be verified end-to-end.

## Remaining

- **Immediate**: add your Cloudinary credentials to `server/.env`, run `bash scripts/test-photo-flow.sh /path/to/a/photo.jpg`, then try it in the browser
- **Phase 3 is then fully complete** — this closes out the roadmap's first major checkpoint
- Phase 4 — Gear (next major milestone)
- Phase 5 through Phase 12 — per `04_DEVELOPMENT_ROADMAP.md`

## Known Issues

- **Cloudinary confirmed working end-to-end by you.** Root cause of the earlier `403` was a credential misconfiguration on your Cloudinary setup (not a bug in the integration) — now resolved.
- Same "not visually reviewed against every screen size" caveat as prior phases for the new lightbox specifically — worth a quick check on mobile, though it was built mobile-width-aware (smaller nav buttons under 600px).
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
`features/activities/PhotoGallery.jsx/css`, `features/activities/PhotoLightbox.jsx/css`

**Frontend — modified:**
`features/activities/api.js` (photo endpoints), `ActivityDetail.jsx` (real hero image, Photos section, cover-change sync), `ActivityCard.jsx` (real thumbnail), `PhotoGallery.css` (overlay pointer-events fix so image clicks reach the lightbox)

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

1. Pull this update, `npm run build` (client) to pick up the lightbox — no new dependencies, no env changes needed
2. Quick browser check: open an activity with a few photos, click a thumbnail, confirm the lightbox opens with working prev/next (click, arrows, and ← → keys) and closes on Escape/click-outside/× button
3. **Phase 3 is now fully complete and verified** — first roadmap checkpoint closed. Ready to start **Phase 4 — Gear** whenever you are.

## Last Handover

No prior handover — continuing directly within the same conversation from Phase 3 core.
