-- CreateTable
CREATE TABLE "ScheduleChangeRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "originalShift" TEXT,
    "newShift" TEXT,
    "absenceTypeId" INTEGER,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "approvedById" INTEGER,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "approvalEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduleChangeRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduleChangeRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduleChangeRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleChangeRequest_absenceTypeId_fkey" FOREIGN KEY ("absenceTypeId") REFERENCES "RodzajAbsencji" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleChangeDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleChangeId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "originalShift" TEXT,
    "newShift" TEXT,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" DATETIME,
    CONSTRAINT "ScheduleChangeDay_scheduleChangeId_fkey" FOREIGN KEY ("scheduleChangeId") REFERENCES "ScheduleChangeRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleChangeNotificationConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notifyOnNew" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnApproval" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleChangeDay_scheduleChangeId_date_key" ON "ScheduleChangeDay"("scheduleChangeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleChangeNotificationConfig_role_email_key" ON "ScheduleChangeNotificationConfig"("role", "email");
