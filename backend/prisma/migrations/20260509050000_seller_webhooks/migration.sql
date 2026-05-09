-- SellerWebhook ------------------------------------------------------
CREATE TABLE "SellerWebhook" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerWebhook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SellerWebhook_sellerId_idx" ON "SellerWebhook"("sellerId");
CREATE INDEX "SellerWebhook_active_idx" ON "SellerWebhook"("active");
