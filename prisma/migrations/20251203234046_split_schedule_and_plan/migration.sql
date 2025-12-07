/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `CalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Schedule` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[planId,googleEventId]` on the table `CalendarEvent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `planId` to the `CalendarEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_scheduleId_fkey";

-- DropIndex
DROP INDEX "CalendarEvent_scheduleId_googleEventId_key";

-- AlterTable
ALTER TABLE "CalendarEvent" DROP COLUMN "scheduleId",
ADD COLUMN     "planId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "endDate",
DROP COLUMN "startDate",
DROP COLUMN "status";

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_planId_googleEventId_key" ON "CalendarEvent"("planId", "googleEventId");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
