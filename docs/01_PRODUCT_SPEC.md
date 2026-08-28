# Cairn — Product Specification

## 1. Product Overview

Cairn is a personal-first outdoor activity platform designed for hikers, trekkers, and campers.

It combines:

* Outdoor activity journaling
* Activity history
* Trip planning
* Backpack preparation
* Gear management
* Destination tracking
* Personal statistics
* Outdoor memories
* Eventually, a lightweight community

Cairn is not primarily a social network.

It is a personal outdoor companion that may eventually become a community of people sharing their outdoor journeys.

The core idea is:

> Plan your adventure. Prepare for it. Live it. Record it. Remember it. Understand your journey.

---

# 2. Product Philosophy

Cairn should feel like a place where the user's outdoor life is organized and preserved.

It should not feel like:

* A spreadsheet
* A productivity dashboard
* A generic SaaS application
* A traditional fitness tracker
* A dating application
* Another social-media feed

The experience should feel:

* Calm
* Natural
* Modern
* Minimal
* Organized
* Personal
* Comfortable
* Visually immersive

The interface should make information easier to breathe through rather than adding cognitive noise.

---

# 3. Target User

The primary user is someone who regularly participates in outdoor activities such as:

* Hiking
* Trekking
* Camping

The user may participate:

* Alone
* With friends
* With family
* With an organized outdoor/hiking group

The user does not need to manage the people participating in the entire trip.

Cairn records the user's personal experience.

---

# 4. Supported Activity Types

Cairn initially supports exactly three activity types:

```text
Hiking
Trekking
Camping
```

Hiking is the default activity type.

Additional activity types should not be added without a product decision.

---

# 5. Core User Journey

The central Cairn experience is:

```text
Discover / think about an adventure
        ↓
Save destination
        ↓
Plan activity
        ↓
Prepare backpack
        ↓
Go outdoors
        ↓
Log activity
        ↓
Attach gear + photos
        ↓
Review experience
        ↓
See it in activity history
        ↓
Statistics and memories
```

Not every user must follow every step.

A user should be able to quickly record an activity without having planned it in Cairn.

---

# 6. Main Navigation

The initial navigation should be:

```text
Home
My Outdoors
Gear
Statistics
Profile
```

Community/Explore is intentionally postponed.

If community functionality is later introduced, `Explore` can become a primary navigation destination.

---

# 7. Home

Home is the user's personal starting point.

It should provide a concise overview of the user's outdoor world.

Potential content:

* Recent activity
* Upcoming planned activity
* Current backpack preparation
* Personal statistics
* Favorite/recent destinations
* Outdoor journey highlights

Home should not become an information dump.

The most important information should be immediately understandable.

---

# 8. My Outdoors

My Outdoors is the main personal outdoor workspace.

It contains:

* Activities
* Planned activities
* Destinations

These should be clearly separated within the experience.

---

# 9. Activities

Activities are the user's historical outdoor experiences.

The user can:

* Create
* View
* Edit
* Delete
* Search
* Filter
* Sort

Activities are displayed primarily as cards/list items rather than as a spreadsheet.

Each activity should have:

* Cover image where available
* Activity name
* Activity number
* Date
* Destination/location
* Activity type
* Brief statistics

Example:

```text
#18
Cap Blanc

Hiking · 24 Aug 2026

12.4 km
+640 m
4h 20
```

The exact card design is a UI decision.

---

# 10. Activity Numbers

Activities receive sequential personal numbers.

Example:

```text
#1
#2
#3
...
#18
```

The number represents the chronological identity of the user's activities.

It does not determine display ordering.

A user may view the newest activity first while it remains Activity #18.

---

# 11. Activity Detail

Selecting an activity opens a rich activity page.

It should feel closer to viewing a memory/product page than opening a database record.

Potential sections:

### Overview

* Name
* Activity number
* Date
* Type
* Location
* Group
* Companions

### Trail

* Distance
* Duration
* Maximum altitude
* Elevation gain
* Elevation loss
* Difficulty

### Conditions

