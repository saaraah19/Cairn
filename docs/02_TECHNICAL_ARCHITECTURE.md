# Cairn — Technical Architecture

### Version 0.1

## 1. Purpose

This document defines how Cairn should be technically built.

The Product Specification defines what Cairn is.

This document defines the technical foundation used to implement it.

The architecture should be simple enough for V1 development while leaving reasonable room for the future community, maps/routes, and other capabilities.

Do not introduce complexity solely for hypothetical future requirements.

---

# 2. Technology Stack

## Frontend

* React
* Vite
* React Router
* Modern CSS approach chosen during implementation
* Responsive/mobile-first design

## Backend

* Node.js
* Express
* REST API

## Database

* MongoDB Atlas
* Mongoose

## Authentication

* Email/password authentication
* Google OAuth

## Media

* Cloudinary

## Deployment

Deployment provider is intentionally not fixed yet.

The application should be structured so frontend, backend, database, and media storage can be deployed independently.

---

# 3. High-Level Architecture

```text
                        ┌─────────────────┐
                        │     Browser     │
                        │ Desktop/Mobile  │
                        └────────┬────────┘
                                 │
                                 │ HTTPS
                                 ▼
                        ┌─────────────────┐
                        │ React Frontend  │
                        │      Vite       │
                        └────────┬────────┘
                                 │
                                 │ REST API
                                 ▼
                        ┌─────────────────┐
                        │ Express Backend │
                        │   Node.js       │
                        └───────┬─┬───────┘
                                │ │
                    ┌───────────┘ └────────────┐
                    ▼                          ▼
           ┌─────────────────┐        ┌─────────────────┐
           │ MongoDB Atlas   │        │   Cloudinary    │
           │ Application Data│        │     Images      │
           └─────────────────┘        └─────────────────┘
```

The browser must never communicate directly with MongoDB.

The browser communicates with the backend API.

The backend is responsible for:

* Authentication
* Authorization
* Validation
* Business logic
* Database access
* Secure media operations
* Data transformation

---

# 4. Repository Structure

A monorepo is recommended for V1.

Suggested structure:

```text
cairn/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── lib/
│   │   ├── utils/
│   │   ├── assets/
│   │   ├── styles/
│   │   └── main.jsx
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── server.js
│   └── ...
│
├── docs/
│
├── .env.example
├── README.md
└── ...
```

The exact folder organization may be refined during implementation.

Avoid creating a large number of empty abstraction layers before they are needed.

---

# 5. Core Domain Entities

V1 should have these primary entities:

```text
User
Activity
PlannedActivity
Destination
GearItem
Group
Companion
Photo
```

Some of these may be embedded documents rather than independent MongoDB collections where appropriate.

The distinction between conceptual entities and physical MongoDB collections should be made intentionally.

---

# 6. User Model

A User represents an authenticated Cairn account.

Conceptually:

```text
User
├── identity
├── authentication
├── profile
├── preferences
└── account metadata
```

Potential fields:

```text
_id
email
passwordHash
googleId
authProviders
name
username
profilePicture
bio
location
preferences
createdAt
updatedAt
```

Do not store all activities, gear, destinations, etc. directly inside the User document.

These should be separate collections/resources linked through `userId`.

---

# 7. Authentication

Cairn supports:

### Email/password

Registration:

```text
Client
 ↓
POST /api/auth/register
 ↓
Validate input
 ↓
Hash password
 ↓
Create User
 ↓
Authenticate session/token
```

Login:

```text
Client
 ↓
POST /api/auth/login
 ↓
Validate credentials
 ↓
Authenticate
```

### Google

Google OAuth should create or authenticate an existing Cairn user.

The authentication implementation should prevent duplicate accounts when the same email is associated with multiple authentication methods.

---

# 8. Authentication Tokens

Use a secure authentication strategy appropriate for the deployment environment.

Preferred architecture:

