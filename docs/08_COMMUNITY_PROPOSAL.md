# Cairn — Community Product & Architecture Proposal (Revision 3 — Finalized Architecture)

**STATUS:** DECISIONS FINALIZED — no open items remain (§16 resolved 2026-09-09: reports reviewed manually/out-of-band, no moderator role introduced). Implementation approved and underway — see `PROGRESS.md` for live milestone status.
**Prepared:** 2026-09-09 (v1) → revised same day (v2, expanded interaction scope) → revised again same day (v3, this document — all open decisions resolved).
**This revision is fully self-contained.** Revision 2 referred back to "the original proposal" for the Activity/Profile privacy field matrices; that original content had been overwritten when Revision 2 was written over the same file, which meant Revision 2 contained references to content that no longer existed anywhere in the repository. That's corrected here — this document does not depend on any prior revision to be complete. (Flagged explicitly in the accompanying report as a documentation-process mistake worth knowing about.)

---

## 0. Grounding (repository facts this revision relies on)

Carried forward from earlier revisions, plus new findings from this pass:

- `Activity.visibility` and its UI toggle already exist and are unused (no public routes exist at all today).
- `User` has no public-profile concept, no `role`/`isAdmin`/moderator field of any kind, anywhere in the schema or middleware.
- **No MongoDB transaction is used anywhere in the current codebase**, despite `02_TECHNICAL_ARCHITECTURE.md` §39 describing them as available for "multiple related database operations that must succeed or fail together." The one place that sounds like a transaction candidate — planned-activity completion — does not actually use one in the real code. The codebase's actual established pattern for atomicity is a **single-document atomic `findOneAndUpdate`/`$inc`**, demonstrated by `models/Counter.js`'s `getNextSequenceValue` (used for `activityNumber` assignment). This matters directly for the kudos-counter design in §4 below — this proposal follows the codebase's real, already-proven pattern rather than introducing multi-document transactions as Community's first-ever use of that machinery.
- Validation throughout the server uses Zod (`validators/*.js`), consulted via `middleware/validate.js` — new Community validators should follow the same convention.
- `ownershipChecks.js` and its per-resource `assertXOwnership` helper pattern is the established convention for "does this referenced resource belong to the right person" checks — reused below for comment-deletion and group-resolution logic.

---

## 1. Community scope (unchanged from Revision 2)

**MVP:** public activities, public profiles (opt-in, decoupled from activity visibility), Explore feed, Following feed, Kudos, flat Comments, Following, in-app Notifications, and — new as of this revision — minimal Comment/Activity Reporting (§7), now a **launch prerequisite**, not a later nice-to-have.

**Explicitly excluded, reconfirmed:** algorithmic/"For You" feed, trending, popularity ranking, a separate likes system, comment likes, comment threading, comment media, comment mentions, email notifications, push notifications, public follower/following counts or lists, opt-in exact-coordinate sharing, public gear display, destination-based discovery and in-feed search (still deferred to a later milestone, not excluded outright).

---

## 2. Public Activity Model & Field Matrix (finalized)

**No new Activity model is created.** The existing `Activity` document is reused; a whitelist-only public DTO builder (`toPublicActivityDTO`, in a new `communityService.js`, never in `activityService.js`) constructs the public representation field-by-field — never `{ ...activity }` or `{ ...activity.social }` spreads, anywhere, for exactly the reason spreads are dangerous: a private field added to the private object later would silently leak through a spread, but is invisible to (and therefore safe from) an explicit whitelist.

### Two schema additions, both approved

**`publicCaption`** — new field. **Placement decision, as requested:** it does **not** belong inside the existing `review` sub-object. `review` (`rating`, `challenges`, `notes`) is conceptually the *private reflection* section of an activity — nesting a field explicitly meant for public consumption inside it blurs that boundary and makes an eventual bug (someone builds a "return the whole review block" convenience function for some other reason and it silently exposes a public-adjacent field, or vice versa) more likely. `publicCaption` is added as a **new top-level field, sibling to `visibility` and `coverPhotoId`** — the same tier as the other Community-relevant, cross-cutting flags:

```text
Activity.publicCaption: { type: String, trim: true, maxlength: 500, default: '' }
```

`review.notes` is never read by `toPublicActivityDTO` under any circumstance, in any Community response — feed, activity detail, profile, notification hydration, nothing. This is the enforcement mechanism for "keep `review.notes` strictly private": it's not filtered out, it's simply never part of the query's public read path in the first place.

