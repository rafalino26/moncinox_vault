CREATE TABLE "OfflineTransactionReceipt" (
    "id" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfflineTransactionReceipt_pkey" PRIMARY KEY ("id")
);
