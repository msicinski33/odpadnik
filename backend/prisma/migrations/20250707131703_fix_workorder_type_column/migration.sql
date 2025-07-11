/*
  Warnings:

  - You are about to drop the column `orderType` on the `WorkOrder` table. All the data in the column will be lost.
  - Added the required column `type` to the `WorkOrder` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "dateReceived" DATETIME NOT NULL,
    "executionDate" DATETIME NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "municipality" TEXT,
    "company" TEXT,
    "wasteType" TEXT,
    "rodzaj" TEXT,
    "description" TEXT,
    "vehicle" TEXT,
    "responsible" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_WorkOrder" ("address", "company", "completed", "dateReceived", "description", "executionDate", "id", "municipality", "receivedBy", "responsible", "vehicle", "wasteType") SELECT "address", "company", "completed", "dateReceived", "description", "executionDate", "id", "municipality", "receivedBy", "responsible", "vehicle", "wasteType" FROM "WorkOrder";
DROP TABLE "WorkOrder";
ALTER TABLE "new_WorkOrder" RENAME TO "WorkOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
