# Frontend

React single-page app for the उत्थान mental health platform: patient dashboard, community feed, iCBT programmes, health worker portal, and direct chat. It talks to the FastAPI backend over HTTP with JWT auth.

## Requirements

- Node.js 18 or newer (LTS recommended)
- npm (ships with Node) or another compatible package manager
- Backend API running locally (see repo root) unless you point `VITE_API_BASE_URL` elsewhere

## Setup

```bash
cd frontend
npm install
```

Copy environment defaults and adjust if needed:

```bash
cp .env.development.example .env.development
```

Create `.env` for local overrides (Vite loads `.env`, `.env.local`, mode-specific files). Required variable:

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Base URL for the API (e.g. `http://127.0.0.1:8000/`) — trailing slash is fine |
| `VITE_APP_NAME` | Product name shown in the UI |
| `VITE_APP_ENV` | `development` or `production` |

The Axios client uses `VITE_API_BASE_URL` directly. Auth tokens are read from persisted Zustand state (`auth-storage` in `localStorage`) and sent as `Authorization: Bearer …`. A 401 response clears auth and redirects to `/login`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (default port **3000**) |
| `npm run build` | Typecheck with `tsc`, then production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier on `src/**/*.{ts,tsx,css}` |
| `npm run format:check` | Prettier check only |

## Project layout

- `src/app/` — Router, root layout, providers
- `src/features/` — Feature modules (auth, dashboard, community, chat, workers, iCBT, onboarding, worker dashboard, etc.)
- `src/shared/` — API client, stores, shared components, types, utilities

Path aliases (see `vite.config.ts` and `tsconfig.json`): `@app/*`, `@features/*`, `@shared/*` map to the matching folders under `src/`.

## Stack

- **React 18** + **TypeScript**
- **Vite 5** for dev and build
- **React Router** for routing
- **TanStack Query** for server state
- **Zustand** (with persist) for auth session
- **Axios** for HTTP

Global styles live in `src/styles/global.css` (design tokens in `tokens.css`).

## Production build

```bash
npm run build
```

Output is in `dist/`. Serve it with any static host; set `VITE_*` variables at build time for the target environment.

For more UI-focused notes, see `FRONTEND.md` in this folder.
