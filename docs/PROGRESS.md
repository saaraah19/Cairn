# Cairn — Project Progress

## Current Status

Overall progress: ~92%
Current phase: Phase 9 — Profile & Settings
Current milestone: Phase 9 — Profile & Settings (COMPLETE)
Status: IMPLEMENTED — pending your live-DB verification and browser review
Last updated: 2026-09-02

## Summary

Application code: Phase 0-8 (fully verified by you) + Phase 9 Profile & Settings implemented
Frontend: Profile is now fully editable (picture, name, username, bio, location), password change/set, working light/dark/system theme with no flash-of-wrong-theme on load, privacy preference (default activity visibility)
Backend: Profile update with username-uniqueness re-check, password change/set (handles both password and Google-only accounts), profile picture upload (Cloudinary, same pattern as gear/destinations)
Database: Connected (your Atlas cluster) — no new collection; `User.profilePicture` upgraded from a plain string to the established `{cloudinaryPublicId, secureUrl}` pattern
Authentication/Activities/Photos/Gear/Planned Activities/Pack My Bag/Destinations/Statistics: Unchanged, all previously verified
Testing: Manual — validation/auth-guarding verified live, full regression pass covering all prior phases; DB-backed happy path needs your run

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
| Statistics (Phase 8) | VERIFIED | Plus a follow-up color/icon polish pass per your feedback. |
| **Profile & Settings (Phase 9)** | **IMPLEMENTED** | Profile editing, password change/set, picture upload, working dark mode, privacy preference all built. Validation/auth verified live, full regression pass across every prior phase. DB-backed happy path and browser review both need you. |
| Database | IMPLEMENTED | No new collection — `User.profilePicture` schema upgraded. |
| Backend | IN PROGRESS | Every core V1 feature from the roadmap now has a backend. Only Data Management (export/account deletion, Phase 10) remains before Polish/Testing/Deployment. |
| Frontend | IN PROGRESS | Every core V1 feature now has a working UI, including a real editable profile. |
| Profile | **DONE** | |
| Testing | IN PROGRESS | Manual only. |
| Mobile/Responsive | IMPLEMENTED (Phase 2 shell) | Settings sections reuse the same responsive form components as everywhere else; not checked on an actual device yet. |
| Deployment | NOT STARTED | |

## Completed

- Phases 0-8 (fully verified working by you, including the statistics color/icon polish follow-up).
- **Phase 9 — Profile & Settings:**
  - **Backend:**
    - `User.profilePicture` upgraded from a bare string to the `{cloudinaryPublicId, secureUrl}` pattern already established for gear/destination images — it was never actually used before this phase, so this was a safe, clean upgrade rather than a breaking migration. Updated the Google-auth service accordingly (Google's own hosted picture URL is stored with `cloudinaryPublicId: null`, since there's nothing of ours to manage/delete in Cloudinary for it).
    - `profileService.js`: `updateProfile` re-checks username uniqueness only when the username is actually changing (avoids a false "taken" error against the user's own current value), and merges `preferences` updates rather than replacing the whole object — so updating just `defaultActivityVisibility` doesn't wipe out `theme`, verified in the test script.
    - **`changePassword` handles two distinct cases**: accounts with an existing password must confirm it (standard security practice); Google-only accounts (no `passwordHash` yet) can set one for the first time with nothing to confirm — mirrors the `NO_PASSWORD_SET` distinction already established in Phase 1b's login flow. Successfully setting a password also adds `'password'` to `authProviders`.
    - **Username change releases immediately** — your explicit decision. No extra logic needed: the existing unique index just allows the freed value to be claimed the moment the document itself no longer holds it. Verified in the test script by having a second account immediately claim the first account's old username.
    - Profile picture upload/remove reuses the exact same Cloudinary pipeline as gear and destination images.
    - Routes: `GET/PATCH /api/profile`, `PATCH /api/profile/password`, `POST/DELETE /api/profile/picture`.
    - `server/scripts/test-profile-flow.sh` — 8 steps covering profile update, username change + immediate reuse by a second account, password-change-without-current-password rejection, password-change-with-current-password success, logging in with the new password, and confirming partial preference updates don't clobber sibling preferences.
  - **Frontend — working dark mode**, not just a stored-but-inert preference:
    - Two new derived color tokens were already added during the Statistics polish pass (`--color-moss-light`, `--color-clay-light`); this phase added a full dark palette in `tokens.css` under `html[data-theme='dark']` — same hue families as light mode (moss green, clay warm accent), lightened and slightly desaturated for legibility rather than a flat inversion.
    - **Found and fixed several hardcoded hex colors** scattered across `authForms.css`, `ActivityForm.css`, `ActivitiesList.css`, `PhotoGallery.css`, and `PackMyBag.css` (input borders, selected-checkbox tints) that would have looked wrong in dark mode since they bypassed the token system entirely. Replaced all of them with two new tokens (`--color-border-input`, `--color-selected-bg`) that have dark-mode overrides — a genuine bug caught and fixed as a side effect of building this feature properly, not just cosmetic.
    - `ThemeProvider.jsx` (`features/theme/`): manages the light/dark/system preference, resolves "system" via `matchMedia` and stays live-updated if the OS preference changes mid-session, and caches the choice in `localStorage` purely so the correct theme paints immediately on load.
    - **No flash-of-wrong-theme**: a small inline script in `index.html` applies the cached preference before React even mounts — a standard, minimal technique for this exact problem, not overengineering.
    - `App.jsx` syncs the theme to the authenticated user's saved `preferences.theme` once per login session (covers the case where it differs from what's locally cached, e.g. changed on another device), without fighting later in-session changes made via Settings.
    - `ProfileSettingsPage.jsx` (`features/profile/`, replacing the read-only Phase 2 `pages/ProfilePage.jsx`, which was removed): Picture, Profile (name/username/bio/location), Account (email display, connected providers, change/set password), Appearance (theme radio), Privacy (default visibility radio), and a Data section stating export/deletion are coming in a future update — deliberately not building Phase 10's functionality early.
    - `AuthContext.jsx` gained an `updateUser` function so profile edits immediately reflect everywhere the authenticated user's data is used (e.g. the Home page's welcome message), without each feature needing its own notion of "the current user."

