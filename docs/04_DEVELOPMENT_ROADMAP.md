# Cairn — Development Roadmap

## 1. Purpose

This roadmap defines how Cairn should be developed from an empty repository into the first polished version.

The goal is not to build every future feature immediately.

The goal is to build a strong, usable V1 that already embodies the final product vision and has a clean foundation for future expansion.

Claude must follow this roadmap sequentially.

Do not skip ahead because a future feature appears interesting.

Do not implement community, AI, advanced maps, or other future functionality before the current milestone is complete.

---

# 2. Development Philosophy

Cairn should be built vertically.

Each milestone should produce something that actually works.

Prefer:

```text
Build
→ Run
→ Test
→ Review
→ Refine
→ Continue
```

over:

```text
Build everything
→ discover problems at the end
```

The user should be able to inspect and test the application after every major milestone.

---

# 3. Development Phases

The recommended order is:

```text
Phase 0 — Project foundation
Phase 1 — Authentication
Phase 2 — Core shell & navigation
Phase 3 — Activities
Phase 4 — Gear
Phase 5 — Planned activities
Phase 6 — Pack My Bag
Phase 7 — Destinations
Phase 8 — Statistics
Phase 9 — Profile & settings
Phase 10 — Data management
Phase 11 — Polish & responsive UX
Phase 12 — Testing & deployment
Phase 13 — Future community
```

The final phase is explicitly outside the initial V1.

---

# 4. Phase 0 — Project Foundation

## Objective

Create the technical foundation before building product functionality.

Implement:

* Repository
* Client
* Server
* Environment configuration
* MongoDB Atlas connection
* Express server
* React/Vite application
* Basic API structure
* Error handling foundation
* Validation foundation
* Git configuration
* README

Expected structure:

```text
cairn/
├── client/
├── server/
├── docs/
├── .env.example
├── README.md
└── .gitignore
```

## Done when

* Frontend starts successfully.
* Backend starts successfully.
* Backend connects to MongoDB Atlas.
* Environment variables work.
* Frontend can communicate with backend.
* Basic health endpoint works.
* No secrets are committed.
* README explains local setup.

STOP HERE.

Do not begin application features until this foundation works.

---

# 5. Phase 1 — Authentication

## Objective

Create the user/account foundation.

Implement:

### Registration

* Name
* Email
* Password
* Username where appropriate

### Login

* Email/password

### Google login

* Google OAuth

### Session/authentication handling

* Secure authentication
* Protected routes
* Logout

### Account isolation

Every authenticated user must only access their own data.

## Done when

A user can:

```text
Register
↓
Login
↓
Reach authenticated application
↓
Refresh page
↓
Remain authenticated
↓
Logout
```

And User A cannot access User B's resources.

STOP HERE.

Test authorization before continuing.

---

# 6. Phase 2 — Application Shell

## Objective

Create the Cairn experience around the authenticated user.

Implement:

* Main navigation
* Home
* My Outdoors
* Gear
* Statistics
* Profile
* Responsive navigation
* Mobile navigation
* Page layouts
* Global design system
* Basic loading states
* Basic empty states

At this stage, pages can contain placeholders.

The objective is to establish:

```text
Cairn's visual identity
+
Navigation
+
Responsive structure
```

Do not build detailed functionality yet.

## Done when

A logged-in user can navigate naturally through the application on:

* Desktop
* Tablet
* Mobile

and the interface already feels recognizably like Cairn.

STOP HERE.

Review the visual direction before building the rest of the product.

---

# 7. Phase 3 — Activities

This is the first major product milestone.

## Objective

Allow a user to fully record and manage outdoor activities.

Implement:

### Activity creation

Fields should support:

```text
Name
Type
Date
Location
Wilaya
Coordinates
Distance
Duration
Maximum altitude
D+
D-
Difficulty
Weather
Temperature
Trail condition
Group
Companions
Cost
Rating
Challenges
Notes
Visibility
```

Not every field is mandatory.

---

## Activity numbering

Automatically assign:

```text
#1
#2
#3
...
```

per user.

Numbers must never be reused after deletion.

---

## Activity list

Implement:

* Activity cards
* Newest-first ordering
* Search
* Filters
* Sorting
* Pagination

---

## Activity detail

Implement:

* Hero image
* Activity information
* Trail statistics
* Conditions
* Group/companions
* Gear
* Photos
* Review
* Edit
* Delete

---

## Activity editing

Editing should reuse the same conceptual form as creation.

---

## Activity deletion

Require confirmation.

---

## Visibility

Implement:

```text
Private
Public
```

Default:

```text
Private
```

Public activities should NOT yet appear in a community feed.

---

## Photos

Integrate Cloudinary.

Implement:

* Upload
* Multiple photos
* Cover photo
* Remove photo

---

## Done when

The user can complete the entire journey:

```text
Log activity
↓
Save
↓
See it in history
↓
Open it
↓
See all information
↓
Edit it
↓
Delete it
```

and activity data survives page refresh and logout/login.

STOP HERE.

This is the first major review checkpoint.

---

# 8. Phase 4 — Gear

