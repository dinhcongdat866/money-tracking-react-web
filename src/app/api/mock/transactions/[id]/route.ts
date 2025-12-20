import { NextResponse } from "next/server";
import { MOCK_TRANSACTIONS } from "../mock-data";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const tx = MOCK_TRANSACTIONS.find((t) => t.id === id);

  if (!tx) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json(tx);
}


