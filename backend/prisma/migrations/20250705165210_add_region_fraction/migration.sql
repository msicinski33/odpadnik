-- CreateTable
CREATE TABLE "RegionFraction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regionId" INTEGER NOT NULL,
    "fractionId" INTEGER NOT NULL,
    CONSTRAINT "RegionFraction_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegionFraction_fractionId_fkey" FOREIGN KEY ("fractionId") REFERENCES "Fraction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RegionFraction_regionId_fractionId_key" ON "RegionFraction"("regionId", "fractionId");
