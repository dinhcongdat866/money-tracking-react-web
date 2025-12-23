import { describe, beforeEach, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionDetailPage } from "./TransactionDetailPage";
import { useTransactionDetail } from "./hooks/useTransactionDetail";
import { useDeleteTransaction } from "./hooks/useDeleteTransaction";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("./hooks/useTransactionDetail", () => ({
  useTransactionDetail: vi.fn(),
}));

vi.mock("./hooks/useDeleteTransaction", () => ({
  useDeleteTransaction: vi.fn(),
}));

// Avoid rendering modal complexity
vi.mock("./components/AddTransactionModal", () => ({
  AddTransactionModal: () => <div data-testid="edit-modal" />,
}));

const mockUseTransactionDetail = vi.mocked(useTransactionDetail);
const mockUseDeleteTransaction = vi.mocked(useDeleteTransaction);

const baseDeleteHook = {
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
} as any;

describe("TransactionDetailPage", () => {
  beforeEach(() => {
    mockUseDeleteTransaction.mockReturnValue(baseDeleteHook);
  });

  it("shows loading state", () => {
    mockUseTransactionDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    render(<TransactionDetailPage id="tx-1" />);

    expect(
      screen.getByText(/Loading transaction/i),
    ).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseTransactionDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    render(<TransactionDetailPage id="tx-1" />);

    expect(
      screen.getByText(/Transaction not found/i),
    ).toBeInTheDocument();
  });

  it("renders transaction detail when loaded", () => {
    mockUseTransactionDetail.mockReturnValue({
      data: {
        id: "tx-1",
        amount: 150,
        type: "income",
        category: { id: "c1", name: "Salary" },
        date: "2025-12-03T09:00:00.000Z",
        note: "Monthly pay",
      },
      isLoading: false,
      isError: false,
    } as any);

    render(<TransactionDetailPage id="tx-1" />);

    expect(screen.getByText("Transaction Detail")).toBeInTheDocument();
    expect(screen.getByText(/\+150/)).toBeInTheDocument();
    expect(screen.getByText(/Salary ·/)).toBeInTheDocument();
    expect(screen.getByText(/Monthly pay/)).toBeInTheDocument();
  });

  it("disables delete button when pending", () => {
    mockUseTransactionDetail.mockReturnValue({
      data: {
        id: "tx-1",
        amount: 20,
        type: "expense",
        category: { id: "c1", name: "Food" },
        date: "2025-12-03T12:00:00.000Z",
      },
      isLoading: false,
      isError: false,
    } as any);

    mockUseDeleteTransaction.mockReturnValue({
      ...baseDeleteHook,
      isPending: true,
    } as any);

    render(<TransactionDetailPage id="tx-1" />);

    const deleteBtn = screen.getByRole("button", { name: /Deleting/i });
    expect(deleteBtn).toBeDisabled();
  });
});

