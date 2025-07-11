-- CreateTable
CREATE TABLE "WorkCardEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "actualFrom" TEXT,
    "actualTo" TEXT,
    "actualTotal" REAL,
    "absenceTypeId" INTEGER,
    "onCall" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkCardEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkCardEntry_absenceTypeId_fkey" FOREIGN KEY ("absenceTypeId") REFERENCES "RodzajAbsencji" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkCardEntry_employeeId_date_key" ON "WorkCardEntry"("employeeId", "date");
