// JWT types
export interface JWTPayload {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
  type: 'access';
  // Epoch seconds of the original login; survives refreshes and bounds the
  // absolute session lifetime (REQ-020). Optional: tokens minted before the
  // claim existed fall back to their iat.
  authTime?: number;
}
