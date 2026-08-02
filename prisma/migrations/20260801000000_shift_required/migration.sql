-- Per-shift required flag: whether the role must be filled for this specific
-- event. Backfilled from the role's type so existing optional roles stay
-- optional on their current shifts.

ALTER TABLE "Shift" ADD COLUMN "required" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "RecurringShift" ADD COLUMN "required" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ScheduleEventShift" ADD COLUMN "required" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Shift" s SET "required" = false
FROM "Role" r WHERE s."roleId" = r.id AND r."type" = 'optional';

UPDATE "RecurringShift" s SET "required" = false
FROM "Role" r WHERE s."roleId" = r.id AND r."type" = 'optional';

UPDATE "ScheduleEventShift" s SET "required" = false
FROM "Role" r WHERE s."roleId" = r.id AND r."type" = 'optional';
