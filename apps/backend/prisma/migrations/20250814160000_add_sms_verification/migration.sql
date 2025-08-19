-- CreateTable
CREATE TABLE "sms_verification_codes" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sms_verification_codes_phone_number_key" ON "sms_verification_codes"("phone_number");

-- CreateIndex
CREATE INDEX "sms_verification_codes_expires_at_idx" ON "sms_verification_codes"("expires_at");