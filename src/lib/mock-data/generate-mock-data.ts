#!/usr/bin/env tsx
/**
 * Mock Data Generator
 * 
 * Generates realistic transaction data for development and testing
 * Run: npm run generate:mock
 */

import { faker } from '@faker-js/faker';
import { writeFileSync } from 'fs';
import { join } from 'path';

const CATEGORY_CONFIG = [
  { id: 'income', name: 'Income', icon: '💰', weight: 0.15 },
  { id: 'food', name: 'Food & Dining', icon: '🍔', weight: 0.25 },
  { id: 'transport', name: 'Transportation', icon: '🚗', weight: 0.15 },
  { id: 'housing', name: 'Housing', icon: '🏠', weight: 0.15 },
  { id: 'shopping', name: 'Shopping', icon: '💳', weight: 0.15 },
  { id: 'utilities', name: 'Utilities', icon: '📱', weight: 0.10 },
  { id: 'other', name: 'Other', icon: '❓', weight: 0.05 },
] as const;

type TransactionType = 'income' | 'expense';

type MockTransaction = {
  id: string;
  amount: number;
  type: TransactionType;
  category: {
    id: string;
    name: string;
    icon: string;
  };
  date: string;
  note?: string;
};

/**
 * Get random category based on weights
 */
function getRandomCategory() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const cat of CATEGORY_CONFIG) {
    cumulative += cat.weight;
    if (random <= cumulative) {
      return cat;
    }
  }
  
  return CATEGORY_CONFIG[CATEGORY_CONFIG.length - 1];
}

/**
 * Generate realistic amount based on category
 */
function generateAmount(categoryId: string, type: TransactionType): number {
  if (type === 'income') {
    // Salary range: $2000 - $8000
    return faker.number.float({ min: 2000, max: 8000, fractionDigits: 2 });
  }
  
  // Expense amounts by category
  const ranges: Record<string, [number, number]> = {
    food: [5, 150],
    transport: [10, 80],
    housing: [500, 2000],
    shopping: [20, 500],
    utilities: [30, 200],
    other: [10, 300],
  };
  
  const [min, max] = ranges[categoryId] || [10, 200];
  return faker.number.float({ min, max, fractionDigits: 2 });
}

/**
 * Generate realistic note based on category
 */
function generateNote(categoryId: string, includeNote: boolean): string | undefined {
  if (!includeNote) return undefined;
  
  const notes: Record<string, string[]> = {
    income: [
      'Monthly salary',
      'Freelance project payment',
      'Bonus',
      'Side gig income',
      'Investment dividend',
    ],
    food: [
      'Lunch at restaurant',
      'Grocery shopping',
      'Coffee with friends',
      'Dinner delivery',
      'Weekly groceries',
      'Birthday cake',
    ],
    transport: [
      'Gas refill',
      'Uber to work',
      'Monthly bus pass',
      'Taxi ride',
      'Parking fee',
      'Car maintenance',
    ],
    housing: [
      'Monthly rent',
      'Mortgage payment',
      'Home insurance',
      'Property tax',
      'Repairs',
    ],
    shopping: [
      'New clothes',
      'Electronics purchase',
      'Gift for friend',
      'Online shopping',
      'Books',
      'Home decor',
    ],
    utilities: [
      'Internet bill',
      'Phone bill',
      'Electricity',
      'Water bill',
      'Netflix subscription',
      'Spotify premium',
    ],
    other: [
      'Miscellaneous expense',
      'Personal care',
      'Medical',
      'Donation',
      'Entertainment',
    ],
  };
  
  const categoryNotes = notes[categoryId] || notes.other;
  return faker.helpers.arrayElement(categoryNotes);
}

/**
 * Generate mock transactions
 */
function generateTransactions(count: number): MockTransaction[] {
  const transactions: MockTransaction[] = [];
  const now = new Date();
  
  // Generate transactions concentrated in current month only
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
  
  for (let i = 0; i < count; i++) {
    // Random date within 6 months
    const date = faker.date.between({ from: startDate, to: now });
    
    // Determine type (10% income, 90% expense)
    const type: TransactionType = Math.random() < 0.1 ? 'income' : 'expense';
    
    // Get category (income always gets income category)
    const category = type === 'income' 
      ? CATEGORY_CONFIG[0] // Income category
      : getRandomCategory();
    
    // Generate amount
    const amount = generateAmount(category.id, type);
    
    // 60% chance of having a note
    const hasNote = Math.random() < 0.6;
    const note = generateNote(category.id, hasNote);
    
    transactions.push({
      id: faker.string.uuid(),
      amount,
      type,
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon,
      },
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      note,
    });
  }
  
  // Sort by date descending (newest first)
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return transactions;
}

/**
 * Main execution
 */
function main() {
  console.log('🎲 Generating mock transaction data...\n');
  
  const transactionCount = 3000;
  const transactions = generateTransactions(transactionCount);
  
  // Calculate statistics
  const stats = {
    total: transactions.length,
    income: transactions.filter(t => t.type === 'income').length,
    expense: transactions.filter(t => t.type === 'expense').length,
    byCategory: CATEGORY_CONFIG.map(cat => ({
      category: cat.name,
      count: transactions.filter(t => t.category.id === cat.id).length,
    })),
    dateRange: {
      from: transactions[transactions.length - 1]?.date,
      to: transactions[0]?.date,
    },
  };
  
  // Write to JSON file
  const outputPath = join(__dirname, 'transactions.json');
  writeFileSync(outputPath, JSON.stringify(transactions, null, 2));
  
  console.log('✅ Generated transactions:', stats.total);
  console.log('   Income:', stats.income);
  console.log('   Expense:', stats.expense);
  console.log('\n📊 By category:');
  stats.byCategory.forEach(({ category, count }) => {
    console.log(`   ${category}: ${count}`);
  });
  console.log('\n📅 Date range:', stats.dateRange.from, '->', stats.dateRange.to);
  console.log('\n💾 Saved to:', outputPath);
  console.log('\n🚀 Ready to use! Start dev server with: npm run dev\n');
}

main();