* Weather
* Temperature
* Trail conditions

### Cost

* Activity cost

### Gear

* Gear used

### Photos

* Activity photographs

### Review

* Rating
* Challenges
* Notes

The user can edit or delete the activity.

Deletion requires confirmation.

---

# 12. Quick Logging vs Detailed Logging

Cairn should not force users to provide every possible piece of information.

A user may be:

```text
"I just want to record that I went hiking today."
```

or:

```text
"I want to document absolutely everything."
```

Both should be supported.

Therefore, most activity fields should be optional.

The same underlying Activity model should support both experiences.

---

# 13. Activity Location

An activity can contain:

* Place name
* Wilaya
* Country
* Latitude
* Longitude

Coordinates establish a foundation for future geographic features.

Advanced route mapping is not required in V1.

---

# 14. Groups

Groups represent outdoor/hiking groups the user personally goes with.

Example:

```text
JJ
GOAT
Another hiking group
```

The user does not manage these organizations.

Cairn is not a group-management platform in V1.

The user simply records:

> I went on this activity with JJ.

---

# 15. Companions

Companions represent people the user remembers going with.

They can be:

* Friends
* Family
* Other people

They do not need Cairn accounts.

The user is not expected to record every participant.

---

# 16. Gear

Gear is the user's personal outdoor closet.

Users can record:

* Clothing
* Footwear
* Backpacks
* Shelter
* Sleeping equipment
* Cooking equipment
* Hydration equipment
* Navigation equipment
* Lighting
* Safety equipment
* Accessories
* Other equipment

Gear records can contain information such as:

* Name
* Brand
* Model
* Quantity
* Weight
* Purchase date
* Purchase price
* Condition
* Photo
* Store
* Product link
* Notes

---

# 17. Gear and Activities

When logging an activity, the user can select gear from their personal closet.

Example:

```text
Activity #18

Gear used:
- Columbia jacket
- Salomon shoes
- Headlamp
```

The relationship is automatic.

When the user later opens the Columbia jacket, Cairn can show:

```text
Used on:
#18
#15
#11
```

This creates a personal history for the gear.

---

# 18. Multiple Gear Items

Users may own multiple similar items.

For example:

```text
Salomon shoes
Salomon shoes
Columbia jacket
Columbia jacket
Black gloves
Winter gloves
Headlamp A
Headlamp B
```

Cairn must not assume that two items with the same brand/category are the same physical item.

---

# 19. Planned Activities

A planned activity represents something the user intends to do.

It may include:

* Name
* Type
* Date
* Destination
* Location
* Group
* Companions
* Estimated cost
* Expected difficulty
* Notes
* Status

Statuses:

```text
Planned
Ready
Completed
Cancelled
```

---

# 20. Completing a Planned Activity

A planned activity can become a completed activity.

The preferred flow is:

```text
Planned Activity
        ↓
Log this activity
        ↓
Activity form opens
        ↓
Information is pre-filled
        ↓
User updates actual information
        ↓
Activity is created
        ↓
Plan becomes Completed
```

The plan and activity remain conceptually separate.

The plan represents intention.

The activity represents reality.

---

# 21. Pack My Bag

Pack My Bag is a preparation feature associated with planned activities.

The user can:

* Open a planned activity
* Search their gear
* Filter gear
* Select gear
* Remove gear
* See what is packed
* See total weight

Example:

```text
Pack My Bag

✓ Tent              1.8 kg
✓ Sleeping bag      0.9 kg
✓ Jacket            0.4 kg
✓ Headlamp          0.1 kg

Total               3.2 kg
```

The user only packs gear they own.

---

# 22. Destinations

Destinations are places the user wants to remember, explore, or eventually visit.

They are separate from planned activities.

A destination can exist without a plan.

Example:

```text
Destination:
Sahara

Possible future plan:
Sahara Trek — October
```

A destination can also be associated with completed activities.

---

# 23. Statistics

Statistics are a major part of Cairn.

The user should be able to understand their outdoor journey through meaningful numbers.

Important statistics include:

