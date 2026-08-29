# Cairn — Project Progress

## Current Status

Overall progress: ~18%
Current phase: Phase 1 — Authentication
Current milestone: Phase 1b — Google OAuth (complete, pending your Google Cloud Console setup + live verification)
Status: IMPLEMENTED — pending your Google credentials + browser verification
Last updated: 2026-08-29

## Summary

Application code: Phase 0 scaffold + Phase 1a (email/password, verified working by you) + Phase 1b (Google OAuth, implemented)
Frontend: Register/login forms, "Sign in with Google" button (auto-hides if unconfigured), session persists across refresh, logout
Backend: Health endpoint + full email/password auth + Google ID-token verification auth, all sharing the same session/cookie mechanism
Database: Connected (confirmed working on your machine via MongoDB Atlas)
Authentication: Email/password — DONE and verified by you. Google OAuth — implemented, needs your Google Cloud credentials to verify live.
Cloudinary: Not configured
Testing: Manual verification (see below)
Deployment: Not implemented

## Milestone Status

| Area | Status | Notes |
|---|---|---|
| Product foundation (docs) | IMPLEMENTED | |
| Project scaffold (Phase 0) | IMPLEMENTED | |
| Authentication — email/password (Phase 1a) | VERIFIED | You confirmed "it works" after running the full flow. |
| Authentication — Google OAuth (Phase 1b) | IMPLEMENTED | Backend logic + non-network paths verified live (missing-client-ID → 501, missing-credential → 422, regression-tested alongside Phase 1a). The actual Google-token-verification path needs your real `GOOGLE_CLIENT_ID` and a browser to test — see "Next Recommended Step". |
| Database | IMPLEMENTED | |
| Backend | IN PROGRESS | Full auth surface (password + Google) done. No product resources yet. |
| Frontend | IN PROGRESS | Auth forms + Google button done. No navigation/design system yet (Phase 2). |
| Activity system | NOT STARTED | |
| Planning | NOT STARTED | |
| Gear | NOT STARTED | |
| Backpack (Pack My Bag) | NOT STARTED | |
| Destinations | NOT STARTED | |
| Statistics | NOT STARTED | |
| Profile | NOT STARTED | Will need a username-uniqueness-checked `PATCH /api/profile` (username stays editable, per your decision) and a way to show which auth provider(s) are linked. |
| Testing | IN PROGRESS | Manual only. |
| Mobile/Responsive | NOT STARTED | |
| Deployment | NOT STARTED | |

## Completed

