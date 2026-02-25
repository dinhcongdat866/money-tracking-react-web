import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions } from "../transactions/mock-data";

/**
 * Kanban API Route - Cursor-based Pagination
 * 
 * Professional-grade pagination for high-performance Kanban boards.
 * Supports:
 * - Cursor-based pagination (100 items per page)
 * - Category filtering (column-specific data)
 * - Search and type filters
 * - Handles 2000+ items per column efficiently
 * 
 * Query Parameters:
 * - cursor: Last item ID from previous page (for pagination)
 * - limit: Items per page (default: 100, max: 200)
 * - category: Filter by category ID
 * - month: Filter by month (yyyy-MM)
 * - type: Filter by type (income/expense/all)
 * - search: Search in note, category, amount
 */

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Pagination params
  const cursor = searchParams.get("cursor");
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "100", 10), 1),
    200 // Max 200 items per page
  );
  
  // Filter params
  const category = searchParams.get("category");
  const month = searchParams.get("month") ?? undefined;
  const type = searchParams.get("type") as 'income' | 'expense' | 'all' | null;
  const search = searchParams.get("search");

  // Simulate network latency (300ms - realistic API call)
  await delay(300);

  // Get all transactions from mutable mock storage
  let filteredTransactions = getAllTransactions();

  // Apply month filter
  if (month) {
    filteredTransactions = filteredTransactions.filter(
      t => t.date.startsWith(month)
    );
  }

  // Apply filters
  if (category) {
    filteredTransactions = filteredTransactions.filter(
      t => t.category.id === category
    );
  }

  if (type && type !== 'all') {
    filteredTransactions = filteredTransactions.filter(
      t => t.type === type
    );
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredTransactions = filteredTransactions.filter(t => {
      const matchesNote = t.note?.toLowerCase().includes(searchLower);
      const matchesCategory = t.category.name.toLowerCase().includes(searchLower);
      const matchesAmount = t.amount.toString().includes(search);
      return matchesNote || matchesCategory || matchesAmount;
    });
  }

  // Sort by date (newest first) for consistent ordering
  filteredTransactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Cursor-based pagination
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = filteredTransactions.findIndex(t => t.id === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1; // Start after cursor
    }
  }

  // Get page of items
  const items = filteredTransactions.slice(startIndex, startIndex + limit);
  
  // Determine next cursor (ID of last item in this page)
  const nextCursor = items.length === limit 
    ? items[items.length - 1].id 
    : null;

  // Calculate summary for this category (from ALL filtered transactions, not just current page)
  // This ensures consistent numbers as user loads more pages
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const categoryTotal = totalIncome - totalExpenses;

  return NextResponse.json({
    items,
    nextCursor,
    hasMore: nextCursor !== null,
    
    // Summary represents complete filtered dataset
    total: filteredTransactions.length,
    categoryTotal,
    totalIncome,
    totalExpenses,
    
    pagination: {
      limit,
      currentCount: items.length,
      totalAvailable: filteredTransactions.length,
    },
  });
}
