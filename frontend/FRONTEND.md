# Frontend

React + TypeScript application built with Vite.

---

## Stack

| Tool | Purpose |
|---|---|
| React 18 | UI |
| TypeScript | Typing |
| Vite | Build tool |
| React Router v6 | Routing |
| TanStack Query | Server state |
| Zustand | Client state |
| Axios | HTTP client |

---

## Folder structure

```
src/
  app/
    providers/          # QueryProvider, app-level wrappers
    routes/             # Router config, ProtectedRoute
  features/
    auth/               # Login, Signup pages + hooks + API
    dashboard/          # Dashboard page
    onboarding/         # Onboarding flow (iCBT / उत्थान)
  shared/
    api/                # Axios client, healthApi, index
    components/         # ErrorBoundary, UI components
    hooks/              # useDisclosure, useLocalStorage
    lib/                # env config
    stores/             # authStore (Zustand)
    types/              # All shared TypeScript interfaces
    utils/              # cn (classname utility)
  styles/
    tokens.css          # Design tokens (colors, spacing, etc.)
    global.css          # Global styles and component classes
```

---

## Getting started

```bash
cd frontend
npm install
cp .env.example .env.development
npm run dev
```

App runs on `http://localhost:3000`.

---

## Environment variables

Defined in `.env.development` (and `.env.production` for builds).

```
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=उत्थान
VITE_APP_ENV=development
```

The Vite dev server proxies `/api` to the backend. Axios base URL is set to `http://localhost:8000` in development.

---

## Auth flow

1. User signs up → redirected to `/login` with email pre-filled
2. User logs in → backend returns `is_first_login`
   - `true` → redirect to `/onboarding`
   - `false` → redirect to `/dashboard`
3. Onboarding completes → `PATCH /auth/onboarding/complete` → redirect to `/dashboard`

The JWT access token is stored in `localStorage` under the key `auth-storage` (Zustand persist). Every Axios request attaches it via a request interceptor. A 401 response clears the store and redirects to `/login`.

---

## Routing

| Path | Access | Description |
|---|---|---|
| `/login` | Public | Login page |
| `/signup` | Public | Signup page |
| `/onboarding` | Auth required | First-login onboarding flow |
| `/dashboard` | Auth + onboarded | Main dashboard |
| `/health` | Public | Backend health check |

`ProtectedRoute` guards `/onboarding` and `/dashboard`. Passing `requireOnboarded` on `/dashboard` redirects users who have not completed onboarding back to `/onboarding`.

---

## State management

**Zustand** (`src/shared/stores/authStore.ts`) holds:

```ts
{
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}
```

Persisted to `localStorage`. Actions: `setAuth`, `clearAuth`.

**TanStack Query** handles all server state (fetching, caching, mutations). Query client is configured in `src/app/providers/QueryProvider.tsx`.

---

## API layer

`src/shared/api/client.ts` — Axios instance with:
- Base URL from env
- Request interceptor: attaches `Authorization: Bearer <token>` from localStorage
- Response interceptor: clears auth and redirects to `/login` on 401

`src/features/auth/api/authApi.ts` — Auth endpoints (login, signup, me, completeOnboarding).

`src/shared/api/healthApi.ts` — Health check endpoint.

---

## Onboarding

Five-step flow at `/onboarding`:

1. Welcome screen
2. Cultural background selection
3. Mental health concerns (multi-select)
4. CBT goals (multi-select)
5. Therapy experience level

Data is mock only — not persisted beyond the `is_onboarded` flag. Completing the flow calls `PATCH /auth/onboarding/complete`.

---

## Scripts

```bash
npm run dev       # start dev server
npm run build     # production build
npm run lint      # eslint
npm run format    # prettier
```

---

## Path aliases

Configured in `tsconfig.json` and `vite.config.ts`:

```
@app/*    → src/app/*
@features/* → src/features/*
@shared/* → src/shared/*
```
