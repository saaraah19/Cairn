# Cairn — UX & Design Specification

## 1. Design Objective

Cairn should feel like a calm digital home for someone's outdoor life.

The experience should evoke:

* Nature
* Breathing room
* Exploration
* Memories
* Calm
* Warmth
* Simplicity
* Personal ownership
* Quiet motivation

Cairn should feel useful without feeling like productivity software.

It should not feel like:

* A spreadsheet
* A corporate dashboard
* A generic SaaS application
* A database management interface
* A fitness-only application
* A traditional social media platform
* A dating application
* An AI application

The interface should feel like something a hiker would enjoy opening after a long day outdoors.

---

# 2. Core UX Principle

Cairn is personal first.

The primary experience is:

```text
Plan
 ↓
Prepare
 ↓
Go outdoors
 ↓
Log
 ↓
Remember
 ↓
Understand your journey
```

Community comes later.

The user should be able to use Cairn extensively without interacting with anyone else.

---

# 3. Emotional Design

The interface should create a sense of:

> “This is my outdoor space.”

Rather than:

> “This is an application where I enter data.”

The distinction is important.

Information should still be structured and organized, but the presentation should avoid making users feel like they are maintaining a spreadsheet.

---

# 4. Visual Direction

Primary visual inspiration:

* Forests
* Mountains
* Trails
* Moss
* Stone
* Natural light
* Paper journals
* Topographic maps
* Campsites
* Wooden textures
* Outdoor photography

The visual language should remain modern and minimal.

Avoid excessive literal “nature” decoration.

Do not cover the interface with:

* Leaves
* Trees
* Mountain illustrations
* Excessive textures
* Outdoor clip-art
* Camping icons everywhere

Nature should influence the visual system subtly.

---

# 5. Color Direction

Green is the primary brand color.

The exact palette should be selected during implementation after visual exploration.

The palette should contain:

* Primary nature green
* Dark green/forest tone
* Soft neutral background
* Warm/light surface tone
* Dark text
* Muted secondary text
* Carefully chosen semantic colors

Avoid extremely saturated greens.

Avoid making every element green.

Green should establish identity rather than dominate every screen.

---

# 6. Typography

Typography should feel modern, elegant, and highly readable.

Do not default to a generic developer/SaaS aesthetic.

Avoid:

* Overly futuristic fonts
* Excessively playful fonts
* Decorative fonts that hurt readability
* Excessive font-weight variation

The chosen typography should work well across:

* Activity cards
* Statistics
* Forms
* Navigation
* Mobile screens
* Long notes

Typography hierarchy should be obvious without being aggressive.

---

# 7. Spacing

Cairn should have generous whitespace.

Do not attempt to fit as much information as possible into every screen.

The interface should breathe.

Prioritize:

```text
Clarity > density
Hierarchy > decoration
Whitespace > clutter
```

This is especially important on the dashboard.

---

# 8. Main Navigation

The primary navigation should contain:

```text
Home
My Outdoors
Gear
Statistics
Profile
```

Potential future navigation:

```text
Explore
```

Explore should not be included as a major V1 navigation item if it has no meaningful V1 functionality.

Do not create empty navigation destinations merely to demonstrate future functionality.

---

# 9. Home

Home is the user's personal outdoor overview.

It should answer:

> “What is happening with my outdoor life?”

without requiring the user to navigate through several screens.

Potential content:

### Primary actions

```text
Log an activity
Plan an activity
Prepare my bag
```

### Recent activity

A small selection of recent activities.

### Upcoming

Upcoming planned activities.

### Personal highlights

Examples:

```text
18 adventures
Highest peak: 1,230 m
Longest hike: 18.4 km
```

### Personal progress

Useful statistics or milestones.

### Memory section

A visually appealing selection of past activity photos.

The Home screen should not become an analytics dashboard.

Statistics have their own navigation destination.

---

# 10. My Outdoors

My Outdoors is the central personal outdoor area.

It should organize:

```text
Activities
Planned
Destinations
```

Potential structure:

```text
My Outdoors

[ Activities ] [ Planned ] [ Destinations ]
```

This should feel like browsing a personal collection rather than browsing database tables.

---

# 11. Activities

Activities represent historical outdoor experiences.

The default view should be a visual list/card layout rather than a spreadsheet table.

Each activity card can show:

```text
Photo
Activity name
Date
Destination
Type
Difficulty
Distance
Duration
Activity number
```

Example concept:

```text
┌─────────────────────────────┐
│                             │
│        Activity Photo       │
│                             │
├─────────────────────────────┤
│ #18  Cap Blanc              │
│      24 August 2026         │
│                             │
│ 12.4 km   4h 20m   Hard     │
└─────────────────────────────┘
```