* Short-lived access token
* Secure refresh mechanism
* HTTP-only cookies where appropriate
* Secure and SameSite cookie configuration
* No sensitive authentication data in localStorage

The exact implementation may be finalized during authentication setup.

Passwords must never be stored in plaintext.

---

# 9. Authorization

Authentication answers:

> Who is this user?

Authorization answers:

> Is this user allowed to access this resource?

Authorization must be enforced on the backend.

Every user-owned resource should contain a user ownership reference.

For example:

```text
Activity
{
    _id,
    userId,
    ...
}
```

A request such as:

```text
GET /api/activities/:id
```

must verify:

```text
activity.userId === authenticatedUser.id
```

unless the resource is explicitly public through future community functionality.

Do not trust a `userId` supplied by the client.

The authenticated identity must come from the authentication layer.

---

# 10. Activity Model

Activity is one of the central entities.

Conceptually:

```text
Activity
├── identity
├── ownership
├── activity information
├── location
├── trail statistics
├── conditions
├── social context
├── financial information
├── review
├── media
├── gear relationships
└── visibility
```

Suggested structure:

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
        notes,
        highlights,
        challenges
    },

    gearItemIds,

    photos,

    visibility,

    createdAt,
    updatedAt
}
```

Exact naming can be refined during implementation.

---

# 11. Activity Types

Use a controlled enum:

```text
hiking
trekking
camping
```

Default:

```text
hiking
```

Do not add trail running in V1.

---

# 12. Activity Numbering

Each user has their own sequential activity numbering.

Example:

```text
User A:
#1
#2
#3
...
#18

User B:
#1
#2
#3
...
```

Activity numbers should be unique within a user.

They should not be used as the MongoDB primary key.

Use MongoDB `_id` for identity and `activityNumber` for the user-facing sequence.

Activity numbers should not change when activities are deleted.

Example:

```text
#1
#2
#3
#4
```

If #3 is deleted:

```text
#1
#2
#4
```

Do not renumber historical activities.

The numbering mechanism must avoid race conditions if two activity creations happen concurrently.

---

# 13. Activity Visibility

V1 supports:

```text
private
public
```

Default:

```text
private
```

Private activities are accessible only to their owner.

Public activities may become discoverable through the future community system.

Do not expose public activities through a community feed in V1.

The visibility field exists so the underlying data model is future-compatible.

---

# 14. Activity ↔ Gear

Activities should reference the specific gear items used.

Example:

```text
Activity #18
gearItemIds:
[
    gearA,
    gearB,
    gearC
]
```

Gear usage history should be derived from this relationship.

Do not manually maintain usage counters unless performance later requires denormalization.

---

# 15. Activity ↔ Destination

An activity may optionally reference a destination.

Example:

```text
Activity
{
    destinationId: ...
}
```

The destination itself remains independent.

One destination can be associated with multiple activities.

An activity may also have a place name/location without belonging to a saved destination.

This distinction is important.

---

# 16. Planned Activity Model

A PlannedActivity represents a future intention.

Suggested conceptual structure:

```text
PlannedActivity
{
    _id,
    userId,

    name,
    type,

    destinationId,

    location: {
        placeName,
        wilaya,
        latitude,
        longitude
    },

    plannedDate,

    groupId,
    companions,

    estimatedCostDzd,
    expectedDifficulty,

    notes,

    preparation: {
        status,
        packedGearItemIds,
        isReady
    },

    status,

    completedActivityId,

    createdAt,
    updatedAt
}
```

The planned activity is not the historical activity.

---

# 17. Planned Activity Completion

When the user chooses:

```text
Log Activity
```

from a planned activity:

1. Retrieve the planned activity.
2. Pre-populate the activity form.
3. Allow the user to modify the information.
4. Save a new Activity.
5. Assign the next activity number.
6. Link the completed activity to the planned activity.
7. Mark the planned activity as completed.

Example:

```text
PlannedActivity.completedActivityId
        ↓
