# Cairn — Data Model & API Contract

## 1. Purpose

This document defines Cairn's core data structures and API conventions.

The purpose is to establish a shared contract between:

* Frontend
* Backend
* Database
* Future features

Claude should treat this document as the current source of truth for data relationships.

The implementation may improve technical details, but it must not silently change the product's data model.

If a structural change is necessary, explain the reason before making it.

---

# 2. Data Ownership Principle

Every user's personal data is isolated.

The fundamental rule is:

```text
Authenticated User
        ↓
Only their own personal resources
```

A user must never be able to access, modify, or delete another user's private data.

Ownership must be enforced by the backend.

Never trust:

```text
userId
```

provided by the frontend.

The backend obtains the authenticated user's identity from the authentication system.

---

# 3. Core Collections

The initial MongoDB database should conceptually contain:

```text
users
activities
plannedActivities
destinations
gearItems
groups
companions
photos
```

Not every conceptual object necessarily requires a collection if embedding is more appropriate.

However, the above is the default starting point.

---

# 4. User

```text
User
{
    _id,

    email,
    passwordHash,
    googleId,

    name,
    username,
    profilePicture,
    bio,
    location,

    preferences: {
        theme,
        defaultActivityVisibility
    },

    createdAt,
    updatedAt
}
```

Authentication fields must be handled securely.

Do not return `passwordHash` to the frontend.

---

# 5. User Constraints

Email:

* Required
* Unique
* Normalized

Username:

* Required
* Unique
* Normalized according to product rules

Password:

* Required for email/password accounts
* Hashed
* Never returned through API responses

Google accounts:

* May authenticate through Google OAuth.
* Must not create duplicate user accounts when an existing account has the same verified email, subject to the authentication implementation.

---

# 6. Activity

An Activity represents a completed outdoor experience.

```text
Activity
{
    _id,

    userId,

    activityNumber,

    name,
    type,
    date,

    location: {
        placeName,
        wilaya,
        country,
        latitude,
        longitude
    },

    trail: {
        distanceKm,
        durationMinutes,
        maxAltitudeM,
        elevationGainM,
        elevationLossM,
        difficulty
    },

    conditions: {
        weather,
        temperatureC,
        trailCondition
    },

    social: {
        groupId,
        companions
    },

    costDzd,

    review: {
        rating,
        challenges,
        notes
    },

    destinationId,

    gearItemIds,

    visibility,

    coverPhotoId,

    createdAt,
    updatedAt
}
```

---

# 7. Activity Required vs Optional Fields

The application should support flexible logging.

Minimum practical information:

```text
name
type
date
```

Everything else may be optional unless a future product decision changes this.

This allows:

```text
Quick log
```

and:

```text
Detailed log
```

without maintaining two completely different activity systems.

---

# 8. Activity Types

Allowed values:

```text
hiking
trekking
camping
```

Default:

```text
hiking
```

Do not add additional activity types without product approval.

---

# 9. Activity Difficulty

Use controlled values rather than arbitrary strings.

Initial recommendation:

```text
easy
moderate
hard
very_hard
```

If the final UX uses different labels, the database enum can be mapped accordingly.

---

# 10. Activity Visibility

Allowed values:

```text
private
public
```

Default:

```text
private
```

Public visibility exists in V1 because it is foundational for future community functionality.

However, V1 does not need to expose public activities in a social feed.

---

# 11. Activity Number

Each user has an independent activity sequence.

Example:

```text
Sarah:
#1
#2
#3
#4
```

Another user:

```text
User B:
#1
#2
#3
```

The number is unique per user.

Recommended database constraint:

```text
unique(userId, activityNumber)
```

Activity numbers must not be reused after deletion.

---

# 12. Activity Date

Use a proper date/time representation.

The displayed date should respect the user's locale/timezone.

For historical activities, the date is more important than exact timestamp precision.

Do not force users to enter a timestamp when they only know the day.

---

# 13. Location

Activity location contains:

```text
placeName
wilaya
country
latitude
longitude
```

Example:

```text
{
    placeName: "Cap Blanc",
    wilaya: "Oran",
    country: "Algeria",
    latitude: ...,
    longitude: ...
}
```

Coordinates are optional in V1.

They are stored to support future geographic functionality.

---

# 14. Trail Statistics

Use normalized numeric units.

```text
distanceKm
durationMinutes
maxAltitudeM
elevationGainM
elevationLossM
```

Do not store:

```text
"12.5 km"
"4h 20"
"1230m"
```

as the underlying database values.

The UI formats numbers for display.

---

# 15. Conditions

```text
conditions: {
    weather,
    temperatureC,
    trailCondition
}
```

Weather can initially use controlled values where practical.

Temperature is numeric.

Example:

```text
temperatureC: 24
```

not:

```text
"24°C"
```

---

# 16. Social Context

Social context does not represent actual social-network relationships in V1.

It simply records:

```text
group
+
people the user remembers going with
```

Example:

```text
social: {
    groupId: "...",
    companions: [
        "Sarah's friend",
        "Yasmine"
    ]
}
```

The user is not responsible for logging every participant.

They only record the people they personally want to remember.

A user may also go:

```text
solo
```

with no group and no companions.

---

# 17. Group

Groups are lightweight personal references.

```text
Group
{
    _id,
    userId,
    name,
    createdAt,
    updatedAt
}
```

Examples:

```text
JJ
GOAT
Other hiking group
```

There are no group accounts in V1.

There is no membership system.

There is no group login.

There is no group participant database.

A group belongs to the user's personal record system.

---

# 18. Companion

A Companion is not necessarily a Cairn user.

```text
Companion
{
    _id,
    userId,
    name,
    createdAt,
    updatedAt
}
```

The same companion can be selected for multiple activities.

The user can also simply enter a one-off name if the UX supports it.

Do not require companions to create Cairn accounts.

---

# 19. Cost

Activity cost is stored as:

```text
costDzd
```

Numeric.

Example:

```text
costDzd: 2500
```

Do not store currency symbols inside the database value.

Currency for V1:

```text
DZD
```

---

# 20. Review

```text
review: {
    rating,
    challenges,
    notes
}
```

Rating:

```text
0–10
```

or the exact UI scale selected during implementation.

Challenges and notes are free text.

The user should not be forced to write a review.

---

# 21. Destination Relationship

Activity may reference:

```text
destinationId
```

A destination is optional.

This allows:

```text
Activity without saved destination
```

and:

```text
Activity associated with saved destination
```

A destination may have many activities.

---

# 22. Gear Relationship

Activity may reference multiple gear items:

```text
gearItemIds: [
    gearId1,
    gearId2,
    gearId3
]
```

Gear items belong to the same authenticated user.

When retrieving an activity, the backend must ensure that referenced gear belongs to the same user.

---

# 23. Planned Activity

```text
PlannedActivity
{
    _id,

    userId,

    name,
    type,

    plannedDate,

    destinationId,

    location: {
        placeName,
        wilaya,
        country,
        latitude,
        longitude
    },

    social: {
        groupId,
        companions
    },

    estimatedCostDzd,
    expectedDifficulty,

    notes,

    status,

    packedGearItemIds,

    completedActivityId,

    createdAt,
    updatedAt
}
```

---

# 24. Planned Activity Status

Initial values:

```text
planned
ready
completed
cancelled
```

The status represents planning state, not activity history.

---

# 25. Planned Activity Completion

When a plan becomes an actual activity:

```text
plannedActivity.completedActivityId
```

references the newly created Activity.

The planned activity remains in the database.

Do not transform the same MongoDB document into an Activity.

This preserves the distinction between:

```text
What I intended to do
```

and:

```text
What actually happened
```

---

# 26. Planned Activity → Activity Data

When creating an activity from a plan, prefill information such as:

```text
name
type
destination
location
group
companions
```

Potentially also:

```text
estimated difficulty
estimated cost
notes
```

But actual values must remain editable.

For example:

```text
Planned distance ≠ Actual distance
```

The activity should store the actual result.