The exact visual design is flexible.

The activity number should be visible but secondary.

---

# 12. Activity Ordering

Activities are assigned numbers chronologically according to the user's history.

Example:

```text
#1
#2
#3
...
#18
```

The number does not determine display order.

The activity list should normally display newest activities first.

Users should be able to change sorting where useful.

Possible sorting:

* Newest
* Oldest
* Distance
* Rating
* Elevation

Only expose sorting options that provide genuine UX value.

---

# 13. Activity Search

Activities should support search.

Search may include:

* Activity name
* Destination/place
* Wilaya
* Group
* Companion
* Notes

The search interface should be easy to access on mobile.

Do not force users to open a complicated filter panel just to search.

---

# 14. Activity Filters

Filters should include useful dimensions such as:

```text
Date
Year
Type
Difficulty
Wilaya
Group
Rating
```

Filters should be combinable.

On desktop they may appear in a sidebar or toolbar.

On mobile they should open in a dedicated filter sheet/drawer.

---

# 15. Activity Detail

Selecting an activity opens a dedicated detail page.

The page should feel more like viewing a beautiful outdoor memory than viewing a database record.

Suggested hierarchy:

```text
Hero photo
↓
Activity title
↓
Date / location / activity number
↓
Quick statistics
↓
Trail information
↓
Conditions
↓
Who I went with
↓
Gear used
↓
Photos
↓
Review / notes
```

The exact ordering can evolve through UX implementation.

---

# 16. Activity Detail Hero

The activity's main image should have strong visual presence when an image exists.

If no image exists, the design should gracefully fall back to a clean visual state.

Do not create an ugly empty image placeholder.

---

# 17. Activity Editing

Activity detail should provide:

```text
Edit
Delete
```

Delete must require confirmation.

The confirmation should clearly communicate that the activity will be permanently removed.

Editing should reuse the activity form rather than creating a completely different editing interface.

---

# 18. Logging an Activity

Logging should be divided into logical sections.

Possible flow:

```text
1. Activity
2. Trail
3. Conditions
4. People
5. Gear
6. Photos
7. Review
8. Visibility
```

The user should not feel forced to complete every field.

---

# 19. Quick vs Detailed Logging

The logging experience should accommodate different levels of effort.

A user may simply want to record:

```text
Name
Date
Destination
Type
```

and save.

Another user may want to record:

```text
Distance
Duration
Altitude
D+
D-
Weather
Temperature
Difficulty
Challenges
Gear
Photos
Rating
Notes
```

The interface should support both.

Do not make detailed logging mandatory.

---

# 20. Activity Form UX

Forms should be broken into visually understandable sections.

Avoid a huge uninterrupted form containing dozens of fields.

Use progressive disclosure where appropriate.

For example:

```text
Activity Information
──────────────
Name
Type
Date
Location
Group
Companions

Trail
──────────────
Distance
Duration
Altitude
D+
D-
Difficulty

Conditions
──────────────
Weather
Temperature
Trail condition

Gear
──────────────
Select gear

Photos
──────────────
Upload

Review
──────────────
Rating
Notes
Challenges

Visibility
──────────────
Private / Public
```

The final implementation may use one page with sections or a multi-step flow.

The decision should prioritize ease of use.

---

# 21. Gear Selection

When logging an activity, gear should be selected from the user's Gear collection.

The user should not need to manually type:

```text
Salomon shoes
Columbia jacket
```

every time.

Instead:

```text
Select gear
 ↓
Search
 ↓
Filter by category
 ↓
Select items
```

The activity then references those specific GearItems.

---

# 22. Gear Usage History

When viewing a gear item, the user should be able to understand its history.

Example:

```text
Columbia Jacket

Purchased:
May 2026

Weight:
420 g

Price:
12,000 DZD

Used:
6 times

Last used:
Activity #18

Used on:
#18
#15
#11
#7
#4
#2
```

The history should be automatically derived.

Do not make the user maintain it manually.

---

# 23. Gear

Gear should feel like a personal outdoor closet.

Potential categories:

```text
Clothing
Footwear
Backpacks
Shelter
Sleeping
Cooking
Hydration
Navigation
Lighting
Safety
Accessories
Other
```

Categories may evolve.

The gear screen should support:

* Search
* Filtering
* Category browsing
* Add gear
* Edit gear
* Delete gear
* Gear detail

---

# 24. Gear Detail

A gear detail page should show:

```text
Photo
Name
Brand
Model
Category

Weight
Purchase date
Purchase price
Condition

Notes
Store
Product link

Usage history
```

