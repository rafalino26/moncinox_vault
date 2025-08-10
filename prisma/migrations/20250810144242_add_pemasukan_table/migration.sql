-- CreateTable
CREATE TABLE "Pemasukan" (
    "id" TEXT NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "sumber" "Sumber" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pemasukan_pkey" PRIMARY KEY ("id")
);
