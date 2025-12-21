"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { CategorySelection } from "./CategorySelection";
import type { Category } from "../data/categories";
import type { TransactionItem } from "../types";
import { useCreateTransaction } from "../hooks/useCreateTransaction";
import { useUpdateTransaction } from "../hooks/useUpdateTransaction";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../data/categories";

type AddTransactionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionItem | null;
};

export function AddTransactionModal({
  open,
  onOpenChange,
  transaction,
}: AddTransactionModalProps) {
  const isEditMode = !!transaction;
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Pre-fill form when transaction is provided (edit mode)
  useEffect(() => {
    if (transaction && open) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setNote(transaction.note || "");
      setSelectedDate(new Date(transaction.date));
      
      // Find category from the transaction
      const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
      const foundCategory = allCategories.find(
        (cat) => cat.id === transaction.category.id
      );
      setCategory(foundCategory || {
        id: transaction.category.id,
        name: transaction.category.name,
      });
    } else if (!transaction && open) {
      // Reset form for add mode
      setType("expense");
      setAmount("");
      setCategory(null);
      setNote("");
      setSelectedDate(new Date());
    }
  }, [transaction, open]);

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleSave = async () => {
    if (!amount || !category) {
      return;
    }

    const transactionData = {
      type,
      amount: parseFloat(amount),
      categoryId: category.id,
      categoryName: category.name,
      note: note || undefined,
      date: selectedDate.toISOString(),
    };

    try {
      if (isEditMode && transaction) {
        await updateMutation.mutateAsync({
          id: transaction.id,
          data: transactionData,
        });
      } else {
        await createMutation.mutateAsync(transactionData);
      }
      
      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      // Error is handled by mutation hooks and will rollback optimistic update
      console.error("Error saving transaction:", error);
    }
  };

  const handleCategorySelect = (selectedCategory: Category) => {
    setCategory(selectedCategory);
  };

  const handleTypeChange = (newType: "income" | "expense") => {
    setType(newType);
    setCategory(null); // Reset category when type changes
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogClose onClose={() => onOpenChange(false)} />
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Type Tabs */}
            <Tabs value={type} onValueChange={(value) => handleTypeChange(value as "income" | "expense")}>
              <TabsList className="w-full">
                <TabsTrigger value="income" className="flex-1">
                  Income
                </TabsTrigger>
                <TabsTrigger value="expense" className="flex-1">
                  Expense
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="w-full text-left px-3 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
              >
                <span className="text-sm">
                  {category ? category.name : "Select category"}
                </span>
              </button>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <Input
                type="text"
                placeholder="Add a note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleDateChange(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{formattedDate}</span>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleDateChange(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {isDatePickerOpen && (
                <Input
                  type="date"
                  value={selectedDate.toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="mt-2"
                />
              )}
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full"
              disabled={
                !amount ||
                !category ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update"
                : "Save"}
            </Button>
            
            {/* Error Message */}
            {(createMutation.isError || updateMutation.isError) && (
              <p className="text-sm text-destructive text-center">
                Failed to {isEditMode ? "update" : "create"} transaction. Please try again.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Selection Modal */}
      <CategorySelection
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        type={type}
        onSelect={handleCategorySelect}
      />
    </>
  );
}