Additional useful information can be introduced later.

---

# 25. Pack My Bag

Pack My Bag is a practical preparation tool.

It should be associated with a planned activity.

Flow:

```text
Planned Activity
        ↓
Prepare my bag
        ↓
Select gear
        ↓
Review packed items
        ↓
See total weight
```

The user should be able to search and filter gear.

Each selected item should show its weight.

The interface should prominently display:

```text
Total weight: 7.4 kg
```

The total should update immediately as gear is added or removed.

---

# 26. Planned Activities

Planned activities represent future outdoor activities.

They should answer:

> “What am I planning to do?”

Each planned activity may show:

```text
Name
Destination
Date
Type
Expected difficulty
Group
Estimated cost
Preparation status
```

Possible statuses:

```text
Planned
Ready
Completed
Cancelled
```

Do not overcomplicate this system.

---

# 27. Planned Activity → Completed Activity

A planned activity can be completed.

The user should have a clear action such as:

```text
Log this activity
```

This should open the activity logging flow with relevant information pre-filled.

The user can modify everything because the actual outing may differ from the original plan.

After completion:

```text
Planned Activity
        ↓
Completed Activity #18
```

The planned record remains available as historical planning information.

---

# 28. Destinations

Destinations represent places the user wants to remember or eventually visit.

They are separate from planned activities.

Destination cards can show:

```text
Image
Name
Wilaya
Status
Target date
```

A destination can exist without a planned activity.

A planned activity may reference a destination.

A destination may eventually contain links to its related activities.

---

# 29. Statistics

Statistics should feel like discovering the story of the user's outdoor life.

Avoid presenting the page as a spreadsheet full of numbers.

Important statistics include:

```text
Total activities
Total distance
Total duration
Total elevation gained
Highest peak
Longest activity
Hardest activity
Highest-rated activity
```

Additional useful statistics may include:

```text
Activities by year
Activities by type
Activities by difficulty
Activities by wilaya
Most visited destinations
Most-used gear
```

Only include statistics that are meaningful.

---

# 30. Personal Records

Personal records should have visual prominence.

Examples:

```text
Highest Peak
1,230 m

Longest Adventure
18.4 km

Biggest Elevation Gain
950 m

Hardest Adventure
Activity #14
```

These should feel like personal achievements rather than competitive leaderboards.

---

# 31. Outdoor Memories

Cairn should eventually provide a visual memory experience.

A possible section:

```text
Your Journey
```

or:

```text
Memories
```

It can display photographs from previous activities in a chronological or curated visual sequence.

A slideshow/playback-style experience can later show:

```text
2024
 ↓
2025
 ↓
2026
```

with activity photographs and short statistics.

This should feel reflective rather than like a social media feed.

---

# 32. Profile

Profile contains:

```text
Profile picture
Name
Username
Bio
Location
```

It should also provide access to:

```text
Settings
```

The profile should feel personal rather than social-media-oriented.

---

# 33. Settings

Initial settings can include:

### Account

* Email
* Change password
* Connected Google account

### Appearance

* Light mode
* Dark mode
* System preference

### Units

V1 defaults:

```text
Distance: km
Altitude: m
Temperature: °C
Weight: kg
Currency: DZD
```

Allowing unit customization can be postponed if it creates unnecessary complexity.

### Privacy

* Default activity visibility

### Data

* Export my data
* Delete my account

### Notifications

Only add notification settings when notifications actually exist.

Do not create empty settings categories.

---

# 34. Community — Future

Community is intentionally not the primary V1 experience.

Future functionality may include:

```text
Explore
Public activity feed
Discover hikers
View public activities
Kudos
Comments
Profiles
Following
```

The community should revolve around outdoor experiences.

The intended behavior is:

> “Look what someone experienced.”

not:

> “Look at this person's social-media profile.”

---

# 35. Public Activity Presentation

When community functionality eventually exists, a public activity should expose useful outdoor information.

Example:

```text
Activity #18

Cap Blanc
24 August 2026

12.4 km
4h 20m
+720 m
Hard

JJ
```

The user's private information should not automatically become public simply because the activity is public.

Privacy requirements should be explicitly defined before community implementation.

---

# 36. Community Tone

Cairn must not become:

* A dating platform
* A popularity contest
* An influencer platform
* A generic social network

Interaction should remain centered around:

* Outdoor experiences
* Discovery
* Encouragement
* Inspiration
* Achievements
* Places
* Activities

---

# 37. Mobile UX

Mobile is a first-class experience.

The application must be comfortable on:

```text
Phone
Tablet
Desktop
```

