# Digital Menu — Restaurant POS System (Backend)

> ⚡ **Highlights:** Express 5 & TypeScript (strict) | Real-time WebSockets | Paymob webhook HMAC verification | Zod schema validation | 100% server-side price calculation & state machine enforcement | Integration tests + CI

A full-stack restaurant Point-of-Sale backend: real-time order management, role-based staff access, table handling with QR ordering, and a live payment integration — built as a deliberate step up from typical "junior CRUD API" portfolio projects.

[![Backend CI](https://github.com/mahmoud-zakaria1/digital-menu/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/mahmoud-zakaria1/digital-menu/actions/workflows/backend-ci.yml)

> 🌐 **Live app:** [https://digital-menu-na6l.onrender.com](https://digital-menu-na6l.onrender.com) (free instance: the first request after idle can take about a minute)

> 📚 **Interactive Swagger Docs:** [`/api-docs`](https://digital-menu-na6l.onrender.com/api-docs) on the live app, or `http://localhost:8000/api-docs` locally

> 🧭 This is the backend README. For the project overview, the frontend and the deployment setup see the [root README](../README.md).

---

## Table of Contents

- [Why I Built This](#why-i-built-this)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Key Architecture Decisions](#key-architecture-decisions)
- [Features](#features)
- [API Overview](#api-overview)
- [Real-Time Events (Socket.IO)](#real-time-events-socketio)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [What I Learned](#what-i-learned)
- [Hardest Challenges & How I Solved Them](#hardest-challenges--how-i-solved-them)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Why I Built This

As a fresh graduate, most portfolio projects I came across followed the same shape: a handful of CRUD endpoints with no real structure behind them, or the same idea rebuilt with different names. I wanted something that behaved like software a real restaurant could actually use — not just a set of routes that happen to talk to a database.

I deliberately started small (Auth → Meals → Tables → Orders) instead of jumping into the hardest features first, specifically so I wouldn't get overwhelmed and abandon the project halfway — something I'd done before with more ambitious ideas. Once the core was solid, I kept extending the plan with whatever would make the system behave like production software rather than a tutorial demo: strict role separation, server-side price calculation, real-time order updates, and a payment integration tested end-to-end with a real webhook flow.

## Tech Stack

| Layer       | Technology                                        |
| ----------- | ------------------------------------------------- |
| Runtime     | Node.js 22 (ESM)                                  |
| Language    | TypeScript (strict mode)                          |
| Framework   | Express 5                                         |
| Database    | MongoDB Atlas + Mongoose                          |
| Validation  | Zod (`.strict()` schemas everywhere)              |
| Auth        | JWT in httpOnly cookies, sliding session          |
| Real-time   | Socket.IO                                         |
| Payments    | Paymob (Intentions API + HMAC-verified webhooks)  |
| Media       | Cloudinary (multer memory storage, never on disk) |
| Security    | helmet, express-rate-limit, bcrypt                |
| API Docs    | Swagger UI (`swagger-ui-express` + `swagger-jsdoc`) |
| Testing     | Jest + Supertest, isolated test database          |
| CI          | GitHub Actions (type check + tests on a Mongo container) |
| Dev tooling | tsx, nodemon                                      |

## Architecture Overview

```
Backend-POS/
├── src/
│   ├── config/               # Environment config, DB connection, Swagger spec, Cloudinary
│   ├── controllers/          # Request handling + business logic
│   ├── middlewares/          # Auth (REST + Socket), error handling, uploads, frontend serving
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Route definitions + OpenAPI annotations
│   ├── scripts/              # seedAdmin.ts (bootstraps the first Admin)
│   ├── tests/                # Jest integration + unit tests
│   ├── types/                # Shared TypeScript interfaces
│   ├── utils/                # toObjectId, assertions, session, orderEvents, error formatting
│   ├── validators/           # Zod schemas
│   ├── app.ts                # Express + Socket.IO construction (no side effects)
│   └── server.ts             # Actual server startup (DB connect + listen)
├── jest.config.js            # Jest test runner setup
├── package.json              # Project scripts and dependencies
└── tsconfig.json             # TypeScript compiler settings
```

`app.ts` and `server.ts` are intentionally separate: `app.ts` only _builds_ the Express app and Socket.IO server and exports them, while `server.ts` is the only file that connects to the database and calls `.listen()`. This means the test suite can import the app and send real requests through it without ever starting a live server or touching the production database.

## Key Architecture Decisions

**Cookies over Bearer tokens.** This is a single web frontend talking to its own backend — the biggest realistic threat is XSS, and httpOnly cookies aren't readable by JavaScript. If a mobile app or third-party API access is added later, the plan is to accept _either_ a cookie or an `Authorization` header in the same middleware, rather than rewriting auth from scratch.

**One origin in production.** Express serves the React build itself, so the frontend and the API share an origin. Safari on iOS blocks third-party cookies even with `SameSite=None`, and the socket handshake authenticates with that same cookie, so a split deployment across two hosts would break login (and real-time) for many phone users. Same origin means `SameSite=Lax` cookies, no CORS in production and no WebSocket proxy.

**Sliding session with a hard cap.** An authenticated request renews the cookie once the token is a day old (7-day idle window), capped at 30 days from the original login via an `authTime` claim carried through every renewal. All three numbers and the only code that sets the auth cookie live in `utils/session.ts`, so login, renewal and logout can't drift apart. The user is re-read from the database on every request, so deleting or demoting someone takes effect immediately.

**An order goes live at exactly one moment.** Cash orders when created; online orders only once the signed webhook confirms the payment. Both paths call `publishOrderToStaff` (table occupied + `new_order` to staff), and `releaseTable` is its mirror image when the order ends. Until an online order is paid it is invisible to staff in lists, stats and the status endpoint — hiding a card in the UI is not a guard.

**The webhook trust model.** The HMAC only authenticates the fields it covers, so the handler finds the payment by Paymob's _signed_ order id (never by `merchant_order_id`, which is not signed), checks the signed amount and currency against what was recorded, and makes every state change an atomic compare-and-set. Retries and simultaneous callbacks can't apply an effect twice.

**Socket rooms are the access-control boundary.** `order_<id>` rooms are joined only after an owner/staff check, `staff_room` holds Admin/Cashier sockets, and anything carrying personal data (`new_order`) is emitted to `staff_room` — never `io.emit`.

**References over embedding.** `Meal` references `Category` by ObjectId instead of storing a free-text category string. This was a deliberate correction from an earlier draft — a free-text field allows silent inconsistencies (`"Fast food"` vs `"fast food"`), can't be renamed in one place, and can't be queried reliably. Categories, in turn, can't be deleted while any meal still references them.

**All ID conversions go through one helper.** `toObjectId(id: unknown)` both validates the string is a real ObjectId _and_ converts it, throwing a clean `400` on anything malformed. Every controller that touches a Mongo ID uses this instead of repeating the same `mongoose.Types.ObjectId.isValid(...)` check.

**Every Zod schema is `.strict()`.** Unknown fields are rejected outright rather than silently ignored. This is what makes it possible to guarantee, for example, that a client can never smuggle a `totalPrice`, a `role` or a `paymentStatus` into a request — the schema itself refuses it before the controller even runs.

**Centralized error handling.** Every controller does the same thing on failure: `next(error)`. One global handler translates Zod errors, Mongoose cast/validation errors, and MongoDB duplicate-key errors into a consistent JSON shape. Controllers never format error responses themselves.

**Reusable assertion helpers.** `assertUser()` and `assertExists()` replace repeated `if (!x) { ...; return next(error); }` blocks across every controller, and use TypeScript type predicates so the compiler narrows the type automatically afterward — no manual `!` or optional chaining needed past the check.

**Scalable pagination & dynamic filtering.** All list endpoints (`GET /api/meals`, `GET /api/orders`) enforce strict pagination (`page`, `limit`) and dynamic filters (`search`, `category`, `status`) built on a reusable Zod base schema (`paginationQueryValidate`). The meal search term is regex-escaped before it reaches `$regex`, so a crafted pattern on a public endpoint can't cause catastrophic backtracking (ReDoS).

## Features

### Authentication & Authorization

- Public registration always creates a `Customer`; the schema rejects any client-supplied `role`
- Admin-only staff creation (`POST /api/users/staff`) for `Admin` and `Cashier` accounts
- First Admin bootstrapped by `npm run seed:admin` — never through an HTTP path (an in-app way to mint the first Admin is a way for an attacker to do the same). Idempotent, and it refuses to silently promote an existing customer
- Login issues a JWT in an httpOnly cookie; logout clears it server-side
- Passwords hashed with bcrypt in a Mongoose `pre('save')` hook
- Three roles enforced through middleware, not scattered checks
- The same JWT is verified independently for REST requests and Socket.IO connections
- Login and register share a brute-force rate limit (20 attempts / 15 min / IP, production only)
- The server refuses to boot in production without `JWT_SECRET`

### Menu Management (Categories, Meals & Images)

- Categories are a real collection, not a string on each meal — supports reliable filtering and renaming
- Categories can't be deleted while meals still reference them
- Meals reference their category and are validated against real category existence on create and update
- Meals can be switched off (`isAvailable`) and are then rejected at order time
- Admin image upload streamed to Cloudinary (JPEG/PNG/WEBP, 5 MB cap), never written to disk — the host's filesystem is ephemeral
- Server-side paginated meal lists with case-insensitive search and category filtering

### Tables

- Table status (`Available` / `Occupied` / `Reserved`) with an automatic reservation timestamp
- An order that goes live marks its table `Occupied` and links it; completing, cancelling or deleting the order frees it again (only if the table still points at that same order)
- Tables can't be deleted while linked to an active order
- Each table's QR code is just a link to `/menu?table=<id>`, which makes the checkout a dine-in order

### Orders

- Total price is always calculated **server-side** from real database meal prices — the client sends quantities, never a price
- Duplicate meal lines in one order are merged; unavailable meals are rejected by name
- Explicit state machine: `pending → preparing → completed`, with `cancelled` as a terminal state — no skipping steps, no moving backward
- An order carries a `paymentMethod` (`cash` | `online`, a client _choice_) and a `paymentStatus` (`pending` | `paid` | `failed`, written only by the webhook)
- Orders can be cancelled by their owner, a Cashier or an Admin, only while `pending`, and never once a payment has been confirmed
- Customers read their own orders (for live tracking); staff read all of them; nobody else can
- Admin analytics: revenue (completed orders only), active orders and top-5 best sellers via a MongoDB aggregation
- New orders and status changes are broadcast in real time via Socket.IO

### Payments (Paymob)

- Creates a payment attempt tied to a real order and its server-calculated total; each call is a fresh attempt, so a failed or abandoned payment can be retried
- The backend builds the hosted-checkout URL, so the frontend never touches a Paymob key
- Webhook verifies the HMAC-SHA512 signature with a timing-safe comparison before trusting anything
- Idempotent: a webhook that arrives twice (or after the payment is already confirmed) has no additional effect
- A confirmed payment sends the order straight to `preparing` (it is already paid, so there is nothing for the cashier to approve) and publishes it to staff
- A payment that arrives for an already cancelled order keeps it cancelled and is logged for a manual refund
- Tested end-to-end through a real Paymob test-mode checkout, and covered by automated webhook tests

---

## Multi-Environment Configuration

Behaviour is controlled via `NODE_ENV`:

| Environment | Purpose & System Behavior | Database Target |
| :--- | :--- | :--- |
| **Development** | Feature work, live reload (`tsx`/`nodemon`), verbose error output with stack traces. | Development Atlas cluster |
| **Testing** | Integration tests through Supertest with isolated state. Rate limiting off. | Isolated `pos-test` database (Atlas locally, a Mongo container in CI) |
| **Production** | Stack traces suppressed, auth rate limiting on, secure cookies, `JWT_SECRET` mandatory. | Production Atlas cluster |

---

## API Overview

Interactive docs: `/api-docs` (Swagger UI).

| Resource       | Endpoint                           | Access                       |
| -------------- | ---------------------------------- | ---------------------------- |
| **Health**     | `GET /api/health`                  | Public                       |
| **Users**      | `POST /api/users/register`         | Public                       |
|                | `POST /api/users/login`            | Public                       |
|                | `POST /api/users/logout`           | Public (idempotent)          |
|                | `GET /api/users/profile`           | Authenticated                |
|                | `POST /api/users/staff`            | Admin                        |
| **Categories** | `GET /api/categories`              | Public                       |
|                | `POST /api/categories`             | Admin                        |
|                | `PUT /api/categories/:id`          | Admin                        |
|                | `DELETE /api/categories/:id`       | Admin                        |
| **Meals**      | `GET /api/meals` (`?search=&category=&page=&limit=`) | Public     |
|                | `GET /api/meals/:id`               | Public                       |
|                | `POST /api/meals`                  | Admin                        |
|                | `PUT /api/meals/:id`               | Admin                        |
|                | `DELETE /api/meals/:id`            | Admin                        |
| **Uploads**    | `POST /api/uploads/meal-image`     | Admin                        |
| **Tables**     | `GET /api/tables`                  | Admin / Cashier              |
|                | `POST /api/tables`                 | Admin                        |
|                | `PUT /api/tables/:id`              | Admin / Cashier              |
|                | `PATCH /api/tables/:id/cancel`     | Admin / Cashier              |
|                | `DELETE /api/tables/:id`           | Admin                        |
| **Orders**     | `POST /api/orders`                 | Authenticated                |
|                | `GET /api/orders` (`?status=&page=&limit=`) | Authenticated (customers see their own, staff see all live orders) |
|                | `GET /api/orders/stats`            | Admin                        |
|                | `GET /api/orders/:id`              | Owner / Admin / Cashier      |
|                | `PATCH /api/orders/:id/status`     | Admin / Cashier              |
|                | `PATCH /api/orders/:id/cancel`     | Owner / Admin / Cashier      |
|                | `DELETE /api/orders/:id`           | Admin                        |
| **Payments**   | `POST /api/payments/create`        | Authenticated (the order's owner) |
|                | `POST /api/payments/webhook`       | Paymob (HMAC-verified)       |

All responses follow a consistent shape: `{ success, message, data }` on success, `{ success: false, message, errors? }` on failure.

## Real-Time Events (Socket.IO)

The socket connection is authenticated with the same JWT cookie used for REST, verified in a dedicated handshake middleware (Socket.IO doesn't run through Express's regular middleware chain, so this couldn't reuse the REST auth middleware directly).

| Event                    | Direction       | Scope                                                                       |
| ------------------------ | --------------- | --------------------------------------------------------------------------- |
| `new_order`              | Server → Client | `staff_room` only (Admin/Cashier join it on connect). Carries customer data |
| `track_order`            | Client → Server | Client asks to join an order's room (ownership/role-checked); the server acknowledges once joined |
| `track_order_error`      | Server → Client | The requester only, when the order is unknown or not theirs                 |
| `status_changed`         | Server → Client | That order's room **and** `staff_room`                                      |
| `payment_status_changed` | Server → Client | That order's room only                                                      |

Events are a freshness optimisation, never the source of truth. Socket.IO doesn't replay what a client missed while offline, so clients re-fetch over REST after every (re)connect ("subscribe, then sync").

## Getting Started

```bash
# From the repository root
cd Backend-POS
npm install

# Create .env (see below), then:
npm run dev        # development with live reload
```

### Required environment variables

```
PORT=8000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PAYMOB_PUBLIC_KEY=
PAYMOB_SECRET_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### First Admin

Neither public registration nor the staff endpoint can create the very first Admin, so add these to `.env` and run the seed script once:

```
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PHONE=
ADMIN_PASSWORD=
```

```bash
npm run seed:admin
```

It validates the values with the same rules as the staff endpoint, hashes the password through the normal `save()` path, and does nothing if an Admin already exists.

## Running Tests

```bash
npm test
```

Tests run against an isolated `pos-test` database (never production data), using Supertest to send real HTTP requests through the Express app without starting a live server. Current coverage focuses on the highest-risk logic:

- **Orders:** server-side price calculation, rejection of client-tampered fields, state machine transitions, owner/staff read access
- **Sessions:** sliding renewal, preserved original login time, the absolute cap, legacy tokens
- **Payment webhook:** invalid HMAC, a valid callback, replay (idempotency), amount mismatch, a late payment on a cancelled order, a failed payment

GitHub Actions runs `tsc --noEmit` and the whole suite on every push that touches the backend, against a throwaway MongoDB container (not the Atlas cluster).

## Deployment

The app runs as a single [Render](https://render.com) service defined in the root `render.yaml`: the build step builds the React app and installs the backend, and Express serves both. Secrets are set in Render's dashboard, never committed. In Paymob's dashboard the integration's webhook URL points to `/api/payments/webhook` on the live app.

---

## What I Learned

### Patterns I hadn't used before

- **The Mapper pattern** — never passing client input directly into a database write. Every create/update goes through a function that explicitly maps validated input to the exact document shape the database expects. This caught several bugs (string-vs-ObjectId mismatches) before they became runtime errors.
- **A real state machine** — instead of letting any order status change to any other, I modeled valid transitions as data (`{ pending: ["preparing"], preparing: ["completed"], ... }`). First time I'd expressed business rules as a lookup table instead of scattered `if` chains.
- **Reusable type-narrowing helpers** — `assertUser`/`assertExists` use TypeScript type predicates, so a single guard function both stops execution _and_ tells the compiler the value is safe to use afterward. Small thing, but it changed how I think about removing duplication beyond copy-pasted code.

### Thinking in business rules, not just endpoints

The real shift was realizing an endpoint isn't "done" when it returns the right JSON — it's done when it protects the rules behind it. That meant: never trusting a price from the client, enforcing role separation through middleware instead of scattered checks, and blocking actions that would corrupt data (deleting a category still in use, cancelling an order that's already paid, double-processing a webhook).

## Hardest Challenges & How I Solved Them

| Challenge                                    | What was happening                                                                                               | How I solved it                                                                                                                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Intermittent Atlas disconnects**           | `mongodb+srv://` DNS resolution kept timing out, forcing constant restarts                                       | Overrode Node's DNS servers (Google/Cloudflare) and added connection retry logic with backoff                                                                                                |
| **Socket.IO authentication**                 | REST auth relies on `cookie-parser` middleware, which Socket.IO's handshake never passes through                 | Built a separate JWT middleware for the handshake that parses the raw cookie header manually                                                                                                 |
| **Testing setup (ESM + TypeScript + Jest)**  | Jest, ts-jest, and native ESM fought constantly — timeouts, wrong DB connections, shell-script issues on Windows | Split `app.ts` (construction) from `server.ts` (execution) so tests import the app without triggering `listen()` or a real DB connection; used an isolated test database                      |
| **Payment integration (Paymob)**             | Needed to receive webhooks from a provider that can't reach `localhost`, and verify they weren't forged          | Used ngrok to expose the local server during development; implemented HMAC verification with a timing-safe comparison, signed-field matching, amount checks and idempotency                  |
| **Preventing duplicate/conflicting actions** | A double-clicked "create category," a webhook arriving twice, a cancel request racing a payment confirmation     | Combined proactive checks (query before insert) with database-level `unique` constraints and atomic status checks as a safety net for the rare cases where timing beats the proactive check   |
| **Login failing on iPhone in a split deploy** | A frontend and an API on two different hosts make the auth cookie third-party, which Safari blocks               | Served the React build from Express so everything shares one origin, and switched the cookie to `SameSite=Lax`                                                                              |
| **Server crashing only in production**       | Two packages used at runtime sat in `devDependencies`; local runs and CI install them, a production install doesn't | Moved them to `dependencies`. CI now also type-checks, and the deploy environment is the final test                                                                                       |

## Known Limitations

- Money is stored as a decimal `Number`; integer piastres would be safer.
- Socket.IO runs on a single instance. Horizontal scaling would need the Redis adapter.
- There is no refund flow yet: a payment for an already cancelled order is only logged for a manual refund.
- The `Reserved` table status is a manual marker for staff (there is no frontend control for it yet) and it does not stop a QR order from taking that table. A true reservation (booking ahead) is a separate feature on the roadmap.
- Sessions can't be revoked individually (deleting or demoting the user is immediate).
- Orders store one server-calculated total, not a price per line.
- `createOrder` has no idempotency key, so a retried request can create a duplicate order.

## Roadmap

- **Refund flow** (Paymob) for late payments and for reservation deposits
- **Reservations**: booking a table for a future time with a refundable deposit — deliberately a different concept from a dine-in order
- Refresh-token rotation with revocable sessions
- Analytics date ranges, a per-line price snapshot, and meal promotions / membership tiers

The full list, with the reasoning behind each item, lives in the repository's `Plan.txt`.