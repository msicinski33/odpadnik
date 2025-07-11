-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dateReceived" DATETIME NOT NULL,
    "executionDate" DATETIME NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "wasteType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "company" TEXT,
    "municipality" TEXT,
    "vehicle" TEXT,
    "responsible" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false
);
