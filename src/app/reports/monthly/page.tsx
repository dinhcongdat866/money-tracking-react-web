"use server";

import { redirect } from "next/navigation";

async function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function MonthlyReportIndexPage() {
  const now = new Date();
  const month = await getMonthKey(now);
  redirect(`/reports/monthly/${month}`);
}