---

# 27. Destination

```text
Destination
{
    _id,

    userId,

    name,

    location: {
        placeName,
        wilaya,
        country,
        latitude,
        longitude
    },

    status,

    targetDate,

    description,
    notes,

    coverImage,

    links,

    createdAt,
    updatedAt
}
```

---

# 28. Destination Independence

Destination and PlannedActivity are separate concepts.

Example:

```text
Destination
Sahara
```

can exist without:

```text
PlannedActivity
Sahara Trek — October
```

Likewise, a planned activity may exist without referencing a saved destination.

Do not merge these concepts.

---

# 29. Gear Item

```text
GearItem
{
    _id,

    userId,

    name,
    category,

    brand,
    model,

    quantity,

    weightGrams,

    purchaseDate,
    purchasePriceDzd,

    condition,

    photo,

    store,
    productUrl,

    notes,

    createdAt,
    updatedAt
}
```

---

# 30. Gear Identity

The user may own multiple similar items.

Examples:

```text
Salomon shoes
Salomon shoes
Different Salomon shoes
Columbia jacket
Another Columbia jacket
```

Do not assume:

```text
brand + name
```

uniquely identifies an item.

Each physical item can have its own GearItem record.

Quantity can still be used when individual distinction is unnecessary.

---

# 31. Gear Categories

Initial categories may include:

```text
clothing
footwear
backpack
shelter
sleeping
cooking
hydration
navigation
lighting
safety
accessories
other
```

The final UI labels can be more human-friendly.

---

# 32. Gear Weight

Store weight in grams.

Example:

```text
weightGrams: 420
```

The UI displays:

```text
420 g
```

or:

```text
0.42 kg
```

depending on context.

This makes backpack calculations straightforward.

---

# 33. Gear Usage History

Do not store a manually maintained list such as:

```text
usedOnActivities
```

unless later performance requirements justify it.

Usage history should be derived from:

```text
Activity.gearItemIds
```

This prevents duplicated information becoming inconsistent.

---

# 34. Packing

Packing is associated with a PlannedActivity.

The planned activity stores:

```text
packedGearItemIds
```

The total backpack weight is calculated from the selected GearItems.

Example:

```text
Tent       1800 g
Sleeping   900 g
Jacket     420 g
Headlamp   120 g

Total      3240 g
```

The UI can display:

```text
3.24 kg
```

Do not permanently store the calculated total in V1 unless necessary.

---

# 35. Photos

Photos should be represented by metadata.

```text
Photo
{
    _id,

    userId,
    activityId,

    cloudinaryPublicId,
    secureUrl,

    width,
    height,

    isCover,

    createdAt
}
```

Actual image files live in Cloudinary.

---

# 36. Photo Ownership

A photo belongs to:

```text
userId
```

and:

```text
activityId
```

Both relationships should be validated.

A user must never be able to attach another user's photo to their activity.

---

# 37. Statistics

Statistics are derived from Activities.

Examples:

```text
totalActivities
totalDistanceKm
totalDurationMinutes
totalElevationGainM
totalElevationLossM
highestAltitudeM
```

Personal records:

```text
longestActivity
highestPeak
hardestActivity
highestRatedActivity
```

The activity records remain the source of truth.

---

# 38. Statistics API

Suggested endpoint:

```text
GET /api/statistics
```

Potential response:

```text
{
    totals: {
        activities: 18,
        distanceKm: 124.7,
        durationMinutes: 2680,
        elevationGainM: 6420,
        elevationLossM: 6210
    },

    records: {
        highestAltitudeM: 1230,
        longestDistanceKm: 18.4,
        hardestActivityId: "...",
        highestRatedActivityId: "..."
    },

    breakdowns: {
        byType: [...],
        byDifficulty: [...],
        byYear: [...],
        byWilaya: [...]
    }
}
```

The exact response can evolve according to the frontend needs.

---

# 39. Activity API

## Create

```text
POST /api/activities
```

Request:

