-- CreateTable
CREATE TABLE "ScheduleAdmin" (
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleAdmin_pkey" PRIMARY KEY ("scheduleId","userId")
);

-- AddForeignKey
ALTER TABLE "ScheduleAdmin" ADD CONSTRAINT "ScheduleAdmin_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleAdmin" ADD CONSTRAINT "ScheduleAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
