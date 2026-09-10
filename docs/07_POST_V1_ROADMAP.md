# Cairn — Post-V1 Roadmap

Produced at the V1 completion checkpoint (2026-09-05); revised 2026-09-09 once the product owner approved Community as the next major chapter. This file did not previously exist in the repository despite being referenced by `HANDOVER.md` and `PROGRESS.md` — it is created now to close that gap. It is a practical, prioritized roadmap, not a restatement of the product spec — see `01_PRODUCT_SPEC.md` / `02_TECHNICAL_ARCHITECTURE.md` / `05_DATA_MODEL_AND_API_CONTRACT.md` for the underlying product/data definitions, and `08_COMMUNITY_PROPOSAL.md` for the full Community architecture.

---

## A. Must Fix

- **A1 — Rate limiting on auth endpoints.** Named as a minimum V1 security requirement (`02_TECHNICAL_ARCHITECTURE.md` §35) and never implemented across all twelve V1 phases. Small, urgent, no product-direction implications.
  - **Scope update (2026-09-09, finalized in Community Revision 3):** now that Community's architecture is finalized, rate limiting is a confirmed, explicit **pre-public-launch dependency** covering `/api/auth/*` plus every new Community write endpoint: kudos (give/remove), comments (create/edit/delete), follow/unfollow, and report creation. See `08_COMMUNITY_PROPOSAL.md` §14 for the exact endpoint list. This doesn't change A1's priority, just finalizes what "done" means for it before Community can launch publicly.
- **A2 — Account-recovery flow for password-only accounts.** No forgot-password/email-reset flow exists; no email-sending infrastructure exists anywhere in the stack. Needs an email-service decision before implementation can start.

## B. Should Improve

- Automated test suite (currently all testing is manual shell-script integration tests, `server/scripts/test-*.sh`).
- Observability / error tracking (Cloudinary cleanup failures are currently silently swallowed everywhere by design, with zero visibility if that ever actually matters).
- CI/CD gating before Render's auto-deploy-on-push.
- The undocumented Group-deletion inconsistency (deleting a `Group` leaves dangling references, same practical behavior as `Destination`'s deliberate choice, but never actually decided/written down for `Group` specifically).
- Gear-picker scale limit (caps at 50 items in the Activity/PlannedActivity forms, no pagination in the picker itself).
- Search-behavior inconsistency (main search uses MongoDB `$text`, word-tokenized; Wilaya filter uses regex, true substring — different matching behavior depending on which control is used).
- Closing out Phase 11's hands-on visual/device review, which was asked for twice during V1 and never explicitly confirmed (see `PROGRESS.md`).

## C. V1.1 / Product Improvements (personal-first, no identity change)

- **Home page dashboard** — still the single highest-leverage, least-developed screen. Currently shows only an empty-state CTA regardless of activity history, despite `01_PRODUCT_SPEC.md` §7 describing recent activity / upcoming plans / highlights. Flagged since Phase 5 of V1, never revisited.
- Outdoor Journey / Playback (explicitly deferred from V1 Phase 8).
- Bulk import.
- Gear-picker pagination.
- Saved filter preferences.
- Print/PDF export.
- Personal notifications (distinct from Community notifications — e.g., a reminder about an upcoming planned activity; not currently scoped or designed, would need its own decision if pursued).
- Currency flexibility (V1 is DZD-only by design).

## D. Major Future Features

- **Community** — see status below. No longer "not currently justified" — **officially approved** as the next major chapter as of 2026-09-09. Full architecture in `08_COMMUNITY_PROPOSAL.md`.
- **Landing/welcome page for unauthenticated visitors** — approved alongside Community; see status below.
- Maps, GPX import/export, route recording, trail discovery — still not justified by any current product signal.
- Native mobile application — still not justified.
- Offline mode — still not justified.
- AI features of any kind — still explicitly prohibited absent a genuine identified user problem (`01_PRODUCT_SPEC.md` §34, `Claude.md` §9).
- Group accounts / multi-user group management (distinct from the existing lightweight personal `Group` tag, which stays exactly as-is) — still not justified.

---

## Current Status: Community & Landing Page

**Community:** STATUS = PRODUCT DIRECTION APPROVED / ARCHITECTURE FINALIZED — **IMPLEMENTATION APPROVED, IN PROGRESS.**
The one remaining open item (§16, report-review mechanism) was resolved 2026-09-09: reports are reviewed manually/out-of-band, no moderator role is introduced. Implementation began the same day, starting with M0 (Landing Page). See `PROGRESS.md` for live per-milestone status — this file records the architecture and priority list, not day-to-day implementation progress.

**Landing page:** STATUS = PLANNED / NOT IMPLEMENTED.
Currently, an unauthenticated visitor is shown a bare login/register form with no explanation of what Cairn is (confirmed by direct inspection of `client/src/App.jsx`'s `AuthGate`). Approved as an independent milestone (`08_COMMUNITY_PROPOSAL.md`'s milestone M0), sequenced before or alongside Community Foundation work, and landing no later than immediately before the first public-facing Community screen ships — since a shared public Community link needs somewhere sensible to send a logged-out visitor.

---

## Recommended Sequencing (current)

```text
Post-V1 status quo:  A1 (rate limiting) and A2 (account recovery) remain open,
                     unrelated to Community and not blocking it.

Next major chapter:  Community, per the milestone sequence in
                     08_COMMUNITY_PROPOSAL.md §12 (M0 Landing Page through
                     M10 Polish).

Not currently in     Everything in category D except Community/Landing Page.
active planning:     No product signal currently justifies starting there.
```

Nothing in this document authorizes implementation on its own — Community specifically remains in the architecture/decision phase until the product owner explicitly approves `08_COMMUNITY_PROPOSAL.md`'s open decisions and gives a go-ahead to begin M0/M1.