## Objective

Create the user's outdoor closet.

Implement:

* Add gear
* Edit gear
* Delete gear
* Gear list
* Categories
* Search
* Filters
* Gear detail

Fields:

```text
Name
Category
Brand
Model
Quantity
Weight
Purchase date
Purchase price
Condition
Photo
Store
Product URL
Notes
```

---

## Gear ↔ Activity

Allow activity logging to select gear from the user's closet.

Implement:

```text
Activity
    ↓
Gear used
```

and:

```text
Gear
    ↓
Usage history
    ↓
Activity #18
Activity #15
Activity #11
...
```

The relationship must be automatic.

The user should not manually maintain gear history.

---

## Done when

A user can:

```text
Create gear
↓
Use gear in Activity #1
↓
Use same gear in Activity #2
↓
Open gear
↓
See both activities in its history
```

STOP HERE.

---

# 9. Phase 5 — Planned Activities

## Objective

Allow users to plan future outdoor activities.

Implement:

* Create planned activity
* Edit
* Delete
* View
* Status
* Planned date
* Destination reference
* Group
* Companions
* Estimated cost
* Expected difficulty
* Notes

Statuses can initially be:

```text
Planned
Ready
Completed
Cancelled
```

Do not overcomplicate planning.

---

# 10. Planned Activity → Activity

Implement:

```text
Planned Activity
        ↓
"Log this activity"
        ↓
Activity form
        ↓
Pre-filled information
        ↓
User reviews/modifies
        ↓
Create Activity
        ↓
Mark plan completed
```

The original planned activity must remain stored.

The completed activity becomes a separate historical record.

---

# 11. Phase 6 — Pack My Bag

## Objective

Create the practical backpack preparation experience.

This should be associated with a planned activity.

Implement:

```text
Planned Activity
↓
Prepare my bag
↓
Search gear
↓
Filter gear
↓
Select gear
↓
See packed items
↓
See total weight
```

The user can add/remove gear.

Total weight updates immediately.

Example:

```text
Backpack
+ Sleeping bag
+ Tent
+ Jacket
+ Headlamp
+ Water

Total:
7.4 kg
```

Do not allow gear belonging to another user to be selected.

---

# 12. Phase 7 — Destinations

## Objective

Create a separate destination/wishlist system.

Implement:

* Add destination
* Edit
* Delete
* Search
* Filter
* Status
* Target date
* Location
* Coordinates
* Image
* Notes
* Links

Destinations are independent from planned activities.

Example:

```text
Destination:
Sahara

Planned Activity:
Sahara Trek — October 2026
```

The destination can exist before or after the plan.

---

# 13. Phase 8 — Statistics

## Objective

Turn the user's activity history into an understandable representation of their outdoor journey.

Implement:

### Core statistics

```text
Total activities
Total distance
Total duration
Total elevation gain
Total elevation loss
Highest altitude
```

### Personal records

```text
Highest peak
Longest activity
Hardest activity
Highest-rated activity
```

### Breakdown

```text
Activities by type
Activities by difficulty
Activities by year
Activities by Wilaya
```

---

# 14. Statistics Design

Statistics should not feel like Excel.

Prioritize:

```text
Big meaningful numbers
+
Personal records
+
Simple visualizations
+
Photos
```

Avoid unnecessary graphs.

The purpose is to help the user understand their journey.

---

# 15. Outdoor Journey / Playback

If the implementation is stable enough, introduce the first version of the visual memory experience.

Potential concept:

```text
Your Journey

2024
↓
2025
↓
2026
```

with photographs and activity highlights.

This should remain visually calm.

If this becomes too complex for V1, defer it.

The core statistics take priority.

---

# 16. Phase 9 — Profile & Settings

Implement profile:

```text
Name
Username
Profile picture
Bio
Location
```

Implement settings:

### Account

* Email
* Change password
* Connected authentication providers

### Appearance

* Light
* Dark
* System

### Privacy

* Default activity visibility

### Data

* Export data
* Delete account

Do not create settings that have no actual functionality.

---

# 17. Phase 10 — Data Management

## Export

Implement a user-accessible export function.

Initial export can include:

```text
Profile
Activities
Planned activities
Destinations
Gear
Groups
Companions
```

JSON and/or CSV can be used.

---

## Account deletion

Implement secure account deletion.

Require explicit confirmation.

Delete all user-owned data.

Do not leave orphaned personal data behind.

Handle Cloudinary assets appropriately.

---

# 18. Phase 11 — Polish

Only after core functionality works should extensive polish begin.

Review:

### UX

* Navigation
* Forms
* Empty states
* Error states
* Loading states
* Confirmation dialogs

### Visual

* Typography
* Spacing
* Color
* Cards
* Images
* Icons
* Responsive behavior

### Mobile

Test:

```text
Phone portrait
Phone landscape
Tablet
Desktop
```

---

# 19. Phase 12 — Testing

Before deployment, test critical workflows.

## Authentication

```text
Register
Login
Logout
Google login
Password change
```

## Activities

```text
Create
Read
Edit
Delete
Search
Filter
Pagination
Photo upload
Gear selection
Visibility
```

