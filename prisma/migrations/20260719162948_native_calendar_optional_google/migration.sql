-- AlterTable
ALTER TABLE "CalendarEvent" ALTER COLUMN "googleEventId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "googleCalendarId" DROP NOT NULL;
