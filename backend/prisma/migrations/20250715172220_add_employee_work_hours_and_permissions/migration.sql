-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "hiredAt" DATETIME,
    "terminatedAt" DATETIME,
    "notes" TEXT,
    "hasDisabilityCertificate" BOOLEAN NOT NULL DEFAULT false,
    "workHours" INTEGER NOT NULL DEFAULT 8,
    "overtimeAllowed" BOOLEAN NOT NULL DEFAULT false,
    "nightShiftAllowed" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Employee" ("email", "hasDisabilityCertificate", "hiredAt", "id", "name", "notes", "phone", "position", "surname", "terminatedAt") SELECT "email", "hasDisabilityCertificate", "hiredAt", "id", "name", "notes", "phone", "position", "surname", "terminatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
