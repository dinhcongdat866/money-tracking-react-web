import type { NextRequest } from "next/server";
import { getAuthCookieName } from "@/lib/auth";
import { verifyAuthToken, type AuthTokenPayload } from "@/lib/auth-token";

export async function getSessionFromRequest(
  req: NextRequest,
): Promise<AuthTokenPayload | null> {
  const token = req.cookies.get(getAuthCookieName())?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}
