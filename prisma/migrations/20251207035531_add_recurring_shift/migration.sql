-- CreateTable
CREATE TABLE "RecurringShift" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "recurringEventId" TEXT NOT NULL,
    "roleId" TEXT,
    "needed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecurringShift_scheduleId_recurringEventId_roleId_key" ON "RecurringShift"("scheduleId", "recurringEventId", "roleId");

-- AddForeignKey
ALTER TABLE "RecurringShift" ADD CONSTRAINT "RecurringShift_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringShift" ADD CONSTRAINT "RecurringShift_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
