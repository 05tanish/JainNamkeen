-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentError" TEXT,
ADD COLUMN     "razorpayOrderId" VARCHAR(100),
ADD COLUMN     "razorpayPaymentId" VARCHAR(100),
ADD COLUMN     "razorpayRefundId" VARCHAR(100),
ADD COLUMN     "razorpaySignature" VARCHAR(255);

-- CreateIndex
CREATE INDEX "orders_razorpayOrderId_idx" ON "orders"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "orders_razorpayPaymentId_idx" ON "orders"("razorpayPaymentId");
