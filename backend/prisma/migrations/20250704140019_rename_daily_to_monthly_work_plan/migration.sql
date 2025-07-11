/*
  Warnings:

  - You are about to drop the `DailyWorkPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DailyWorkPlan";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "MonthlyWorkPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workMonth" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "customHours" TEXT,
    "driverId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "regionId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MonthlyWorkPlan_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyWorkPlan_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyWorkPlan_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyWorkPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkPlanLoader" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    CONSTRAINT "WorkPlanLoader_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MonthlyWorkPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkPlanLoader_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkPlanLoader" ("employeeId", "id", "planId") SELECT "employeeId", "id", "planId" FROM "WorkPlanLoader";
DROP TABLE "WorkPlanLoader";
ALTER TABLE "new_WorkPlanLoader" RENAME TO "WorkPlanLoader";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