## Planning

```text
Create plan
Edit plan
Prepare bag
Complete plan
```

## Gear

```text
Create
Edit
Delete
Search
Usage history
```

## Security

Test cross-user access.

This is mandatory.

---

# 20. Deployment

Deploy:

```text
Frontend
Backend
MongoDB Atlas
Cloudinary
```

Configure production environment variables.

Verify:

* HTTPS
* CORS
* Authentication
* OAuth redirect URLs
* Image uploads
* Database access
* Error handling

---

# 21. Definition of V1

Cairn V1 is complete when a user can independently:

```text
Create an account
        ↓
Enter Cairn
        ↓
Log outdoor activities
        ↓
View their activity history
        ↓
Search and filter activities
        ↓
View detailed activity memories
        ↓
Upload photos
        ↓
Manage their outdoor gear
        ↓
Track gear usage
        ↓
Plan future activities
        ↓
Prepare a backpack
        ↓
Track destinations
        ↓
View personal statistics
        ↓
Manage their profile
        ↓
Export their data
```

The product must be usable without community functionality.

---

# 22. Explicitly NOT V1

Do not implement these during the initial V1 unless the scope is explicitly changed:

```text
Community feed
Following
Followers
Kudos
Comments
Public user discovery
Group accounts
Group management
Messaging
Advanced social features
AI assistant
AI recommendations
Advanced route planning
GPX import/export
Live GPS tracking
Turn-by-turn navigation
Advanced trail mapping
Native mobile application
Marketplace
Notifications system
```

These belong to the future roadmap.

---

# 23. Future Phase — Community

After the personal product is stable, community can be introduced.

Potential flow:

```text
Explore
 ↓
Discover public activities
 ↓
Open activity
 ↓
See brief outdoor statistics
 ↓
Congratulate / give kudos
 ↓
Discover destination
 ↓
Visit another hiker's profile
```

The community should remain activity-centered.

---

# 24. Future Phase — Geographic Features

Later:

```text
Maps
Routes
GPX
Trail paths
Nearby activities
Nearby destinations
Elevation profiles
```

The existing latitude/longitude data should provide a foundation.

---

# 25. Future Phase — Native Mobile Application

Once the web product has proven its workflows, a native/mobile application can be considered.

The API should remain the central source of truth.

Potential mobile advantages:

* GPS
* Offline activity logging
* Camera integration
* Location tracking
* Easier outdoor use

Do not build the native application before the web application's product model is validated.

---

# 26. Future Phase — AI

AI is deliberately postponed.

AI should only be introduced if a real user problem has been identified.

Potential future applications:

* Activity summaries
* Packing recommendations
* Destination suggestions
* Gear recommendations
* Trail analysis
* Personal outdoor insights

But none of these are required for Cairn V1.

AI must never be added merely because the product is called an AI-era application.

---

# 27. Claude Development Rules

Claude must follow these rules while implementing Cairn:

### Rule 1

Do not build multiple major phases simultaneously.

### Rule 2

Do not silently expand the scope.

### Rule 3

If a technical decision affects the product architecture, explain it before implementing it.

### Rule 4

If a requirement is ambiguous, ask rather than inventing product behavior.

### Rule 5

Prefer the simplest implementation that satisfies the requirement.

### Rule 6

Do not replace working architecture with a more complicated architecture without justification.

### Rule 7

Do not add dependencies without a reason.

### Rule 8

Do not generate large amounts of code before verifying the current foundation.

### Rule 9

After each major milestone, report:

```text
Implemented
Changed
Files affected
Database changes
API changes
What was tested
Known limitations
Next milestone
```

### Rule 10

Do not claim something is complete without testing it.

---

# 28. Checkpoint Protocol

At the end of each major phase, Claude should stop and provide a checkpoint report.

Format:

```text
## Checkpoint — Phase X

### Completed
...

### Files changed
...

### Database changes
...

### API changes
...

### Tested
...

### Remaining issues
...

### Decisions requiring Sarah's input
...

### Next phase
...
```

Do not automatically continue into the next major phase if a product/design decision requires user approval.

---

# 29. Definition of Done

A feature is not “done” merely because code exists.

A feature is done when:

```text
UI exists
+
API exists where necessary
+
Database persistence works
+
Validation works
+
Authorization works
+
Error states work
+
Responsive behavior works
+
The main user flow has been tested
```

For user-owned data:

```text
Ownership isolation
```

is mandatory.

---

# 30. Final Development Principle

Cairn should evolve in this order:

```text
Foundation
    ↓
Identity
    ↓
Personal outdoor journal
    ↓
Gear system
    ↓
Planning
    ↓
Preparation
    ↓
Destinations
    ↓
Statistics
    ↓
Polish
    ↓
Community
    ↓
Geographic features
    ↓
Mobile
    ↓
Potential AI
```

The product should become deeper over time, not wider and messier.

The objective is not to ship the maximum number of features.

The objective is to make the core Cairn experience excellent:

> Plan your adventure. Prepare for it. Live it. Record it. Remember it. Understand your journey.
