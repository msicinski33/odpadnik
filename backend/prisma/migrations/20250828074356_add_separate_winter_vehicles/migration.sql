-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WinterVehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "capacity" REAL NOT NULL,
    "fuelType" TEXT NOT NULL,
    "winterEquipment" TEXT,
    "purchaseDate" DATETIME,
    "winterSeasonStart" DATETIME,
    "winterSeasonEnd" DATETIME,
    "baseDepartment" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_WinterVehicle" ("baseDepartment", "brand", "capacity", "createdAt", "fuelType", "id", "isActive", "notes", "purchaseDate", "registrationNumber", "updatedAt", "vehicleType", "winterEquipment", "winterSeasonEnd", "winterSeasonStart") SELECT "baseDepartment", "brand", "capacity", "createdAt", "fuelType", "id", "isActive", "notes", "purchaseDate", "registrationNumber", "updatedAt", "vehicleType", "winterEquipment", "winterSeasonEnd", "winterSeasonStart" FROM "WinterVehicle";
DROP TABLE "WinterVehicle";
ALTER TABLE "new_WinterVehicle" RENAME TO "WinterVehicle";
CREATE UNIQUE INDEX "WinterVehicle_registrationNumber_key" ON "WinterVehicle"("registrationNumber");
CREATE TABLE "new_WinterVehicleDailyAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "winterVehicleId" INTEGER NOT NULL,
    "driverId" INTEGER,
    "loaderId" INTEGER,
    "regionId" INTEGER,
    "routeId" INTEGER,
    "assignmentType" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "equipment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterVehicleDailyAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WinterDailyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_winterVehicleId_fkey" FOREIGN KEY ("winterVehicleId") REFERENCES "WinterVehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_loaderId_fkey" FOREIGN KEY ("loaderId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WinterVehicleDailyAssignment" ("assignmentType", "createdAt", "driverId", "endTime", "equipment", "id", "loaderId", "notes", "planId", "regionId", "routeId", "startTime", "status", "updatedAt", "winterVehicleId") SELECT "assignmentType", "createdAt", "driverId", "endTime", "equipment", "id", "loaderId", "notes", "planId", "regionId", "routeId", "startTime", "status", "updatedAt", "winterVehicleId" FROM "WinterVehicleDailyAssignment";
DROP TABLE "WinterVehicleDailyAssignment";
ALTER TABLE "new_WinterVehicleDailyAssignment" RENAME TO "WinterVehicleDailyAssignment";
CREATE UNIQUE INDEX "WinterVehicleDailyAssignment_planId_winterVehicleId_key" ON "WinterVehicleDailyAssignment"("planId", "winterVehicleId");
CREATE TABLE "new_WinterVehicleMaterialConsumption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "quantityUsed" REAL NOT NULL,
    "winterVehicleId" INTEGER,
    "routeId" INTEGER,
    "operatorId" INTEGER,
    "weatherCondition" TEXT,
    "temperature" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterVehicleMaterialConsumption_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "WinterMaterialStock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleMaterialConsumption_winterVehicleId_fkey" FOREIGN KEY ("winterVehicleId") REFERENCES "WinterVehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleMaterialConsumption_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleMaterialConsumption_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WinterVehicleMaterialConsumption" ("createdAt", "date", "id", "notes", "operatorId", "quantityUsed", "routeId", "stockId", "temperature", "updatedAt", "weatherCondition", "winterVehicleId") SELECT "createdAt", "date", "id", "notes", "operatorId", "quantityUsed", "routeId", "stockId", "temperature", "updatedAt", "weatherCondition", "winterVehicleId" FROM "WinterVehicleMaterialConsumption";
DROP TABLE "WinterVehicleMaterialConsumption";
ALTER TABLE "new_WinterVehicleMaterialConsumption" RENAME TO "WinterVehicleMaterialConsumption";
CREATE TABLE "new_WinterVehicleRouteAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeId" INTEGER NOT NULL,
    "winterVehicleId" INTEGER NOT NULL,
    "driverId" INTEGER,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterVehicleRouteAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleRouteAssignment_winterVehicleId_fkey" FOREIGN KEY ("winterVehicleId") REFERENCES "WinterVehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleRouteAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WinterVehicleRouteAssignment" ("createdAt", "date", "driverId", "endTime", "id", "notes", "routeId", "startTime", "status", "updatedAt", "winterVehicleId") SELECT "createdAt", "date", "driverId", "endTime", "id", "notes", "routeId", "startTime", "status", "updatedAt", "winterVehicleId" FROM "WinterVehicleRouteAssignment";
DROP TABLE "WinterVehicleRouteAssignment";
ALTER TABLE "new_WinterVehicleRouteAssignment" RENAME TO "WinterVehicleRouteAssignment";
CREATE UNIQUE INDEX "WinterVehicleRouteAssignment_routeId_winterVehicleId_date_key" ON "WinterVehicleRouteAssignment"("routeId", "winterVehicleId", "date");
CREATE TABLE "new_WinterVehicleStatusHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "winterVehicleId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "equipmentType" TEXT,
    "notes" TEXT,
    "reportedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterVehicleStatusHistory_winterVehicleId_fkey" FOREIGN KEY ("winterVehicleId") REFERENCES "WinterVehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleStatusHistory_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WinterVehicleStatusHistory" ("createdAt", "date", "equipmentType", "id", "notes", "reportedById", "status", "updatedAt", "winterVehicleId") SELECT "createdAt", "date", "equipmentType", "id", "notes", "reportedById", "status", "updatedAt", "winterVehicleId" FROM "WinterVehicleStatusHistory";
DROP TABLE "WinterVehicleStatusHistory";
ALTER TABLE "new_WinterVehicleStatusHistory" RENAME TO "WinterVehicleStatusHistory";
CREATE UNIQUE INDEX "WinterVehicleStatusHistory_winterVehicleId_date_key" ON "WinterVehicleStatusHistory"("winterVehicleId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
