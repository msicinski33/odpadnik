/*
  Warnings:

  - You are about to drop the column `vehicleId` on the `OneTimeOrder` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OneTimeOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dateReceived" DATETIME NOT NULL,
    "receivedById" INTEGER NOT NULL,
    "deliveryDate" DATETIME NOT NULL,
    "pdfFile" TEXT,
    "clientCode" TEXT NOT NULL,
    "orderingPerson" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "containerType" TEXT NOT NULL,
    "wasteType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_EXECUTION',
    "deliveryVehicleId" INTEGER,
    "pickupVehicleId" INTEGER,
    "pickupDate" DATETIME,
    "invoiceNumber" TEXT,
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OneTimeOrder_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OneTimeOrder_deliveryVehicleId_fkey" FOREIGN KEY ("deliveryVehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OneTimeOrder_pickupVehicleId_fkey" FOREIGN KEY ("pickupVehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OneTimeOrder" ("address", "clientCode", "completedAt", "containerType", "createdAt", "dateReceived", "deliveryDate", "id", "invoiceNumber", "notes", "orderingPerson", "pdfFile", "phone", "pickupDate", "receivedById", "status", "updatedAt", "wasteType") SELECT "address", "clientCode", "completedAt", "containerType", "createdAt", "dateReceived", "deliveryDate", "id", "invoiceNumber", "notes", "orderingPerson", "pdfFile", "phone", "pickupDate", "receivedById", "status", "updatedAt", "wasteType" FROM "OneTimeOrder";
DROP TABLE "OneTimeOrder";
ALTER TABLE "new_OneTimeOrder" RENAME TO "OneTimeOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
