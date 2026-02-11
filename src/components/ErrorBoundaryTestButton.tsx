"use client";

import { useState } from "react";
import { Button } from "./ui/button";

/**
 * Test button to trigger ErrorBoundary
 * Only for development testing - remove in production
 */
export function ErrorBoundaryTestButton() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("Test error for ErrorBoundary - This is intentional for testing!");
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShouldThrow(true)}
      className="border-dashed"
    >
      🧪 Test ErrorBoundary
    </Button>
  );
}

