ALTER TABLE "Product"
  ADD COLUMN "backRedirectUrl" TEXT,
  ADD COLUMN "upsellProductId" TEXT,
  ADD COLUMN "upsellUrl" TEXT,
  ADD COLUMN "warrantyDays" INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN "supportEmail" TEXT,
  ADD COLUMN "supportPhone" TEXT;
