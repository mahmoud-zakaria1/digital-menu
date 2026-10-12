import type { Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import type { IJwtPayload } from "../types/jwt.types.js";

const DAY = 60 * 60 * 24;

// All three numbers live here together so the session policy is readable
// (and changeable) in one place.
export const SESSION = {
  // How long a freshly issued token stays valid = how long someone can be
  // idle before being logged out.
  IDLE_SECONDS: 7 * DAY,
  // An authenticated request renews the cookie once the token is at least
  // this old - so at most one Set-Cookie per user per day, not one per
  // request.
  RENEW_AFTER_SECONDS: 1 * DAY,
  // Absolute ceiling measured from the ORIGINAL login, however active the
  // user is. Without it, a stolen cookie that keeps getting used would
  // renew forever.
  MAX_SECONDS: 30 * DAY,
} as const;

export const ACCESS_TOKEN_COOKIE_NAME = "accessToken";

// res.clearCookie only removes a cookie if sameSite/secure/path match what
// it was set with - so login, renewal and logout must all share these.
export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: (config.isProduction ? "none" : "lax") as "none" | "lax",
  secure: config.isProduction,
} as const;

interface SessionUser {
  _id: unknown;
  phone: string;
  email: string;
  role: string;
}

const nowInSeconds = () => Math.floor(Date.now() / 1000);

// Signs a token and sets it as the auth cookie. `authTime` is the unix
// time of the original login: a brand-new login passes nothing (defaults
// to now), a renewal passes the original value through unchanged.
export const issueSessionCookie = (
  res: Response,
  user: SessionUser,
  authTime: number = nowInSeconds(),
): void => {
  const now = nowInSeconds();
  // Whichever comes first: the idle window, or the absolute ceiling.
  const exp = Math.min(
    now + SESSION.IDLE_SECONDS,
    authTime + SESSION.MAX_SECONDS,
  );

  const token = jwt.sign(
    {
      _id: String(user._id),
      phone: user.phone,
      email: user.email,
      role: user.role,
      authTime,
      exp,
    },
    config.jwtSecret,
  );

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, token, {
    ...ACCESS_TOKEN_COOKIE_OPTIONS,
    maxAge: (exp - now) * 1000,
  });
};

// Called by the auth middleware on every authenticated request. Renews
// the cookie only when the token is old enough and the absolute cap
// hasn't been reached; otherwise does nothing.
export const renewSessionIfNeeded = (
  res: Response,
  decoded: IJwtPayload,
  user: SessionUser,
): void => {
  const now = nowInSeconds();
  const issuedAt = decoded.iat ?? now;
  // Tokens issued before sliding sessions existed carry no authTime -
  // treat their issue time as the original login.
  const authTime = decoded.authTime ?? issuedAt;

  if (now - issuedAt < SESSION.RENEW_AFTER_SECONDS) return;
  if (now >= authTime + SESSION.MAX_SECONDS) return;

  issueSessionCookie(res, user, authTime);
};
