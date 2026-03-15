"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Category } from "../data/categories";
import { TRANSACTION_CATEGORIES } from "@/features/kanban/types";

// Use same category IDs as Kanban so new transactions appear in the correct column
const INCOME_CATEGORIES_FORM = TRANSACTION_CATEGORIES.filter(
  (c) => c.id === "income"
).map((c) => ({ id: c.id, name: c.name, icon: c.icon }));
const EXPENSE_CATEGORIES_FORM = TRANSACTION_CATEGORIES.filter(
  (c) => c.id !== "income"
).map((c) => ({ id: c.id, name: c.name, icon: c.icon }));

type CategorySelectionProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  onSelect: (category: Category) => void;
};

export function CategorySelection({
  open,
  onOpenChange,
  type,
  onSelect,
}: CategorySelectionProps) {
  const [selectedType, setSelectedType] = useState<"income" | "expense">(type);

  const categories =
    selectedType === "income" ? INCOME_CATEGORIES_FORM : EXPENSE_CATEGORIES_FORM;

  const handleSelect = (category: Category) => {
    onSelect(category);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Select Category</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Tabs
            value={selectedType}
            onValueChange={(value) =>
              setSelectedType(value as "income" | "expense")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="income" className="flex-1">
                Income
              </TabsTrigger>
              <TabsTrigger value="expense" className="flex-1">
                Expense
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType} className="mt-4">
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleSelect(category)}
                    className="w-full text-left px-4 py-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

