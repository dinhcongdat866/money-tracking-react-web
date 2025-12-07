"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTransactionModal } from "@/features/transactions/components/AddTransactionModal";

export function AddTransactionFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Add Transaction</span>
      </Button>
      <AddTransactionModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

