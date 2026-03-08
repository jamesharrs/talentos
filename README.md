# TalentOS

An AI-native talent acquisition platform. Built with React + Vite (frontend), Express (backend), and a JSON file store.

## Structure

```
talentos/
├── client/          # React/Vite admin app (port 3000)
├── server/          # Express API (port 3001)
├── portal-renderer/ # Public-facing portal renderer (port 5173)
└── data/            # JSON data store (gitignored, see talentos.sample.json)
```

## Quick Start

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
cd ../portal-renderer && npm install
```

### 2. Set up environment

```bash
cp data/talentos.sample.json data/talentos.json
cp server/.env.example server/.env
# Add your ANTHROPIC_API_KEY to server/.env
```

### 3. Seed demo data

```bash
cd server && node seed-demo.js
```

### 4. Run

```bash
# Terminal 1 — API
cd server && node index.js

# Terminal 2 — Admin UI
cd client && npm run dev

# Terminal 3 — Portal Renderer (optional)
cd portal-renderer && npm run dev
```

- Admin: http://localhost:3000
- API: http://localhost:3001
- Portals: http://localhost:5173/?portal=TOKEN

## Default Login

- Email: `admin@talentos.io`
- Password: `Admin1234!`

## Features

- **Environments** — multi-tenant data isolation
- **Objects & Fields** — configurable data model (People, Jobs, Talent Pools)
- **Records** — full CRUD with list, kanban, and detail views
- **AI Copilot** — natural language search, record creation, candidate matching
- **Workflows** — stage-based hiring pipelines with automations
- **Portal Builder** — branded external experiences (Career Site, HM Portal, Agency Portal, Onboarding)
- **Search** — global cross-object search with filters
- **Dashboard** — live hiring metrics with Recharts visualisations
