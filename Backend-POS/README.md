# Digital Menu — Restaurant POS System (Backend)

> ⚡ **Highlights:** Built with Express 5 & TypeScript (Strict Mode) | Real-time WebSockets | Paymob Webhook HMAC Verification | Zod Schema Validation | 100% Server-Side Price Calculation & State Machine Enforcement.

A full-stack restaurant Point-of-Sale backend: real-time order management, role-based staff access, table/reservation handling, and a live payment integration — built as a deliberate step up from typical "junior CRUD API" portfolio projects.

> 🌐 **Live API Deployment:** [https://digital-menu-production-4182.up.railway.app](https://digital-menu-production-4182.up.railway.app)

> **Status:** Backend complete and tested. Frontend (React + Vite) in progress.

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
- [What I Learned](#what-i-learned)
- [Hardest Challenges & How I Solved Them](#hardest-challenges--how-i-solved-them)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Why I Built This

As a fresh graduate, most portfolio projects I came across followed the same shape: a handful of CRUD endpoints with no real structure behind them, or the same idea rebuilt with different names. I wanted something that behaved like software a real restaurant could actually use — not just a set of routes that happen to talk to a database.

I deliberately started small (Auth → Meals → Tables → Orders) instead of jumping into the hardest features first, specifically so I wouldn't get overwhelmed and abandon the project halfway — something I'd done before with more ambitious ideas. Once the core was solid, I kept extending the plan with whatever would make the system behave like production software rather than a tutorial demo: strict role separation, server-side price calculation, real-time order updates, and a payment integration tested end-to-end with a real webhook flow.

## Tech Stack

| Layer       | Technology                                       |
| ----------- | ------------------------------------------------ |
| Runtime     | Node.js (ESM)                                    |
| Language    | TypeScript (strict mode)                         |
| Framework   | Express 5                                        |
| Database    | MongoDB Atlas + Mongoose                         |
| Validation  | Zod (`.strict()` schemas everywhere)             |
| Auth        | JWT in httpOnly cookies                          |
| Real-time   | Socket.IO                                        |
| Payments    | Paymob (Intentions API + HMAC-verified webhooks) |
| Testing     | Jest + Supertest, isolated Atlas test database   |
| Dev tooling | tsx, nodemon                                     |

## Architecture Overview

```
Backend-POS/
├── node_modules/
├── src/
│   ├── config/               # Environment config, DB connection
│   ├── controllers/          # Request handling + business logic
│   ├── middlewares/          # Auth (REST + Socket), error handling
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Route definitions
│   ├── tests/                # Jest integration tests
│   ├── types/                # Shared TypeScript interfaces
│   ├── utils/                # toObjectId, assertions, error formatting
│   ├── validators/           # Zod schemas
│   ├── app.ts                # Express + Socket.IO construction (no side effects)
│   └── server.ts             # Actual server startup (DB connect + listen)
├── .env                      # Environment variables configuration
├── .gitignore                # Git ignored patterns
├── jest.config.js            # Jest test runner setup
├── package-lock.json         # Locked dependency tree
├── package.json              # Project scripts and dependencies
├── Plan.txt                  # System roadmap and architectural notes
├── test-socket-client.js     # Standalone Socket.IO client testing script
└── tsconfig.json             # TypeScript compiler settings
```

`app.ts` and `server.ts` are intentionally separate: `app.ts` only _builds_ the Express app and Socket.IO server and exports them, while `server.ts` is the only file that connects to the database and calls `.listen()`. This means the test suite can import the app and send real requests through it without ever starting a live server or touching the production database.

## Key Architecture Decisions

**Cookies over Bearer tokens.** This is a single web frontend talking to its own backend — the biggest realistic threat is XSS, and httpOnly cookies aren't readable by JavaScript. If a mobile app or third-party API access is added later, the plan is to accept _either_ a cookie or an `Authorization` header in the same middleware, rather than rewriting auth from scratch.

**References over embedding.** `Meal` references `Category` by ObjectId instead of storing a free-text category string. This was a deliberate correction from an earlier draft — a free-text field allows silent inconsistencies (`"Fast food"` vs `"fast food"`), can't be renamed in one place, and can't be queried reliably. Categories, in turn, can't be deleted while any meal still references them.

**All ID conversions go through one helper.** `toObjectId(id: unknown)` both validates the string is a real ObjectId _and_ converts it, throwing a clean `400` on anything malformed. Every controller that touches a Mongo ID uses this instead of repeating the same `mongoose.Types.ObjectId.isValid(...)` check.

**Every Zod schema is `.strict()`.** Unknown fields are rejected outright rather than silently ignored. This is what makes it possible to guarantee, for example, that a client can never smuggle a `totalPrice` field into an order request — the schema itself refuses it before the controller even runs.

**Centralized error handling.** Every controller does the same thing on failure: `next(error)`. One global handler translates Zod errors, Mongoose cast/validation errors, and MongoDB duplicate-key errors into a consistent JSON shape. Controllers never format error responses themselves.

**Reusable assertion helpers.** `assertUser()` and `assertExists()` replace repeated `if (!x) { ...; return next(error); }` blocks across every controller, and use TypeScript type predicates so the compiler narrows the type automatically afterward — no manual `!` or optional chaining needed past the check.

**Scalable Pagination & Dynamic Filtering.** Unbounded DB queries are a silent scalability killer. All list endpoints (`GET /api/meals`, `GET /api/orders`) enforce strict pagination (`page`, `limit`) and dynamic field filters (`search`, `category`, `status`) merged into a reusable Zod base schema (`paginationQueryValidate`). Search queries execute case-insensitive `$regex` matches on indexed fields, capping payload sizes, optimizing MongoDB cursor consumption, and improving client load times.

## Features

### Authentication & Authorization

- Registration with hashed passwords (bcrypt, via a Mongoose `pre('save')` hook)
- Login issuing a JWT in an httpOnly cookie
- Three roles — `Admin`, `Cashier`, `Customer` — enforced through middleware, not scattered checks
- Same JWT is verified independently for REST requests and Socket.IO connections

### Menu Management (Categories & Meals)

- Categories are a real collection, not a string on each meal — supports reliable filtering and renaming
- Categories can't be deleted while meals still reference them
- Meals reference their category and are validated against real category existence on both create and update
- Server-side paginated meal lists with real-time dynamic search (`$regex` matching) and category filtering.

### Tables

- Table status lifecycle (`Available` / `Occupied` / `Reserved`)
- Reservation timestamps are set and cleared automatically based on status changes
- Tables can't be deleted while linked to an active order

### Orders

- Total price is always calculated **server-side** from real database meal prices — the client can send quantities, never a price
- Explicit state machine for order status: `pending → preparing → completed`, with `cancelled` as a separate terminal state — no skipping steps, no moving backward
- Orders can only be cancelled by their owner or an Admin, only while still `pending`, and never once a payment has been confirmed
- New orders and status changes are broadcast in real time via Socket.IO
- Paginated order retrieval for staff with multi-status filters (`pending`, `preparing`, etc.).

### Payments (Paymob)

- Creates a Paymob payment intention tied to a real order and its server-calculated total
- Webhook endpoint verifies Paymob's HMAC signature using a timing-safe comparison before trusting any payload
- Idempotent: a webhook that arrives twice (or after the payment is already confirmed) has no additional effect
- Tested end-to-end through a real Paymob test-mode checkout via ngrok — not just unit-tested against a mock

---

## Multi-Environment Configuration

The architecture is explicitly configured to manage three distinct deployment contexts controlled via `NODE_ENV`:

| Environment | Purpose & System Behavior | Database Target |
| :--- | :--- | :--- |
| **Development** | Feature engineering, live-reloading (`tsx`/`nodemon`), and verbosely formatted error outputs. | Development Atlas Cluster |
| **Testing** | Automated integration test runs via Supertest with isolated state, mock sockets, and non-persistent hooks. | Isolated `pos-test` Atlas DB |
| **Production** | Optimized execution, suppressed stack traces, rate limiting, and real-time Socket.IO scalability. | Production Atlas Cluster |

---

## API Overview

| Resource       | Endpoint                       | Access                 |
| -------------- | ------------------------------ | ---------------------- |
| **Auth**       | `POST /api/users/register`     | Public                 |
|                | `POST /api/users/login`        | Public                 |
|                | `GET /api/users/profile`       | Authenticated          |
| **Categories** | `GET /api/categories/`         | Public                 |
|                | `POST /api/categories/`        | Admin                  |
|                | `PUT /api/categories/:id`      | Admin                  |
|                | `DELETE /api/categories/:id`   | Admin                  |
| **Meals**      | `GET /api/meals/` `/:id`       | Public                 |
|                | `POST /api/meals/`             | Admin                  |
|                | `PUT /api/meals/:id`           | Admin                  |
|                | `DELETE /api/meals/:id`        | Admin                  |
|                | `GET /api/meals?search=&page=` | Public                 |
| **Tables**     | `GET /api/tables/`             | Admin / Cashier        |
|                | `POST /api/tables/`            | Admin                  |
|                | `PUT /api/tables/:id`          | Admin / Cashier        |
|                | `PATCH /api/tables/:id/cancel` | Admin / Cashier        |
|                | `DELETE /api/tables/:id`       | Admin                  |
| **Orders**     | `POST /api/orders/`            | Customer               |
|                | `GET /api/orders/` `/:id`      | Admin / Cashier        |
|                | `PATCH /api/orders/:id/status` | Admin / Cashier        |
|                | `PATCH /api/orders/:id/cancel` | Owner / Admin          |
|                | `DELETE /api/orders/:id`       | Admin                  |
|                | `GET /api/orders?status=&page=`| Admin / Cashier        |
| **Payments**   | `POST /api/payments/create`    | Authenticated          |
|                | `POST /api/payments/webhook`   | Paymob (HMAC-verified) |

All responses follow a consistent shape: `{ success, message, data }` on success, `{ success: false, message, errors? }` on failure.

## Real-Time Events (Socket.IO)

The socket connection is authenticated with the same JWT cookie used for REST, verified in a dedicated handshake middleware (Socket.IO doesn't run through Express's regular middleware chain, so this couldn't reuse the REST auth middleware directly).

| Event                    | Direction       | Scope                                                                                        |
| ------------------------ | --------------- | -------------------------------------------------------------------------------------------- |
| `new_order`              | Server → Client | Broadcast to all connected clients                                                           |
| `track_order`            | Client → Server | Client requests to join an order's room (ownership/role-checked)                             |
| `status_changed`         | Server → Client | Sent only to that order's room                                                               |
| `order_status_changed`   | Server → Client | Sent to `staff_room` (Admin/Cashier auto-joined on connect) when a payment confirms an order |
| `payment_status_changed` | Server → Client | Sent only to that order's room                                                               |

## Getting Started

```bash
# Clone and install
git clone <repo-url>
cd Backend-POS
npm install

# Configure environment
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, FRONTEND_URL, PAYMOB_* keys

# Run in development
npm run dev

# Build and start in production
npm run build
npm start
```

### Required environment variables

```
PORT=8000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PAYMOB_SECRET_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=
```

## Running Tests

```bash
npm test
```

Tests run against an isolated `pos-test` database on the same Atlas cluster (not production data), using Supertest to send real HTTP requests through the Express app without starting a live server. Current coverage focuses on the highest-risk logic in the system: server-side price calculation, rejection of client-tampered fields, and order status state machine transitions.

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
| **Testing setup (ESM + TypeScript + Jest)**  | Jest, ts-jest, and native ESM fought constantly — timeouts, wrong DB connections, shell-script issues on Windows | Split `app.ts` (construction) from `server.ts` (execution) so tests import the app without triggering `listen()` or a real DB connection; used an isolated test database on the same cluster |
| **Payment integration (Paymob)**             | Needed to receive webhooks from a provider that can't reach `localhost`, and verify they weren't forged          | Used ngrok to expose the local server during development; implemented HMAC verification with a timing-safe comparison plus idempotency checks                                                |
| **Preventing duplicate/conflicting actions** | A double-clicked "create category," a webhook arriving twice, a cancel request racing a payment confirmation     | Combined proactive checks (query before insert) with database-level `unique` constraints and status checks as a safety net for the rare cases where timing beats the proactive check         |

## Roadmap

**Frontend** (in progress) — React + Vite, Socket.IO client with reconnect + re-join logic for tracked order rooms.

**Deployment** — Railway first, for a fast working deployment to share now; AWS/DigitalOcean later once the frontend is done, as a deliberate learning step into more hands-on infrastructure.

**Phase 2 ideas** (documented, not built):

- Meal discounts/promotions — likely a separate `Promotion` collection with start/end dates, not a static field on `Meal`, to support real time-limited offers
- VIP/membership tiers — as a separate `membershipTier` field, deliberately _not_ merged into the existing `role` field, which represents system permissions rather than a marketing/loyalty status
