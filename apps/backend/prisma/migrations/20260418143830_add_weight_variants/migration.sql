/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,variantId]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "cart_items_cartId_productId_key";

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "variantId" TEXT,
ADD COLUMN     "weightLabel" VARCHAR(50);

-- CreateTable
CREATE TABLE "weight_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "weightLabel" VARCHAR(50) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weight_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weight_variants_productId_idx" ON "weight_variants"("productId");

-- CreateIndex
CREATE INDEX "weight_variants_productId_isDefault_idx" ON "weight_variants"("productId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "weight_variants_productId_weightLabel_key" ON "weight_variants"("productId", "weightLabel");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_productId_variantId_key" ON "cart_items"("cartId", "productId", "variantId");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "weight_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "weight_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_variants" ADD CONSTRAINT "weight_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
