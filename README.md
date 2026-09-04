# Cairn

A calm, personal-first outdoor activity platform for hikers, trekkers, and campers.

> Plan your adventure. Prepare for it. Live it. Record it. Remember it. Understand your journey.

This repository is under active development. See `docs/` for the full product, architecture, UX, and roadmap documentation before contributing.

## Project Status

All core V1 features from the roadmap are implemented and verified: authentication (email/password + Google), activities with photos, gear with usage history, planned activities with a pack-my-bag flow, destinations, statistics, and a fully editable profile with data export/account deletion. Currently in **Phase 11 — Polish**. See `docs/PROGRESS.md` for the authoritative, up-to-date implementation status and what's next.

## Features

- **Activities** — log hikes/treks/camping trips with trail stats, conditions, photos, and gear used; search, filter, and sort your history
- **Gear** — a personal closet with automatically-derived usage history across your activities
- **Planned Activities** — plan ahead, then turn a plan into a real logged activity with one click
- **Pack My Bag** — select gear for a planned trip with a live-updating weight total
- **Destinations** — save places you want to visit, independent of any specific plan
- **Statistics** — personal records and breakdowns derived from your activity history
- **Profile & Settings** — editable profile, password management, light/dark/system theme, data export, and account deletion

## Repository Structure

```text
cairn/
├── client/          React + Vite frontend
├── server/          Express + MongoDB backend
├── docs/            Product, architecture, UX, roadmap, and data-model documentation
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- A MongoDB Atlas cluster (or local MongoDB instance) — the app boots without one, but most features need it to actually persist data
- Optional: a Google Cloud OAuth Client ID, for "Sign in with Google" — the app works fine without it, the button just won't appear
- Optional: Cloudinary credentials, for photo uploads on activities, gear, and destinations — the app works fine without them, uploads just return a clear "not configured" message until set

## Local Setup

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env and set MONGODB_URI once you have a database to connect to
npm install
npm run dev
```

The API starts on `http://localhost:5000` by default. `GET /api/health` confirms it's running and reports database connection status.

### 2. Frontend

In a separate terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The app starts on `http://localhost:5173` by default and displays whether it can reach the backend.

## Environment Variables

Each app has its own `.env.example` documenting the variables it needs (`client/.env.example`, `server/.env.example`). Never commit a real `.env` file — both are already git-ignored.

## Manual Testing Scripts

`server/scripts/` has a set of shell scripts that exercise each major feature end-to-end against a live database (run `bash scripts/<name>.sh` from `server/` while the backend is running):

- `test-auth-flow.sh` — register/login/logout/refresh, wrong-password rejection
- `test-activity-flow.sh` — activity CRUD, group ownership rejection, numbering
- `test-photo-flow.sh` — Cloudinary photo upload/cover/delete (needs a real image file path as an argument)
- `test-gear-flow.sh` — gear CRUD, usage-history derivation, cross-user rejection
- `test-planned-activity-flow.sh` — plan → complete → link-to-activity flow
- `test-pack-flow.sh` — Pack My Bag weight calculation and gear ownership check
- `test-destination-flow.sh` — destination CRUD, ownership checks on Activities/Plans
- `test-statistics-flow.sh` — totals/records/breakdowns against known values
- `test-profile-flow.sh` — profile editing, username reuse, password change
- `test-data-management-flow.sh` — export and account deletion (uses a disposable throwaway account, safe to run)

These aren't a substitute for the formal automated test suite planned in Phase 12, but they're the fastest way to sanity-check a feature against a real database right now.

## Documentation

Read these before making product or architectural decisions:

- `docs/01_PRODUCT_SPEC.md` — what Cairn is and does
- `docs/02_TECHNICAL_ARCHITECTURE.md` — stack, architecture, data model, auth
- `docs/03_UX_DESIGN_SPEC.md` — visual direction and UX principles
- `docs/04_DEVELOPMENT_ROADMAP.md` — implementation phases
- `docs/05_DATA_MODEL_AND_API_CONTRACT.md` — schemas and API conventions
- `docs/06_FUTURE_VISION.md` — long-term direction (not current scope)
- `docs/MASTER_IMPLEMENTATION_PROMPT.md` — engineering process and session protocol
- `docs/PROGRESS.md` — current implementation status (persistent memory across sessions)
