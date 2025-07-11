/*
  Warnings:

  - You are about to alter the column `capacity` on the `Vehicle` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "capacity" REAL NOT NULL,
    "fuelType" TEXT NOT NULL,
    "purchaseDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "faultStatus" TEXT NOT NULL DEFAULT 'operational'
);
INSERT INTO "new_Vehicle" ("brand", "capacity", "faultStatus", "fuelType", "id", "isActive", "purchaseDate", "registrationNumber", "vehicleType") SELECT "brand", "capacity", "faultStatus", "fuelType", "id", "isActive", "purchaseDate", "registrationNumber", "vehicleType" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE UNIQUE INDEX "Vehicle_registrationNumber_key" ON "Vehicle"("registrationNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
