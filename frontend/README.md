# StrikeTech storefront (Next.js)

This directory is the **Next.js 15** application. The **Express API** is a sibling folder: **`../backend/`**.

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

Full documentation: **[README in the repo root](../README.md)**.
