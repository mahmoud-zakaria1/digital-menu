export const SOCKET_AUTH_ERRORS = {
  NO_COOKIES: "Authentication error: No cookies provided",
  NO_TOKEN: "Authentication error: No token provided",
  USER_NOT_FOUND: "Authentication error: User no longer exists",
  INVALID_TOKEN: "Authentication error: Invalid or expired token",
} as const;
