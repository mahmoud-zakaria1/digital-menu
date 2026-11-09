# Digital Menu — Restaurant POS System (Frontend)

> ⚡ **Highlights:** Built with React 19 & TypeScript (Strict Mode) | RTK Query server state | Real-time Socket.IO with "subscribe, then sync" | React Hook Form + Zod validation | Server-authoritative pricing | Role-protected routes | QR-code table ordering.

The React client for the Digital Menu POS: a mobile-first ordering flow for customers, a live Kanban board for the cashier, and a management dashboard for the admin — built as the other half of a backend that was designed to never trust the client.

> 🌐 **Live App:** [https://digital-menu-na6l.onrender.com](https://digital-menu-na6l.onrender.com) *(free instance: the first request after idle can take about a minute)*

> 🧭 This is the frontend README. For the project overview see the [root README](../README.md); for the API, the security model and the payment flow see the [backend README](../Backend-POS/README.md).

> **Status:** Frontend complete. Served by the backend as one service in production.

<!-- TODO: add 3-4 screenshots (customer menu on a phone, cashier board, admin dashboard, order tracking) in docs/ and link them here -->

---

## Table of Contents

- [Why I Built This](#why-i-built-this)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Key Architecture Decisions](#key-architecture-decisions)
- [Features](#features)
- [Routes](#routes)
- [Real-Time Hooks (Socket.IO)](#real-time-hooks-socketio)
- [Getting Started](#getting-started)
- [What I Learned](#what-i-learned)
- [Hardest Challenges & How I Solved Them](#hardest-challenges--how-i-solved-them)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Why I Built This

With the backend finished and tested, the project was still only a set of endpoints that I could use through Swagger and nobody else could. I wanted the part that makes it a *Digital Menu*: a customer scans a QR code on the table, orders from their phone, and the cashier watches the order appear on a screen — the whole story working end to end, not a UI that just lists database rows.

I kept the same discipline as on the backend and built the frontend in the order of the customer journey (Auth → Menu → Cart → Checkout) before the staff dashboards, and I set one rule early: the frontend never decides anything about money. The cart totals are for display, and the server stays the source of truth for what is charged.

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Framework    | React 19 + Vite                                     |
| Language     | TypeScript (strict mode)                            |
| Server state | Redux Toolkit **RTK Query** with an Axios base query |
| Client state | Redux Toolkit slice (cart), persisted to localStorage |
| Forms        | React Hook Form + Zod                               |
| Routing      | React Router (role-protected routes)                |
| Real-time    | socket.io-client                                    |
| Styling      | Tailwind CSS v4 (brand tokens defined once in `@theme`) |
| QR codes     | qrcode.react                                        |
| Feedback     | react-hot-toast + a global error boundary           |

## Architecture Overview

```
Frontend-POS/
├── public/
├── src/
│   ├── api/                  # Axios instance, RTK Query base, root apiSlice, createSocket()
│   ├── app/                  # Redux store, typed hooks, cart persistence middleware
│   ├── components/           # Shared UI: Navbar, ToastProvider, ErrorBoundaryFallback
│   ├── features/
│   │   ├── admin/            # Dashboard, CRUD modals, analytics, tables + QR, staff creation
│   │   ├── auth/             # Login/register, ProtectedRoute, RootRedirect, logout
│   │   ├── cart/             # Cart slice, storage, selectors, cart page and bar
│   │   ├── menu/             # Menu page, meal cards, search and category filter
│   │   ├── orders/           # Checkout, tracking, cashier board, socket hooks
│   │   └── tables/           # Tables API and the QR link helper
│   ├── hooks/                # useDebounce
│   ├── pages/                # Unauthorized page
│   ├── router/               # Route tree
│   ├── styles/               # Global SCSS entry
│   ├── App.tsx               # Root shell
│   └── main.tsx              # Providers: Redux, error boundary, toasts
├── index.html
├── package.json              # Scripts and dependencies
├── tsconfig.app.json         # Strict TypeScript settings
└── vite.config.ts
```

The code is organised **by feature, not by file type**: everything about orders (API slice, hooks, components, pages, types) lives in `features/orders`, so a feature can be read, changed or deleted in one place.

## Key Architecture Decisions

**The server is the source of truth for money.** The cart stores only `mealId` and `quantity`, never a price or a name — the same "references over embedding" principle the backend uses for `Meal` → `Category`. Prices are read live from the meals query cache, so a price change while an item sits in someone's cart can't leave a stale number on screen. At checkout, the total the server calculated is compared with the cart's total (in integer piastres, so floating-point noise can't cause a false mismatch); if they differ, the customer must explicitly continue or cancel.

**RTK Query over hand-written fetch logic.** Every endpoint is a typed hook with tag-based cache invalidation, so mutations refresh exactly the data they affect. Each slice unwraps the backend's `{ success, message, data }` envelope with `transformResponse`, so components receive the entity itself rather than the raw response.

**Real-time as "subscribe, then sync".** Socket events are a freshness optimisation, never the data itself. Every screen loads over REST first. The cashier board patches incoming events straight into the RTK Query cache (`updateQueryData`), so it updates with no refetch flicker, and every (re)connect triggers a REST re-sync because Socket.IO never replays what a client missed while offline. Sockets live only while the screen that needs them is mounted.

**Payments never trust the browser.** After online checkout the customer is redirected to Paymob's hosted page and comes back to the tracking page, but the query string Paymob appends is ignored. The page shows only what the signed webhook recorded: "Confirming your payment…", then paid or failed through a socket event, with a 5-second polling safety net and a "Try payment again" button on failure.

**Auth through httpOnly cookies.** The cookie is invisible to JavaScript, so logout is a server call, followed by a reset of the entire RTK Query cache so one user's cached data (an admin's revenue, say) never outlives their session on a shared device. When a protected route sends a visitor to `/login`, the original location — including `?table=<id>` — is carried through the login ↔ register loop.

**Dine-in through QR codes.** The admin generates a print-ready QR per table, entirely client-side. It is just a link to `/menu?table=<id>`; the menu syncs that id into the cart, which turns the checkout into a dine-in order. Switching to a different table silently clears the cart, so items meant for table 3 can't be ordered from table 7. The id lives inside the cart state rather than the storage key, so there is one cart per device.

**One place for each cross-cutting concern.** `createSocket()` is the only place the socket address is derived, from the same `VITE_API_BASE_URL` axios uses. `axiosBaseQuery` is the only place that handles `FormData`. Brand colours are defined once as Tailwind tokens and never as one-off hex values, while status colours (red, green, amber) stay separate from brand colour on purpose.

**Derived state without effects.** Prefilling the checkout phone from the profile is done by adjusting state during render behind a guarded comparison, not with `useEffect` + `setState`, which avoids an extra render and matches React's own guidance.

## Features

### Authentication & Protected Routes

- Login and register forms validated with Zod and React Hook Form
- `ProtectedRoute` checks the user's role and redirects: unauthenticated → `/login`, wrong role → `/unauthorized`
- `RootRedirect` sends an already signed-in user straight to their role's home page
- After login the user returns to the page they originally tried to reach, including its query string
- Logout clears the cookie on the server and wipes the client cache

### Customer Journey

- **Menu:** live debounced search, category filter, meal detail modal, a floating cart bar, and a "Dine-in" badge when ordering from a table
- **Cart:** adjust quantities, remove items, and handle a meal that was deleted from the menu after being added
- **Checkout:** dine-in is detected from the cart; otherwise delivery (address required) or takeaway; phone prefilled from the profile; cash or online payment
- **Order tracking:** a live status stepper, a connected/connecting indicator, cancel while pending, payment states, and a short order id (`#A1B2C3`) the customer can quote to staff — the same id the cashier sees on the card

### Cashier Dashboard

- A three-column Kanban board: Pending / Preparing / Completed
- Forward-only action buttons instead of free drag-and-drop, because the backend state machine only allows one direction
- New orders and status changes arrive live, with a sound on every new order
- A "Paid online" / "Cash" badge on every card, so the person at the counter knows whether there is money to collect

### Admin Dashboard

- Analytics cards: revenue (completed orders), active orders, and the top-5 best sellers
- Meals and categories CRUD in one modal each, surfacing the backend's real messages (for example "3 meal(s) are still using it")
- Meal image upload with a live preview, or paste an external URL
- Tables tab: add and delete tables, see each table's status and current order, and download a print-ready QR PNG ("Table N" label included)
- Staff account creation (Cashier or Admin) through the Admin-only endpoint
- The tables list and the analytics re-sync automatically whenever an order goes live, advances or ends

### Accessibility & Mobile

- 48 px touch targets, because this app is used on a phone in a restaurant
- Meal cards are keyboard-operable with a visible focus ring; modals close on Escape and lock background scroll
- Broken image URLs fall back to a placeholder instead of a broken icon

---

## Routes

| Path                  | Access                  | Screen                          |
| --------------------- | ----------------------- | ------------------------------- |
| `/login`, `/register` | Public                  | Authentication                  |
| `/`                   | Public                  | Redirects to the user's home    |
| `/menu`               | Any signed-in user      | Menu (reads `?table=`)          |
| `/cart`               | Any signed-in user      | Cart                            |
| `/checkout`           | Any signed-in user      | Checkout                        |
| `/orders/:id/track`   | Any signed-in user      | Live order tracking             |
| `/cashier`            | Cashier / Admin         | Order board                     |
| `/admin`              | Admin                   | Management dashboard            |
| `/unauthorized`       | Public                  | Access denied                   |

## Real-Time Hooks (Socket.IO)

| Hook                  | Used by            | Listens to                                                       |
| --------------------- | ------------------ | ---------------------------------------------------------------- |
| `useOrdersSocket`     | Cashier board      | `new_order`, `status_changed`; re-syncs on every connect         |
| `useOrderTracking`    | Tracking page      | `status_changed`, `payment_status_changed`; re-joins the order room on every connect |
| `useAdminLiveUpdates` | Admin dashboard    | `new_order`, `status_changed`; invalidates the tables list and the stats |

In all three, events only patch or invalidate the cache; REST remains the source of truth.

## Getting Started

You need Node.js 22+ and the backend running (see the [backend README](../Backend-POS/README.md)).

```bash
# From the repository root
cd Frontend-POS
npm install

# Create .env (see below), then:
npm run dev
```

### Environment variables

```
VITE_API_BASE_URL=http://localhost:8000/api
```

| Variable            | Purpose                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | The API address. A full URL in development; `/api` in production, where the backend serves this app from the same origin. The socket address is derived from it. |
| `VITE_APP_URL`      | Optional. The public address printed into table QR codes; defaults to the page's own origin.      |

Vite bakes `VITE_*` values into the bundle at **build** time, so they must be set before `npm run build`.

| Script            | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Vite dev server with hot reload             |
| `npm run build`   | Type-check (`tsc -b`) and production build  |
| `npm run lint`    | ESLint                                      |
| `npm run preview` | Serve the production build locally          |

In production the build is not deployed on its own: Express serves `Frontend-POS/dist`, as described in the root README.

---

## What I Learned

### Patterns I hadn't used before

- **RTK Query cache patching.** Instead of polling or refetching on every socket event, I patched events directly into the cached query with `updateQueryData`, so the cashier board updates instantly with no loading flicker.
- **"Subscribe, then sync".** Realising that an event stream is not a source of truth: whatever happened before the subscription, or while the connection was down, is never delivered, so the client has to re-fetch over REST right after it subscribes.
- **References, not snapshots, in client state.** Keeping only ids and quantities in the cart and deriving everything else from the server cache removed a whole class of stale-price bugs.

### Thinking in user journeys, not just components

A screen isn't done when it renders; it's done when the journey survives the awkward moments: a customer who scans a QR code before having an account, a payment that completes before the webhook arrives, a connection that drops mid-order, a meal that disappears from the menu while it sits in a cart. Most of the real work on the frontend was handling those moments.

## Hardest Challenges & How I Solved Them

| Challenge                                  | What was happening                                                                                                  | How I solved it                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Role checks silently failing**           | The profile endpoint returns `{ success, message, user }`, but the hook exposed that raw envelope, so every role check saw `undefined` | Unwrapped the response with `transformResponse` in the slice, and applied the same pattern to every other slice                                              |
| **Image uploads arriving with no file**    | The Axios instance fixes a JSON `Content-Type`, which stops the browser from setting the multipart boundary on a `FormData` body | `axiosBaseQuery` detects `FormData` in one place and drops that header, so every current and future upload works                                              |
| **Missed real-time events**                | Socket.IO doesn't replay events a client missed while offline or still connecting, so an order could silently vanish from the board | Every connect re-syncs over REST; the tracking page re-fetches only after the server acknowledges the room join; new orders are de-duplicated against a concurrent re-sync |
| **The table was lost on sign-up**          | A new customer who scanned a QR code was sent to `/login`, and the table in the URL was dropped on the register → login hop | Forwarded the router's `location.state` through the whole login ↔ register loop, query string included                                                       |
| **Stale admin dashboard**                  | A table stayed "Available" and "Active Orders" stayed one behind while orders were in progress on other devices      | Found by comparing it to the cashier board during a live test; `useAdminLiveUpdates` now invalidates the affected queries on every relevant event            |
| **Redirect arrives before the webhook**    | Paymob sends the customer back before the payment is usually confirmed, so the page can't tell paid from unpaid       | The tracking page ignores the redirect's query string and shows "Confirming…", then updates from the socket event, with polling as a safety net              |

## Known Limitations

- There are no automated frontend tests yet; the highest-risk logic (pricing, payments, order state) is covered by the backend tests.
- Loading states are spinners, not skeletons, and order status changes are not optimistic.
- The app ships as a single JavaScript bundle (about 675 kB); route-level code splitting would improve first load.
- The cart and checkout fetch one page of 100 meals to look up prices, which is fine for a small menu and would need a by-ids endpoint for a larger one.
- The cashier board loads the latest 100 orders and groups them by status in the browser.
- The new-order sound plays only if an audio file exists at `public/sounds/new-order.mp3`, and browsers may block it until the page has had a click.
- There is no screen for the table `Reserved` status yet (the backend supports it).

## Roadmap

- **Optimistic updates** in RTK Query for order status changes, with rollback and a toast on failure
- **Skeleton loaders** in place of spinners
- **Code splitting** by route, and a responsive pass on the admin layout for larger screens
- **Frontend tests** for the checkout reconciliation and the socket hooks
- **Table reservations** UI, once the backend gets a real reservation flow with deposits

The full list, with the reasoning behind each item, lives in the repository's `Plan.txt`.