**`kudosCount`** — new field, denormalized aggregate. Full consistency design in §4.

### Field matrix

| Field | Classification | Notes |
|---|---|---|
| `name` | Public when chosen | |
| `activityNumber` | Never public | Internal per-user sequential identifier; public detail pages address by `_id`, not number. |
| `type`, `date` | Public when chosen | |
| `location.placeName`, `wilaya`, `country` | Public when chosen | This is the actual discovery value ("look where people went"). |
| `location.latitude` / `longitude` | **Never public — architectural invariant, no opt-in, ever, in this version.** | See dedicated note below. |
| `trail.*` (distance, duration, altitude, elevation, difficulty) | Public when chosen | |
| `conditions.*` | Public when chosen | |
| `social.groupId` → resolved to **group name only** | **Public by default with the activity** | Resolved server-side; see resolution mechanism below. |
| `social.companions` | **Never public** | Named individuals who never consented to public exposure. |
| `costDzd` | **Never public** | |
| `review.rating` | Public when chosen | |
| `review.challenges` | Public when chosen | |
| `review.notes` | **Never public, under any circumstance** | Enforced structurally, not by filtering — see above. |
| `publicCaption` | Public when chosen (and only meaningful when set) | New field, see above. |
| `destinationId` → resolved to `{ name, wilaya }` only | Public but transformed | Never the full private `Destination` document (which can carry the owner's own private `notes`/`links`). |
| `gearItemIds` | **Never public, excluded entirely in this version** | `GearItem` carries price/store/notes — private financial/personal inventory data, out of scope for any public read path. |
| `photos` / `coverPhotoId` | Public when chosen, inherits parent Activity visibility | No independent per-photo visibility flag. |
| `kudosCount` | Public — this is the point of it | See §4. |
| `visibility` | Control field, not content | Single source of truth, unchanged. |

**Group resolution mechanism**, concretely: `communityService` resolves `social.groupId` via `Group.findById(groupId).select('name').lean()` and includes only `{ groupName: '<name>' }` in the public DTO's social section — deliberately renamed from `groupId` to `groupName` in the output shape, so it's structurally obvious at every call site that this is already-resolved, already-redacted public data, never the raw reference. If the group has been deleted (the codebase's already-documented dangling-reference behavior — see `PROGRESS.md`'s Known Issues), the resolver returns `null` and `groupName` is simply omitted from the response, not an error.

### Exact coordinates — architectural invariant (finalized)

Per your instruction, this is now a **hard invariant**, not a recommendation: `toPublicActivityDTO` never reads `location.latitude`/`location.longitude` under any circumstance. This is enforced the same way `review.notes` is — by never being part of the whitelist, not by being stripped after the fact. `location.placeName`/`wilaya`/`country` remain the only geographic information ever exposed through any Community endpoint. There is no code path in this design — present or future without a further explicit product decision — through which exact coordinates could reach a public response, because the query/serialization layer that has access to them (`activityService.js`) is entirely separate from the one that's ever exposed publicly (`communityService.js`), and the latter's whitelist simply doesn't include those fields as a possibility.

---

## 3. Public Profile Model & Field Matrix (finalized, unchanged in substance from Revision 2)

`User.isPublicProfile: Boolean, default: false` — new field, decoupled from activity visibility (a user can have public activities with no public profile, or a public profile with zero public activities).

| Field | Classification |
|---|---|
| `name`, `username`, `profilePicture`, `bio`, `location` | Public when profile is public |
| Statistics | Public but **recomputed scoped to public activities only** — never the user's real totals, which would leak the existence/scale of private activity data through aggregation even with no individual activity exposed. A dedicated query, entirely separate from `statisticsService.js`. |
| Follower/following counts or lists | **Never public in this version** — see §6. |
| `email`, `preferences`, `passwordHash`, `googleId`, `authProviders` | Never public |

---

## 4. Kudos Architecture (finalized — full consistency design)

### Two sources of truth, deliberately

- **`Kudos` collection** — the authoritative record of *who* gave kudos to *what*. Used for duplicate prevention and "have I kudos'd this?" checks.
- **`Activity.kudosCount`** — a denormalized, read-optimized integer, used everywhere a count needs to be displayed (feed cards, activity detail). It is *derived from* the Kudos collection and must never be treated as authoritative on its own — it can, in principle, always be recomputed via `Kudos.countDocuments({ activityId })` if a reconciliation is ever needed.

```text
Kudos
{
  _id,
  activityId,   // ref Activity — must be visibility: 'public' at write time
  userId,       // ref User — who gave it
  createdAt
}
```

**Index:** `{ activityId: 1, userId: 1 }`, **unique** — this single index does three jobs: prevents duplicate kudos at the database level (not just application-level), serves "has user X kudos'd activity Y?" lookups directly, and serves per-activity kudos listing if ever needed.

### Give-kudos flow (the actual consistency strategy)

1. Reject up front if `activity.userId === req.userId` (self-kudos) or if `activity.visibility !== 'public'` (initial check — re-verified atomically in step 3 regardless, per the hard "never trust a previous read" rule).
2. Attempt `Kudos.create({ activityId, userId })`. If this throws a duplicate-key error (the unique index firing), treat it as an **idempotent no-op**: return the current state successfully (not an error) — a double-click or duplicate request from the same user should not surface as a failure, and critically, **no counter increment and no notification occur on this path**, satisfying "notification is created only when a new kudos is actually created."
3. If the create in step 2 succeeded (a genuinely new Kudos document), atomically increment the counter with a **guarded update**: `Activity.updateOne({ _id: activityId, visibility: 'public' }, { $inc: { kudosCount: 1 } })`. This re-verifies visibility at the exact moment of the write, closing the narrow race window where the activity could have flipped private between step 1's check and this step.
4. **If step 3 matches zero documents** (the rare race where the activity went private in that window): compensate by deleting the Kudos document just created in step 2 (`Kudos.deleteOne({ activityId, userId })`), and return an error indicating the activity is no longer public. This is a simple two-step compensating action within normal application code — **not** a MongoDB multi-document transaction, deliberately, consistent with §0's finding that the codebase has no existing transaction usage and its stated architectural preference (`02_TECHNICAL_ARCHITECTURE.md` §39) to avoid transactions where a simpler mechanism suffices.
5. Only on a successful step 3 does the notification get created (via the shared `notifyService.create()` helper from §8).

### Remove-kudos flow

1. `Kudos.findOneAndDelete({ activityId, userId })` — atomic; if nothing matched (already removed, or never existed), it's a no-op, return success, no counter change.
2. If a document was actually deleted, decrement with a **guard against going negative**: `Activity.updateOne({ _id: activityId, kudosCount: { $gt: 0 } }, { $inc: { kudosCount: -1 } })` — the `$gt: 0` condition makes it structurally impossible for the counter to go below zero even under a hypothetical double-request race, since Mongo simply won't match/apply the update if the count is already `0`.
3. Per your explicit instruction: the historical notification created when the kudos was originally given is **not** retracted. No architectural reason surfaced during this review to change that.

### Why this is safe under concurrency, explicitly

- Two simultaneous **give** requests from the same user: the unique index guarantees only one `Kudos.create` succeeds; the other hits step 2's duplicate-key branch and becomes a no-op. Exactly one increment happens.
- Two simultaneous **remove** requests: `findOneAndDelete` is atomic at the document level; only one call actually deletes anything. Exactly one decrement happens.
- A **give** racing a **remove** for the same user/activity: each operation type only proceeds past its atomic first step if it actually changed the Kudos document's existence state, so the counter only ever moves in lockstep with a real create/delete — it cannot double-count or double-remove.
- The **known, accepted, extremely narrow edge case**: a give request's step 2 (Kudos create) and step 3 (guarded increment) are two separate operations, not one atomic unit — so there is a small window where a Kudos document could theoretically exist without an incremented counter, if the compensating delete in step 4 itself failed (e.g., a process crash between steps 3 and 4). This is judged acceptable because (a) it requires two independent low-probability events to coincide, (b) the consequence is a display-only count drifting from the true `Kudos.countDocuments` value by at most 1, not a security or privacy issue, and (c) the fix if it's ever observed is a trivial reconciliation script (`Activity.updateOne({_id}, {kudosCount: await Kudos.countDocuments({activityId})})`), which doesn't need to exist proactively for a problem that hasn't occurred. This is an engineering judgment call, documented rather than silently made.

---

## 5. Comments Architecture (finalized — unchanged from Revision 2, reporting cross-referenced)

```text
Comment
{
  _id,
  activityId,   // ref Activity — must be visibility: 'public' at write time, re-verified, not assumed
  userId,       // ref User, author
  text,         // trimmed, required, maxlength ~1000
  editedAt,     // null until edited
  createdAt,
  updatedAt
}
```

**Index:** `{ activityId: 1, createdAt: 1 }` — the only access pattern comments need (chronological listing per activity).

**Deletion:** comment author (`comment.userId === req.userId`) or activity owner (`activity.userId === req.userId`) — a new `assertCanDeleteComment(userId, comment, activity)` helper, following the codebase's existing `assertXOwnership` naming/shape convention. **Hard delete**, consistent with `05_DATA_MODEL_AND_API_CONTRACT.md` §59's existing default.

**Editing:** author only, no time window, sets `editedAt` (client renders "(edited)").

**Moderation in this version = deletion (self/owner) + reporting (§7).** No profanity filter, no auto-moderation.

---

## 6. Following Architecture (finalized, including the resolved edge case)

```text
Follow
{
  _id,
  followerId,   // ref User
  followingId,  // ref User
  createdAt
}
```

**Index:** `{ followerId: 1, followingId: 1 }`, **unique** — this is the only index created at this stage. It directly serves duplicate-follow prevention and "is A already following B?" checks. **The previously-discussed `{ followingId: 1, createdAt: -1 }` index is explicitly deferred**, per your instruction — it would only be needed for a followers-list or followers-count feature, and neither exists in this version. If a future approved feature needs it, it can be added then, with its own justification at that time.

**Following feed query** doesn't need this deferred index either: it goes `followerId → followingId list` (served by the unique index's prefix) then queries `Activity` by `{ visibility: 'public', userId: { $in: followingIds }, ...date sort }`, which uses the `{ visibility: 1, date: -1 }` index from §9, not anything on `Follow`.

