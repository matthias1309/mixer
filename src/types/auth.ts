// JWT types
export interface JWTPayload {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
  type: 'access';
}
