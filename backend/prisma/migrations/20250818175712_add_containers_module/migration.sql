-- CreateTable
CREATE TABLE "Container" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "containerType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "entryPersonData" TEXT NOT NULL,
    "additionalInfo" TEXT,
    "personalPickup" BOOLEAN NOT NULL DEFAULT false,
    "recordNumber" TEXT,
    "completionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
