-- CreateTable
CREATE TABLE "VehicleFaultReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vehicleId" INTEGER NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "description" TEXT,
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "VehicleFaultReport_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "fuelType" TEXT NOT NULL,
    "purchaseDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "faultStatus" TEXT NOT NULL DEFAULT 'operational'
);
INSERT INTO "new_Vehicle" ("brand", "capacity", "fuelType", "id", "isActive", "purchaseDate", "registrationNumber", "vehicleType") SELECT "brand", "capacity", "fuelType", "id", "isActive", "purchaseDate", "registrationNumber", "vehicleType" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE UNIQUE INDEX "Vehicle_registrationNumber_key" ON "Vehicle"("registrationNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
