-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Point" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "notes" TEXT,
    "companyName" TEXT,
    "activityNotes" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "isIndefinite" BOOLEAN NOT NULL DEFAULT false,
    "kompostownik" BOOLEAN NOT NULL DEFAULT false,
    "regionId" INTEGER,
    CONSTRAINT "Point_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Point" ("activityNotes", "companyName", "endDate", "id", "isIndefinite", "kompostownik", "notes", "number", "regionId", "startDate", "street", "town", "type") SELECT "activityNotes", "companyName", "endDate", "id", "isIndefinite", "kompostownik", "notes", "number", "regionId", "startDate", "street", "town", "type" FROM "Point";
DROP TABLE "Point";
ALTER TABLE "new_Point" RENAME TO "Point";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
