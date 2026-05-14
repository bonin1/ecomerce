# StrikeTech — Backend API

Express-based REST API for the StrikeTech e-commerce platform. This package owns **authentication**, **persistence** (MySQL via Sequelize), **email**, **uploads**, **admin operations**, and **static assets** served under `/static`.

**← [Platform overview](../README.md)** · **Frontend → [../frontend/README.md](../frontend/README.md)**

**Quick local start:** from the repo root, `npm run first-run`, edit `backend/.env`, optional `docker compose up -d` for MySQL, then `npm run dev` — see the root **README**.

---

## What this service does

| Concern | Implementation |
|---------|------------------|
| **HTTP** | Express 4, JSON body parser, cookie parser, CORS (origin from `FRONTEND_URL`) |
| **Persistence** | Sequelize 6 + `mysql2`; models in `model/` |
| **Auth** | JWT (`JWT_SECRET`, `ADMIN_JWT_SECRET`), bcrypt, Google token verification, 2FA (TOTP + QR) |
| **Content** | Multer uploads, EJS views (home), HTML email templates in `template/` |
| **Files** | `static/` mounted at **`/static`** (resolved with `__dirname`, safe from any cwd) |
| **Output** | PDF (orders/exports), CSV, ZIP (archiver), QR codes where applicable |

Entry point: **`app.js`** (listens on `process.env.PORT` or **8080**).

---

## Requirements

- **Node.js** 18+
- **npm** 8+
- **MySQL** 8 (or compatible)
- Valid **`backend/.env`** (see below)

---

## Install and run

```bash
cd backend
npm install
cp .env.example .env   # then edit .env
npm run dev            # nodemon
# or
npm start              # node (production-style)
```

**Windows (PowerShell):** `Copy-Item .env.example .env`

---

## Environment

Configuration is loaded from **`backend/.env`** (path anchored to this directory), so it works whether you run `node app.js` from here or start the server via tooling in `frontend/`.

| Variable | Required for | Notes |
|----------|----------------|-------|
| `PORT` | Server bind | Default `8080` |
| `NODE_ENV` | Cookie / error behavior | `development` or `production` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` | Database | UTF-8 database recommended |
| `JWT_SECRET` | User sessions / tokens | Long random string per environment |
| `ADMIN_JWT_SECRET` | Admin routes | Separate from user secret |
| `FRONTEND_URL` | CORS + email links | e.g. `http://localhost:3000` |
| `BASE_URL` | Public API URL in emails | e.g. `http://localhost:8080` |
| `EMAIL_USER`, `EMAIL_PASSWORD` | Transactional mail | Gmail: use app password |
| `GOOGLE_CLIENT_ID` | Google login verification | Must match OAuth client |
| `LOGO_URL`, social URLs | Templates | Optional |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Affiliate mail | Optional |

See **`.env.example`** for a copy-paste template. **Do not commit `.env`.**

---

## Project layout

```
backend/
├── app.js                 # Express app, CORS, middleware, route registration, listen
├── database.js            # Sequelize instance + env load
├── package.json
├── config/                # Email transport, upload (Multer), etc.
├── controller/            # Request handlers by domain
│   ├── Admin/
│   ├── Auth/
│   ├── Affiliate/
│   ├── ProductManagement/
│   ├── Subscribe/
│   ├── UserManagement/
│   └── career/
├── middleware/            # auth, admin auth, validation, rate limit helpers
├── model/                 # Sequelize models + ALLMODELSYNC
├── routes/                # Express routers → mounted in app
├── services/              # emailServices, AffiliateEmailService, …
├── template/              # HTML fragments for Nodemailer
├── static/                # Served at GET /static/...
├── utils/                 # Shared helpers (e.g. validation)
├── views/                 # EJS (e.g. home)
└── tests/                 # Jest tests (wire jest.config as needed)
```

---

## HTTP routes (mount map)

Registered in **`routes/index.js`**:

| Mount path | Module | Typical use |
|------------|--------|-------------|
| `/` | inline + `StaticRoutes` | Home view, static helpers |
| `/auth` | `AuthRoute` | Register, login, logout, Google, password reset |
| `/api` | `ProfileManagementRoute` | Profile, security, 2FA, export, picture |
| `/admin` | `AdminRoute` | Admin auth, dashboard, orders, users |
| `/product` | `ProduktManagementRoute` | Categories, products, media |
| `/payment-methods` | `PaymentMethodRoutes` | Payment method CRUD |
| `/orders` | `OrderRoutes` | Checkout / order lifecycle |
| `/newsletter` | `SubscribeRoute` | Subscribe / unsubscribe |
| `/careers` | `CareerRoute` | Listings + applications (file upload) |
| `/track-order` | `TrackOrderRoutes` | Public tracking |
| `/reviews` | `ReviewRoutes` | Product reviews |
| `/affiliate` | `AffiliateRoute` | Affiliate program + tracking |

Explore **`routes/*.js`** and **`controller/`** for method-level paths (`GET`/`POST`/…).

---

## Static assets

- Files live in **`static/`**.
- URLs are **`{BASE_URL}/static/...`** (e.g. logos referenced in email HTML).
- Express uses `path.join(__dirname, 'static')` so the correct folder is used regardless of process cwd.

---

## Database

- **Models:** `model/*.js`
- **Sync:** `model/ALLMODELSYNC.js` runs when the app boots (handy for local dev).
- **Production:** Prefer explicit migrations and controlled rollouts instead of blind sync on every deploy.

---

## Scripts (`package.json`)

| Command | Description |
|---------|-------------|
| `npm run dev` | `nodemon app.js` — auto-restart on changes |
| `npm start` | `node app.js` — no watcher |
| `npm test` | Jest — add `jest.config.js` to point at `tests/` if needed |

---

## Working with the frontend

- The browser never reads `backend/.env`. The Next app uses **`NEXT_PUBLIC_API_URL`** (see `frontend/.env.example`).
- **`FRONTEND_URL`** must exactly match the site origin the user uses (scheme + host + port), or the browser will block requests (CORS) or links in emails will be wrong.

---

## Security checklist

- [ ] Strong, unique `JWT_SECRET` and `ADMIN_JWT_SECRET` in every environment  
- [ ] `NODE_ENV=production` behind HTTPS in live deployments  
- [ ] `FRONTEND_URL` restricted to real storefront origins  
- [ ] Mail credentials are app passwords or SMTP users with least privilege  
- [ ] Dependencies updated regularly (`npm audit`, patch releases)

Report serious vulnerabilities through a **private** channel when public issues would put users at risk.

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `ECONNREFUSED` (MySQL) | Check `DB_HOST`, port, firewall, MySQL service |
| Sequelize auth errors | Verify `DB_USER` / `DB_PASSWORD` and database grants |
| CORS blocked | Align `FRONTEND_URL` with the Next dev URL |
| Missing `uuid` / module errors | Run `npm install` in **`backend/`** |
| Rate limiter / Redis errors | `middleware/rateLimiterMiddleware.js` references Redis; ensure any future wiring matches your infra |

---

## License

This package is **private** (see repository `package.json` `"private": true`). Use and distribution follow the parent repository’s terms.
