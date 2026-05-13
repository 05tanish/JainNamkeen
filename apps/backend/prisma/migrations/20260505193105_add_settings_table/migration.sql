-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_key_idx" ON "settings"("key");

-- Insert default setting for online payment (disabled by default)
INSERT INTO "settings" ("id", "key", "value", "description", "updatedAt")
VALUES (
    'clxxx' || substr(md5(random()::text), 1, 20),
    'ENABLE_ONLINE_PAYMENT',
    'false',
    'Enable or disable online payment (Razorpay)',
    NOW()
);
