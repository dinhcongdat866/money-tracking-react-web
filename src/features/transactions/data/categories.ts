export type Category = {
  id: string;
  name: string;
  icon?: string;
};

export const INCOME_CATEGORIES: Category[] = [
  { id: "2", name: "Salary" },
  { id: "6", name: "Freelance" },
  { id: "7", name: "Investment" },
  { id: "8", name: "Gift" },
  { id: "9", name: "Other Income" },
];

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "1", name: "Food & Drink" },
  { id: "3", name: "Transport" },
  { id: "4", name: "Entertainment" },
  { id: "5", name: "Rent" },
  { id: "10", name: "Utilities" },
  { id: "11", name: "Shopping" },
  { id: "12", name: "Healthcare" },
  { id: "13", name: "Education" },
  { id: "14", name: "Other Expense" },
];

