import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

export type AccountProfileResponse = {
  email: string;
  displayName: string | null;
  timezone: string;
  marketingOptIn: boolean;
};

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { email: true, displayName: true, timezone: true, marketingOptIn: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof json !== "object" || json === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const body = json as Record<string, unknown>;
  const patch: { displayName?: string; timezone?: string; marketingOptIn?: boolean } = {};

  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string") {
      return NextResponse.json({ error: "displayName must be a string" }, { status: 400 });
    }
    const trimmed = body.displayName.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      return NextResponse.json({ error: "displayName must be 1–80 characters" }, { status: 400 });
    }
    patch.displayName = trimmed;
  }

  if (body.timezone !== undefined) {
    if (typeof body.timezone !== "string") {
      return NextResponse.json({ error: "timezone must be a string" }, { status: 400 });
    }
    patch.timezone = body.timezone;
  }

  if (body.marketingOptIn !== undefined) {
    if (typeof body.marketingOptIn !== "boolean") {
      return NextResponse.json({ error: "marketingOptIn must be a boolean" }, { status: 400 });
    }
    patch.marketingOptIn = body.marketingOptIn;
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: patch,
    select: { email: true, displayName: true, timezone: true, marketingOptIn: true },
  });

  return NextResponse.json(updated);
}
