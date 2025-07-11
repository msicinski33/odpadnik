-- CreateTable
CREATE TABLE "PointFraction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pointId" INTEGER NOT NULL,
    "fractionId" INTEGER NOT NULL,
    "containerSize" TEXT NOT NULL,
    "pickupFrequency" TEXT NOT NULL,
    CONSTRAINT "PointFraction_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PointFraction_fractionId_fkey" FOREIGN KEY ("fractionId") REFERENCES "Fraction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
