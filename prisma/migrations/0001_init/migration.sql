-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

-- CreateTable
CREATE TABLE "Transaction" (
    "id"           TEXT         NOT NULL,
    "amount"       DOUBLE PRECISION NOT NULL,
    "type"         "TransactionType" NOT NULL,
    "categoryId"   TEXT         NOT NULL,
    "categoryName" TEXT         NOT NULL,
    "categoryIcon" TEXT,
    "date"         TEXT         NOT NULL,
    "note"         TEXT,
    "version"      INTEGER      NOT NULL DEFAULT 1,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- CreateIndex
CREATE INDEX "Transaction_date_type_idx" ON "Transaction"("date", "type");
