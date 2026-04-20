import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth-token";
import { getAuthCookieName } from "@/lib/auth";

function safeReturnUrl(path: string | null): string {
  if (!path || typeof path !== "string") return "/dashboard";
  // Only allow same-origin paths (no protocol, no //)
  const trimmed = path.trim();
  if (trimmed === "" || trimmed.startsWith("//") || trimmed.includes(":")) return "/dashboard";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export async function middleware(req: NextRequest) {
  const cookieName = getAuthCookieName();
  const token = req.cookies.get(cookieName)?.value;
  const pathname = req.nextUrl.pathname;

  // Visiting /signup while already authenticated → redirect to dashboard
  if (pathname === "/signup") {
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    return NextResponse.next();
  }

  // Visiting /login while already authenticated → redirect to returnUrl or dashboard
  if (pathname === "/login") {
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload) {
        const returnUrl = req.nextUrl.searchParams.get("returnUrl");
        const target = safeReturnUrl(returnUrl);
        return NextResponse.redirect(new URL(target, req.url));
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyAuthToken(token);
  if (!payload) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Protect all app routes except /login and static/assets
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};


