-- CreateTable
CREATE TABLE "DailyAssignmentFraction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dailyAssignmentId" INTEGER NOT NULL,
    "fractionId" INTEGER NOT NULL,
    CONSTRAINT "DailyAssignmentFraction_dailyAssignmentId_fkey" FOREIGN KEY ("dailyAssignmentId") REFERENCES "DailyAssignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DailyAssignmentFraction_fractionId_fkey" FOREIGN KEY ("fractionId") REFERENCES "Fraction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
