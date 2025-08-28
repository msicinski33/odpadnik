-- CreateTable
CREATE TABLE "WinterVehicleStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vehicleId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "equipmentType" TEXT,
    "notes" TEXT,
    "reportedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterVehicleStatus_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterVehicleStatus_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterRoute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "regionId" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "estimatedTime" INTEGER,
    "distance" REAL,
    "mapData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterRoute_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterRouteStep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeId" INTEGER NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "streetName" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "coordinates" JSONB,
    "estimatedTime" INTEGER,
    CONSTRAINT "WinterRouteStep_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterRouteAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "driverId" INTEGER,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterRouteAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterRouteAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterRouteAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterSidewalk" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startAddress" TEXT NOT NULL,
    "endAddress" TEXT NOT NULL,
    "length" REAL,
    "regionId" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterSidewalk_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterSidewalkAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sidewalkId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterSidewalkAssignment_sidewalkId_fkey" FOREIGN KEY ("sidewalkId") REFERENCES "WinterSidewalk" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterSidewalkAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterBusStop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "coordinates" JSONB,
    "regionId" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterBusStop_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterBusStopAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "busStopId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterBusStopAssignment_busStopId_fkey" FOREIGN KEY ("busStopId") REFERENCES "WinterBusStop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterBusStopAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterRoadInventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "roadNumber" TEXT,
    "category" TEXT NOT NULL,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "length" REAL NOT NULL,
    "width" REAL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "regionId" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterRoadInventory_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterMaterialStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materialType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "supplierName" TEXT,
    "deliveryDate" DATETIME,
    "expirationDate" DATETIME,
    "cost" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WinterMaterialConsumption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "quantityUsed" REAL NOT NULL,
    "vehicleId" INTEGER,
    "routeId" INTEGER,
    "operatorId" INTEGER,
    "weatherCondition" TEXT,
    "temperature" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterMaterialConsumption_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "WinterMaterialStock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterMaterialConsumption_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterMaterialConsumption_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterMaterialConsumption_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterDailyPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "weatherForecast" TEXT,
    "temperature" REAL,
    "precipitation" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "supervisorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterDailyPlan_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinterDailyPlanAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "driverId" INTEGER,
    "loaderId" INTEGER,
    "regionId" INTEGER,
    "routeId" INTEGER,
    "assignmentType" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "equipment" JSONB,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WinterDailyPlanAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WinterDailyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WinterDailyPlanAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WinterDailyPlanAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterDailyPlanAssignment_loaderId_fkey" FOREIGN KEY ("loaderId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterDailyPlanAssignment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WinterDailyPlanAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "WinterRoute" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WinterVehicleStatus_vehicleId_date_key" ON "WinterVehicleStatus"("vehicleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WinterRouteStep_routeId_stepOrder_key" ON "WinterRouteStep"("routeId", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WinterRouteAssignment_routeId_vehicleId_date_key" ON "WinterRouteAssignment"("routeId", "vehicleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WinterSidewalkAssignment_sidewalkId_employeeId_date_key" ON "WinterSidewalkAssignment"("sidewalkId", "employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WinterBusStopAssignment_busStopId_employeeId_date_key" ON "WinterBusStopAssignment"("busStopId", "employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WinterDailyPlanAssignment_planId_vehicleId_key" ON "WinterDailyPlanAssignment"("planId", "vehicleId");
