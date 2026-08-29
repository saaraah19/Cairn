# Cairn — Project Progress

## Current Status

Overall progress: ~28%
Current phase: Phase 2 — Application Shell
Current milestone: Phase 2 — Application Shell
Status: IMPLEMENTED — pending your visual review in a real browser
Last updated: 2026-08-29

## Summary

Application code: Phase 0 (foundation) + Phase 1 (auth, verified) + Phase 2 (shell/navigation/design system) implemented
Frontend: Full navigation shell (sidebar on desktop, bottom tab bar on mobile), five placeholder pages, design token system in place
Backend: Unchanged since Phase 1b — health + full auth (password + Google)
Database: Connected (your Atlas cluster)
Authentication: Complete for V1 scope (email/password + Google), verified working
Cloudinary: Not configured
Testing: Manual (lint, build, static bundle-serve check — see Verification)
Deployment: Not implemented

## Milestone Status

| Area | Status | Notes |
|---|---|---|
| Product foundation (docs) | IMPLEMENTED | |
| Project scaffold (Phase 0) | IMPLEMENTED | |
| Authentication (Phase 1a + 1b) | VERIFIED | Both confirmed working by you. |
| Application Shell (Phase 2) | IMPLEMENTED | Design system, navigation, routing, five placeholder pages, loading/empty states all built. **Not yet seen in an actual browser** — this sandbox can't render UI, only lint/build/serve-check it. See "Next Recommended Step." |
| Database | IMPLEMENTED | |
| Backend | IN PROGRESS | No product resources yet (activities, gear, etc.) — Phase 3+. |
| Frontend | IN PROGRESS | Shell + auth done. Pages are intentionally placeholder content per roadmap §6 ("pages can contain placeholders" at this stage). |
| Activity system | NOT STARTED | |
| Planning | NOT STARTED | |
| Gear | NOT STARTED | |
| Backpack (Pack My Bag) | NOT STARTED | |
| Destinations | NOT STARTED | |
| Statistics | NOT STARTED | |
| Profile | IN PROGRESS | Read-only profile page built (name/username/email/linked providers/logout). Editing is Phase 9. |
| Testing | IN PROGRESS | Manual only. |
| Mobile/Responsive | IMPLEMENTED | Sidebar (≥860px) / bottom tab bar (<860px) breakpoint built and reviewed in code; not yet visually confirmed on a real device. |
| Deployment | NOT STARTED | |

## Completed

- Phase 0 — Project Foundation (unchanged).
- Phase 1 — Authentication, email/password + Google OAuth (unchanged; **verified working by you**).
- **Phase 2 — Application Shell**, built to the approved design direction (stone/moss/clay palette, Fraunces/Work Sans/IBM Plex Mono type, slim sidebar + bottom tab bar, abstract cairn-mark signature element):
  - **Design tokens** (`client/src/styles/tokens.css`): all approved colors, type, spacing, radius, and shadow as CSS custom properties; global reset; `prefers-reduced-motion` respected site-wide.
  - **Fonts**: Fraunces (display, headings only), Work Sans (body/UI), IBM Plex Mono (data/stats figures) loaded via Google Fonts in `index.html`.
  - **Signature element** (`components/Logo.jsx`): abstract stacked-stone cairn mark (SVG, not a literal illustration) used as the wordmark and reused as the active-nav accent — the one deliberately "bold" element, everything else kept quiet per the design brief.
  - **Navigation** (`layouts/Sidebar.jsx` + `layouts/BottomTabBar.jsx`, sharing `layouts/navItems.js` as a single source of truth): slim left sidebar ≥860px, bottom tab bar <860px — explicitly avoiding the generic top-navbar SaaS pattern per the UX spec. Five hand-rolled line icons (`components/NavIcons.jsx`) rather than adding an icon-library dependency for five icons.
  - **Routing**: `react-router-dom` wired in `App.jsx` — `AppShell` (`layouts/AppShell.jsx`) wraps an `<Outlet/>` for nested routes: `/`, `/outdoors`, `/gear`, `/statistics`, `/profile`.
  - **Five pages** (`pages/`): Home, My Outdoors, Gear, Statistics use `EmptyState` with invitational copy per the UX spec's voice guidance ("Your trail starts here," never "No records found"). Profile shows real authenticated-user data (name, username, email, linked auth providers as pills) and hosts the logout action — moved here from the old status page in `App.jsx`.
  - **Shared primitives**: `LoadingState` and `EmptyState` components (`components/`), required explicitly by the roadmap for this phase.
  - **Auth pages restyled**: `AuthLayout` (centered card, wordmark, tagline) replaces the old bare status page; `authForms.css` migrated from Phase 1's hardcoded hex values to the new token system for full visual consistency between the logged-out and logged-in experience.
  - Removed a leftover default Vite template stylesheet (`index.css`) from Phase 0 that had never been cleaned up and was fighting with the real design system.

