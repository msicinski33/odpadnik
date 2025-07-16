-- CreateTable
CREATE TABLE "OneTimeOrder" (
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
    "vehicleId" INTEGER,
    "pickupDate" DATETIME,
    "invoiceNumber" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OneTimeOrder_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OneTimeOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
