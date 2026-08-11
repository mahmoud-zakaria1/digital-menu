import { IJwtPayload } from '../types/jwt.types.js';
import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import User from "../models/user.schema.js";
import { SOCKET_AUTH_ERRORS } from "../utils/socketErrors.js";

const extractCookieValue = (
  rawCookies: string,
  key: string,
): string | undefined => {
  const cookieArray = rawCookies.split(";").map((c) => c.trim());
  const targetCookie = cookieArray.find((c) => c.startsWith(`${key}=`));
  return targetCookie ? targetCookie.split("=")[1] : undefined;
};

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const rawCookies = socket.handshake.headers.cookie;
    if (!rawCookies) return next(new Error(SOCKET_AUTH_ERRORS.NO_COOKIES));

    const token = extractCookieValue(rawCookies, "accessToken");
    if (!token) return next(new Error(SOCKET_AUTH_ERRORS.NO_TOKEN));

    const decoded = jwt.verify(token, config.jwtSecret) as IJwtPayload ;

    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return next(new Error(SOCKET_AUTH_ERRORS.USER_NOT_FOUND));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error(SOCKET_AUTH_ERRORS.INVALID_TOKEN));
  }
};
