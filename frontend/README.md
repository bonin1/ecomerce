# StrikeTech storefront (Next.js)

This directory is the **Next.js 16** application (App Router, TypeScript, Turbopack in dev). The **Express API** is a sibling folder: **`../backend/`**.

**Easiest start:** from the **repository root**, run `npm run first-run`, edit `../backend/.env`, then `npm run dev` (see [root README](../README.md)).

## Environment

Create **`frontend/.env.local`** (or `.env`) here — at minimum:

- `NEXT_PUBLIC_API_URL` — API base URL (e.g. `http://localhost:8080`)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — if you use Google sign-in

Copy from the template:

```bash
cp .env.example .env.local
```

Server secrets (database, JWT, email passwords) belong in **`../backend/.env`**, not here.

## Run

```bash
npm install
npm run dev
```

For API + web together from this folder: `npm run dev:all` (starts Next and runs `npm run dev` in `../backend`).

## Production build

From **`frontend/`**:

```bash
npm run build
```

Runs the optimized production compile and TypeScript checking. Resolve any errors before deployment.

## Client-only hooks

Pages that use **`useSearchParams()`** from `next/navigation` must wrap the component that calls it in a **`<Suspense>`** boundary so static generation and prerender succeed (see Next.js: *Missing Suspense with CSR bailout*).

Full documentation: **[README in the repo root](../README.md)**.
