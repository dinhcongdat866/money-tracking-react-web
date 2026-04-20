import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/api-request-auth";
import { getProfileFields, patchProfileFields } from "@/lib/user-profile-store";

export type AccountProfileResponse = {
  email: string;
  displayName: string;
  timezone: string;
  marketingOptIn: boolean;
};

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fields = getProfileFields(session.sub);
  const body: AccountProfileResponse = {
    email: session.email,
    displayName: fields.displayName,
    timezone: fields.timezone,
    marketingOptIn: fields.marketingOptIn,
  };
  return NextResponse.json(body);
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const patch: Partial<{
    displayName: string;
    timezone: string;
    marketingOptIn: boolean;
  }> = {};

  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string") {
      return NextResponse.json(
        { error: "displayName must be a string" },
        { status: 400 },
      );
    }
    const trimmed = body.displayName.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      return NextResponse.json(
        { error: "displayName must be 1–80 characters" },
        { status: 400 },
      );
    }
    patch.displayName = trimmed;
  }

  if (body.timezone !== undefined) {
    if (typeof body.timezone !== "string") {
      return NextResponse.json(
        { error: "timezone must be a string" },
        { status: 400 },
      );
    }
    patch.timezone = body.timezone;
  }

  if (body.marketingOptIn !== undefined) {
    if (typeof body.marketingOptIn !== "boolean") {
      return NextResponse.json(
        { error: "marketingOptIn must be a boolean" },
        { status: 400 },
      );
    }
    patch.marketingOptIn = body.marketingOptIn;
  }

  const updated = patchProfileFields(session.sub, patch);
  const res: AccountProfileResponse = {
    email: session.email,
    displayName: updated.displayName,
    timezone: updated.timezone,
    marketingOptIn: updated.marketingOptIn,
  };
  return NextResponse.json(res);
}
