-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_person_key" ON "Wallet"("person");
