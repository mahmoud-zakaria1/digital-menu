export interface IJwtPayload {
  _id: string;
  // Standard claims, added by jsonwebtoken when the token is signed
  iat?: number;
  exp?: number;
  // Unix seconds of the ORIGINAL login. Carried unchanged through every
  // renewal so the absolute session cap can be enforced. Tokens issued
  // before sliding sessions existed don't have it (we fall back to iat).
  authTime?: number;
}