**Follow eligibility:** a user may only follow a target whose `isPublicProfile === true` at the moment of the follow request — enforced server-side at write time (`optionalAuthenticate`-gated route, but the follow-write itself always requires real authentication).

**Self-follow:** blocked (`followerId !== followingId`), engineering default, no coherent product meaning otherwise.

### Resolved edge case: what happens when a followed user turns their public profile off?

You asked this to be explicitly verified and documented. Resolution:

- The `Follow` record is **not** deleted automatically (per your instruction).
- The followed user's **profile page** (`GET /api/community/users/:username`) starts returning `404` immediately, same as for anyone without a public profile.
- **New** follow requests targeting them are rejected (the eligibility check above).
- **However, their individually-public activities continue to appear in their existing followers' Following feeds.** This is a deliberate, principled resolution, not an oversight: `isPublicProfile` and `Activity.visibility` were explicitly decoupled as separate, orthogonal flags earlier in this process specifically so a user could have public activities without a discoverable profile. The Following feed's query only ever checks `Activity.visibility === 'public'` for followed authors — the exact same check Explore uses for literally everyone. Making Following-feed visibility *additionally* depend on `isPublicProfile` would mean the same activity is visible to a stranger browsing Explore but invisible to someone who already follows that person — a confusing, privacy-theater-only carve-out, since the activity itself is exactly as public either way and Explore already proves that. The `isPublicProfile` flag's actual effect is: whether you have a browsable profile page, and whether new people can start following you. It was never meant to be a secondary global content-visibility gate — `Activity.visibility` already is that gate, on its own.
- A follower can unfollow at any time, exactly as before — nothing about this behavior removes that ability.