## In Progress

Nothing actively in progress. Phase 2 is implemented and awaiting your visual review in a real browser — this sandbox has no way to render UI, only to lint, build, and static-serve-check it.

## Remaining

- **Immediate**: open the app in a real browser (desktop and mobile-width) and confirm the design reads the way we discussed — see "Next Recommended Step"
- Phase 3 — Activities (first major product milestone)
- Phase 4 through Phase 12 — per `04_DEVELOPMENT_ROADMAP.md`

## Known Issues

- **Not visually verified in a browser.** I confirmed the build compiles, lints clean, and serves a valid bundle (checked via `vite preview` + curl), but I have no way to actually render the page and check that the design looks/feels right — that requires your eyes. Please flag anything that's off (spacing, color, font pairing, the sidebar/bottom-bar breakpoint, etc.) and I'll adjust.
- Mobile bottom-tab-bar and desktop sidebar breakpoint (860px) is a reasonable default, not something confirmed against real devices — easy to adjust if it feels wrong on your phone.
- No automated test suite yet.

## Technical Decisions

- **Design direction** — approved by you before implementation (color palette, type pairing, sidebar/bottom-bar layout, cairn-mark signature element). Full rationale is in the conversation; summarized in "Completed" above.
- **No icon library dependency** — five nav icons hand-rolled as inline SVG rather than adding `lucide-react` or similar, per the "avoid unnecessary dependencies" principle.
- **BackendStatus pill relocated**: the Phase 0 "backend connected" health indicator no longer lives on every authenticated page (would violate the UX spec's "Home should not become an information dump" rule) — it now only appears on the logged-out `AuthLayout` screen, where it's still useful as a dev sanity check.
- **Profile page built ahead of Phase 9's schedule, minimally**: since real user data was already available from Phase 1, it seemed wasteful to placeholder-empty-state a page we could make genuinely useful (and it needed to host the logout button somewhere sensible). Kept read-only — no editing capability added; that's still Phase 9 as planned. Flagging this as a small scope note since it's not strictly "placeholder only" as the roadmap describes for this phase, though it doesn't add any new product surface beyond what already existed in `App.jsx`.

Open decisions for upcoming phases (not yet made):

- Activity numbering concurrency strategy (atomic counter vs. transaction) — Phase 3.

## Files / Areas Recently Changed

- `client/index.html` — added Google Fonts links
- `client/src/main.jsx` — now imports `styles/tokens.css` instead of the removed default `index.css`
- `client/src/index.css` — **removed** (leftover Vite template artifact)
- `client/src/styles/tokens.css` — new
- `client/src/components/Logo.jsx`, `NavIcons.jsx`, `LoadingState.jsx`, `EmptyState.jsx`, `states.css` — new
- `client/src/layouts/` — new: `AppShell.jsx/css`, `Sidebar.jsx/css`, `BottomTabBar.jsx/css`, `AuthLayout.jsx/css`, `navItems.js`
- `client/src/pages/` — new: `HomePage.jsx`, `MyOutdoorsPage.jsx`, `GearPage.jsx`, `StatisticsPage.jsx`, `ProfilePage.jsx/css`, `pages.css`
- `client/src/App.jsx` — rewired for routing + AppShell + AuthGate (replaces the old single-page status/auth view)
- `client/src/App.css` — trimmed to only what's still used (status pill, full-page-center)
- `client/src/features/auth/authForms.css` — migrated to design tokens

## Verification

Build: `client` — `npm run build` succeeds (verified).
Lint: `client` — `npx oxlint` → 0 warnings, 0 errors across 24 files (verified).
Bundle-serve check: `vite preview` + curl confirmed `index.html`, the JS bundle (200, ~244KB), and CSS all serve correctly with resolved font/color variables (verified).
Visual/UX review: **not done** — requires a real browser, which this sandbox doesn't have. This is the primary thing to check before moving on.

## Next Recommended Step

1. Pull this update, `npm install` in `client/` if needed (no new dependencies this phase, but worth confirming), `npm run dev`
2. Open it in a browser: check the desktop sidebar, then narrow the window below ~860px (or open on your phone) to confirm the bottom tab bar takes over
3. Click through all five nav destinations, check the Profile page shows your real account info correctly, confirm logout still works
4. Tell me what to adjust, if anything — then we move to **Phase 3 — Activities**, the first major product milestone

## Last Handover

No prior handover — continuing directly within the same conversation from Phase 1b.
