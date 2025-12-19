import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth-token";
import { getAuthCookieName } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const cookieName = getAuthCookieName();
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/transactions", "/transactions/:path*"],
};