This follows directly from applying the earlier decoupling decision consistently, rather than introducing a new rule — flagged here for your explicit awareness and override if you disagree with this reading.

---

## 7. Reporting Architecture (new — required before public comments launch, per your instruction)

### Smallest design that fits the existing architecture

No admin/moderator role or dashboard exists anywhere in the current codebase (§0), and building one is explicitly out of scope ("do NOT build an elaborate moderation dashboard"). The minimal design that satisfies "a user has a real in-product escape hatch for abuse" without inventing new authorization infrastructure:

```text
Report
{
  _id,
  reporterUserId,   // ref User — who filed it
  targetType,       // 'comment' | 'activity'
  targetId,         // ref, interpreted per targetType
  reason,           // controlled enum — see below
  details,          // optional free text, maxlength ~500
  status,           // 'open' | 'resolved' | 'dismissed' — default 'open'
  createdAt,
  resolvedAt,       // null until resolved
}
```

**`reason` enum** (small, matches "minimal" instruction): `spam`, `harassment`, `inappropriate_content`, `other`.

### Answering your specific questions

- **Can users report a comment?** Yes — `targetType: 'comment'`.
- **Should activity reporting also exist before launch, given activities themselves are public?** Recommend **yes** — the model generalizes to `targetType: 'activity'` at essentially no extra cost, and it would be an inconsistent gap to let people flag an abusive comment but have no recourse for an abusive public activity itself (name, caption, or photos). Recommend including both from the start.
- **Can someone report their own content?** No — blocked server-side (`reporterUserId !== ` the target's owner), engineering default; the owner already has direct delete rights over their own content, so a self-report has no purpose.
- **Can the same user report the same target repeatedly?** No — a **unique compound index** on `{ reporterUserId: 1, targetType: 1, targetId: 1 }` allows exactly one report per (reporter, target) pair. This is both the simplest possible design and the primary spam-resistance mechanism for the endpoint itself (see below). If a genuinely new, separate incident involving the same target occurs later, that's a product question for a future iteration, not this version.
- **Who can resolve/review reports?** — this is the one place this design cannot avoid a real, still-open question. See §16.
- **Where does the report go if there's no moderation UI?** It's durably stored in the `Report` collection, queryable directly (e.g., a simple read-only script or a direct database query filtered on `status: 'open'`) — this satisfies "a real in-product escape hatch for the reporting *user*" without requiring a reviewing *interface* to exist yet. The escape hatch is that the report is filed and persisted, not that it's immediately actioned by a UI.
- **What happens to a report if the underlying comment/activity is later deleted?** The `Report` document is left as-is — it becomes self-evidently moot on manual review (the target no longer resolves to anything), and no automatic cascade-delete or status change is applied. Simplest correct behavior, no special-casing needed.
- **Can a reported target later become private?** Yes, and nothing special happens — the report record persists regardless; if it's ever manually reviewed, the reviewer will simply find the target is no longer publicly visible, which is itself relevant context, not a bug to handle.
- **How is the reporting endpoint itself prevented from becoming a spam vector?** Three layers: (1) requires real authentication, (2) the unique-per-(reporter,target) index caps any single user's reports on any single target at one, and (3) — per your explicit instruction — the report-write endpoint is included in the pre-launch rate-limiting scope (§14).

**Indexes:** the unique compound above, plus `{ status: 1, createdAt: 1 }` to support ordered review even without a dedicated UI (useful for a direct query or a future minimal admin listing).

---

## 8. Notifications Architecture (finalized, unchanged from Revision 2)

```text
Notification
{
  _id, recipientUserId, actorUserId, type,   // 'kudos' | 'comment' | 'follow'
  activityId,   // present for kudos/comment, null for follow
  commentId,    // present only for comment, null otherwise
  isRead, createdAt
}
```

**Indexes:** `{ recipientUserId: 1, createdAt: -1 }` (inbox), `{ recipientUserId: 1, isRead: 1 }` (unread-count badge).

Synchronous writes, no queue. Self-notifications suppressed. Kudos-removal/comment-deletion/unfollow do not retract prior notifications. Broken/now-private references render a safe generic fallback rather than re-fetching content the recipient may no longer be entitled to see in its current state — this now explicitly includes the case where a notification references content whose *actor* account has since been deleted, in addition to the activity/comment cases already covered: render a generic "someone" fallback rather than failing to resolve `actorUserId`. In-app only — no email/push infrastructure exists in the stack and none is introduced for this.

---

## 9. Feed Architecture (finalized, unchanged from Revision 2)

Two scopes, one query shape, no new infrastructure — no fan-out-on-write, no feed-entry collection, no event bus, no queue, no WebSockets, no caching layer, confirmed as still appropriate after this round of repository inspection (nothing found that changes this).

- **Explore**: `Activity.find({ visibility: 'public', ...filters }).sort({ date: -1, _id: -1 })`, cursor-paginated, using `{ visibility: 1, date: -1 }`.
- **Following**: `followerId → followingId list` (via `Follow`'s unique index prefix), then the same Activity query with `userId: { $in: followingIds }` added.
- Both strictly chronological — no ranking difference between them.

---

## 10. Consolidated Security Threat Table

| Threat | Mitigation |
|---|---|
| Private activity retrieved via any public endpoint | Every community query filters `visibility: 'public'` at the database level; non-distinguishing `404` otherwise. |
| Companions/cost/gear/exact-coordinates/private-notes leak through a public activity | Whitelist-only DTO — these fields are never read into the response object, not merely stripped (§2). |
| `social` object accidentally spread, leaking `companions` alongside the approved `groupName` | Explicit field-by-field construction is a hard rule for every public DTO builder — no `{ ...obj }` spreads on any object containing both public and private fields, anywhere in `communityService.js`. |
| Comment posted or read on a private activity | Write- and read-time re-verification of the parent activity's *current* visibility — never assumed from an earlier fetch. |
| Unauthorized comment deletion | `assertCanDeleteComment` checks both the author and activity-owner branches explicitly. |
| Kudos on a private activity, duplicate kudos, negative counter, self-kudos | Full flow in §4 — unique index, guarded atomic increment/decrement, self-kudos block, compensating rollback. |
| Follow used to bypass privacy | Following grants **zero** additional read access by construction — the Following feed only ever reads already-`visibility:'public'` activities (§6, §9). |
| Following a private-profile user | Blocked at write time via the `isPublicProfile` eligibility check (§6). |
| Cross-user notification leakage | Every notification query scoped by `recipientUserId: req.userId`; broken/stale references render safely rather than re-fetching (§8). |
| Report endpoint abused as a spam vector | Unique per-(reporter, target) index + required auth + rate limiting (§7, §14). |
| Self-reporting used to pre-empt or game moderation | Blocked server-side (§7). |

**Cross-cutting rules, unchanged and fully reused throughout:** query/filter at the database level, never fetch-then-filter in application code; explicit whitelist DTOs, never raw Mongoose documents returned from any Community endpoint; identity always derived from the verified server-side session, never from request body/query; non-distinguishing `404`s; re-check current state at write time, never trust a previously-fetched value.

---

## 11. Indexes — consolidated, final

```text
Activity:      { visibility: 1, date: -1 }                       (feed queries, both scopes)
Comment:       { activityId: 1, createdAt: 1 }                   (comment listing)
Kudos:         { activityId: 1, userId: 1 }  UNIQUE               (dedupe + existence checks)
Follow:        { followerId: 1, followingId: 1 }  UNIQUE          (dedupe + eligibility checks)
Notification:  { recipientUserId: 1, createdAt: -1 }              (inbox)
               { recipientUserId: 1, isRead: 1 }                  (unread-count badge)
Report:        { reporterUserId: 1, targetType: 1, targetId: 1 }  UNIQUE  (dedupe + spam resistance)
               { status: 1, createdAt: 1 }                        (review ordering, even without a UI)
```

**Explicitly deferred, per your instruction:** `Follow`'s `{ followingId: 1, createdAt: -1 }` — no current query needs it; add only if a future approved feature (followers list/count) requires it, with its own justification at that time.

---

## 12. Landing Page

Unchanged — M0, independent milestone, an actual introduction to Cairn (purpose, visual identity per `03_UX_DESIGN_SPEC.md`, core loop, feature overview, Sign Up / Log In CTAs), not a generic SaaS landing page, sequenced before or alongside Community Foundation and landing no later than immediately before the first public-facing Community screen ships.

---

## 13. Implementation Milestones — revised testing philosophy

Per your explicit instruction, **every milestone now carries its own required authorization/privacy tests as part of its own definition of done** — security is no longer front-loaded to a single later pass. M9 becomes the final *cross-feature* audit, not the first security work.

```text
M0 — Landing Page
      Independent.

M1 — Community Foundation
      User.isPublicProfile. Activity.publicCaption, Activity.kudosCount (schema only,
      both default-safe, no migration needed). optionalAuthenticate middleware.
      Whitelist-only public DTO builders (activity + profile). New Activity index.
      Notification model + shared notifyService.create() write helper.
      Tests: DTO builders return no private fields when unit-tested directly against
      a fixture activity/user containing every private field populated.

M2 — Public Activity View
      GET /api/community/activities/:id + public activity detail page.
      Tests: private activity → 404. Public → private flips immediately (no caching).
      Response contains no coordinates/companions/cost/gear/review.notes even when
      the fixture activity has all of them populated.

M3 — Public Profiles
      GET /api/community/users/:username (+ scoped statistics, + their public
      activities). "Public profile" toggle in Settings.
      Tests: non-opted-in user → 404. Statistics reflect only public activities, not
      real totals, verified against a fixture user with both public and private
      activities.

M4 — Explore Feed
      GET /api/community/feed?scope=explore, filters, cursor pagination.
      Tests: private activities never appear regardless of filters; pagination
      doesn't skip/duplicate across pages.

M5 — Kudos
      Full flow from §4. Tests: kudos on private activity rejected; duplicate kudos
      is a no-op, not a second row; concurrent give requests produce exactly one
      counter increment; remove is idempotent and never goes negative; self-kudos
      rejected; notification created only on genuine first-time give.

M6 — Comments
      Full flow from §5. Tests: comment write/read blocked on private activities;
      only author or activity owner can delete; only author can edit; deletion by
      an unrelated user rejected.

M7 — Reporting
      Report model + create endpoint (comment and activity targets). Tests:
      duplicate report from same user on same target rejected; self-report
      rejected; report on nonexistent target rejected cleanly.
      **Per your instruction, this milestone must ship before public Comments can
      be considered launch-ready — sequenced here, directly after Comments, rather
      than deferred.**

M8 — Following
      Full flow from §6, including the resolved profile-toggle edge case. Tests:
      cannot follow a non-public-profile user; cannot self-follow; cannot follow
      twice; unfollow is idempotent; Following feed never exposes anything Explore
      wouldn't also show the same user.

M9 — Notifications Inbox
      GET /notifications, unread-count, mark-read, mark-all-read, bell + badge UI.
      Tests: a user can only ever read their own notifications; broken/stale
      references (deleted comment, now-private activity, deleted actor) render
      safely without re-fetching or erroring.

M10 — Cross-Feature Security Audit (final pass, not first pass)
      A consolidated test-community-flow.sh exercising every row in §10's table
      end-to-end, across features together (e.g., a comment-then-report-then-
      activity-deletion sequence), not just each feature in isolation as covered
      by M2–M9's own tests. Confirms the rate-limiting dependency (§14) is in
      place before sign-off.

M11 — Polish
      Visual/UX pass against 03_UX_DESIGN_SPEC.md. Empty states. Mobile
      responsiveness across feed, activity detail, profile, comments,
      notifications, and reporting UI.
```

Each milestone ships in a working, demoable, *and independently security-tested* state before the next begins.

---

## 14. Rate Limiting — explicit pre-launch dependency

Unchanged in substance, restated explicitly per your instruction: before Community's **public** launch (not before each individual milestone lands in a non-public/staging state), rate limiting must cover, at minimum:

```text
/api/auth/*                              (pre-existing Must-Fix item, unchanged)
/api/community/activities/:id/kudos      (give + remove)
/api/community/activities/:id/comments   (create)
/api/community/comments/:id              (edit, delete — lower risk, but included for consistency)
/api/community/users/:username/follow    (follow + unfollow)
/api/community/reports                   (create)
```

This proposal does not implement rate limiting itself — it is recorded here as an explicit, non-negotiable dependency of the "public launch" milestone, consistent with `07_POST_V1_ROADMAP.md`'s A1 item, whose scope was already broadened to cover this in the previous revision.

---

## 15. Resolved Decisions Log

All eight items previously listed as open are now resolved by explicit product-owner decision, as reflected throughout this document:

1. **`publicCaption` vs. exposing `review.notes`** → new top-level `publicCaption` field; `review.notes` never public, ever (§2).
2. **Group visibility** → group name public by default with the activity, resolved server-side, never the raw `social` object (§2).
3. **Kudos count** → denormalized `Activity.kudosCount`, full consistency strategy documented (§4).
4. **Exact coordinates** → architectural invariant, never public, no opt-in, enforced structurally (§2).
5. **Following eligibility** → public-profile-required-to-follow; edge case of a followed user later going private resolved — activities remain visible in Following feed exactly as they remain visible in Explore, since `Activity.visibility` (not `isPublicProfile`) is the actual content gate (§6).
6. **Follower/following visibility** → private to account owner only, no public counts or lists (§3, §6).
7. **Comment/activity reporting** → required before public Comments launch; minimal `Report` model designed, no admin role introduced (§7).
8. **Deferred Follow index** → `{ followingId, createdAt }` not created; only the unique `{ followerId, followingId }` index exists for now (§6, §11).

---

## 16. Report Review — RESOLVED (product-owner decision, 2026-09-09)

**Decision: Option (a).** `Report` records are stored and reviewed manually/out-of-band for now. No `role`/`isModerator` field is added to `User`, no admin authorization surface is introduced, and no in-app review UI is built in this version. The filing mechanism in §7 (the actual in-product escape hatch for the reporting user) is unaffected by this choice — it's fully specified and unchanged. Review happens via direct database access to the `Report` collection (e.g., `db.reports.find({ status: 'open' }).sort({ createdAt: 1 })`), which the `{ status: 1, createdAt: 1 }` index already supports.

This closes the last open item from this proposal. **All eight items from the Resolved Decisions Log (§15) plus this one are now final.** There are no remaining PRODUCT OWNER DECISION REQUIRED items — the architecture is ready for implementation.

---

## Report to the product owner

**1. What was inspected:** `Activity.js`, `User.js`, `GearItem.js`, `Photo.js`, `Destination.js`, `Group.js`, `Counter.js`, `activity.routes.js`, `authenticate.js`, `ownershipChecks.js`, `app.js`, `activityValidators.js`, `activityController.js`/`activityService.js` (visibility handling), and a repo-wide search confirming no transaction usage and no admin/role concept exists anywhere in `server/src`.

**2. What changed in each document:**
- `08_COMMUNITY_PROPOSAL.md` — fully rewritten as a self-contained Revision 3 (see the note at the top of this file explaining why: Revision 2 referenced content from Revision 1 that had been overwritten and no longer existed in the repository — a documentation-process mistake, now corrected structurally so it can't recur, by making each revision self-contained rather than layered-by-reference).
- `07_POST_V1_ROADMAP.md` and `docs/PROGRESS.md` — see the accompanying updates in this same response; both now reflect "Community direction approved → architecture finalized (Revision 3) → implementation not started," without claiming any milestone is complete.

**3. Contradiction discovered:** the one described above (§ intro note) — Revision 2's cross-references to a deleted Revision 1 section. No other contradictions found between the docs and the actual repository; the repository matched `HANDOVER.md`/`PROGRESS.md`'s description in every other respect checked.

**4. Remaining PRODUCT OWNER DECISION REQUIRED:** exactly one — §16, who/how reports get reviewed, with a recommendation given.

**5. Engineering decisions made autonomously (documented, not silently made):**
- Idempotent-success (not an error) response for a duplicate kudos-give request.
- Compensating two-step rollback for the kudos-counter race, rather than a MongoDB transaction (§4, justified against §0's finding that transactions aren't used anywhere else in the codebase).
- `publicCaption` placed as a new top-level field rather than nested in `review`.
- Group name resolved and renamed to `groupName` in public output, never the raw `groupId`/object.
- Including `targetType: 'activity'` in Reporting alongside `'comment'`, since it was free given the model design.
- Blocking self-reporting.
- The resolution of the "followed user turns off public profile" edge case (§6) — determined by consistent application of the earlier, already-approved decoupling decision, not a new product call, but flagged prominently since you asked for it to be verified and documented explicitly.

**6. Final milestone/dependency order:** M0 Landing Page → M1 Community Foundation → M2 Public Activity View → M3 Public Profiles → M4 Explore Feed → M5 Kudos → M6 Comments → M7 Reporting → M8 Following → M9 Notifications Inbox → M10 Cross-Feature Security Audit → M11 Polish. Full detail and per-milestone tests in §13.

**7. What must be completed before public Community launch specifically (not just before each milestone lands):** M0–M11 all complete; rate limiting extended per §14; §16 resolved one way or the other (even choosing option (a) is a resolution — it just needs to be an explicit choice, not a default by omission).

**8. Confirmation: no application code was changed.** Only `docs/08_COMMUNITY_PROPOSAL.md`, `docs/07_POST_V1_ROADMAP.md`, and `docs/PROGRESS.md` were touched this turn, in the local working copy of the repository — none of it has been pushed anywhere, since write access to the actual GitHub repository isn't available in this environment.

Waiting for your decision on §16, and your go-ahead, before any M0/M1 implementation begins.
