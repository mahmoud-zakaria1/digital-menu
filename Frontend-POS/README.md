# Digital Menu — Frontend

The React client for the Digital Menu POS system: a mobile-first ordering flow for customers, a live Kanban board for the cashier, and a management dashboard for the admin.

> 🌐 **Live app:** [https://digital-menu-na6l.onrender.com](https://digital-menu-na6l.onrender.com) (free instance: the first request after idle can take about a minute)
>
> 🧭 This is the frontend README. For the project overview see the [root README](../README.md); for the API see the [backend README](../Backend-POS/README.md).

<!-- TODO: add 3-4 screenshots (customer menu on a phone, cashier board, admin dashboard, order tracking) in docs/ and link them here -->

## What it does

| Role | Screens |
| ---- | ------- |
| **Customer** | Menu with live search and category filter, meal details, cart, checkout (cash or online), and a live order tracking page |
| **Cashier** | `/cashier`: a three-column board (Pending / Preparing / Completed) that updates in real time, with a sound on every new order |
| **Admin** | `/admin`: sales analytics, meals and categories CRUD with image upload, tables with printable QR codes, and staff account creation |

## Tech stack

| Concern | Choice |
| ------- | ------ |
| Framework | React 19 + Vite + TypeScript (strict) |
| Server state | Redux Toolkit **RTK Query** with an Axios base query |
| Client state | Redux Toolkit slice for the cart |
| Forms & validation | React Hook Form + Zod |
| Routing | React Router (role-protected routes) |
| Real-time | socket.io-client |
| Styling | Tailwind CSS v4 with brand tokens defined once in `@theme` |
| QR codes | qrcode.react |
| Feedback | react-hot-toast + a global error boundary |

## Project structure

The code is organised by feature rather than by file type, so everything about orders (API, hooks, components, pages, types) lives together.

```
src/
├── api/                 # axios instance, RTK Query base, root apiSlice, createSocket()
├── app/                 # Redux store, typed hooks, cart persistence middleware
├── components/          # Shared UI: Navbar, ToastProvider, ErrorBoundaryFallback
├── features/
│   ├── admin/           # Dashboard, CRUD modals, analytics, tables + QR, staff creation
│   ├── auth/            # Login/register, ProtectedRoute, RootRedirect, logout
│   ├── cart/            # Cart slice, localStorage persistence, cart page and bar
│   ├── menu/            # Menu page, meal cards, search and category filter
│   ├── orders/          # Checkout, tracking page, cashier board, socket hooks
│   └── tables/          # Tables API and QR link helper
├── hooks/               # useDebounce
├── pages/               # Unauthorized page
├── router/              # Route tree
└── styles/              # Global SCSS entry
```

## Key decisions

**The server is the source of truth for money.** The cart only stores `mealId` and `quantity`, never a price or a name. Prices are read live from the meals query cache, so a price change while an item sits in a cart can't leave a stale number on screen. At checkout the total the server calculated is compared with the cart's total (in integer piastres, to avoid floating-point noise); if they differ, the customer must explicitly continue or cancel the order.

**Real-time as "subscribe, then sync".** Socket events are a freshness optimisation, never the data itself. Every view loads over REST first. The cashier board patches incoming events straight into the RTK Query cache, so it updates with no refetch flicker, and every (re)connect triggers a REST re-sync because Socket.IO never replays what a client missed while offline. The tracking page re-fetches only after the server acknowledges that the order room was joined. Sockets exist only while the screen that needs them is mounted.

**Payments never trust the browser.** After online checkout the customer is redirected to Paymob's hosted page and comes back to the tracking page, but the query string Paymob appends is ignored. The page shows what the signed webhook recorded: "Confirming your payment…", then paid or failed through a socket event, with a 5-second polling safety net and a "Try payment again" button on failure.

**Auth through httpOnly cookies.** The cookie is invisible to JavaScript, so logout is a server call, followed by a reset of the whole RTK Query cache so one user's cached data (an admin's revenue, say) never outlives their session on a shared device. If a protected route sends a visitor to `/login`, the original location, including `?table=<id>`, is carried through the login ↔ register loop, so a new customer who scanned a table's QR code still ends up on that table's menu.

**Dine-in through QR codes.** The admin generates a print-ready QR per table (client-side). It is just a link to `/menu?table=<id>`; the menu syncs that id into the cart, which turns the checkout into a dine-in order. Switching to a different table clears the cart, so items meant for table 3 can't be ordered from table 7.

**One place for each cross-cutting concern.** `createSocket()` is the only place the socket address is derived. `axiosBaseQuery` is the only place that handles `FormData`: it drops the instance's fixed JSON `Content-Type` so the browser can set the multipart boundary itself, which fixes every upload at once. Brand colours are defined once as Tailwind tokens and never as one-off hex values, while status colours (red, green, amber) stay separate from brand colour on purpose.

**Built for a phone in a restaurant.** Touch targets are 48 px, the meal card is keyboard-operable with visible focus, modals close on Escape and lock background scroll, and broken image URLs fall back to a placeholder.

## Routes

| Path | Who | Screen |
| ---- | --- | ------ |
| `/login`, `/register` | Public | Authentication |
| `/menu` | Any signed-in user | Menu (reads `?table=`) |
| `/cart`, `/checkout` | Any signed-in user | Cart and checkout |
| `/orders/:id/track` | Any signed-in user | Live order tracking |
| `/cashier` | Cashier, Admin | Order board |
| `/admin` | Admin | Dashboard |

`/` redirects an already signed-in user to their role's home page.

## Run it locally

You need Node.js 22+ and the backend running (see the [backend README](../Backend-POS/README.md)).

```bash
cd Frontend-POS
npm install
npm run dev
```

Create `Frontend-POS/.env`:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

| Variable | Purpose |
| -------- | ------- |
| `VITE_API_BASE_URL` | The API address. A full URL in development; **`/api` in production**, where Express serves this app from the same origin. The socket address is derived from it. |
| `VITE_APP_URL` | Optional. The public address printed into table QR codes; defaults to the page's own origin. |

Vite bakes `VITE_*` values into the bundle at **build** time, so they must be set before `npm run build`.

| Script | What it does |
| ------ | ------------ |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |

In production the build is not deployed on its own: Express serves `Frontend-POS/dist`, as described in the root README.

## Known limitations

- There are no automated frontend tests yet; the highest-risk logic (pricing, payments, order state) is tested on the backend.
- Loading states are spinners, not skeletons, and order status changes are not optimistic.
- The app ships as a single JavaScript bundle (about 675 kB); route-level code splitting would help first load.
- The cart and checkout fetch one page of 100 meals to look up prices, which is fine for a small menu and would need a by-ids endpoint for a larger one.
- The cashier board loads the latest 100 orders and groups them by status in the browser.
- The new-order sound plays only if an audio file exists at `public/sounds/new-order.mp3`, and browsers may block it until the page has had a click.