- Phase 0 — Project Foundation (see earlier entries, unchanged).
- Phase 1a — Email/Password Authentication (see earlier entries; **verified working by you**).
- **Phase 1b — Google OAuth:**
  - **Approach**: Option B — `google-auth-library` verifies an ID token that the frontend obtains directly from Google Identity Services (GIS). No server-side redirect flow, no Client Secret needed — only `GOOGLE_CLIENT_ID` (public) on both frontend and backend.
  - **Product decision (your call)**: Google signups get an auto-generated, unique username instantly (one-click signup preserved); editable anytime afterward via profile, same as password signups.
  - Backend:
    - `server/src/utils/googleAuth.js` — verifies the ID token's signature, audience, and `email_verified` flag; returns a trusted profile (`googleId`, `email`, `name`, `picture`). Throws a clean `ApiError` on any invalid/expired/wrong-audience token — never trusts client-supplied identity.
    - `server/src/utils/generateUsername.js` — derives a pattern-valid, collision-checked username from the email's local part, falling back to a random numeric suffix if taken.
    - `authenticateOrCreateGoogleUser` in `authService.js` — three-way logic: (1) existing `googleId` → log in, (2) existing account with that email (e.g. originally password-registered) → **link** Google to it rather than creating a duplicate (prevents the duplicate-account problem called out in `02_TECHNICAL_ARCHITECTURE.md` §7), (3) neither → create a new account with an auto-generated username.
    - `POST /api/auth/google` — accepts `{ credential }`, verifies it, authenticates/creates the user, sets the same access/refresh cookies as password login. Fully interoperable with the existing session/refresh/logout endpoints — a Google-authenticated session behaves identically to a password one everywhere else in the app.
    - `User` model updated: `passwordHash` is now optional (Google-only accounts have none) — enforced instead at the `registerUser` service level for password signups. `googleId` given a sparse unique index.
    - `authenticateUser` (password login) now gives a clear, specific error (`NO_PASSWORD_SET`) if someone with a Google-only account tries to log in with a password, rather than crashing on a null hash.
    - Server boots fine with no `GOOGLE_CLIENT_ID` set; the endpoint returns a clean `501 GOOGLE_AUTH_NOT_CONFIGURED` instead of crashing (verified live).
  - Frontend:
    - Google Identity Services script added to `index.html`.
    - `GoogleSignInButton.jsx` — renders Google's own button via GIS, posts the resulting ID token to the backend, updates auth state on success. **Renders nothing** if `VITE_GOOGLE_CLIENT_ID` isn't set, so the app works cleanly before you've configured Google Cloud.
    - Wired into both `LoginForm` and `RegisterForm` with a simple "or" divider (works for both flows since the backend transparently creates-or-logs-in).
  - `server/scripts/test-auth-flow.sh` updated with a note that Google sign-in needs manual browser testing (can't be scripted via curl — requires a real token minted by Google).

## In Progress

Nothing actively in progress. Phase 1b is implemented and awaiting your Google Cloud Console credentials + a browser test.

## Remaining

- **Immediate**: set up Google Cloud OAuth credentials (see "Next Recommended Step"), add `GOOGLE_CLIENT_ID` to both `server/.env` and `client/.env`, test "Sign in with Google" in the browser
- Phase 2 — Application Shell
- Phase 3 through Phase 12 — per `04_DEVELOPMENT_ROADMAP.md`

## Known Issues

- **Google sign-in not yet verified against real Google credentials.** Everything that doesn't require an actual Google ID token was verified live in this session (missing-config → 501, missing-credential → 422, no regressions to Phase 1a). The real flow (click button → Google popup → token → account created/linked) needs your `GOOGLE_CLIENT_ID` and a browser.
- Same DB-connectivity limitation as before applies to this sandbox — I can't create a real Google-linked user here to inspect in MongoDB myself.
- No automated test suite yet.

## Technical Decisions

- **Google OAuth signup username**: auto-generated instantly, editable later — your explicit decision (matches Google's one-click expectation rather than adding a "choose a username" interstitial).
- **Account linking by email**: if someone registers with password first and later uses "Sign in with Google" with the same (verified) email, the accounts are linked rather than duplicated. This wasn't explicitly asked about — flagging it now: the alternative would be to reject the Google attempt and tell them to log in with their password instead. I went with linking because it matches `02_TECHNICAL_ARCHITECTURE.md` §7's explicit instruction to prevent duplicate accounts for the same email, but let me know if you'd rather block and prompt instead.
- **No Google Client Secret needed** — corrects earlier guidance from the Phase 1 kickoff, where I initially mentioned an "Authorized redirect URI." That was for a different (redirect-based) flow; with ID-token verification, only the "Authorized JavaScript origin" matters in Google Cloud Console.
- `passwordHash` relaxed from required to optional at the schema level to accommodate Google-only accounts; enforcement moved to `registerUser`.

Open decisions for upcoming phases (not yet made):

- Activity numbering concurrency strategy (atomic counter vs. transaction) — Phase 3.

## Files / Areas Recently Changed

- `server/src/models/User.js` — `passwordHash` optional, `googleId` sparse unique index
- `server/src/utils/generateUsername.js` — new
- `server/src/utils/googleAuth.js` — new
- `server/src/services/authService.js` — added `authenticateOrCreateGoogleUser`, `NO_PASSWORD_SET` guard
- `server/src/controllers/authController.js` — added `google` action
- `server/src/routes/auth.routes.js` — added `POST /api/auth/google`
- `server/src/config/env.js` — added `googleClientId` (no boot-time requirement)
- `server/.env.example` — documented `GOOGLE_CLIENT_ID`, removed unnecessary Client Secret placeholder
- `server/scripts/test-auth-flow.sh` — added Google sign-in manual-test note
- `client/index.html` — added Google Identity Services script tag
- `client/.env.example` — added `VITE_GOOGLE_CLIENT_ID`
- `client/src/features/auth/api.js` — added `googleAuthRequest`
- `client/src/features/auth/AuthContext.jsx` — added `loginWithGoogle`
- `client/src/features/auth/GoogleSignInButton.jsx` — new
- `client/src/features/auth/LoginForm.jsx`, `RegisterForm.jsx` — wired in Google button + divider
- `client/src/features/auth/authForms.css` — added `.auth-divider` styling

## Verification

Build: `client` — `npm run build` succeeds (verified). `server` — all files pass `node --check`, app assembly verified.
Tests: No automated test suite yet.
Lint: `client` — `npx oxlint` → 0 warnings, 0 errors (verified).
Manual verification (live, this session):
- Regression pass confirming Phase 1a still works: health, 404, register validation, unauthenticated `/me` — all correct
- `POST /api/auth/google` without `GOOGLE_CLIENT_ID` configured — clean `501 GOOGLE_AUTH_NOT_CONFIGURED` (verified)
- `POST /api/auth/google` with missing `credential` field — clean `422 VALIDATION_ERROR` (verified)

Not yet verified (requires your Google Cloud credentials + a browser): actual Google sign-in creating a new account, linking to an existing password account, and logging in an existing Google account a second time.

## Next Recommended Step

1. **Set up Google Cloud OAuth credentials** (I walked you through this earlier in the conversation — Google Cloud Console → OAuth consent screen → Credentials → Create OAuth Client ID, Web application). One correction to that earlier guidance: you only need to set the **Authorized JavaScript origin** (`http://localhost:5173`) — skip the redirect URI, it's not used by this approach.
2. Add the resulting Client ID to **both**:
   - `server/.env` → `GOOGLE_CLIENT_ID=...`
   - `client/.env` → `VITE_GOOGLE_CLIENT_ID=...` (same value)
3. Run both dev servers, open the app, click "Sign in with Google," confirm you land in the authenticated view and a new user document appears in MongoDB with `authProviders: ["google"]`.
4. Try it a second time (should log the same account back in), and try registering with a password using the *same* email as an existing password account then later linking via Google, if you want to confirm the linking path.
5. Report back — then we move to **Phase 2 (Application Shell)**.

## Last Handover

No prior handover — continuing directly within the same conversation from Phase 1a.
