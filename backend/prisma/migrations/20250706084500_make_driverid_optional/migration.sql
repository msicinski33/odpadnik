-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "regionId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "driverId" INTEGER,
    CONSTRAINT "DailyAssignment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DailyAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DailyAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DailyAssignment" ("date", "driverId", "id", "regionId", "vehicleId") SELECT "date", "driverId", "id", "regionId", "vehicleId" FROM "DailyAssignment";
DROP TABLE "DailyAssignment";
ALTER TABLE "new_DailyAssignment" RENAME TO "DailyAssignment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
