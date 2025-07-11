-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN "bagNumber" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "orderNumber" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "quantity" INTEGER;
ALTER TABLE "WorkOrder" ADD COLUMN "realizationDate" DATETIME;
