/*
  Warnings:

  - You are about to drop the column `roleId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `roleOpeningId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `serviceDayId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the `Availability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoleOpening` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceDay` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[shiftId,userId]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shiftId,email]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shiftId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_roleOpeningId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_serviceDayId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_roleOpeningId_fkey";

-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_serviceDayId_fkey";

-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_userId_fkey";

-- DropForeignKey
ALTER TABLE "RoleOpening" DROP CONSTRAINT "RoleOpening_roleId_fkey";

-- DropForeignKey
ALTER TABLE "RoleOpening" DROP CONSTRAINT "RoleOpening_serviceDayId_fkey";

-- DropIndex
DROP INDEX "Assignment_roleId_idx";

-- DropIndex
DROP INDEX "Assignment_roleOpeningId_userId_key";

-- DropIndex
DROP INDEX "Assignment_userId_serviceDayId_key";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "roleId",
DROP COLUMN "roleOpeningId",
DROP COLUMN "serviceDayId",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "shiftId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- DropTable
DROP TABLE "Availability";

-- DropTable
DROP TABLE "RoleOpening";

-- DropTable
DROP TABLE "ServiceDay";

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "googleCalendarId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "recurringEventId" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "calendarEventId" TEXT NOT NULL,
    "roleId" TEXT,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_scheduleId_googleEventId_key" ON "CalendarEvent"("scheduleId", "googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_shiftId_userId_key" ON "Assignment"("shiftId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_shiftId_email_key" ON "Assignment"("shiftId", "email");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
