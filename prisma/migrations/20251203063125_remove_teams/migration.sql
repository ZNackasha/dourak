/*
  Warnings:

  - You are about to drop the column `teamId` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_scheduleId_fkey";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "teamId";

-- DropTable
DROP TABLE "Team";
