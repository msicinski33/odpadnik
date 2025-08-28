/*
  Warnings:

  - You are about to drop the column `estimatedCost` on the `EmployeeDamage` table. All the data in the column will be lost.
  - You are about to drop the column `supervisor` on the `EmployeeDamage` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "LeavePlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalEntitlement" INTEGER NOT NULL,
    "carriedOver" INTEGER NOT NULL DEFAULT 0,
    "totalAvailable" INTEGER NOT NULL,
    "daysUsed" INTEGER NOT NULL DEFAULT 0,
    "daysRemaining" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeavePlan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaveEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "leavePlanId" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "daysCount" INTEGER NOT NULL,
    "leaveType" TEXT NOT NULL DEFAULT 'ANNUAL_LEAVE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" INTEGER,
    "approvedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveEntry_leavePlanId_fkey" FOREIGN KEY ("leavePlanId") REFERENCES "LeavePlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeaveEntry_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmployeeDamage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmployeeDamage_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EmployeeDamage" ("createdAt", "date", "description", "employeeId", "id", "updatedAt") SELECT "createdAt", "date", "description", "employeeId", "id", "updatedAt" FROM "EmployeeDamage";
DROP TABLE "EmployeeDamage";
ALTER TABLE "new_EmployeeDamage" RENAME TO "EmployeeDamage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LeavePlan_employeeId_year_key" ON "LeavePlan"("employeeId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveEntry_leavePlanId_startDate_endDate_key" ON "LeaveEntry"("leavePlanId", "startDate", "endDate");