Activity._id
```

Do not overwrite the planned record with actual activity information.

This preserves planning history.

---

# 18. Destination Model

Destination represents a place the user wants to track independently.

Conceptually:

```text
Destination
{
    _id,
    userId,

    name,

    location: {
        wilaya,
        country,
        latitude,
        longitude
    },

    status,
    priority,

    targetDate,

    description,
    notes,

    coverImage,

    links,

    createdAt,
    updatedAt
}
```

Potential status values:

```text
wishlist
planned
visited
```

These can be refined later.

A destination should not contain every activity performed there.

Activities reference the destination.

---

# 19. Gear Item Model

Gear represents an individual owned physical item.

Conceptually:

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

`quantity` is useful for cases such as socks or identical items.

Different physical items should still be separate records when the user wants to distinguish them.

For example:

```text
Petzl Headlamp
Black Diamond Headlamp
```

are separate GearItems.

---

# 20. Gear Usage History

Usage history is derived through Activity.gearItemIds.

When displaying:

```text
Petzl Headlamp
```

the backend can query activities containing that gear item's ID and belonging to the same user.

Display:

```text
Used X times
Last used: Activity #18
Used in:
#18
#14
#9
...
```

The system must never expose another user's activity history through a gear lookup.

---

# 21. Pack My Bag

Pack My Bag is conceptually a packing session associated with a planned activity.

A planned activity can contain selected gear references.

Example:

```text
plannedActivity.packedGearItemIds
```

The UI calculates:

```text
totalWeight =
sum(selectedGear.weightGrams)
```

The backend should validate that selected gear belongs to the authenticated user.

The frontend should provide:

* Search
* Filtering
* Category selection
* Item selection
* Packed/unpacked state
* Total item count
* Total weight

---

# 22. Group Model

Groups are lightweight user-owned entities in V1.

Conceptually:

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

A user can have:

```text
JJ
GOAT
Other group
```

Group names should be reusable across activities.

The system may provide suggestions based on previous group entries.

Do not implement group accounts or membership management in V1.

---

# 23. Companion Model

Companions represent people the user records as having joined an activity.

They do not need Cairn accounts.

There are two reasonable implementations:

### Option A — Embedded names

```text
Activity
{
    social: {
        companions: [
            "Amel",
            "Yasmine"
        ]
    }
}
```

### Option B — User-owned Companion collection

```text
Companion
{
    _id,
    userId,
    name
}
```

For V1, use a lightweight user-owned Companion collection if autocomplete/history is desired.

The companion must never be interpreted as another Cairn user unless explicitly linked in a future feature.

---

# 24. Photo Model

Photos are associated with activities.

A photo can conceptually contain:

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

Images should be stored in Cloudinary rather than MongoDB.

MongoDB stores metadata and references.

---

# 25. Cloudinary Architecture

Do not store image binaries in MongoDB.

Preferred flow:

```text
Browser
   ↓
Backend / signed upload preparation
   ↓
Cloudinary
   ↓
Cloudinary response
   ↓
Backend stores image metadata
   ↓
