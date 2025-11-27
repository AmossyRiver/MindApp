-- CreateTable
CREATE TABLE "EncryptedEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedData" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EncryptedEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EncryptedEntry_userId_createdAt_idx" ON "EncryptedEntry"("userId", "createdAt");
