# Digital Menu — Restaurant POS System

[![Backend CI](https://github.com/mahmoud-zakaria1/digital-menu/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/mahmoud-zakaria1/digital-menu/actions/workflows/backend-ci.yml)

A full-stack restaurant ordering and point-of-sale system. A customer scans a QR code on the table, orders from a live menu and pays online or in cash; the cashier sees the order appear in real time and moves it through the kitchen; the admin manages the menu, tables, staff and sales.

> 🌐 **Live demo:** https://digital-menu-na6l.onrender.com
>
> ⏳ The demo runs on a free instance that sleeps when idle, so the **first request can take about a minute**. After that it is fast.

<!-- TODO: add a short GIF of the main flow (scan QR -> order -> cashier board updates live) at docs/demo.gif -->
<!-- ![Demo](docs/demo.gif) -->

---

## Try it

| Role | What to try |
| ---- | ----------- |
| **Customer** | Browse the menu, add items, check out with cash or the Paymob test card, then watch the order status update live. |
| **Cashier** | Open `/cashier` and move incoming orders through Pending → Preparing → Completed. |
| **Admin** | Open `/admin` for sales analytics, menu management with image upload, tables with printable QR codes, and staff accounts. |

<!-- TODO: add demo accounts here (Customer and Cashier). Share the Admin account only on request: anyone could wipe the menu. -->

Online payments run in Paymob **test mode** (no real money). Test cards are listed in [Paymob's test credentials](https://developers.paymob.com/paymob-docs/need-help/setup-guides/test-credentials).

## Highlights

- **Never trusts the client with money.** Totals are calculated on the server from real meal prices, and every request schema rejects unknown fields, so a tampered `totalPrice` is refused before the controller runs.
- **Payments done properly.** Paymob webhooks are verified with an HMAC signature (timing-safe comparison), matched by Paymob's *signed* order id, checked against the expected amount and currency, and applied with atomic compare-and-set updates, so retries and simultaneous callbacks are harmless. The browser redirect back from Paymob is never trusted.
- **An order goes live at exactly one moment.** Cash orders when created; online orders only once the payment is confirmed. An abandoned checkout never reaches the kitchen.
- **Real-time that survives bad networks.** Socket.IO rooms act as the access-control boundary, and every client follows *subscribe, then sync*: events are a freshness optimisation, and the REST API stays the source of truth after every reconnect.
- **Explicit order state machine.** `pending → preparing → completed`, with `cancelled` as a terminal state. Transitions are data, not scattered `if` chains.
- **Security hardening.** httpOnly cookie sessions with a sliding window and an absolute cap, role checks in middleware, regex-escaped search input (ReDoS), helmet, rate limiting on auth routes, and a server that refuses to boot in production without a JWT secret.
- **Tested where it matters.** Integration tests cover server-side pricing, field rejection, the order state machine, ownership rules, session renewal and the whole payment webhook (bad signature, replay, amount mismatch, late payment on a cancelled order, failed payment). CI runs the type check and the suite against a throwaway MongoDB on every push.

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Backend | Node.js, Express 5, TypeScript (strict), MongoDB Atlas + Mongoose, Zod, Socket.IO |
| Frontend | React, Vite, TypeScript, Redux Toolkit (RTK Query), React Hook Form + Zod, Tailwind CSS |
| Payments | Paymob (Intentions API + HMAC-verified webhooks) |
| Media | Cloudinary (streamed from memory, never written to disk) |
| Testing & CI | Jest, Supertest, GitHub Actions |
| Hosting | Render (single service), MongoDB Atlas |

## Repository layout

```
digital-menu/
├── Backend-POS/      # Express API + Socket.IO server (see its README)
├── Frontend-POS/     # React app (see its README)
├── .github/workflows # Backend CI
├── render.yaml       # Render blueprint (one service for the whole app)
└── Plan.txt          # Roadmap, decisions and the fixes log
```

## How it is deployed

The whole app runs as **one Render service**: Express serves the React build itself, so the frontend and the API share a single origin.

This was a deliberate choice. Splitting them across two hosts (for example Vercel and Render) makes the auth cookie third-party, which Safari on iOS blocks, and a rewrite proxy cannot carry the WebSocket handshake that authenticates with that same cookie. One origin removes both problems, along with CORS. If the project ever gets a custom domain, `app.` and `api.` subdomains would be same-site and the two could be split again; the frontend already supports both a relative and a full API URL.

## Run it locally

You need Node.js 22+ and a MongoDB database (a free Atlas cluster works).

**Backend** (`Backend-POS/.env`):

```
PORT=8000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=any_long_random_string
FRONTEND_URL=http://localhost:5173
PAYMOB_PUBLIC_KEY=
PAYMOB_SECRET_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

```bash
cd Backend-POS
npm install
npm run dev
```

Public registration can only create customers, and creating staff needs an existing Admin, so the **first Admin** is created from a script. Add `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE` and `ADMIN_PASSWORD` to the `.env`, then run `npm run seed:admin` (it does nothing if an Admin already exists).

**Frontend** (`Frontend-POS/.env`):

```
VITE_API_BASE_URL=http://localhost:8000/api
```

```bash
cd Frontend-POS
npm install
npm run dev
```

Then open http://localhost:5173. Interactive API docs are at http://localhost:8000/api-docs. To run the tests: `cd Backend-POS && npm test` (they use an isolated `pos-test` database).

## Known limitations

Stated up front rather than discovered later:

- Money is stored as a decimal `Number`; integer piastres would be safer.
- Socket.IO runs on a single instance. Scaling horizontally would need the Redis adapter.
- There is no refund flow yet: a payment that arrives for an already cancelled order is only logged for a manual refund.
- The cashier board loads the latest 100 orders and groups them by status in the browser.
- Sessions cannot be revoked one by one (deleting or demoting the user takes effect immediately).
- Orders store one server-calculated total, not a price per line.
- The frontend has no automated tests yet.

## Roadmap

Refund flow, refresh-token rotation, analytics date ranges, promotions, and table reservations with a refundable deposit. The full list, with the reasoning behind each, lives in [`Plan.txt`](Plan.txt).

## Author

**Mahmoud Zakaria**: [GitHub](https://github.com/mahmoud-zakaria1)