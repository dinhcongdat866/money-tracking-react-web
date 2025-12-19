import "server-only";

import { SignJWT, jwtVerify, JWTPayload } from "jose";

const ISSUER = "money-tracking";
const AUDIENCE = "money-tracking-user";

const encoder = new TextEncoder();
const secretKey = encoder.encode(
  process.env.AUTH_SECRET || "dev-secret-change-me"
);

export type AuthTokenPayload = JWTPayload & {
  sub: string;
  email: string;
};

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("1h")
    .sign(secretKey);
}

export async function verifyAuthToken(
  token: string
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify<AuthTokenPayload>(token, secretKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload;
  } catch {
    return null;
  }
}


