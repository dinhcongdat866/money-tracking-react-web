#!/usr/bin/env tsx
/**
 * Database Seed Script
 *
 * Populates the Neon PostgreSQL database with realistic transaction data.
 * Re-uses the same generation logic as the mock data generator.
 *
 * Run: pnpm db:seed
 */

import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

import { PrismaClient, TransactionType } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Category config — must match src/features/transactions/data/categories.ts
// ---------------------------------------------------------------------------
const CATEGORY_CONFIG = [
  { id: "income", name: "Income", icon: "💰", weight: 0.15 },
  { id: "food", name: "Food & Dining", icon: "🍔", weight: 0.25 },
  { id: "transport", name: "Transportation", icon: "🚗", weight: 0.15 },
  { id: "housing", name: "Housing", icon: "🏠", weight: 0.15 },
  { id: "shopping", name: "Shopping", icon: "💳", weight: 0.15 },
  { id: "utilities", name: "Utilities", icon: "📱", weight: 0.10 },
  { id: "other", name: "Other", icon: "❓", weight: 0.05 },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getRandomCategory() {
  const random = Math.random();
  let cumulative = 0;
  for (const cat of CATEGORY_CONFIG) {
    cumulative += cat.weight;
    if (random <= cumulative) return cat;
  }
  return CATEGORY_CONFIG[CATEGORY_CONFIG.length - 1];
}

function generateAmount(categoryId: string, type: "income" | "expense"): number {
  if (type === "income") {
    return faker.number.float({ min: 2000, max: 8000, fractionDigits: 2 });
  }
  const ranges: Record<string, [number, number]> = {
    food: [5, 150],
    transport: [10, 80],
    housing: [500, 2000],
    shopping: [20, 500],
    utilities: [30, 200],
    other: [10, 300],
  };
  const [min, max] = ranges[categoryId] ?? [10, 200];
  return faker.number.float({ min, max, fractionDigits: 2 });
}

function generateNote(categoryId: string, includeNote: boolean): string | undefined {
  if (!includeNote) return undefined;
  const notes: Record<string, string[]> = {
    income: ["Monthly salary", "Freelance project payment", "Bonus", "Side gig income", "Investment dividend"],
    food: ["Lunch at restaurant", "Grocery shopping", "Coffee with friends", "Dinner delivery", "Weekly groceries"],
    transport: ["Gas refill", "Uber to work", "Monthly bus pass", "Taxi ride", "Parking fee"],
    housing: ["Monthly rent", "Mortgage payment", "Home insurance", "Property tax", "Repairs"],
    shopping: ["New clothes", "Electronics purchase", "Gift for friend", "Online shopping", "Books"],
    utilities: ["Internet bill", "Phone bill", "Electricity", "Water bill", "Netflix subscription"],
    other: ["Miscellaneous expense", "Personal care", "Medical", "Donation", "Entertainment"],
  };
  const categoryNotes = notes[categoryId] ?? notes.other!;
  return faker.helpers.arrayElement(categoryNotes);
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------
async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Starting database seed...\n");

  // Clear existing data
  await prisma.transaction.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("🗑️  Cleared existing transactions and users");

  // Create a seed user that owns all generated transactions
  const seedUser = await prisma.user.create({
    data: {
      email: "demo@example.com",
      passwordHash: await bcrypt.hash("password123", 12),
      displayName: "Demo User",
    },
  });
  console.log(`👤 Created seed user: ${seedUser.email}`);

  // Generate transactions spanning the last 6 months
  // Allow overriding the default via SEED_TRANSACTION_COUNT env for heavy testing
  const TRANSACTION_COUNT =
    Number(process.env.SEED_TRANSACTION_COUNT ?? "500") || 500;
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const transactions = [];

  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    const date = faker.date.between({ from: sixMonthsAgo, to: now });
    const type: "income" | "expense" = Math.random() < 0.15 ? "income" : "expense";
    const category = type === "income" ? CATEGORY_CONFIG[0] : getRandomCategory();
    const amount = generateAmount(category.id, type);
    const note = generateNote(category.id, Math.random() < 0.6);

    transactions.push({
      userId: seedUser.id,
      amount,
      type: type as TransactionType,
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      date: date.toISOString().split("T")[0]!, // YYYY-MM-DD
      note,
    });
  }

  // Bulk insert in batches of 100
  const BATCH_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    await prisma.transaction.createMany({ data: batch });
    inserted += batch.length;
    console.log(`   ✅ Inserted ${inserted}/${TRANSACTION_COUNT}...`);
  }

  const stats = await prisma.transaction.groupBy({
    by: ["type"],
    _count: true,
  });

  console.log("\n📊 Seed complete!");
  stats.forEach((s) => console.log(`   ${s.type}: ${s._count} transactions`));
  console.log(`   Total: ${TRANSACTION_COUNT} transactions\n`);

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
