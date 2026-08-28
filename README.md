# Cairn

A calm, personal-first outdoor activity platform for hikers, trekkers, and campers.

> Plan your adventure. Prepare for it. Live it. Record it. Remember it. Understand your journey.

This repository is under active development. See `docs/` for the full product, architecture, UX, and roadmap documentation before contributing.

## Project Status

Currently in **Phase 0 — Project Foundation**. See `docs/PROGRESS.md` for the authoritative, up-to-date implementation status.

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
- A MongoDB Atlas cluster (or local MongoDB instance) — only needed once you start Phase 1+; the app boots without one

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