MongoDB
```

Cloudinary credentials must remain server-side.

Images should be associated with the authenticated user and relevant activity.

When an activity is deleted, associated Cloudinary assets should be cleaned up according to the chosen deletion strategy.

---

# 26. Statistics Architecture

Statistics should primarily be derived from Activity data.

Examples:

```text
totalActivities
totalDistance
totalDuration
totalElevationGain
totalElevationLoss
highestAltitude
longestActivity
hardestActivity
highestRatedActivity
```

Avoid storing every statistic as a permanent field on the User document.

For V1, calculate statistics through database queries/aggregation.

If performance becomes an issue later, selected statistics may be cached or denormalized.

The underlying activity records remain the source of truth.

---

# 27. Personal Records

Personal records should be calculated from the user's activity history.

Examples:

```text
Highest peak
Longest distance
Longest duration
Highest D+
Hardest activity
Highest-rated activity
Most active month
Most visited destination
```

Records should automatically update when activity data changes.

For example, editing Activity #10 may cause it to become the new longest hike.

Do not permanently store personal records unless there is a clear performance requirement.

---

# 28. Search

Activity search should query only the authenticated user's data in V1.

Potential searchable fields:

* Activity name
* Place name
* Wilaya
* Group
* Notes
* Companion names

Search should support partial matching where practical.

Indexes should be introduced for frequently queried fields.

Do not implement a heavyweight search engine in V1.

---

# 29. Filtering

Activity filtering should support:

* Date/year
* Type
* Difficulty
* Group
* Wilaya
* Rating

Filters should be composable.

Example:

```text
type = hiking
year = 2026
difficulty = hard
group = JJ
```

The backend should support pagination.

---

# 30. Pagination

Lists that can grow indefinitely should not retrieve every record at once.

This includes:

* Activities
* Photos
* Gear
* Destinations
* Planned activities

Use a scalable pagination strategy.

Cursor-based pagination is preferred where appropriate, particularly for activity history and future community feeds.

---

# 31. API Structure

Use RESTful resource-oriented endpoints.

Example:

```text
/api/auth
/api/users
/api/activities
/api/planned-activities
/api/destinations
/api/gear
/api/groups
/api/companions
/api/photos
/api/statistics
```

Example activity endpoints:

```text
GET    /api/activities
POST   /api/activities
GET    /api/activities/:id
PATCH  /api/activities/:id
DELETE /api/activities/:id
```

Planned activities:

```text
GET    /api/planned-activities
POST   /api/planned-activities
GET    /api/planned-activities/:id
PATCH  /api/planned-activities/:id
DELETE /api/planned-activities/:id
POST   /api/planned-activities/:id/complete
```

Gear:

```text
GET    /api/gear
POST   /api/gear
GET    /api/gear/:id
PATCH  /api/gear/:id
DELETE /api/gear/:id
GET    /api/gear/:id/usage
```

The exact endpoint list can evolve during implementation.

---

# 32. Backend Layering

Use a clear separation of concerns.

Recommended:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Model / Database
```

### Routes

Define HTTP endpoints.

### Controllers

Handle HTTP request/response concerns.

### Services

Contain business logic.

### Models

Define persistence structures.

### Validators

Validate external input.

Do not place complex business logic directly inside routes.

Do not create services solely for the sake of having more files.

---

# 33. Validation

All external input must be validated server-side.

This includes:

* Authentication
* Activity creation
* Activity updates
* Gear
* Destinations
* Planned activities
* Profile updates
* Search/filter parameters

Frontend validation improves UX but does not replace backend validation.

Use a consistent validation library/pattern.

---

# 34. Error Handling

The API should return consistent error responses.

Conceptual format:

```text
{
    success: false,
    error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Activity not found."
    }
}
```

Do not expose internal stack traces or sensitive implementation details to clients.

Handle:

* Validation errors
* Authentication errors
* Authorization errors
* Not found
* Conflict
* Rate limits where relevant
* Server errors

---

# 35. Security

Minimum V1 security requirements:

* Password hashing
* Secure authentication
* Server-side authorization
* Input validation
* Protection against injection
* Secure cookies where applicable
* CORS configuration
* Rate limiting on authentication endpoints
* Environment secrets
* No secrets committed to Git
* Safe error responses
* Ownership checks on every user-owned resource

Never trust client-supplied ownership fields.

---

# 36. Environment Configuration

Use environment variables for:

```text
MongoDB connection
Authentication secrets
Google OAuth credentials
Cloudinary credentials
Frontend/backend URLs
Deployment-specific configuration
```

Provide:

```text
.env.example
```

with variable names but no secrets.

---

