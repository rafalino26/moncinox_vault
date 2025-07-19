-- CreateEnum
CREATE TYPE "Tipe" AS ENUM ('pengeluaran', 'tabungan');

-- CreateEnum
CREATE TYPE "Sumber" AS ENUM ('Saya', 'Pacar_Saya');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT NOT NULL,
    "tipe" "Tipe" NOT NULL,
    "jenis" TEXT NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "sumber" "Sumber" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
