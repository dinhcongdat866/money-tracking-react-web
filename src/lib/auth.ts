import "server-only";

import { cookies } from "next/headers";
import { AuthTokenPayload, verifyAuthToken } from "./auth-token";

const AUTH_COOKIE = "auth";

export async function getCurrentUser(): Promise<
  Pick<AuthTokenPayload, "sub" | "email"> | null
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload) return null;

  return {
    sub: payload.sub,
    email: payload.email,
  };
}

export function getAuthCookieName() {
  return AUTH_COOKIE;
}