# 37. Database Indexing

Indexes should be created intentionally.

Likely V1 indexes include:

```text
Activity:
(userId, date)
(userId, activityNumber)
(userId, type)
(userId, destinationId)
(userId, groupId)

Gear:
(userId, category)

Destination:
(userId, status)

PlannedActivity:
(userId, plannedDate)
(userId, status)
```

Exact indexes should be confirmed based on actual query patterns.

Do not create indexes indiscriminately.

---

# 38. MongoDB Modeling Philosophy

Use references for entities that:

* Have independent lifecycles.
* Are queried independently.
* Can be associated with many other records.

Examples:

```text
User
Activity
GearItem
Destination
PlannedActivity
```

Use embedded data for small information that belongs tightly to its parent.

Examples:

```text
Activity.conditions
Activity.location
Activity.review
```

The exact embedding/reference boundary can be adjusted during implementation.

---

# 39. Transactions

Use MongoDB transactions when multiple related database operations must succeed or fail together.

A key example is planned activity completion if the operation performs several dependent writes.

Avoid transactions where a single atomic update is sufficient.

---

# 40. Data Deletion

Deleting an Activity should:

* Remove the activity record.
* Remove associated photo metadata.
* Remove the activity ↔ gear relationships.
* Remove planned-activity completion linkage if relevant.

It must not:

* Delete GearItems.
* Delete Destinations.
* Delete Groups.
* Delete unrelated user data.

Cloudinary asset deletion should also be handled appropriately.

---

# 41. Account Deletion

Account deletion is a destructive operation.

The backend should identify all user-owned resources:

```text
Activities
PlannedActivities
Destinations
GearItems
Groups
Companions
Photos
```

and remove them according to the final deletion policy.

Cloudinary media must also be addressed.

The operation should be protected by explicit confirmation and appropriate authentication.

---

# 42. Data Export

The architecture should support an export endpoint/service.

Potential output:

```text
User
Activities
Planned Activities
Destinations
Gear
Groups
Companions
```

A first V1 implementation can use JSON and/or CSV where appropriate.

Images do not necessarily need to be bundled into the initial export; this can be specified separately.

---

# 43. Frontend Architecture

Organize frontend code primarily around features rather than a giant global components directory.

