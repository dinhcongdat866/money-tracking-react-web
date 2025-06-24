import { TimeRange } from "@/features/dashboard/types";
import { NextRequest } from "next/server";

const MOCK_EXPENSES_MONTH = [
  {
    categoryId: "1",
    categoryName: "Food & Drink",
    expense: 320,
    ratio: 0.32,
  },
  {
    categoryId: "2",
    categoryName: "Transport",
    expense: 210,
    ratio: 0.21,
  },
  {
    categoryId: "3",
    categoryName: "Entertainment",
    expense: 150,
    ratio: 0.15,
  },
];

const MOCK_EXPENSES_WEEK = [
    {
        categoryId: "1",
        categoryName: "Food & Drink",
        expense: 120,
        ratio: 0.12,
    },
    {
        categoryId: "2",
        categoryName: "Transport",
        expense: 80,
        ratio: 0.08,
    },
    {
        categoryId: "3",
        categoryName: "Entertainment",
        expense: 60,
        ratio: 0.06,
    },
];

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const timeRange = searchParams.get("timeRange") as TimeRange;
  const limit = parseInt(searchParams.get("limit") ?? "3", 10);

  return Response.json(timeRange === "month" ? MOCK_EXPENSES_MONTH.slice(0, limit) : MOCK_EXPENSES_WEEK.slice(0, limit));
}
