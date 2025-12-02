import { NextResponse } from "next/server";
import { MOCK_TRANSACTIONS } from "../mock-data";

type RouteParams = {
  params: { id: string };
};

export function GET(_req: Request, { params }: RouteParams) {
  const tx = MOCK_TRANSACTIONS.find((t) => t.id === params.id);

  if (!tx) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json(tx);
}