Possible structure:

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── activities/
│   ├── plannedActivities/
│   ├── destinations/
│   ├── gear/
│   ├── packing/
│   ├── statistics/
│   └── profile/
├── layouts/
├── pages/
├── hooks/
├── services/
├── lib/
├── utils/
└── styles/
```

Reusable components should be extracted when genuinely reusable.

Do not create an enormous design-system abstraction before the UI needs it.

---

# 44. Frontend State

Separate:

### Server state

Data retrieved from the API:

* Activities
* Gear
* Destinations
* Planned activities
* Statistics

### Local UI state

Examples:

* Modal open/closed
* Form state
* Filter drawer
* Selected gear
* Packing checkbox
* Temporary UI state

Use an appropriate server-state/data-fetching solution if beneficial.

Do not put all application data into one global state store.

---

# 45. Forms

Forms should support:

* Client-side validation
* Server-side validation
* Loading states
* Error states
* Success feedback
* Unsaved changes handling where appropriate

Activity creation should not feel like filling out a database form.

Progressive disclosure should be used where helpful.

---

# 46. Responsive Behavior

Design from the smallest practical screen upward.

Important mobile interactions:

### Activity cards

Readable with minimal scrolling.

### Activity detail

Information should be grouped into collapsible/clearly separated sections where appropriate.

### Activity logging

Large touch targets.

Simple field progression.

### Gear selection

Search and category filters should remain usable on mobile.

### Pack My Bag

Selecting gear and seeing total weight should be immediate.

### Statistics

Charts should remain readable on small screens.

---

# 47. Accessibility

V1 should follow reasonable accessibility standards.

At minimum:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Form labels
* Accessible buttons
* Appropriate contrast
* Alt text for meaningful images
* Accessible dialogs
* Error messages associated with fields

Do not rely solely on color to communicate information.

---

# 48. Performance

Prioritize:

* Fast initial load
* Optimized images
* Lazy loading where appropriate
* Pagination
* Efficient database queries
* Proper indexes
* Avoiding unnecessary frontend requests
* Responsive interactions

Cloudinary should be used to serve appropriately optimized image variants.

---

# 49. Future Architecture Compatibility

The architecture should leave reasonable extension points for:

```text
Community
Public activities
Users
Followers
Kudos
Comments
Groups
Maps
GPX
Routes
Trail discovery
Advanced geospatial queries
Offline support
Native mobile application
Potential AI features
```

However, these should not be implemented merely to prepare for them.

The current V1 architecture should remain simple.

---

# 50. Geospatial Future

V1 stores:

```text
latitude
longitude
```

This provides a foundation for future geographic functionality.

Future requirements may include:

* Nearby destinations
* Nearby activities
* Route geometry
* GPX
* Trail maps
* Geographic search

If these become a dominant part of the product, reassess whether MongoDB geospatial capabilities remain sufficient or whether PostgreSQL/PostGIS would provide a better long-term foundation.

Do not migrate databases preemptively.

---

# 51. Testing Strategy

Testing should exist at several levels.

### Unit tests

For:

* Utility functions
* Validation
* Business logic
* Statistics calculations

### API/integration tests

For:

* Authentication
* Authorization
* Activity CRUD
* Gear relationships
* Planned activity completion
* Data isolation

### Frontend tests

For important user interactions.

### Manual testing

Required for:

* Mobile layouts
* Photo uploads
* Forms
* Responsive behavior
* Important user journeys

---

# 52. Critical Security Tests

The following must explicitly be tested:

### User A attempts to retrieve User B's activity.

Expected:

```text
Not authorized / not found
```

### User A attempts to modify User B's gear.

Expected:

```text
Rejected
```

### User A supplies another user's ID in the request body.

Expected:

```text
Ignored/rejected
```

The server determines ownership from authentication.

### Private activity access

A private activity must not be accessible by another user.

These tests are fundamental to Cairn.

---

# 53. Implementation Rule

Do not build the complete application in one pass.

Implement vertically sliced functionality.

Example:

```text
Authentication
 ↓
User
 ↓
Activity creation
 ↓
Activity list
 ↓
Activity detail
 ↓
Activity editing
 ↓
Photos
...
```

Each slice should have working frontend + backend + persistence before moving forward.

---

# 54. Architecture Decision Principle

When choosing between two technically valid solutions:

Prefer the solution that is:

1. Easier to understand.
2. Easier to maintain.
3. Easier to test.
4. Sufficient for V1.
5. Reasonably extensible.

Do not choose technology because it is fashionable.

Do not introduce microservices.

Do not introduce event-driven architecture.

Do not introduce Kubernetes.

Do not introduce a complex infrastructure layer.

Cairn V1 is a focused web application.

---

# 55. Current Architecture Summary

```text
Frontend
React + Vite
        │
        │ REST API
        ▼
Backend
Node.js + Express
        │
        ├── Authentication
        ├── Authorization
        ├── Validation
        ├── Business Logic
        │
        ▼
MongoDB Atlas
        │
        └── User-owned data

Cloudinary
        │
        └── Activity images
```

Primary domain:

```text
User
 │
 ├── Activities
 │     ├── Destination
 │     ├── Group
 │     ├── Companions
 │     ├── Gear
 │     └── Photos
 │
 ├── Planned Activities
 │     ├── Destination
 │     ├── Group
 │     └── Gear
 │
 ├── Destinations
 │
 ├── Gear
 │
 ├── Groups
 │
 └── Companions
```

This architecture is the V1 technical foundation for Cairn.