```text
{
    name,
    type,
    date,
    location,
    trail,
    conditions,
    social,
    costDzd,
    review,
    destinationId,
    gearItemIds,
    visibility
}
```

The server generates:

```text
userId
activityNumber
createdAt
updatedAt
```

The client must not generate these.

---

# 40. Activity List

```text
GET /api/activities
```

Supports:

```text
page / cursor
limit
search
type
difficulty
wilaya
group
rating
dateFrom
dateTo
sort
```

Only the authenticated user's activities are returned in V1.

Default:

```text
sort = newest
```

---

# 41. Activity Detail

```text
GET /api/activities/:id
```

Must verify ownership.

Future community functionality may introduce a separate public-access path.

Do not weaken ownership rules in anticipation of that feature.

---

# 42. Activity Update

```text
PATCH /api/activities/:id
```

Only mutable fields may be changed.

The following should not normally be client-editable:

```text
_id
userId
activityNumber
createdAt
```

---

# 43. Activity Delete

```text
DELETE /api/activities/:id
```

Must:

1. Verify ownership.
2. Remove the activity.
3. Handle associated photo records.
4. Handle associated Cloudinary assets.
5. Remove the completed-activity linkage from any planned activity if necessary.

Do not renumber other activities.

---

# 44. Gear API

```text
GET    /api/gear
POST   /api/gear
GET    /api/gear/:id
PATCH  /api/gear/:id
DELETE /api/gear/:id
GET    /api/gear/:id/usage
```

Every operation must enforce user ownership.

---

# 45. Planned Activity API

```text
GET    /api/planned-activities
POST   /api/planned-activities
GET    /api/planned-activities/:id
PATCH  /api/planned-activities/:id
DELETE /api/planned-activities/:id
POST   /api/planned-activities/:id/complete
```

---

# 46. Destination API

```text
GET    /api/destinations
POST   /api/destinations
GET    /api/destinations/:id
PATCH  /api/destinations/:id
DELETE /api/destinations/:id
```

---

# 47. Group API

Groups are lightweight.

Suggested endpoints:

```text
GET    /api/groups
POST   /api/groups
PATCH  /api/groups/:id
DELETE /api/groups/:id
```

Group suggestions may later be derived from activity history.

---

# 48. Companion API

Suggested:

```text
GET    /api/companions
POST   /api/companions
PATCH  /api/companions/:id
DELETE /api/companions/:id
```

The user may select previously saved companions when logging an activity.

---

# 49. Profile API

```text
GET   /api/profile
PATCH /api/profile
```

Profile fields:

```text
name
username
profilePicture
bio
location
```

Authentication fields should not be exposed unnecessarily.

---

# 50. Data Export API

Suggested:

```text
GET /api/profile/export
```

or a dedicated:

```text
POST /api/data/export
```

The implementation can choose between immediate and asynchronous export depending on complexity.

V1 can begin with a simple JSON export if the dataset is small.

---

# 51. Account Deletion API

Suggested:

```text
DELETE /api/profile
```

This operation requires explicit confirmation.

The backend must delete all user-owned data according to the account deletion policy.

---

# 52. API Response Convention

Use a consistent structure.

Success:

```text
{
    success: true,
    data: ...
}
```

Error:

```text
{
    success: false,
    error: {
        code: "...",
        message: "..."
    }
}
```

The exact implementation may vary if the chosen framework conventions provide an equivalent consistent structure.

---

# 53. HTTP Status Codes

Use appropriate status codes.

Examples:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

Do not return `200` for every situation.

---

# 54. Validation

Validation must happen on the backend.

Examples:

```text
distanceKm >= 0
durationMinutes >= 0
weightGrams >= 0
costDzd >= 0
rating within allowed range
latitude between -90 and 90
longitude between -180 and 180
```

Strings should have reasonable length limits.

Arrays should have reasonable limits.

Image uploads should have size/type restrictions.

---

# 55. Ownership Validation

For requests involving relationships:

```text
Activity → Gear
Activity → Destination
Activity → Group
PlannedActivity → Gear
PlannedActivity → Destination
```

