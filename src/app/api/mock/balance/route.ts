import { NextResponse } from "next/server";

export function GET() {
  const mockData = {
    amount: 12345.67,
    currency: "USD",
  };

  return NextResponse.json(mockData);
}