-- Per-user email notification opt-outs.

ALTER TABLE "User" ADD COLUMN "emailRecruitment" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailSchedule" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailRoleAdded" BOOLEAN NOT NULL DEFAULT true;
