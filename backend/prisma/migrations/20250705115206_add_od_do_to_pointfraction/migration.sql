/*
  Warnings:

  - Added the required column `surname` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PointFraction" ADD COLUMN "do" DATETIME;
ALTER TABLE "PointFraction" ADD COLUMN "od" DATETIME;

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
    "notes" TEXT
);
INSERT INTO "new_Employee" ("email", "hiredAt", "id", "name", "notes", "phone", "position", "terminatedAt") SELECT "email", "hiredAt", "id", "name", "notes", "phone", "position", "terminatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
