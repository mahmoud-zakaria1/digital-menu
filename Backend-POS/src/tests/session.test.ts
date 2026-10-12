import { describe, it, expect, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { SESSION, renewSessionIfNeeded } from "../utils/session.js";
import type { IJwtPayload } from "../types/jwt.types.js";

const DAY = 60 * 60 * 24;
const now = () => Math.floor(Date.now() / 1000);

const user = {
  _id: "user-1",
  phone: "+201000000000",
  email: "cashier@test.com",
  role: "Cashier",
};

// A fake `res` that only records what was passed to res.cookie().
const makeRes = () => {
  const cookie = jest.fn();
  return { res: { cookie } as unknown as Response, cookie };
};

const issuedCookie = (cookie: { mock: { calls: unknown[][] } }) => {
  const [, token, options] = cookie.mock.calls[0] as [
    string,
    string,
    { maxAge: number },
  ];
  return { payload: jwt.decode(token) as IJwtPayload, options };
};

describe("Sliding session renewal", () => {
  it("does not renew a token that is still fresh", () => {
    const { res, cookie } = makeRes();
    const t = now();

    renewSessionIfNeeded(
      res,
      { _id: "user-1", iat: t - 60, authTime: t - 60 },
      user,
    );

    expect(cookie).not.toHaveBeenCalled();
  });

  it("renews an older token and keeps the ORIGINAL login time", () => {
    const { res, cookie } = makeRes();
    const t = now();
    const authTime = t - 2 * DAY;

    renewSessionIfNeeded(
      res,
      { _id: "user-1", iat: t - 2 * DAY, authTime },
      user,
    );

    expect(cookie).toHaveBeenCalledTimes(1);
    const { payload, options } = issuedCookie(cookie);
    expect(payload.authTime).toBe(authTime);
    expect(payload.exp).toBeGreaterThan(t + SESSION.IDLE_SECONDS - 5);
    expect(options.maxAge).toBeGreaterThan(0);
  });

  it("never extends a session past the absolute cap", () => {
    const { res, cookie } = makeRes();
    const t = now();
    // One hour left before the 30-day ceiling.
    const authTime = t - (SESSION.MAX_SECONDS - 3600);

    renewSessionIfNeeded(
      res,
      { _id: "user-1", iat: t - 2 * DAY, authTime },
      user,
    );

    const { payload } = issuedCookie(cookie);
    expect(payload.exp).toBe(authTime + SESSION.MAX_SECONDS);
  });

  it("stops renewing once the cap has been reached", () => {
    const { res, cookie } = makeRes();
    const t = now();
    const authTime = t - SESSION.MAX_SECONDS - 10;

    renewSessionIfNeeded(
      res,
      { _id: "user-1", iat: t - 2 * DAY, authTime },
      user,
    );

    expect(cookie).not.toHaveBeenCalled();
  });

  it("treats a legacy token (no authTime) as logged in at its issue time", () => {
    const { res, cookie } = makeRes();
    const t = now();
    const iat = t - 2 * DAY;

    renewSessionIfNeeded(res, { _id: "user-1", iat }, user);

    const { payload } = issuedCookie(cookie);
    expect(payload.authTime).toBe(iat);
  });
});
