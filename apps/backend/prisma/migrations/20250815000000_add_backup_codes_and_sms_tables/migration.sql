-- CreateTable
CREATE TABLE "user_backup_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_backup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_backup_codes_userId_idx" ON "user_backup_codes"("userId");

-- CreateIndex
CREATE INDEX "user_backup_codes_used_idx" ON "user_backup_codes"("used");

-- AddForeignKey
ALTER TABLE "user_backup_codes" ADD CONSTRAINT "user_backup_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;