Important mobile workflows:

* Log activity
* View activity
* Search
* Filter
* Prepare bag
* Select gear
* View statistics
* Upload photos

Touch targets should be sufficiently large.

Avoid tiny controls.

Avoid dense tables on mobile.

---

# 38. Desktop UX

Desktop should take advantage of available space without becoming a dashboard full of panels.

Possible layout:

```text
Sidebar
    +
Main content
```

or:

```text
Top navigation
    +
Main content
```

The final choice should follow the visual identity rather than generic SaaS conventions.

---

# 39. Responsive Activity Cards

Cards should adapt naturally.

Desktop:

```text
Large image
Information beside/below image
```

Mobile:

```text
Image
Title
Date
Location
Key statistics
```

Do not simply scale desktop cards down.

---

# 40. Empty States

Empty states are important because new users will initially have:

```text
No activities
No planned activities
No destinations
No gear
```

Empty states should explain what the user can do next.

Example:

```text
Your trail starts here.

Log your first outdoor adventure.
```

Then:

```text
[ Log an activity ]
```

Avoid sterile messages such as:

```text
No records found.
```

---

# 41. Loading States

Use appropriate loading states.

Avoid flashing empty content before data loads.

Skeleton states can be used where helpful.

Loading should feel calm and unobtrusive.

---

# 42. Error States

Errors should be understandable.

Avoid exposing technical messages such as:

```text
MongoServerError: E11000 duplicate key error
```

Instead:

```text
Something went wrong while saving your activity.
Please try again.
```

Technical details should remain in logs.

---

# 43. Confirmation Dialogs

Destructive operations require confirmation.

Examples:

```text
Delete activity
Delete gear
Delete destination
Delete planned activity
Delete account
```

The dialog should clearly identify the object being deleted.

For account deletion, stronger confirmation should be required.

---

# 44. Notifications and Feedback

Use subtle feedback for successful actions.

Examples:

```text
Activity saved
Gear added
Bag updated
Changes saved
```

Do not rely on large intrusive popups for every action.

Feedback should not interrupt the user's flow.

---

# 45. Imagery

Photography is important to Cairn's identity.

Outdoor photos should be allowed to visually dominate where appropriate.

Images should feel:

* Natural
* Authentic
* Atmospheric

Avoid generic stock-photo aesthetics throughout the product.

User-uploaded images should be prioritized in personal areas.

---

# 46. Icons

Use a consistent icon system.

Icons should support comprehension rather than decorate every piece of information.

Do not use an emoji for every field.

For example, avoid turning:

```text
Distance
Duration
Difficulty
Weather
Cost
```

into a wall of emojis.

Use restrained visual cues.

---

# 47. Data Density

Cairn contains a lot of information.

The solution is not to remove useful information.

The solution is to organize it hierarchically.

Example:

```text
Primary information
        ↓
Quick statistics
        ↓
Detailed information
        ↓
Optional metadata
```

Users should be able to see the important information immediately and discover the rest naturally.

---

# 48. Design System

Create a lightweight design system containing:

```text
Colors
Typography
Spacing
Border radius
Shadows
Buttons
Inputs
Cards
Badges
Dialogs
Tabs
Navigation
Empty states
Loading states
```

The design system should remain lightweight.

Do not build a massive generic component library.

Components should serve Cairn's visual language.

---

# 49. Visual Consistency

Every screen should feel like part of the same product.

Maintain consistency in:

* Spacing
* Typography
* Buttons
* Forms
* Cards
* Border radius
* Icons
* Animation
* Colors
* Empty states

Do not let each page develop its own visual language.

---

# 50. Animation

Animation should be subtle.

Useful examples:

* Page transitions
* Card interactions
* Modal appearance
* Filter drawer
* Packing weight updates
* Image transitions

Avoid:

* Excessive bouncing
* Constant motion
* Long transitions
* Decorative animations everywhere

The product should feel calm.

---

# 51. Accessibility

Design must support:

* Keyboard navigation
* Screen readers
* Sufficient contrast
* Visible focus states
* Accessible forms
* Accessible dialogs
* Appropriate image descriptions

Accessibility is part of the UX rather than a final cleanup task.

---

# 52. Final UX Principle

When deciding between two designs, ask:

> Does this make the user's outdoor life easier to understand, plan, record, or remember?

If not, it probably does not belong in the interface.

Cairn should feel like:

```text
A personal outdoor journal
        +
A planning companion
        +
A gear closet
        +
A record of personal adventures
        +
Eventually, a quiet community of fellow hikers
```

It should never feel like:

```text
A database with a nature-themed skin.
```
