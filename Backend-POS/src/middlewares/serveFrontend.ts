import express, { Express, NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";

// 1️⃣ Where the React build lives. Frontend and backend sit side by side in
// the same repo, and every way the server is started (npm run dev, npm
// start, the Railway start command) runs from inside Backend-POS, so the
// build is one folder up. Kept relative to the working directory on purpose
// instead of import.meta.url: it works the same under tsx and under Jest's
// ESM setup, with no extra tooling config.
const FRONTEND_DIST = path.resolve(process.cwd(), "../Frontend-POS/dist");
const INDEX_HTML = path.join(FRONTEND_DIST, "index.html");

// 2️⃣ Serve the React app from the SAME server (and therefore the same
// origin) as the API. This is what fixes login on iPhone: Safari blocks
// cookies between two different sites (e.g. a Vercel frontend and a Railway
// backend), but a cookie set by the page's own origin is always first-party.
// It also means no CORS and no separate WebSocket proxy in production.
export const serveFrontend = (app: Express): void => {
  // 3️⃣ No build folder = nothing to serve. This is the normal case in
  // development (Vite serves the frontend itself) and in the test suite, so
  // the API behaves exactly as before there.
  if (!fs.existsSync(INDEX_HTML)) return;

  // 4️⃣ Real files first: the hashed JS/CSS bundles, the favicon, images.
  app.use(express.static(FRONTEND_DIST));

  // 5️⃣ Everything else that isn't an API call gets index.html. React
  // Router lives in the browser, so a refresh on /menu or /orders/123/track
  // reaches the server as a plain GET for a path that doesn't exist as a
  // file - without this fallback it would be a 404 instead of the app.
  // Express 5 no longer accepts a bare "*" here, hence the named wildcard.
  app.get("/{*splat}", (req: Request, res: Response, next: NextFunction) => {
    // An unknown /api/... path must still reach the JSON 404 handler below
    // (and /api-docs is Swagger's), not silently return the React app with
    // a 200 that would hide a typo in an API URL.
    if (req.path.startsWith("/api")) return next();

    res.sendFile(INDEX_HTML);
  });
};
