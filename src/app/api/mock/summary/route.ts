import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("timeRange") || "week";

  const data =
    timeRange === "week"
      ? { current: 50, previous: 38 }
      : { current: 100, previous: 80 };

  return NextResponse.json(data);
}