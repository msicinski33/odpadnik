/*
  Warnings:

  - You are about to drop the `CalendarEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmployeeSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MonthlyWorkPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PdfExport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PointFraction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScheduleChangeLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkPlanLoader` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CalendarEntry";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EmployeeSchedule";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MonthlyWorkPlan";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PdfExport";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PointFraction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ScheduleChangeLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "WorkPlanLoader";
PRAGMA foreign_keys=on;
