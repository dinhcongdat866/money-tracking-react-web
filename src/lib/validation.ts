/**
 * Input Validation Utilities
 * 
 * Type-safe validation helpers for API inputs
 */

import { ValidationError } from './api-errors';

/**
 * Validate month format (YYYY-MM)
 */
export function validateMonth(month: string): asserts month is string {
  if (!month || typeof month !== 'string') {
    throw new ValidationError('Month is required', 'month');
  }

  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) {
    throw new ValidationError('Month must be in format YYYY-MM', 'month');
  }

  const [year, monthNum] = month.split('-').map(Number);
  if (year < 2000 || year > 2100 || monthNum < 1 || monthNum > 12) {
    throw new ValidationError('Invalid month value', 'month');
  }
}

/**
 * Validate transaction ID
 */
export function validateTransactionId(id: string | undefined): asserts id is string {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new ValidationError('Transaction ID is required', 'id');
  }
}

/**
 * Validate amount (must be positive number)
 */
export function validateAmount(amount: number): asserts amount is number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new ValidationError('Amount must be a number', 'amount');
  }

  if (amount <= 0) {
    throw new ValidationError('Amount must be greater than 0', 'amount');
  }

  if (amount > 1000000000) {
    throw new ValidationError('Amount is too large', 'amount');
  }
}

/**
 * Validate date string (ISO format)
 */
export function validateDate(date: string): asserts date is string {
  if (!date || typeof date !== 'string') {
    throw new ValidationError('Date is required', 'date');
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new ValidationError('Invalid date format', 'date');
  }
}

/**
 * Validate transaction type
 */
export function validateTransactionType(
  type: string,
): asserts type is 'income' | 'expense' {
  if (type !== 'income' && type !== 'expense') {
    throw new ValidationError(
      'Transaction type must be "income" or "expense"',
      'type',
    );
  }
}

/**
 * Validate category
 */
export function validateCategory(category: {
  id: string;
  name: string;
}): void {
  if (!category || typeof category !== 'object') {
    throw new ValidationError('Category is required', 'category');
  }

  if (!category.id || typeof category.id !== 'string') {
    throw new ValidationError('Category ID is required', 'category.id');
  }

  if (!category.name || typeof category.name !== 'string') {
    throw new ValidationError('Category name is required', 'category.name');
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page?: number,
  limit?: number,
): { page: number; limit: number } {
  const validatedPage = page && page > 0 ? page : 1;
  const validatedLimit =
    limit && limit > 0 && limit <= 100 ? limit : 20;

  return { page: validatedPage, limit: validatedLimit };
}

