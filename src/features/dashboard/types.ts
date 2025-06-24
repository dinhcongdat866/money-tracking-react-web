export type Balance = {
    amount: number;
    currency: string;
}

export type ExpenseSummary = {
    currentExpense: number;
    lastExpense: number;
    timeRange: 'week' | 'month';
}

export type CategoryExpense = {
    categoryId: string;
    categoryName: string;
    expense: number;
    ratio: number;
}

export type Transaction = {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    category: {
        id: string;
        name: string;
        icon?: string;
    };
    date: string;
    note?: string;
};

export type TimeRange = 'week' | 'month';

export type Summary = {
    current: number;
    previous: number;
}
