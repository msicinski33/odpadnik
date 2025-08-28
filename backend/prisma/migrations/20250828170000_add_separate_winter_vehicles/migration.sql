-- CreateTable
CREATE TABLE "WinterVehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "capacity" REAL NOT NULL,
    "fuelType" TEXT NOT NULL,
    "winterEquipment" TEXT, -- JSON array of winter equipment types
    "purchaseDate" DATETIME,
    "winterSeasonStart" DATETIME,
    "winterSeasonEnd" DATETIME,
    "baseDepartment" TEXT, -- Which department/depot the vehicle belongs to
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WinterVehicleStatusHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "winterVehicleId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL, -- 'operational', 'out_of_service_vehicle', 'out_of_service_device', 'reconfigured', 'maintenance', 'standby'
    "equipmentType" TEXT, -- Currently mounted equipment
    "notes" TEXT,
    "reportedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WinterVehicleStatusHistory_winterVehicleId_fkey" FOREIGN KEY ("winterVehicleId") REFERENCES "WinterVehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleStatusHistory_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterVehicleRouteAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeId" INTEGER NOT NULL,
    "winterVehicleId" INTEGER NOT NULL,
    "driverId" INTEGER,
    "date" DATETIME NOT NULL,
    "startTime" TEXT, -- HH:MM format
    "endTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'cancelled'
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WinterVehicleRouteAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleRouteAssignment_winterVehicleId_fkey" FOREIGN KEY ("winterVehicleId") REFERENCES "WinterVehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleRouteAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterVehicleMaterialConsumption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "quantityUsed" REAL NOT NULL,
    "winterVehicleId" INTEGER,
    "routeId" INTEGER,
    "operatorId" INTEGER,
    "weatherCondition" TEXT, -- 'snow', 'ice', 'sleet', 'clear'
    "temperature" REAL, -- in Celsius
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WinterVehicleMaterialConsumption_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "WinterMaterialStock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleMaterialConsumption_winterVehicleId_fkey" FOREIGN KEY ("winterVehicleId") REFERENCES "WinterVehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleMaterialConsumption_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleMaterialConsumption_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterVehicleDailyAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "winterVehicleId" INTEGER NOT NULL,
    "driverId" INTEGER,
    "loaderId" INTEGER,
    "regionId" INTEGER,
    "routeId" INTEGER,
    "assignmentType" TEXT NOT NULL, -- 'route', 'region', 'standby', 'emergency'
    "startTime" TEXT, -- HH:MM format
    "endTime" TEXT,
    "equipment" TEXT, -- JSON array of equipment assigned
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WinterVehicleDailyAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WinterDailyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_winterVehicleId_fkey" FOREIGN KEY ("winterVehicleId") REFERENCES "WinterVehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_loaderId_fkey" FOREIGN KEY ("loaderId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleDailyAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WinterVehicle_registrationNumber_key" ON "WinterVehicle"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WinterVehicleStatusHistory_winterVehicleId_date_key" ON "WinterVehicleStatusHistory"("winterVehicleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WinterVehicleRouteAssignment_routeId_winterVehicleId_date_key" ON "WinterVehicleRouteAssignment"("routeId", "winterVehicleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WinterVehicleDailyAssignment_planId_winterVehicleId_key" ON "WinterVehicleDailyAssignment"("planId", "winterVehicleId");