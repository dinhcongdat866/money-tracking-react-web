export type MonthlySummary = {
    month: string;
    totalBefore: number;
    totalAfter: number;
    difference: number;
};

export type GroupedTransactions = {
    date: string;
    dailyTotal: number;
    transactions: TransactionItem[];
}[];

export type TransactionItem = {
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
