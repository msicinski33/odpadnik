-- CreateTable
CREATE TABLE "CalendarEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regionId" INTEGER NOT NULL,
    "fractionId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "CalendarEntry_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CalendarEntry_fractionId_fkey" FOREIGN KEY ("fractionId") REFERENCES "Fraction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEntry_regionId_fractionId_date_key" ON "CalendarEntry"("regionId", "fractionId", "date");