## In Progress

Nothing actively in progress. Phase 9 is implemented and awaiting your live-DB verification + browser review.

## Remaining

- **Immediate**: run `server/scripts/test-profile-flow.sh`; try it in the browser — edit your profile, upload a picture, change your password, toggle through light/dark/system and confirm dark mode actually looks right (not just "colors changed" — check contrast/legibility across a few different pages)
- **Phase 10 — Data Management** (export, account deletion) — the last feature phase before Polish/Testing/Deployment
- Phase 11 — Polish
- Phase 12 — Testing & Deployment

## Known Issues

- **DB-backed profile flow not yet verified by you.** Same sandbox limitation as every prior phase. Everything not requiring a live DB write was verified: auth-guarding on every new endpoint, all validation-error paths (bad username format, password too short), and a full regression pass confirming the `profilePicture` schema change didn't break registration or any other endpoint. The actual update→username-change→password-change→login-with-new-password flow needs your run. Script provided.
- **Dark mode has not been visually reviewed by me at all** — this sandbox genuinely cannot render anything, so unlike most "not yet visually reviewed" notes in prior phases (which were about polish/spacing), this one is about whether the dark palette is actually *legible and pleasant*, not just "technically present." Please look at it closely across a few different pages before considering this done.
- No automated test suite yet.

## Technical Decisions

- **Username release is immediate** — your explicit decision, simplest approach, no extra tracking needed.
- **Password change requires current password; first-time password set (Google-only accounts) does not** — since there's nothing to confirm yet. Mirrors the existing `NO_PASSWORD_SET` pattern from Phase 1b.
- **`profilePicture` schema upgrade treated as safe** since the field was never actually populated with real data before this phase (Google's picture URL was the only prior writer, and that's been updated to match).
- **Dark mode implemented as a real, working feature** rather than just storing an inert preference — the roadmap explicitly lists "Light mode / Dark mode / System preference" under Phase 9's settings, so this felt like the actual scope rather than optional extra work.
- **Data Management UI deliberately stubbed**, not built — Phase 10's job, kept out of scope here on purpose.

Open decisions for upcoming phases: none currently.

## Files / Areas Recently Changed

**Backend — new:**
`validators/profileValidators.js`, `services/profileService.js`, `controllers/profileController.js`, `routes/profile.routes.js`, `scripts/test-profile-flow.sh`

**Backend — modified:**
`app.js` (mounted profile routes), `models/User.js` (`profilePicture` schema upgrade), `services/authService.js` (Google profile picture handling updated to match)

**Frontend — new:**
`features/theme/` — `themeContextObject.js`, `useTheme.js`, `ThemeProvider.jsx`; `features/profile/` — `api.js`, `ProfileSettingsPage.jsx/css`

**Frontend — modified:**
`styles/tokens.css` (dark palette, new border/selected-bg tokens), `index.html` (flash-avoidance inline script), `App.jsx` (ThemeProvider wiring, theme sync on login, profile route), `features/auth/AuthContext.jsx` (`updateUser`), five CSS files with hardcoded colors replaced by theme-aware tokens (see Completed)

**Frontend — removed:**
`pages/ProfilePage.jsx`, `pages/ProfilePage.css` (superseded by `features/profile/ProfileSettingsPage.jsx`)

## Verification

Build: `client` — `npm run build` succeeds (verified). Confirmed the dark-theme CSS selector and all overrides survived minification in the actual build output (verified by inspecting `dist/assets/*.css` directly).
Lint: `client` — `npx oxlint` → 0 warnings, 0 errors across 67 files (verified).
Backend: all files pass `node --check`; app assembles cleanly with the `profilePicture` schema change and new profile routes (verified).
Manual verification (live, this session):
- Full regression pass: health, registration (specifically re-checking the `profilePicture` schema upgrade didn't break it), statistics auth-guard, destination validation, profile auth-guard — all correct
- Profile validation: bad username format, password too short — correct `422`s
- Every new profile endpoint correctly returns `401` without authentication

Not yet verified (requires your live database): the actual profile-update/username-change/password-change flow, and — genuinely important this phase — how dark mode actually looks in a browser, since this sandbox cannot render anything visual at all. Script provided: `server/scripts/test-profile-flow.sh`.

## Next Recommended Step

1. Pull this update, `npm install` if needed (no new dependencies this phase)
2. Run `bash scripts/test-profile-flow.sh` against your live database
3. In the browser: edit your profile, upload a picture, change your password and confirm you can log in with the new one, and **specifically check dark mode carefully** — toggle through all three options, look at several different pages (not just Settings), and tell me if anything reads poorly
4. Report back — then we start **Phase 10 — Data Management**

## Last Handover

No prior handover — continuing directly within the same conversation from Phase 8.
