import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "./api-request-auth";

type Success = { ok: true; userId: string; email: string };
type Failure = { ok: false; response: NextResponse };
export type RequireUserResult = Success | Failure;

export async function requireUser(req: NextRequest): Promise<RequireUserResult> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, userId: session.sub, email: session.email };
}