the backend must verify that the referenced resources belong to the authenticated user.

Example:

User A attempts:

```text
POST Activity
gearItemIds: [User B's gear ID]
```

Expected:

```text
Rejected.
```

Do not silently attach another user's resource.

---

# 56. Public Data Boundary

Future community functionality will introduce a distinction between:

```text
Private user data
```

and:

```text
Public activity data
```

This boundary must be explicit.

Do not expose fields simply because an Activity has:

```text
visibility = public
```

A public activity should eventually have a controlled public representation.

For example:

```text
PublicActivityView
```

rather than automatically serializing the complete Activity document.

This prevents accidental exposure of:

* Private notes
* Sensitive coordinates
* Personal information
* Internal IDs
* Private companions
* Other sensitive metadata

---

# 57. Future Public Activity Representation

Potential future response:

```text
{
    id,
    author,
    activity: {
        name,
        type,
        date,
        location,
        trail,
        conditions,
        rating,
        photos
    }
}
```

This should be explicitly designed when community functionality begins.

Do not implement the public API prematurely.

---

# 58. Database Indexes

Initial indexes should include:

```text
users.email
users.username

activities:
(userId, activityNumber) unique
(userId, date)
(userId, type)
(userId, destinationId)
(userId, groupId)

gearItems:
(userId, category)

plannedActivities:
(userId, plannedDate)
(userId, status)

destinations:
(userId, status)

groups:
(userId, name)

companions:
(userId, name)
```

The exact indexing strategy should be validated against real queries.

---

# 59. Soft Delete

Do not implement soft deletion for every resource by default.

V1 can use hard deletion where appropriate.

If legal, recovery, audit, or future product requirements make soft deletion necessary, introduce it intentionally.

---

# 60. Timestamps

All persistent entities should use:

```text
createdAt
updatedAt
```

where useful.

MongoDB/Mongoose timestamps should be preferred rather than manually maintaining them.

---

# 61. API Versioning

V1 does not need elaborate API versioning.

A simple:

```text
/api/...
```

structure is sufficient.

If breaking API changes become necessary later, introduce:

```text
/api/v2/...
```

or another deliberate versioning strategy.

Do not add versioning complexity prematurely.

---

# 62. Final Data Relationship

The primary relationship graph is:

```text
                         USER
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
      ACTIVITIES      PLANNED          DESTINATIONS
          │           ACTIVITIES             │
          │               │                  │
     ┌────┼────┐          │                  │
     │    │    │          │                  │
     ▼    ▼    ▼          ▼                  │
   GEAR GROUP PEOPLE     GEAR ───────────────┘
     │
     │
     ▼
  USAGE HISTORY
  derived from
  Activities
```

Photos belong to Activities.

Statistics are derived from Activities.

Packing is derived from PlannedActivities + Gear.

---

# 63. Source of Truth

Cairn should avoid duplicate sources of truth.

Primary examples:

```text
Activity data
    → source of truth for statistics

Activity.gearItemIds
    → source of truth for gear usage

PlannedActivity.packedGearItemIds
    → source of truth for planned packing

Destination
    → source of truth for saved destinations
```

Derived information should generally be calculated rather than manually maintained.

---

# 64. Important Architectural Rule

The frontend should not become responsible for business logic that belongs on the backend.

For example:

The frontend may calculate a temporary backpack total for instant feedback.

But the backend must validate the selected GearItems and their weights when saving.

Likewise:

The frontend may display:

```text
Activity #18
```

but the backend is responsible for assigning that number.

---

# 65. Final Contract Principle

The data model should represent Cairn's real-world concepts clearly:

```text
An Activity
is something I did.

A Planned Activity
is something I intend to do.

A Destination
is somewhere I want to remember or visit.

Gear
is what I own.

Pack My Bag
is what I intend to take on a planned activity.

A Group
is a hiking/outdoor group I went with.

A Companion
is someone I remember going with.

Statistics
are the story derived from my activities.
```

Do not merge these concepts merely to reduce the number of collections.

Clarity of the domain model is more important than minimizing the number of database entities.