* Total activities
* Total distance
* Total duration
* Total elevation gain
* Total elevation loss
* Highest peak
* Longest activity
* Hardest activity
* Highest-rated activity

Additional breakdowns can include:

* Activities by type
* Activities by difficulty
* Activities by year
* Activities by Wilaya

Statistics should prioritize meaningful insights over decorative charts.

---

# 24. Memories

Cairn should eventually make the user's history feel alive.

Photos from previous activities should be surfaced in ways that encourage the user to revisit their journey.

A possible future experience is an outdoor journey playback:

```text
Your Journey

2024
    ↓
2025
    ↓
2026
```

with photographs and activity highlights.

This should feel like looking through an outdoor memory collection rather than scrolling through a social media feed.

---

# 25. Profile

The profile contains:

* Name
* Username
* Profile picture
* Bio
* Location

Settings can contain:

* Account settings
* Password
* Authentication
* Appearance
* Privacy
* Data export
* Account deletion

---

# 26. Data Ownership

Each user's data is independent.

User A cannot access User B's private:

* Activities
* Gear
* Destinations
* Plans
* Groups
* Companions
* Photos

Account isolation is a fundamental requirement.

---

# 27. Activity Visibility

Activities can be:

```text
Private
Public
```

Private is the default.

Public activities establish the foundation for future community functionality.

However, V1 remains personal-first.

Public does not automatically mean that all activity information becomes publicly accessible.

A future public representation must deliberately choose which information is exposed.

---

# 28. Authentication

An account is required to use Cairn.

Initial authentication:

* Email/password
* Google login

Cairn is designed as a personal data platform, so anonymous usage is not a primary use case.

---

# 29. Multi-device Usage

A user can access the same Cairn account from:

* Desktop
* Laptop
* Phone
* Tablet

Data is synchronized through the backend.

---

# 30. Mobile Experience

Cairn V1 is a responsive web application.

The experience must be designed for mobile rather than merely shrunk to fit a phone.

Important mobile considerations:

* Touch-friendly controls
* Simple navigation
* Large tap targets
* Fast loading
* Responsive cards
* Easy photo upload
* Easy activity logging
* Easy backpack preparation

---

# 31. Units

Cairn V1 uses:

```text
Distance: km
Elevation: m
Temperature: °C
Weight: kg / g
Currency: DZD
```

Database storage should use normalized numeric values.

---

# 32. Offline Capability

Offline support is desirable, especially because outdoor environments may have weak connectivity.

However, full offline functionality is not required for the first implementation unless the architecture can support it cleanly.

Future offline functionality may include:

* Logging activities offline
* Viewing cached plans
* Viewing packed gear
* Syncing when connectivity returns

---

# 33. Community — Future

Community is intentionally secondary.

When introduced, users should be able to:

* Discover public activities
* Discover places
* See other hikers' achievements
* Congratulate people
* Give kudos
* Share their own activities
* Discover inspiration

The community should feel closer to:

```text
Outdoor journey sharing
```

than:

```text
Traditional social media
```

It should not become:

* Dating
* Influencer-centric
* Engagement-optimized
* Notification-heavy
* Algorithmically addictive

---

# 34. AI — Future

AI is not part of the initial product.

Do not add an AI assistant merely because AI is available.

AI can be considered later if a genuine user problem emerges.

---

# 35. Core Product Success

Cairn succeeds if a user can say:

> "I know what I've done, what I want to do, what I need to prepare, what gear I own, and I can look back at the journey I've built."

The application should reduce the cognitive burden of organizing outdoor activities.

It should turn scattered information into a coherent personal outdoor history.

---

# 36. Product Boundary

Cairn is:

```text
Personal outdoor journal
+
Planning tool
+
Gear closet
+
Backpack preparation tool
+
Destination tracker
+
Statistics
+
Future outdoor community
```

Cairn is not:

```text
Generic productivity software
Fitness tracker
Spreadsheet
Dating platform
Generic social network
Marketplace
AI chatbot
Navigation application
```

Those boundaries should remain clear.
