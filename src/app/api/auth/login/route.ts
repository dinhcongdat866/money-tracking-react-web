import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signAuthToken } from "@/lib/auth-token";
import { getAuthCookieName } from "@/lib/auth";

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, displayName: true, passwordHash: true },
  });

  // Always run verifyPassword even when user not found — prevents timing attack
  const dummyHash = "$2b$12$LQv3c1yqBwEHB6rKd5jfOe.9bGiBl5BbeBn0i4a9mfJ2U.r4z5ROm";
  const passwordMatch = await verifyPassword(password, user?.passwordHash ?? dummyHash);

  if (!user || !passwordMatch) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const token = await signAuthToken({ sub: user.id, email: user.email });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.displayName ?? null,
    },
  });

  response.cookies.set(getAuthCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
