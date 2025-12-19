"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthTokenPayload, signAuthToken } from "@/lib/auth-token";
import { getAuthCookieName } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

const MOCK_USER = {
  id: "1",
  email: "demo@example.com",
  password: "password123",
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const isValid =
    email === MOCK_USER.email && password === MOCK_USER.password;

  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  const payload: AuthTokenPayload = {
    sub: MOCK_USER.id,
    email: MOCK_USER.email,
  };

  const token = await signAuthToken(payload);

  const cookieName = getAuthCookieName();

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  redirect("/dashboard");
  return {};
}

export async function logout() {
  const cookieName = getAuthCookieName();
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
  redirect("/login");
}


